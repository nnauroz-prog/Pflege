// KI-Schicht mit mehreren Anbietern:
//  - GEMINI_API_KEY  -> Google Gemini (KOSTENLOSER Tarif, keine Karte/kein Guthaben)
//  - ANTHROPIC_API_KEY -> Claude (kostenpflichtig)
// Es wird der erste vorhandene Schlüssel verwendet (Gemini bevorzugt = gratis).
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, THEMENFELDER } from './prompt.js';

const clean = (v) => (v || '').trim().replace(/^['"]|['"]$/g, '').trim();
const GEMINI_KEY = clean(process.env.GEMINI_API_KEY);
const ANTHROPIC_KEY = clean(process.env.ANTHROPIC_API_KEY);
const GEMINI_MODEL = clean(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';
const ANTHROPIC_MODEL = clean(process.env.CLAUDE_MODEL) || 'claude-opus-4-8';

export function kiVerfuegbar() {
  return !!(GEMINI_KEY || ANTHROPIC_KEY);
}
export function kiProvider() {
  return GEMINI_KEY ? `gemini (${GEMINI_MODEL})` : ANTHROPIC_KEY ? `anthropic (${ANTHROPIC_MODEL})` : null;
}

function intakeText(stammdaten = {}, freitext = '') {
  const z = [];
  const f = (label, val) => { if (val !== undefined && val !== null && String(val).trim() !== '') z.push(`- ${label}: ${val}`); };
  f('Name/Pseudonym', stammdaten.name);
  f('Alter', stammdaten.alter);
  f('Geschlecht', stammdaten.geschlecht);
  f('Pflegegrad', stammdaten.pflegegrad);
  f('Versorgung', stammdaten.setting);
  f('Wohnsituation', stammdaten.wohnsituation);
  f('Hauptdiagnosen', Array.isArray(stammdaten.diagnosen) ? stammdaten.diagnosen.join(', ') : stammdaten.diagnosen);
  f('Hilfsmittel', stammdaten.hilfsmittel);
  f('Allergien', stammdaten.allergien);
  if (freitext?.trim()) z.push(`- Weitere Angaben / Beobachtungen: ${freitext.trim()}`);
  return z.join('\n') || '(noch keine Angaben)';
}

function parseJson(text) {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(t);
  } catch {
    // größten {...}-Block versuchen (auch bei Vor-/Nachtext)
    const first = t.indexOf('{');
    const last = t.lastIndexOf('}');
    if (first !== -1 && last > first) {
      try { return JSON.parse(t.slice(first, last + 1)); } catch {}
    }
    throw new Error('KI-Antwort war kein gültiges JSON. Anfang: ' + (t.slice(0, 180) || '(leer)'));
  }
}

// --- Anbieter ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function geminiCall(model, userText, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: maxTokens, temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    const err = new Error(`Gemini ${res.status}: ${t.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (data?.promptFeedback?.blockReason) throw new Error('Gemini hat die Anfrage blockiert: ' + data.promptFeedback.blockReason);
  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts || []).map((p) => p.text || '').join('');
  if (!text.trim()) {
    const reason = cand?.finishReason || 'unbekannt';
    const e = new Error(`Gemini leere Antwort (finishReason: ${reason})`);
    // MAX_TOKENS -> mehr Tokens nötig; SAFETY/RECITATION -> Filter
    e.status = reason === 'MAX_TOKENS' ? 'max_tokens' : 0;
    throw e;
  }
  return text;
}

async function generateGemini(userText, maxTokens) {
  // Mehrere kostenlose Modelle (jeweils eigene Quote) + Wiederholung bei 429/503.
  const models = [...new Set([GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'])];
  let lastErr;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await geminiCall(model, userText, maxTokens);
      } catch (e) {
        lastErr = e;
        if ((e.status === 429 || e.status === 503) && attempt < 2) {
          await sleep(1200 * (attempt + 1));
          continue;
        }
        break; // anderes Problem -> nächstes Modell probieren
      }
    }
  }
  throw lastErr || new Error('Gemini: kein Modell erfolgreich');
}

let _anthropic;
async function generateAnthropic(userText, maxTokens) {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
  const msg = await _anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'disabled' },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userText + '\n\nAntworte AUSSCHLIESSLICH mit gültigem JSON.' }],
  });
  return (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}

async function generate(userText, maxTokens) {
  if (!kiVerfuegbar()) throw new Error('Kein KI-Schlüssel gesetzt (GEMINI_API_KEY oder ANTHROPIC_API_KEY).');
  const raw = GEMINI_KEY ? await generateGemini(userText, maxTokens) : await generateAnthropic(userText, maxTokens);
  return parseJson(raw);
}

// Phase 1: gezielte Rückfragen.
export async function generiereRueckfragen({ stammdaten, freitext }) {
  const user = `Hier sind die bisher bekannten Eckdaten zur pflegebedürftigen Person:

${intakeText(stammdaten, freitext)}

Erstelle 5–8 GEZIELTE, kurze Rückfragen, deren Antworten du brauchst, um eine vollständige SIS und einen Maßnahmenplan zu erstellen. Frage nur nach fachlich Relevantem (orientiert an den 6 Themenfeldern und den Diagnosen).

Antworte AUSSCHLIESSLICH mit gültigem JSON in genau dieser Form:
{"rueckfragen":[{"frage":"...","themenfeld":"...","warum":"..."}]}`;
  return generate(user, 2000);
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

Erstelle die vollständige Dokumentation nach dem Strukturmodell: SIS über alle 6 Themenfelder (mit Ressourcen und Problemen/Risiken), eine Risikomatrix und einen konkreten, überprüfbaren Maßnahmenplan, plus eine kompakte Übergabe-Kurzfassung. Kurz und präzise. Wo Angaben fehlen, nenne offene Punkte unter "hinweise".

Die 6 Themenfelder (genau diese Namen für "feld" verwenden): ${THEMENFELDER.map((t) => `"${t}"`).join(', ')}.

Antworte AUSSCHLIESSLICH mit gültigem JSON in genau dieser Form:
{"sicht_des_pflegebeduerftigen":"...","themenfelder":[{"feld":"<eines der 6 Themenfelder>","informationssammlung":"...","ressourcen":"...","probleme_und_risiken":"..."}],"risikomatrix":[{"risiko":"...","einschaetzung":"kein|niedrig|mittel|hoch","begruendung":"...","massnahme":"..."}],"massnahmenplan":[{"thema":"...","ziel":"...","massnahmen":["..."],"haeufigkeit":"...","evaluation":"..."}],"kurzfassung_uebergabe":"...","hinweise":["..."]}`;

  const plan = await generate(user, 8000);
  return { plan, provider: kiProvider() };
}
