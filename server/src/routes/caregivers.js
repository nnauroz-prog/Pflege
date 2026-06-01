import { Router } from 'express';
import { all, get, run } from '../db.js';
import { matchesFuerPfleger } from '../matching.js';

const router = Router();
const QUALIS = ['pflegehelfer', 'pflegefachkraft', 'spezialisiert'];

function serialize(row) {
  if (!row) return row;
  return {
    ...row,
    spezialisierungen: JSON.parse(row.spezialisierungen || '[]'),
    ist_gesellschafter: !!row.ist_gesellschafter,
    hat_patienten: !!row.hat_patienten,
  };
}

router.get('/', async (req, res) => {
  const rows = await all('SELECT * FROM caregivers ORDER BY erstellt_am DESC');
  res.json(rows.map(serialize));
});

router.get('/:id', async (req, res) => {
  const row = await get('SELECT * FROM caregivers WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Pfleger nicht gefunden' });
  res.json(serialize(row));
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  const fehler = [];
  if (!b.name?.trim()) fehler.push('name');
  if (!b.email?.trim()) fehler.push('email');
  if (!b.plz?.trim()) fehler.push('plz');
  if (!b.stadt?.trim()) fehler.push('stadt');
  if (!QUALIS.includes(b.qualifikation)) fehler.push('qualifikation');
  if (fehler.length) return res.status(400).json({ error: 'Pflichtfelder fehlen/ungueltig', felder: fehler });

  const info = await run(
    `INSERT INTO caregivers
     (name, email, plz, stadt, qualifikation, spezialisierungen, radius_km, stunden_woche, ist_gesellschafter, hat_patienten, notiz)
     VALUES (@name, @email, @plz, @stadt, @qualifikation, @spezialisierungen, @radius_km, @stunden_woche, @ist_gesellschafter, @hat_patienten, @notiz)`,
    {
      name: b.name.trim(),
      email: b.email.trim(),
      plz: b.plz.trim(),
      stadt: b.stadt.trim(),
      qualifikation: b.qualifikation,
      spezialisierungen: JSON.stringify(Array.isArray(b.spezialisierungen) ? b.spezialisierungen : []),
      radius_km: Number(b.radius_km) || 25,
      stunden_woche: Number(b.stunden_woche) || 20,
      ist_gesellschafter: b.ist_gesellschafter === false ? 0 : 1,
      hat_patienten: b.hat_patienten ? 1 : 0,
      notiz: b.notiz?.trim() || '',
    }
  );
  const row = await get('SELECT * FROM caregivers WHERE id = ?', [info.lastInsertRowid]);
  res.status(201).json(serialize(row));
});

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM caregivers WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

router.get('/:id/matches', async (req, res) => {
  const c = await get('SELECT * FROM caregivers WHERE id = ?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Pfleger nicht gefunden' });
  const patienten = await all('SELECT * FROM patients');
  res.json(matchesFuerPfleger(c, patienten));
});

export default router;
