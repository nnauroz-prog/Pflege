import React from 'react';

// Füllt Platzhalter der Vorlage mit bekanntem Kontext (Rest bleibt als {…} stehen,
// damit der Nutzer sieht, was er noch ergänzen muss).
function fuelle(text, ctx = {}) {
  return String(text || '')
    .replaceAll('{Ort}', ctx.ort || '{Ort}')
    .replaceAll('{Leistungen}', ctx.leistungen || '{Leistungen}');
}

// Gemeinsame Detailansicht eines Akquise-Agenten (genutzt im Berater und an Leads).
export default function AgentDetail({ agent: k, context }) {
  if (!k) return null;
  const schritte = Array.isArray(k.schritte) ? k.schritte : [];
  return (
    <div className="agent-body">
      {k.hinweise?.length > 0 && (
        <div className="agent-hinweis">{k.hinweise.map((h, i) => <div key={i}>💡 {h}</div>)}</div>
      )}
      {k.warum && <p><b>Warum:</b> {k.warum}</p>}
      {k.ansprechpartner && <p><b>Wen ansprechen:</b> {k.ansprechpartner}</p>}
      {schritte.length > 0 && (
        <>
          <b>Schritt für Schritt:</b>
          <ol className="agent-steps">{schritte.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </>
      )}
      {k.vorlage && (
        <div className="vorlage">
          <div className="vorlage-kopf">
            📋 Vorlage: {k.vorlage_typ}
            <button className="btn ghost btn-sm" onClick={() => navigator.clipboard?.writeText(fuelle(k.vorlage, context))}>
              kopieren
            </button>
          </div>
          <pre>{fuelle(k.vorlage, context)}</pre>
        </div>
      )}
      {k.fehler && <p className="agent-fehler">⚠️ <b>Typische Fehler:</b> {k.fehler}</p>}
      <p className="muted small">🔁 Rhythmus: {k.rhythmus} · Kontaktweg: {k.kontaktweg}</p>
    </div>
  );
}
