import { Router } from 'express';
import { db } from '../db.js';
import { KATEGORIE_LISTE, KATEGORIEN } from '../akquise/categories.js';
import { geocode } from '../akquise/geo.js';
import { findeLeads, routenReihenfolge } from '../akquise/provider.js';

const router = Router();
const STATI = ['neu', 'kontaktiert', 'termin', 'gewonnen', 'kein_interesse'];

// Live-Modus per Env steuerbar (in gesperrtem Netz auf Demo schalten)
const LIVE = process.env.AKQUISE_LIVE !== '0';

router.get('/kategorien', (req, res) => {
  res.json(KATEGORIE_LISTE.map((k) => ({ ...k, tipp: KATEGORIEN[k.key].tipp })));
});

// "Bot": Gebiet durchsuchen und Leads erzeugen/aktualisieren
router.post('/suche', async (req, res) => {
  const ort = (req.body?.ort || '').trim();
  const radiusKm = Math.min(50, Math.max(1, Number(req.body?.radius_km) || 10));
  let kategorien = Array.isArray(req.body?.kategorien) ? req.body.kategorien : [];
  kategorien = kategorien.filter((k) => KATEGORIEN[k]);
  if (!ort) return res.status(400).json({ error: 'Einsatzgebiet (Ort/PLZ) fehlt' });
  if (kategorien.length === 0) kategorien = Object.keys(KATEGORIEN);

  const center = await geocode(ort, { live: LIVE });
  const { quelle, leads } = await findeLeads({ ...center, radiusKm, kategorien, live: LIVE });

  const upsert = db.prepare(`
    INSERT INTO leads (name, kategorie, adresse, plz, stadt, lat, lon, telefon, website, distanz_km, potenzial_score, quelle, gebiet)
    VALUES (@name,@kategorie,@adresse,@plz,@stadt,@lat,@lon,@telefon,@website,@distanz,@score,@quelle,@gebiet)
    ON CONFLICT(name, lat, lon) DO UPDATE SET
      distanz_km=excluded.distanz_km, potenzial_score=excluded.potenzial_score,
      telefon=COALESCE(NULLIF(excluded.telefon,''), leads.telefon),
      gebiet=excluded.gebiet`);
  const tx = db.transaction(() => {
    for (const l of leads) {
      upsert.run({
        name: l.name, kategorie: l.kategorie, adresse: l.adresse, plz: l.plz, stadt: l.stadt,
        lat: l.lat, lon: l.lon, telefon: l.telefon, website: l.website,
        distanz: l.distanz, score: l.potenzial_score, quelle: l.quelle, gebiet: center.label,
      });
    }
  });
  tx();

  res.json({
    gebiet: center,
    quelle,
    radius_km: radiusKm,
    gefunden: leads.length,
    leads,
  });
});

router.get('/leads', (req, res) => {
  const { status, kategorie } = req.query;
  const wo = [];
  const args = {};
  if (status) { wo.push('status = @status'); args.status = status; }
  if (kategorie) { wo.push('kategorie = @kategorie'); args.kategorie = kategorie; }
  const sql = `SELECT * FROM leads ${wo.length ? 'WHERE ' + wo.join(' AND ') : ''} ORDER BY potenzial_score DESC, distanz_km ASC`;
  res.json(db.prepare(sql).all(args));
});

// Fahrplan: kürzeste Route durch die wichtigsten offenen Leads
router.get('/route', (req, res) => {
  const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
  const center = {
    lat: Number(req.query.lat) || 51.16,
    lon: Number(req.query.lon) || 10.45,
  };
  const leads = db
    .prepare(`SELECT * FROM leads WHERE status IN ('neu','kontaktiert') AND lat IS NOT NULL ORDER BY potenzial_score DESC LIMIT ?`)
    .all(limit);
  res.json(routenReihenfolge(center, leads));
});

router.patch('/leads/:id', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead nicht gefunden' });
  const status = STATI.includes(req.body?.status) ? req.body.status : lead.status;
  const zustaendig = req.body?.zustaendig ?? lead.zustaendig;
  const notiz = req.body?.notiz ?? lead.notiz;
  db.prepare('UPDATE leads SET status=?, zustaendig=?, notiz=? WHERE id=?').run(status, zustaendig, notiz, lead.id);
  res.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(lead.id));
});

router.delete('/leads/:id', (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

// Akquise-Trichter für das Team-Dashboard
router.get('/stats', (req, res) => {
  const rows = db.prepare('SELECT status, COUNT(*) AS n FROM leads GROUP BY status').all();
  const stats = { neu: 0, kontaktiert: 0, termin: 0, gewonnen: 0, kein_interesse: 0, gesamt: 0 };
  for (const r of rows) { stats[r.status] = r.n; stats.gesamt += r.n; }
  res.json(stats);
});

export default router;
