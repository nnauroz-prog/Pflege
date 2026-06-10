import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { Field } from './components.jsx';

const SETTINGS = [
  { value: 'ambulant', label: 'Ambulant' },
  { value: 'stationär', label: 'Stationär' },
];

function leerStammdaten() {
  return { name: '', alter: '', geschlecht: '', pflegegrad: '', setting: 'ambulant', wohnsituation: '', diagnosen: '', hilfsmittel: '', allergien: '' };
}

export default function App() {
  const [schritt, setSchritt] = useState(1);
  const [kiOk, setKiOk] = useState(true);
  const [stammdaten, setStammdaten] = useState(leerStammdaten());
  const [freitext, setFreitext] = useState('');
  const [rueckfragen, setRueckfragen] = useState([]);
  const [antworten, setAntworten] = useState({});
  const [plan, setPlan] = useState(null);
  const [laden, setLaden] = useState(false);
  const [ladeText, setLadeText] = useState('');
  const [fehler, setFehler] = useState(null);
  const [kiDetail, setKiDetail] = useState('');

  useEffect(() => {
    api
      .planStatus()
      .then((s) => {
        setKiOk(s.ki);
        setKiDetail(s.ki ? '' : 'Server erreichbar (API läuft), aber ANTHROPIC_API_KEY fehlt im Deploy → ki:false.');
      })
      .catch((e) => {
        setKiOk(false);
        setKiDetail('API nicht erreichbar: ' + (e?.message || String(e)) + ' → /api-Funktion läuft nicht.');
      });
  }, []);

  const set = (k, v) => setStammdaten((s) => ({ ...s, [k]: v }));

  const zuRueckfragen = async (e) => {
    e?.preventDefault();
    if (!stammdaten.name.trim()) return setFehler('Bitte mindestens Name/Pseudonym angeben.');
    setFehler(null); setLaden(true); setLadeText('Der Assistent überlegt sich passende Rückfragen …');
    try {
      const data = { stammdaten: normalisiere(stammdaten), freitext };
      const r = await api.planRueckfragen(data);
      setRueckfragen(r.rueckfragen || []);
      setAntworten({});
      setSchritt(2);
    } catch (e) {
      setFehler(e.message);
    } finally {
      setLaden(false);
    }
  };

  const erstellePlan = async () => {
    setFehler(null); setLaden(true); setLadeText('Der Assistent erstellt SIS, Risikomatrix und Maßnahmenplan …');
    try {
      const antwortListe = rueckfragen.map((f, i) => ({ frage: f.frage, antwort: antworten[i] || '' }));
      const r = await api.planErstellen({ stammdaten: normalisiere(stammdaten), freitext, antworten: antwortListe });
      setPlan(r.plan);
      setSchritt(3);
    } catch (e) {
      setFehler(e.message);
    } finally {
      setLaden(false);
    }
  };

  const neu = () => {
    setStammdaten(leerStammdaten()); setFreitext(''); setRueckfragen([]); setAntworten({}); setPlan(null); setFehler(null); setSchritt(1);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">📋</span>
          <div>
            <h1>Pflegeplan-Assistent</h1>
            <p>SIS &amp; Maßnahmenplan (Strukturmodell) – KI-gestützt aus wenigen Eckdaten</p>
          </div>
        </div>
        <div className="stepper">
          <Step n={1} aktiv={schritt} label="Eckdaten" />
          <Step n={2} aktiv={schritt} label="Rückfragen" />
          <Step n={3} aktiv={schritt} label="Plan" />
        </div>
      </header>

      {!kiOk && (
        <div className="banner warn">
          🔌 <b>KI noch nicht verbunden.</b> Du kannst die Eckdaten ausfüllen, aber zum Erstellen muss ein KI-Schlüssel
          gesetzt sein: <code>GEMINI_API_KEY</code> (kostenlos, ohne Karte) oder <code>ANTHROPIC_API_KEY</code>.
          {kiDetail && <div className="small" style={{ marginTop: 6, opacity: 0.85 }}>Diagnose: <code>{kiDetail}</code></div>}
        </div>
      )}
      {fehler && <div className="banner error">⚠ {fehler}</div>}

      <main className="content">
        {laden && (
          <div className="lade">
            <div className="spinner" />
            <p>{ladeText}</p>
          </div>
        )}

        {!laden && schritt === 1 && (
          <div className="card">
            <div className="card-head">
              <h2>Eckdaten zur pflegebedürftigen Person</h2>
              <p className="muted small">Nur wenige Angaben nötig – der Assistent fragt den Rest gezielt nach. Bitte pseudonymisieren.</p>
            </div>
            <div className="card-body">
              <form className="form" onSubmit={zuRueckfragen}>
                <div className="row">
                  <Field label="Name / Pseudonym *"><input value={stammdaten.name} onChange={(e) => set('name', e.target.value)} placeholder="z. B. Herr M." required /></Field>
                  <Field label="Alter"><input value={stammdaten.alter} onChange={(e) => set('alter', e.target.value)} placeholder="z. B. 82" /></Field>
                </div>
                <div className="row">
                  <Field label="Geschlecht">
                    <select value={stammdaten.geschlecht} onChange={(e) => set('geschlecht', e.target.value)}>
                      <option value="">–</option><option>weiblich</option><option>männlich</option><option>divers</option>
                    </select>
                  </Field>
                  <Field label="Pflegegrad">
                    <select value={stammdaten.pflegegrad} onChange={(e) => set('pflegegrad', e.target.value)}>
                      <option value="">–</option>{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Pflegegrad {g}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="row">
                  <Field label="Versorgung">
                    <select value={stammdaten.setting} onChange={(e) => set('setting', e.target.value)}>
                      {SETTINGS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Wohnsituation"><input value={stammdaten.wohnsituation} onChange={(e) => set('wohnsituation', e.target.value)} placeholder="z. B. allein, EG, mit Ehefrau" /></Field>
                </div>
                <Field label="Hauptdiagnosen" hint="mit Komma trennen"><input value={stammdaten.diagnosen} onChange={(e) => set('diagnosen', e.target.value)} placeholder="z. B. Demenz, Diabetes Typ 2, Z. n. Sturz" /></Field>
                <div className="row">
                  <Field label="Hilfsmittel"><input value={stammdaten.hilfsmittel} onChange={(e) => set('hilfsmittel', e.target.value)} placeholder="z. B. Rollator, Hörgerät" /></Field>
                  <Field label="Allergien"><input value={stammdaten.allergien} onChange={(e) => set('allergien', e.target.value)} placeholder="z. B. Penicillin" /></Field>
                </div>
                <Field label="Was ist sonst wichtig? (frei)" hint="Beobachtungen, Wünsche, Besonderheiten">
                  <textarea rows={3} value={freitext} onChange={(e) => setFreitext(e.target.value)} placeholder="z. B. nachts unruhig, möchte selbstständig essen, Tochter pflegt mit …" />
                </Field>
                <div className="btn-reihe">
                  <button className="btn primary" type="submit">Weiter zu Rückfragen →</button>
                  <button className="btn" type="button" onClick={erstellePlan} title="Ohne Rückfragen direkt erstellen">Direkt Plan erstellen</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!laden && schritt === 2 && (
          <div className="card">
            <div className="card-head">
              <h2>Rückfragen des Assistenten</h2>
              <p className="muted small">Beantworte, was du weißt – Unbekanntes einfach leer lassen. Je mehr, desto besser der Plan.</p>
            </div>
            <div className="card-body">
              {rueckfragen.length === 0 ? (
                <p className="empty">Keine Rückfragen – du kannst direkt den Plan erstellen.</p>
              ) : (
                <div className="form">
                  {rueckfragen.map((f, i) => (
                    <Field key={i} label={f.frage} hint={f.themenfeld}>
                      <input value={antworten[i] || ''} onChange={(e) => setAntworten((a) => ({ ...a, [i]: e.target.value }))} placeholder="Antwort (optional)" />
                    </Field>
                  ))}
                </div>
              )}
              <div className="btn-reihe">
                <button className="btn ghost" type="button" onClick={() => setSchritt(1)}>← Zurück</button>
                <button className="btn primary" type="button" onClick={erstellePlan}>✦ Plan erstellen</button>
              </div>
            </div>
          </div>
        )}

        {!laden && schritt === 3 && plan && (
          <PlanAnsicht plan={plan} stammdaten={stammdaten} onNeu={neu} onZurueck={() => setSchritt(2)} />
        )}
      </main>
    </div>
  );
}

function normalisiere(s) {
  return { ...s, diagnosen: s.diagnosen ? s.diagnosen.split(',').map((d) => d.trim()).filter(Boolean) : [] };
}

function Step({ n, aktiv, label }) {
  const status = aktiv === n ? 'aktiv' : aktiv > n ? 'fertig' : '';
  return (
    <div className={`step ${status}`}>
      <span className="step-n">{aktiv > n ? '✓' : n}</span>
      <span className="step-label">{label}</span>
    </div>
  );
}

/* ---------------- Plan-Ansicht ---------------- */
function PlanAnsicht({ plan, stammdaten, onNeu, onZurueck }) {
  const [kopiert, setKopiert] = useState(false);
  const text = planAlsText(plan, stammdaten);
  const kopieren = async () => {
    try { await navigator.clipboard.writeText(text); setKopiert(true); setTimeout(() => setKopiert(false), 2000); } catch {}
  };
  const tonRisiko = (e) => (e === 'hoch' ? 'tag-hoch' : e === 'mittel' ? 'tag-normal' : 'tag-niedrig');

  return (
    <section>
      <div className="plan-aktionen">
        <h2 className="plan-titel">Dokumentation: {stammdaten.name}</h2>
        <div className="btn-reihe">
          <button className="btn" onClick={kopieren}>{kopiert ? '✓ kopiert' : '⧉ Als Text kopieren'}</button>
          <button className="btn" onClick={() => window.print()}>🖨 Drucken / PDF</button>
          <button className="btn ghost" onClick={onZurueck}>← Rückfragen</button>
          <button className="btn primary" onClick={onNeu}>+ Neuer Plan</button>
        </div>
      </div>

      <div className="card sektion">
        <div className="card-head"><h3>Sicht der pflegebedürftigen Person</h3></div>
        <div className="card-body"><p className="fliess">{plan.sicht_des_pflegebeduerftigen}</p></div>
      </div>

      <div className="card sektion">
        <div className="card-head"><h3>Strukturierte Informationssammlung (SIS)</h3></div>
        <div className="card-body">
          {plan.themenfelder?.map((t, i) => (
            <div key={i} className="themenfeld">
              <h4>{i + 1}. {t.feld}</h4>
              <p><b>Informationen:</b> {t.informationssammlung}</p>
              <p className="pos2"><b>Ressourcen:</b> {t.ressourcen}</p>
              <p className="neg2"><b>Probleme/Risiken:</b> {t.probleme_und_risiken}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card sektion">
        <div className="card-head"><h3>Risikomatrix</h3></div>
        <div className="card-body">
          <ul className="risiko-liste">
            {plan.risikomatrix?.map((r, i) => (
              <li key={i} className="risiko">
                <span className={`tag ${tonRisiko(r.einschaetzung)}`}>{r.einschaetzung}</span>
                <div>
                  <strong>{r.risiko}</strong>
                  <div className="muted small">{r.begruendung}</div>
                  {r.massnahme && <div className="small">→ {r.massnahme}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card sektion">
        <div className="card-head"><h3>Maßnahmenplan</h3></div>
        <div className="card-body">
          {plan.massnahmenplan?.map((m, i) => (
            <div key={i} className="massnahme-block">
              <h4>{m.thema}</h4>
              <p className="ziel"><b>Ziel:</b> {m.ziel}</p>
              <ul className="agent-steps">{(m.massnahmen || []).map((x, k) => <li key={k}>{x}</li>)}</ul>
              <div className="muted small">{m.haeufigkeit ? `Häufigkeit: ${m.haeufigkeit}` : ''}{m.evaluation ? ` · Evaluation: ${m.evaluation}` : ''}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card sektion">
        <div className="card-head"><h3>Kurzfassung / Übergabe</h3></div>
        <div className="card-body"><p className="fliess">{plan.kurzfassung_uebergabe}</p></div>
      </div>

      {plan.hinweise?.length > 0 && (
        <div className="card sektion">
          <div className="card-head"><h3>Offene Punkte / Hinweise</h3></div>
          <div className="card-body"><ul className="diag">{plan.hinweise.map((h, i) => <li key={i}>{h}</li>)}</ul></div>
        </div>
      )}

      <p className="muted small disclaimer">⚠ KI-generierter Entwurf. Vor Verwendung fachlich prüfen und an die individuelle Situation anpassen.</p>
    </section>
  );
}

function planAlsText(p, s) {
  const L = [];
  L.push(`PFLEGEDOKUMENTATION (Strukturmodell) – ${s.name}`);
  if (s.pflegegrad) L.push(`Pflegegrad ${s.pflegegrad} · ${s.setting}`);
  L.push('');
  L.push('SICHT DER PFLEGEBEDÜRFTIGEN PERSON');
  L.push(p.sicht_des_pflegebeduerftigen, '');
  L.push('SIS – STRUKTURIERTE INFORMATIONSSAMMLUNG');
  p.themenfelder?.forEach((t, i) => {
    L.push(`${i + 1}. ${t.feld}`);
    L.push(`   Informationen: ${t.informationssammlung}`);
    L.push(`   Ressourcen: ${t.ressourcen}`);
    L.push(`   Probleme/Risiken: ${t.probleme_und_risiken}`);
  });
  L.push('', 'RISIKOMATRIX');
  p.risikomatrix?.forEach((r) => L.push(`- [${r.einschaetzung}] ${r.risiko}: ${r.begruendung}${r.massnahme ? ` → ${r.massnahme}` : ''}`));
  L.push('', 'MASSNAHMENPLAN');
  p.massnahmenplan?.forEach((m) => {
    L.push(`# ${m.thema}`);
    L.push(`  Ziel: ${m.ziel}`);
    (m.massnahmen || []).forEach((x) => L.push(`  - ${x}`));
    if (m.haeufigkeit) L.push(`  Häufigkeit: ${m.haeufigkeit}`);
    if (m.evaluation) L.push(`  Evaluation: ${m.evaluation}`);
  });
  L.push('', 'KURZFASSUNG / ÜBERGABE', p.kurzfassung_uebergabe);
  if (p.hinweise?.length) { L.push('', 'OFFENE PUNKTE'); p.hinweise.forEach((h) => L.push(`- ${h}`)); }
  return L.join('\n');
}
