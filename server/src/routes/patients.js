import { Router } from 'express';
import { all, get, run } from '../db.js';
import { matchesFuerPatient } from '../matching.js';

const router = Router();
const QUALIS = ['pflegehelfer', 'pflegefachkraft', 'spezialisiert'];

function serialize(row) {
  if (!row) return row;
  return { ...row, benoetigte_leistungen: JSON.parse(row.benoetigte_leistungen || '[]') };
}

router.get('/', async (req, res) => {
  const rows = await all('SELECT * FROM patients ORDER BY erstellt_am DESC');
  res.json(rows.map(serialize));
});

router.get('/:id', async (req, res) => {
  const row = await get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Anfrage nicht gefunden' });
  res.json(serialize(row));
});

router.post('/', async (req, res) => {
  const b = req.body || {};
  const fehler = [];
  if (!b.name?.trim()) fehler.push('name');
  if (!b.kontakt?.trim()) fehler.push('kontakt');
  if (!b.plz?.trim()) fehler.push('plz');
  if (!b.stadt?.trim()) fehler.push('stadt');
  if (!QUALIS.includes(b.benoetigte_qualifikation)) fehler.push('benoetigte_qualifikation');
  if (fehler.length) return res.status(400).json({ error: 'Pflichtfelder fehlen/ungueltig', felder: fehler });

  const info = await run(
    `INSERT INTO patients
     (name, kontakt, plz, stadt, pflegegrad, benoetigte_qualifikation, benoetigte_leistungen, stunden_woche, dringlichkeit, status, notiz, quelle_lead_id, quelle_lead)
     VALUES (@name, @kontakt, @plz, @stadt, @pflegegrad, @benoetigte_qualifikation, @benoetigte_leistungen, @stunden_woche, @dringlichkeit, 'offen', @notiz, @quelle_lead_id, @quelle_lead)`,
    {
      name: b.name.trim(),
      kontakt: b.kontakt.trim(),
      plz: b.plz.trim(),
      stadt: b.stadt.trim(),
      pflegegrad: Math.min(5, Math.max(1, Number(b.pflegegrad) || 1)),
      benoetigte_qualifikation: b.benoetigte_qualifikation,
      benoetigte_leistungen: JSON.stringify(Array.isArray(b.benoetigte_leistungen) ? b.benoetigte_leistungen : []),
      stunden_woche: Number(b.stunden_woche) || 10,
      dringlichkeit: ['niedrig', 'normal', 'hoch'].includes(b.dringlichkeit) ? b.dringlichkeit : 'normal',
      notiz: b.notiz?.trim() || '',
      quelle_lead_id: Number(b.quelle_lead_id) || null,
      quelle_lead: b.quelle_lead?.trim() || '',
    }
  );
  const row = await get('SELECT * FROM patients WHERE id = ?', [info.lastInsertRowid]);
  res.status(201).json(serialize(row));
});

router.delete('/:id', async (req, res) => {
  await run('DELETE FROM patients WHERE id = ?', [req.params.id]);
  res.status(204).end();
});

router.get('/:id/matches', async (req, res) => {
  const p = await get('SELECT * FROM patients WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Anfrage nicht gefunden' });
  const nurFrei = req.query.alle === '1' ? '' : 'WHERE ist_gesellschafter = 1 AND hat_patienten = 0';
  const pfleger = await all(`SELECT * FROM caregivers ${nurFrei}`);
  res.json(matchesFuerPatient(p, pfleger));
});

export default router;
