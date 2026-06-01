import { Router } from 'express';
import { db } from '../db.js';
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

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM caregivers ORDER BY erstellt_am DESC').all();
  res.json(rows.map(serialize));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Pfleger nicht gefunden' });
  res.json(serialize(row));
});

router.post('/', (req, res) => {
  const b = req.body || {};
  const fehler = [];
  if (!b.name?.trim()) fehler.push('name');
  if (!b.email?.trim()) fehler.push('email');
  if (!b.plz?.trim()) fehler.push('plz');
  if (!b.stadt?.trim()) fehler.push('stadt');
  if (!QUALIS.includes(b.qualifikation)) fehler.push('qualifikation');
  if (fehler.length) return res.status(400).json({ error: 'Pflichtfelder fehlen/ungueltig', felder: fehler });

  const info = db
    .prepare(
      `INSERT INTO caregivers
       (name, email, plz, stadt, qualifikation, spezialisierungen, radius_km, stunden_woche, ist_gesellschafter, hat_patienten, notiz)
       VALUES (@name, @email, @plz, @stadt, @qualifikation, @spezialisierungen, @radius_km, @stunden_woche, @ist_gesellschafter, @hat_patienten, @notiz)`
    )
    .run({
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
    });

  const row = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(serialize(row));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM caregivers WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Passende offene Anfragen fuer diesen Pfleger
router.get('/:id/matches', (req, res) => {
  const c = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Pfleger nicht gefunden' });
  const patienten = db.prepare('SELECT * FROM patients').all();
  res.json(matchesFuerPfleger(c, patienten));
});

export default router;
