import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { QUALIFIKATIONEN, LEISTUNGEN, DRINGLICHKEIT, qualiLabel } from './constants.js';
import { ScoreBadge, Chips, CheckboxGroup, Field } from './components.jsx';

const TABS = [
  { id: 'dashboard', label: 'Übersicht' },
  { id: 'vermittlung', label: 'Vermittlung' },
  { id: 'pfleger', label: 'Pfleger (Gesellschafter)' },
  { id: 'anfragen', label: 'Patientenanfragen' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [pfleger, setPfleger] = useState([]);
  const [patienten, setPatienten] = useState([]);
  const [vermittlungen, setVermittlungen] = useState([]);
  const [fehler, setFehler] = useState(null);

  const laden = useCallback(async () => {
    try {
      const [p, a, v] = await Promise.all([api.listPfleger(), api.listPatienten(), api.listVermittlungen()]);
      setPfleger(p);
      setPatienten(a);
      setVermittlungen(v);
      setFehler(null);
    } catch (e) {
      setFehler(e.message);
    }
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⚕</span>
          <div>
            <h1>PflegeMatch</h1>
            <p>Vermittlungsplattform für Pfleger-Gesellschafter ohne Patienten</p>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {fehler && <div className="banner error">⚠ {fehler}</div>}

      <main className="content">
        {tab === 'dashboard' && <Dashboard pfleger={pfleger} patienten={patienten} vermittlungen={vermittlungen} goto={setTab} />}
        {tab === 'vermittlung' && <Vermittlung patienten={patienten} reload={laden} setFehler={setFehler} />}
        {tab === 'pfleger' && <PflegerView pfleger={pfleger} reload={laden} setFehler={setFehler} />}
        {tab === 'anfragen' && <AnfragenView patienten={patienten} reload={laden} setFehler={setFehler} />}
      </main>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ pfleger, patienten, vermittlungen, goto }) {
  const frei = pfleger.filter((p) => p.ist_gesellschafter && !p.hat_patienten);
  const offen = patienten.filter((p) => p.status === 'offen');
  return (
    <section>
      <div className="kpis">
        <Kpi label="Gesellschafter ohne Patienten" value={frei.length} hint="suchen aktiv" onClick={() => goto('pfleger')} />
        <Kpi label="Offene Anfragen" value={offen.length} hint="warten auf Vermittlung" onClick={() => goto('anfragen')} />
        <Kpi label="Vermittelt" value={vermittlungen.length} hint="erfolgreich gematcht" onClick={() => goto('vermittlung')} />
        <Kpi label="Pfleger gesamt" value={pfleger.length} />
      </div>

      <div className="grid-2">
        <Card title={`Pfleger, die Patienten suchen (${frei.length})`}>
          {frei.length === 0 ? (
            <Empty text="Aktuell suchen keine Gesellschafter Patienten." />
          ) : (
            <ul className="list">
              {frei.map((c) => (
                <li key={c.id} className="list-row">
                  <div>
                    <strong>{c.name}</strong>
                    <div className="muted small">{qualiLabel(c.qualifikation)} · {c.stadt} ({c.plz}) · {c.stunden_woche} h/Woche</div>
                  </div>
                  <Chips items={c.spezialisierungen} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Offene Patientenanfragen (${offen.length})`}>
          {offen.length === 0 ? (
            <Empty text="Keine offenen Anfragen." />
          ) : (
            <ul className="list">
              {offen.map((p) => (
                <li key={p.id} className="list-row">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="muted small">Pflegegrad {p.pflegegrad} · {p.stadt} ({p.plz}) · {qualiLabel(p.benoetigte_qualifikation)}</div>
                  </div>
                  <span className={`tag tag-${p.dringlichkeit}`}>{p.dringlichkeit}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}

function Kpi({ label, value, hint, onClick }) {
  return (
    <button className="kpi" onClick={onClick} disabled={!onClick}>
      <span className="kpi-value">{value}</span>
      <span className="kpi-label">{label}</span>
      {hint && <span className="kpi-hint">{hint}</span>}
    </button>
  );
}

/* ---------------- Vermittlung / Matching ---------------- */
function Vermittlung({ patienten, reload, setFehler }) {
  const offen = patienten.filter((p) => p.status === 'offen');
  const [aktiv, setAktiv] = useState(null);
  const [matches, setMatches] = useState([]);
  const [laden, setLaden] = useState(false);

  useEffect(() => {
    if (!aktiv && offen.length) setAktiv(offen[0].id);
  }, [offen, aktiv]);

  useEffect(() => {
    if (!aktiv) return;
    setLaden(true);
    api
      .matchesFuerPatient(aktiv)
      .then(setMatches)
      .catch((e) => setFehler(e.message))
      .finally(() => setLaden(false));
  }, [aktiv, setFehler]);

  const vermitteln = async (caregiverId) => {
    try {
      await api.createVermittlung(caregiverId, aktiv);
      await reload();
      setAktiv(null);
      setMatches([]);
    } catch (e) {
      setFehler(e.message);
    }
  };

  const anfrage = offen.find((p) => p.id === aktiv);

  return (
    <section>
      <Card title="Anfrage wählen">
        {offen.length === 0 ? (
          <Empty text="Keine offenen Anfragen – alles vermittelt 🎉" />
        ) : (
          <div className="pill-row">
            {offen.map((p) => (
              <button key={p.id} className={aktiv === p.id ? 'pill active' : 'pill'} onClick={() => setAktiv(p.id)}>
                {p.name} · {p.stadt} · PG{p.pflegegrad}
              </button>
            ))}
          </div>
        )}
      </Card>

      {anfrage && (
        <Card title={`Passende Gesellschafter für „${anfrage.name}“`} subtitle={`Gesucht: ${qualiLabel(anfrage.benoetigte_qualifikation)} · ${anfrage.stadt} (${anfrage.plz}) · ${anfrage.stunden_woche} h/Woche`}>
          {laden ? (
            <Empty text="Berechne Matches …" />
          ) : matches.length === 0 ? (
            <Empty text="Kein passender Gesellschafter gefunden." />
          ) : (
            <ul className="match-list">
              {matches.map((m) => (
                <li key={m.caregiver.id} className={`match ${m.machbar ? '' : 'match-warn'}`}>
                  <div className="match-head">
                    <ScoreBadge score={m.score} machbar={m.machbar} />
                    <div className="match-title">
                      <strong>{m.caregiver.name}</strong>
                      <div className="muted small">{qualiLabel(m.caregiver.qualifikation)} · {m.caregiver.stadt} ({m.caregiver.plz})</div>
                    </div>
                    <button className="btn primary" onClick={() => vermitteln(m.caregiver.id)}>
                      Vermitteln
                    </button>
                  </div>
                  <ul className="reasons">
                    {m.gruende.map((g, i) => (
                      <li key={i} className={g.startsWith('Bonus') ? 'reason bonus' : /reicht nicht|Ausserhalb|Keine/.test(g) ? 'reason neg' : 'reason pos'}>
                        {g}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </section>
  );
}

/* ---------------- Pfleger ---------------- */
function PflegerView({ pfleger, reload, setFehler }) {
  const [form, setForm] = useState(leerPfleger());
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const speichern = async (e) => {
    e.preventDefault();
    try {
      await api.createPfleger(form);
      setForm(leerPfleger());
      await reload();
    } catch (e) {
      setFehler(e.message);
    }
  };

  const entfernen = async (id) => {
    try {
      await api.deletePfleger(id);
      await reload();
    } catch (e) {
      setFehler(e.message);
    }
  };

  return (
    <section className="grid-2">
      <Card title="Pfleger (Gesellschafter) anlegen">
        <form className="form" onSubmit={speichern}>
          <Field label="Name"><input value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="E-Mail"><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required /></Field>
          <div className="row">
            <Field label="PLZ"><input value={form.plz} onChange={(e) => set('plz', e.target.value)} required /></Field>
            <Field label="Stadt"><input value={form.stadt} onChange={(e) => set('stadt', e.target.value)} required /></Field>
          </div>
          <Field label="Qualifikation">
            <select value={form.qualifikation} onChange={(e) => set('qualifikation', e.target.value)}>
              {QUALIFIKATIONEN.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          </Field>
          <Field label="Spezialisierungen / Leistungen">
            <CheckboxGroup options={LEISTUNGEN} value={form.spezialisierungen} onChange={(v) => set('spezialisierungen', v)} />
          </Field>
          <div className="row">
            <Field label="Einsatzradius (km)"><input type="number" min="1" value={form.radius_km} onChange={(e) => set('radius_km', e.target.value)} /></Field>
            <Field label="Verfügbar (h/Woche)"><input type="number" min="1" value={form.stunden_woche} onChange={(e) => set('stunden_woche', e.target.value)} /></Field>
          </div>
          <button className="btn primary" type="submit">Gesellschafter aufnehmen</button>
        </form>
      </Card>

      <Card title={`Gesellschafter (${pfleger.length})`}>
        {pfleger.length === 0 ? (
          <Empty text="Noch keine Pfleger erfasst." />
        ) : (
          <ul className="list">
            {pfleger.map((c) => (
              <li key={c.id} className="list-row">
                <div>
                  <strong>{c.name}</strong>{' '}
                  {c.hat_patienten ? <span className="tag tag-ok">hat Patienten</span> : <span className="tag tag-search">sucht Patienten</span>}
                  <div className="muted small">{qualiLabel(c.qualifikation)} · {c.stadt} ({c.plz}) · {c.radius_km} km · {c.stunden_woche} h/Woche</div>
                  <Chips items={c.spezialisierungen} />
                </div>
                <button className="btn ghost" onClick={() => entfernen(c.id)}>Entfernen</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

/* ---------------- Anfragen ---------------- */
function AnfragenView({ patienten, reload, setFehler }) {
  const [form, setForm] = useState(leerPatient());
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const speichern = async (e) => {
    e.preventDefault();
    try {
      await api.createPatient(form);
      setForm(leerPatient());
      await reload();
    } catch (e) {
      setFehler(e.message);
    }
  };

  const entfernen = async (id) => {
    try {
      await api.deletePatient(id);
      await reload();
    } catch (e) {
      setFehler(e.message);
    }
  };

  return (
    <section className="grid-2">
      <Card title="Patientenanfrage erfassen">
        <form className="form" onSubmit={speichern}>
          <Field label="Name / Pseudonym"><input value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="Kontakt (Angehörige:r)"><input value={form.kontakt} onChange={(e) => set('kontakt', e.target.value)} required /></Field>
          <div className="row">
            <Field label="PLZ"><input value={form.plz} onChange={(e) => set('plz', e.target.value)} required /></Field>
            <Field label="Stadt"><input value={form.stadt} onChange={(e) => set('stadt', e.target.value)} required /></Field>
          </div>
          <div className="row">
            <Field label="Pflegegrad">
              <select value={form.pflegegrad} onChange={(e) => set('pflegegrad', e.target.value)}>
                {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Pflegegrad {g}</option>)}
              </select>
            </Field>
            <Field label="Benötigte Qualifikation">
              <select value={form.benoetigte_qualifikation} onChange={(e) => set('benoetigte_qualifikation', e.target.value)}>
                {QUALIFIKATIONEN.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Benötigte Leistungen">
            <CheckboxGroup options={LEISTUNGEN} value={form.benoetigte_leistungen} onChange={(v) => set('benoetigte_leistungen', v)} />
          </Field>
          <div className="row">
            <Field label="Bedarf (h/Woche)"><input type="number" min="1" value={form.stunden_woche} onChange={(e) => set('stunden_woche', e.target.value)} /></Field>
            <Field label="Dringlichkeit">
              <select value={form.dringlichkeit} onChange={(e) => set('dringlichkeit', e.target.value)}>
                {DRINGLICHKEIT.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
          </div>
          <button className="btn primary" type="submit">Anfrage einstellen</button>
        </form>
      </Card>

      <Card title={`Anfragen (${patienten.length})`}>
        {patienten.length === 0 ? (
          <Empty text="Noch keine Anfragen." />
        ) : (
          <ul className="list">
            {patienten.map((p) => (
              <li key={p.id} className="list-row">
                <div>
                  <strong>{p.name}</strong>{' '}
                  {p.status === 'vermittelt' ? <span className="tag tag-ok">vermittelt</span> : <span className={`tag tag-${p.dringlichkeit}`}>{p.dringlichkeit}</span>}
                  <div className="muted small">PG {p.pflegegrad} · {p.stadt} ({p.plz}) · {qualiLabel(p.benoetigte_qualifikation)} · {p.stunden_woche} h/Woche</div>
                  <Chips items={p.benoetigte_leistungen} />
                </div>
                <button className="btn ghost" onClick={() => entfernen(p.id)}>Entfernen</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

/* ---------------- Helpers ---------------- */
function Card({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {subtitle && <p className="muted small">{subtitle}</p>}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <p className="empty">{text}</p>;
}

function leerPfleger() {
  return { name: '', email: '', plz: '', stadt: '', qualifikation: 'pflegefachkraft', spezialisierungen: [], radius_km: 25, stunden_woche: 20 };
}

function leerPatient() {
  return { name: '', kontakt: '', plz: '', stadt: '', pflegegrad: 2, benoetigte_qualifikation: 'pflegefachkraft', benoetigte_leistungen: [], stunden_woche: 10, dringlichkeit: 'normal' };
}
