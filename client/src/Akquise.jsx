import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { LEAD_STATUS, KATEGORIE_ICON, KATEGORIEN_AKQUISE, QUALIFIKATIONEN, LEISTUNGEN, DRINGLICHKEIT } from './constants.js';
import { CheckboxGroup, Field } from './components.jsx';
import MapView from './MapView.jsx';

export default function Akquise({ setFehler }) {
  const kategorien = KATEGORIEN_AKQUISE; // lokal – kein Backend nötig fürs Formular
  const [form, setForm] = useState({ ort: '', radius_km: 10, kategorien: [] });
  const [center, setCenter] = useState(null);
  const [leads, setLeads] = useState([]);
  const [route, setRoute] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState({ status: '', kategorie: '' });
  const [info, setInfo] = useState(null);
  const [laden, setLaden] = useState(false);
  const [patientFor, setPatientFor] = useState(null); // Lead, für den ein Patient aufgenommen wird

  const ladeListe = useCallback(async () => {
    const [l, s] = await Promise.all([api.akquiseLeads(filter), api.akquiseStats()]);
    setLeads(l);
    setStats(s);
  }, [filter]);

  useEffect(() => {
    // Erstes Laden still – fehlendes Backend meldet die App-Ebene zentral.
    ladeListe().catch(() => {});
  }, [ladeListe]);

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

  const patientAufnehmen = async (lead, daten) => {
    try {
      await api.createPatient({
        ...daten,
        plz: lead.plz || '',
        stadt: lead.stadt || lead.gebiet || '',
        quelle_lead_id: lead.id,
        quelle_lead: lead.name,
      });
      // Zuweiser gilt damit als gewonnen
      if (lead.status !== 'gewonnen') await api.updateLead(lead.id, { status: 'gewonnen' });
      setPatientFor(null);
      await ladeListe();
      await aktualisiereRoute();
      setInfo(`Patientenanfrage über „${lead.name}“ angelegt – jetzt im Tab „Vermittlung“ matchbar.`);
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

      {leads.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>🗺️ Karte – Zuweiser im Gebiet</h2>
            <p className="muted small">Pins nach Status (grau = neu, blau = kontaktiert, orange = Termin, grün = gewonnen). Größe = Potenzial. Linie = Fahrplan.</p>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <MapView center={center} leads={leads} route={route} />
          </div>
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
                      <button type="button" className="btn primary btn-sm" title="Patientenanfrage von diesem Zuweiser aufnehmen" onClick={() => setPatientFor(l)}>＋ Patient</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {patientFor && (
        <PatientModal lead={patientFor} onClose={() => setPatientFor(null)} onSave={(d) => patientAufnehmen(patientFor, d)} />
      )}
    </section>
  );
}

function PatientModal({ lead, onClose, onSave }) {
  const [d, setD] = useState({
    name: '', kontakt: '', pflegegrad: 2, benoetigte_qualifikation: 'pflegefachkraft',
    benoetigte_leistungen: [], stunden_woche: 10, dringlichkeit: 'normal',
  });
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-head">
          <h2>Patient aufnehmen</h2>
          <p className="muted small">Herkunft: {KATEGORIE_ICON[lead.kategorie]} {lead.name}{lead.stadt ? ` · ${lead.stadt}` : ''}</p>
        </div>
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(d); }}>
          <div className="row">
            <Field label="Name / Pseudonym"><input value={d.name} onChange={(e) => set('name', e.target.value)} required /></Field>
            <Field label="Kontakt"><input value={d.kontakt} onChange={(e) => set('kontakt', e.target.value)} required /></Field>
          </div>
          <div className="row">
            <Field label="Pflegegrad">
              <select value={d.pflegegrad} onChange={(e) => set('pflegegrad', e.target.value)}>
                {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Pflegegrad {g}</option>)}
              </select>
            </Field>
            <Field label="Benötigte Qualifikation">
              <select value={d.benoetigte_qualifikation} onChange={(e) => set('benoetigte_qualifikation', e.target.value)}>
                {QUALIFIKATIONEN.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Benötigte Leistungen">
            <CheckboxGroup options={LEISTUNGEN} value={d.benoetigte_leistungen} onChange={(v) => set('benoetigte_leistungen', v)} />
          </Field>
          <div className="row">
            <Field label="Bedarf (h/Woche)"><input type="number" min="1" value={d.stunden_woche} onChange={(e) => set('stunden_woche', e.target.value)} /></Field>
            <Field label="Dringlichkeit">
              <select value={d.dringlichkeit} onChange={(e) => set('dringlichkeit', e.target.value)}>
                {DRINGLICHKEIT.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="btn primary">Anfrage anlegen</button>
          </div>
        </form>
      </div>
    </div>
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
