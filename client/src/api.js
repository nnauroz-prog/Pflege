// Standard: gleiches Origin (lokal/Single-Host). Für getrenntes Hosting
// VITE_API_URL beim Build setzen, z. B. https://mein-backend.example.com
const BASE = (import.meta.env?.VITE_API_URL || '') + '/api';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    let msg = `Fehler ${res.status}`;
    try {
      const j = await res.json();
      if (j.error) msg = j.error + (Array.isArray(j.felder) ? `: ${j.felder.join(', ')}` : '') + (j.detail ? ` – ${j.detail}` : '');
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => req('/health'),

  listPfleger: () => req('/caregivers'),
  createPfleger: (data) => req('/caregivers', { method: 'POST', body: JSON.stringify(data) }),
  deletePfleger: (id) => req(`/caregivers/${id}`, { method: 'DELETE' }),
  matchesFuerPfleger: (id) => req(`/caregivers/${id}/matches`),

  listPatienten: () => req('/patients'),
  createPatient: (data) => req('/patients', { method: 'POST', body: JSON.stringify(data) }),
  deletePatient: (id) => req(`/patients/${id}`, { method: 'DELETE' }),
  matchesFuerPatient: (id) => req(`/patients/${id}/matches`),

  listVermittlungen: () => req('/vermittlungen'),
  createVermittlung: (caregiver_id, patient_id) =>
    req('/vermittlungen', { method: 'POST', body: JSON.stringify({ caregiver_id, patient_id }) }),
  deleteVermittlung: (id) => req(`/vermittlungen/${id}`, { method: 'DELETE' }),

  akquiseKategorien: () => req('/akquise/kategorien'),
  akquiseSuche: (data) => req('/akquise/suche', { method: 'POST', body: JSON.stringify(data) }),
  akquiseLeads: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return req('/akquise/leads' + (q ? `?${q}` : ''));
  },
  akquiseRoute: (lat, lon, limit = 12) => req(`/akquise/route?lat=${lat}&lon=${lon}&limit=${limit}`),
  akquiseStats: () => req('/akquise/stats'),
  akquiseAgenten: () => req('/akquise/agenten'),
  akquiseStrategie: (data) => req('/akquise/strategie', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (id, data) => req(`/akquise/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead: (id) => req(`/akquise/leads/${id}`, { method: 'DELETE' }),

  // SIS-/Maßnahmenplan-Assistent
  planStatus: () => req('/plan/status'),
  planRueckfragen: (data) => req('/plan/rueckfragen', { method: 'POST', body: JSON.stringify(data) }),
  planErstellen: (data) => req('/plan/erstellen', { method: 'POST', body: JSON.stringify(data) }),
};
