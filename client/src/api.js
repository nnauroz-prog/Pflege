const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    let msg = `Fehler ${res.status}`;
    try {
      const j = await res.json();
      if (j.error) msg = j.error + (j.felder ? `: ${j.felder.join(', ')}` : '');
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
};
