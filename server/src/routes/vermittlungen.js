import { Router } from 'express';
import { all, get, run, batch } from '../db.js';
import { bewerte } from '../matching.js';

const router = Router();

router.get('/', async (req, res) => {
  const rows = await all(
    `SELECT v.*, c.name AS caregiver_name, p.name AS patient_name, p.stadt AS patient_stadt
     FROM vermittlungen v
     JOIN caregivers c ON c.id = v.caregiver_id
     JOIN patients p ON p.id = v.patient_id
     ORDER BY v.erstellt_am DESC`
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const caregiverId = Number(req.body?.caregiver_id);
  const patientId = Number(req.body?.patient_id);
  const c = await get('SELECT * FROM caregivers WHERE id = ?', [caregiverId]);
  const p = await get('SELECT * FROM patients WHERE id = ?', [patientId]);
  if (!c || !p) return res.status(404).json({ error: 'Pfleger oder Anfrage nicht gefunden' });

  const { score } = bewerte(c, p);

  await batch([
    {
      sql: `INSERT INTO vermittlungen (caregiver_id, patient_id, score, status)
            VALUES (?, ?, ?, 'angenommen')
            ON CONFLICT(caregiver_id, patient_id)
            DO UPDATE SET status = 'angenommen', score = excluded.score`,
      args: [caregiverId, patientId, score],
    },
    { sql: "UPDATE patients SET status = 'vermittelt' WHERE id = ?", args: [patientId] },
    { sql: 'UPDATE caregivers SET hat_patienten = 1 WHERE id = ?', args: [caregiverId] },
  ]);

  const row = await get('SELECT * FROM vermittlungen WHERE caregiver_id = ? AND patient_id = ?', [caregiverId, patientId]);
  res.status(201).json(row);
});

router.delete('/:id', async (req, res) => {
  const v = await get('SELECT * FROM vermittlungen WHERE id = ?', [req.params.id]);
  if (v) {
    await batch([
      { sql: 'DELETE FROM vermittlungen WHERE id = ?', args: [v.id] },
      { sql: "UPDATE patients SET status = 'offen' WHERE id = ?", args: [v.patient_id] },
    ]);
    const rest = await get('SELECT COUNT(*) AS n FROM vermittlungen WHERE caregiver_id = ?', [v.caregiver_id]);
    if (rest.n === 0) await run('UPDATE caregivers SET hat_patienten = 0 WHERE id = ?', [v.caregiver_id]);
  }
  res.status(204).end();
});

export default router;
