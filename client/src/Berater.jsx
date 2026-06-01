import React, { useState } from 'react';
import { api } from './api.js';
import { LEISTUNGEN } from './constants.js';
import { CheckboxGroup, Field } from './components.jsx';
import AgentDetail from './AgentDetail.jsx';

// Die Kanäle, die man typischerweise schon probiert hat (zum Selbsttest).
const VERSUCHT_OPTIONEN = [
  { key: 'klinik', label: 'Klinik-Sozialdienst' },
  { key: 'arzt', label: 'Arztpraxen' },
  { key: 'apotheke', label: 'Apotheken' },
  { key: 'flyer', label: 'Flyer / Briefkasten' },
  { key: 'online', label: 'Online / Google' },
  { key: 'empfehlung', label: 'Empfehlungen' },
  { key: 'sanitaetshaus', label: 'Sanitätshäuser' },
  { key: 'heim', label: 'Betreutes Wohnen' },
];

const WEG_ICON = { persönlich: '🚶', 'persönlich (kurz) + Material dalassen': '🚶', online: '💻', 'persönlich + E-Mail': '✉️' };
const erfolgTone = (n) => (n >= 65 ? 'gut' : n >= 45 ? 'mittel' : 'schwach');

export default function Berater({ setFehler }) {
  const [form, setForm] = useState({ leistungen: [], kapazitaet: 20, schon_versucht: [] });
  const [plan, setPlan] = useState(null);
  const [offen, setOffen] = useState(null);
  const [laden, setLaden] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const beraten = async (e) => {
    e?.preventDefault();
    setLaden(true);
    try {
      setPlan(await api.akquiseStrategie(form));
    } catch (e) {
      setFehler(e.message);
    } finally {
      setLaden(false);
    }
  };

  return (
    <section>
      <div className="card">
        <div className="card-head">
          <h2>🧠 Akquise-Berater – dein virtuelles Team</h2>
          <p className="muted small">
            Ein Team spezialisierter Agenten analysiert, <b>wie du regelmäßig Patienten gewinnst</b>: welcher Kanal, wie
            wahrscheinlich, persönlich oder per Mail, wen genau ansprechen – mit fertigen Vorlagen.
          </p>
        </div>
        <div className="card-body">
          <form className="form" onSubmit={beraten}>
            <Field label="Welche Leistungen bietest du an?">
              <CheckboxGroup options={LEISTUNGEN} value={form.leistungen} onChange={(v) => set('leistungen', v)} />
            </Field>
            <div className="row">
              <Field label={`Freie Kapazität: ${form.kapazitaet} h/Woche`}>
                <input type="range" min="0" max="80" value={form.kapazitaet} onChange={(e) => set('kapazitaet', +e.target.value)} />
              </Field>
            </div>
            <Field label="Was hast du schon probiert? (ehrlich – für die Diagnose)">
              <div className="checkbox-group">
                {VERSUCHT_OPTIONEN.map((o) => (
                  <label key={o.key} className={form.schon_versucht.includes(o.key) ? 'cb active' : 'cb'}>
                    <input
                      type="checkbox"
                      checked={form.schon_versucht.includes(o.key)}
                      onChange={() =>
                        set(
                          'schon_versucht',
                          form.schon_versucht.includes(o.key)
                            ? form.schon_versucht.filter((x) => x !== o.key)
                            : [...form.schon_versucht, o.key]
                        )
                      }
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </Field>
            <button className="btn primary" type="submit" disabled={laden}>
              {laden ? 'Analysiere …' : '🧠 Strategie erstellen'}
            </button>
          </form>
        </div>
      </div>

      {plan && (
        <>
          <div className="card">
            <div className="card-head"><h2>🔎 Diagnose – warum es bisher hakt</h2></div>
            <div className="card-body">
              <ul className="diag">
                {plan.diagnose.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
              <p className="erwartet">Realistisch erreichbar bei sauberer Umsetzung der Top-Kanäle: <b>{plan.erwartet_pro_monat} neue Patienten / Monat</b>.</p>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h2>🗓️ Dein 30/60/90-Tage-Plan</h2></div>
            <div className="card-body phasen">
              <Phase titel="Tage 1–30" items={plan.plan.tage_30} ton="gut" />
              <Phase titel="Tage 31–60" items={plan.plan.tage_60} ton="mittel" />
              <Phase titel="Tage 61–90" items={plan.plan.tage_90} ton="schwach" />
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>👥 Dein Agenten-Team – Kanäle nach Priorität</h2>
              <p className="muted small">Klick auf einen Agenten für den genauen Plan, Vorlage und typische Fehler.</p>
            </div>
            <div className="card-body">
              <ul className="agent-list">
                {plan.kanaele.map((k) => (
                  <li key={k.key} className={`agent ${k.versucht ? 'agent-tried' : ''}`}>
                    <button className="agent-head" onClick={() => setOffen(offen === k.key ? null : k.key)}>
                      <span className={`score score-${erfolgTone(k.erfolg)}`} style={{ width: 42, height: 42, fontSize: 15 }}>{k.erfolg}</span>
                      <span className="agent-title">
                        <strong>{k.name}</strong>
                        <span className="muted small">{k.kanal}</span>
                      </span>
                      <span className="agent-meta">
                        <span className="tag tag-search">{WEG_ICON[k.kontaktweg] || '•'} {k.kontaktweg}</span>
                        <span className="muted small">{k.patienten} Pat./Mon · {'€'.repeat(k.aufwand)} Aufwand · {k.zeit_wochen} Wo.</span>
                      </span>
                      <span className="agent-toggle">{offen === k.key ? '▲' : '▼'}</span>
                    </button>
                    {offen === k.key && <AgentDetail agent={k} />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Phase({ titel, items, ton }) {
  return (
    <div className={`phase phase-${ton}`}>
      <h3>{titel}</h3>
      <ul>{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
    </div>
  );
}
