import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, RUECKFRAGEN_SCHEMA, PLAN_SCHEMA } from './prompt.js';

// Modell per Env konfigurierbar; Default = aktuell stärkstes Modell.
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-8';

export function kiVerfuegbar() {
  return !!process.env.ANTHROPIC_API_KEY;
}

let _client;
function client() {
  if (!_client) _client = new Anthropic(); // liest ANTHROPIC_API_KEY aus der Umgebung
  return _client;
}

// System-Prompt als cache-fähiger Block (Prompt-Caching spart Kosten über beide Aufrufe).
function systemBlocks() {
  return [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }];
}

function intakeText(stammdaten = {}, freitext = '') {
  const z = [];
  const f = (label, val) => { if (val !== undefined && val !== null && String(val).trim() !== '') z.push(`- ${label}: ${val}`); };
  f('Name/Pseudonym', stammdaten.name);
  f('Alter', stammdaten.alter);
  f('Geschlecht', stammdaten.geschlecht);
  f('Pflegegrad', stammdaten.pflegegrad);
  f('Versorgung', stammdaten.setting); // ambulant | stationär
  f('Wohnsituation', stammdaten.wohnsituation);
  f('Hauptdiagnosen', Array.isArray(stammdaten.diagnosen) ? stammdaten.diagnosen.join(', ') : stammdaten.diagnosen);
  f('Hilfsmittel', stammdaten.hilfsmittel);
  f('Allergien', stammdaten.allergien);
  if (freitext?.trim()) z.push(`- Weitere Angaben / Beobachtungen: ${freitext.trim()}`);
  return z.join('\n') || '(noch keine Angaben)';
}

// Extrahiert das JSON aus der Modellantwort (output_config.format liefert reines JSON im Text).
function parseJson(message) {
  const text = (message.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('KI-Antwort war kein gültiges JSON');
  }
}

// Phase 1: gezielte Rückfragen aus minimalen Eckdaten.
export async function generiereRueckfragen({ stammdaten, freitext }) {
  const user = `Hier sind die bisher bekannten Eckdaten zur pflegebedürftigen Person:

${intakeText(stammdaten, freitext)}

Erstelle 5–8 GEZIELTE, kurze Rückfragen, deren Antworten du brauchst, um eine vollständige SIS und einen Maßnahmenplan zu erstellen. Frage nur nach dem, was wirklich fehlt und fachlich relevant ist (orientiert an den 6 Themenfeldern und den genannten Diagnosen). Jede Frage knapp und konkret beantwortbar.`;

  const msg = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    thinking: { type: 'disabled' },
    system: systemBlocks(),
    messages: [{ role: 'user', content: user }],
    output_config: { format: { type: 'json_schema', schema: RUECKFRAGEN_SCHEMA } },
  });
  return parseJson(msg);
}

// Phase 2: vollständige SIS + Risikomatrix + Maßnahmenplan.
export async function generierePlan({ stammdaten, freitext, antworten }) {
  const antwortenText = Array.isArray(antworten) && antworten.length
    ? antworten.map((a) => `- ${a.frage} → ${a.antwort || '(keine Angabe)'}`).join('\n')
    : '(keine zusätzlichen Antworten)';

  const user = `ECKDATEN:
${intakeText(stammdaten, freitext)}

ANTWORTEN AUF RÜCKFRAGEN:
${antwortenText}

Erstelle daraus die vollständige Dokumentation nach dem Strukturmodell: SIS über alle 6 Themenfelder (mit Ressourcen und Problemen/Risiken), eine Risikomatrix und einen konkreten, überprüfbaren Maßnahmenplan, plus eine kompakte Übergabe-Kurzfassung. Kurz und präzise. Wo Angaben fehlen, nenne offene Punkte unter "hinweise".`;

  // Ohne extended Thinking + kompaktes Limit, damit die Erzeugung zuverlässig
  // innerhalb des Serverless-Zeitbudgets (Vercel max. 60 s) abgeschlossen ist.
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'disabled' },
    system: systemBlocks(),
    messages: [{ role: 'user', content: user }],
    output_config: { format: { type: 'json_schema', schema: PLAN_SCHEMA } },
  });
  const msg = await stream.finalMessage();
  return { plan: parseJson(msg), modell: MODEL, usage: msg.usage };
}
