import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { LEAD_STATUS, KATEGORIE_ICON } from './constants.js';
import { CheckboxGroup, Field } from './components.jsx';

export default function Akquise({ setFehler }) {
  const [kategorien, setKategorien] = useState([]);
  const [form, setForm] = useState({ ort: '', radius_km: 10, kategorien: [] });
  const [center, setCenter] = useState(null);
  const [leads, setLeads] = useState([]);
  const [route, setRoute] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: '', kategorie: '' });
  const [info, setInfo] = useState(null);
  const [laden, setLaden] = useState(false);

  useEffect(() => {
    api.akquiseKategorien().then(setKategorien).catch((e) => setFehler(e.message));
  }, [setFehler]);

  const ladeListe = useCallback(async () => {
    const [l, s] = await Promise.all([api.akquiseLeads(filter), api.akquiseStats()]);
    setLeads(l);
    setStats(s);
  }, [filter]);

  useEffect(() => {
    ladeListe().catch((e) => setFehler(e.message));
  }, [ladeListe, setFehler]);

  const suchen = async (e) => {
    e.preventDefault();
    setLaden(true);
    try {
      const r = await api.akquiseSuche(form);
      setCenter(r.gebiet);
      setInfo(`${r.gefunden} Zuweiser im Umkreis von ${r.radius_km} km · Quelle: ${quelleLabel(r.quelle)}`);
      const rt = await api.akquiseRoute(r.gebiet.lat, r.gebiet.lon, 12);
      setRoute(rt);
      await ladeListe();
    } catch (e) {
      setFehler(e.message);
    } finally {
      setLaden(false);
    }
  };

  const aktualisiereRoute = useCallback(async () => {
    if (center) setRoute(await api.akquiseRoute(center.lat, center.lon, 12));
  }, [center]);

  const setLead = async (id, data) => {
    try {
      await api.updateLead(id, data);
      await ladeListe();
      await aktualisiereRoute();
    } catch (e) {
      setFehler(e.message);
    }
  };

  const toggle = (k) =>
    setForm((f) => ({
      ...f,
      kategorien: f.kategorien.includes(k) ? f.kategorien.filter((x) => x !== k) : [...f.kategorien, k],
    }));

  return (
    <section>
      <div className="card">
        <div className="card-head">
          <h2>Patienten finden – Gebiet durchsuchen</h2>
          <p className="muted small">
            Gib dein Einsatzgebiet an. Der Bot findet die wichtigsten Zuweiser (Krankenhäuser, Ärzte, Heime …),
            priorisiert sie und baut deinen Fahrplan.
          </p>
        </div>
        <div className="card-body">
          <form className="form" onSubmit={suchen}>
            <div className="row">
              <Field label="Einsatzgebiet (Ort oder PLZ)" hint="z. B. „Hannover“ oder „30159“">
                <input value={form.ort} onChange={(e) => setForm((f) => ({ ...f, ort: e.target.value }))} placeholder="Stadt / PLZ" required />
              </Field>
              <Field label={`Umkreis: ${form.radius_km} km`}>
                <input type="range" min="2" max="50" value={form.radius_km} onChange={(e) => setForm((f) => ({ ...f, radius_km: +e.target.value }))} />
              </Field>
            </div>
            <Field label="Welche Zuweiser? (leer = alle)">
              <div className="checkbox-group">
                {kategorien.map((k) => (
                  <label key={k.key} className={form.kategorien.includes(k.key) ? 'cb active' : 'cb'} title={k.tipp}>
                    <input type="checkbox" checked={form.kategorien.includes(k.key)} onChange={() => toggle(k.key)} />
                    {KATEGORIE_ICON[k.key]} {k.label}
                  </label>
                ))}
              </div>
            </Field>
            <button className="btn primary" type="submit" disabled={laden}>
              {laden ? 'Suche läuft …' : '🔍 Gebiet durchsuchen'}
            </button>
            {info && <p className="muted small">📍 {center?.label} — {info}</p>}
          </form>
        </div>
      </div>

      {stats && (
        <div className="funnel">
          <FunnelStep label="Neu" value={stats.neu} tone="neu" />
          <FunnelStep label="Kontaktiert" value={stats.kontaktiert} tone="kontaktiert" />
          <FunnelStep label="Termin" value={stats.termin} tone="termin" />
          <FunnelStep label="Gewonnen" value={stats.gewonnen} tone="gewonnen" />
          <FunnelStep label="Kein Interesse" value={stats.kein_interesse} tone="kein" />
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h2>🚗 Fahrplan – wo genau hinfahren</h2>
            <p className="muted small">Kürzeste Route durch die Top-Zuweiser (offen/kontaktiert).</p></div>
          <div className="card-body">
            {route.length === 0 ? (
              <p className="empty">Noch keine Route – zuerst ein Gebiet durchsuchen.</p>
            ) : (
              <ol className="route">
                {route.map((l, i) => (
                  <li key={l.id} className="route-stop">
                    <span className="route-num">{i + 1}</span>
                    <div className="route-body">
                      <strong>{KATEGORIE_ICON[l.kategorie]} {l.name}</strong>
                      <div className="muted small">{l.adresse || 'Adresse via Karte'} · {l.distanz_km} km · {l.etappe_km} km Etappe</div>
                    </div>
                    <span className="score score-gut" style={{ width: 38, height: 38, fontSize: 14 }}>{l.potenzial_score}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Zuweiser-Liste (Team-CRM)</h2>
            <div className="filter-row">
              <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
                <option value="">Alle Status</option>
                {LEAD_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={filter.kategorie} onChange={(e) => setFilter((f) => ({ ...f, kategorie: e.target.value }))}>
                <option value="">Alle Kategorien</option>
                {kategorien.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
              </select>
            </div>
          </div>
          <div className="card-body">
            {leads.length === 0 ? (
              <p className="empty">Keine Leads. Durchsuche ein Gebiet, um Zuweiser zu finden.</p>
            ) : (
              <ul className="list">
                {leads.map((l) => (
                  <li key={l.id} className="lead">
                    <div className="lead-head">
                      <span className={`score ${l.potenzial_score >= 70 ? 'score-gut' : l.potenzial_score >= 45 ? 'score-mittel' : 'score-schwach'}`} style={{ width: 38, height: 38, fontSize: 14 }}>{l.potenzial_score}</span>
                      <div className="lead-title">
                        <strong>{KATEGORIE_ICON[l.kategorie]} {l.name}</strong>
                        <div className="muted small">
                          {l.adresse || '–'} · {l.distanz_km} km{l.telefon ? ` · ☎ ${l.telefon}` : ''}
                          {l.quelle === 'osm' ? '' : ' · Demo'}
                        </div>
                      </div>
                    </div>
                    <div className="lead-actions">
                      <select value={l.status} onChange={(e) => setLead(l.id, { status: e.target.value })} className={`status-sel status-${l.status}`}>
                        {LEAD_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <input className="assignee" placeholder="Zuständig…" defaultValue={l.zustaendig}
                        onBlur={(e) => e.target.value !== l.zustaendig && setLead(l.id, { zustaendig: e.target.value })} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FunnelStep({ label, value, tone }) {
  return (
    <div className={`funnel-step funnel-${tone}`}>
      <span className="funnel-value">{value}</span>
      <span className="funnel-label">{label}</span>
    </div>
  );
}

function quelleLabel(q) {
  if (q === 'osm') return 'OpenStreetMap (live)';
  if (q === 'demo-fallback') return 'Demo (Live-Netz nicht erreichbar)';
  return 'Demo';
}
