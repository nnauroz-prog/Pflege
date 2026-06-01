import { Router } from 'express';
import { db } from '../db.js';
import { bewerte } from '../matching.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT v.*, c.name AS caregiver_name, p.name AS patient_name, p.stadt AS patient_stadt
       FROM vermittlungen v
       JOIN caregivers c ON c.id = v.caregiver_id
       JOIN patients p ON p.id = v.patient_id
       ORDER BY v.erstellt_am DESC`
    )
    .all();
  res.json(rows);
});

// Vermittlung anlegen: Pfleger <-> Patient verbinden
router.post('/', (req, res) => {
  const caregiverId = Number(req.body?.caregiver_id);
  const patientId = Number(req.body?.patient_id);
  const c = db.prepare('SELECT * FROM caregivers WHERE id = ?').get(caregiverId);
  const p = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  if (!c || !p) return res.status(404).json({ error: 'Pfleger oder Anfrage nicht gefunden' });

  const { score } = bewerte(c, p);

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO vermittlungen (caregiver_id, patient_id, score, status)
       VALUES (?, ?, ?, 'angenommen')
       ON CONFLICT(caregiver_id, patient_id)
       DO UPDATE SET status = 'angenommen', score = excluded.score`
    ).run(caregiverId, patientId, score);
    db.prepare("UPDATE patients SET status = 'vermittelt' WHERE id = ?").run(patientId);
    db.prepare('UPDATE caregivers SET hat_patienten = 1 WHERE id = ?').run(caregiverId);
  });
  tx();

  const row = db.prepare('SELECT * FROM vermittlungen WHERE caregiver_id = ? AND patient_id = ?').get(caregiverId, patientId);
  res.status(201).json(row);
});

// Vermittlung loesen (zuruecksetzen)
router.delete('/:id', (req, res) => {
  const v = db.prepare('SELECT * FROM vermittlungen WHERE id = ?').get(req.params.id);
  if (v) {
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM vermittlungen WHERE id = ?').run(v.id);
      db.prepare("UPDATE patients SET status = 'offen' WHERE id = ?").run(v.patient_id);
      const rest = db.prepare('SELECT COUNT(*) AS n FROM vermittlungen WHERE caregiver_id = ?').get(v.caregiver_id);
      if (rest.n === 0) db.prepare('UPDATE caregivers SET hat_patienten = 0 WHERE id = ?').run(v.caregiver_id);
    });
    tx();
  }
  res.status(204).end();
});

export default router;
