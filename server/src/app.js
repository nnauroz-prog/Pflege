// Reine API-Express-App (ohne Server-Listen) – wird sowohl lokal (index.js)
// als auch als Vercel-Serverless-Funktion (api/index.js) verwendet.
import express from 'express';
import cors from 'cors';
import { init, get } from './db.js';
import caregivers from './routes/caregivers.js';
import patients from './routes/patients.js';
import vermittlungen from './routes/vermittlungen.js';
import akquise from './routes/akquise.js';

const app = express();
app.use(cors());
app.use(express.json());

// Vercel leitet /api/* hierher; Präfix entfernen, damit die Routen passen.
// Lokal (Vite-Proxy) kommt /api/* ebenfalls an -> gleiche Normalisierung.
app.use((req, res, next) => {
  if (req.url === '/api') req.url = '/';
  else if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  next();
});

// Schema bei (erstem) Aufruf sicherstellen – wichtig für Serverless-Cold-Start.
app.use(async (req, res, next) => {
  try {
    await init();
    next();
  } catch (e) {
    next(e);
  }
});

app.get('/health', async (req, res) => {
  const z = async (sql) => (await get(sql))?.n ?? 0;
  res.json({
    ok: true,
    pfleger: await z('SELECT COUNT(*) AS n FROM caregivers'),
    anfragen: await z('SELECT COUNT(*) AS n FROM patients'),
    offen: await z("SELECT COUNT(*) AS n FROM patients WHERE status='offen'"),
    vermittelt: await z('SELECT COUNT(*) AS n FROM vermittlungen'),
    leads: await z('SELECT COUNT(*) AS n FROM leads'),
  });
});

app.use('/caregivers', caregivers);
app.use('/patients', patients);
app.use('/vermittlungen', vermittlungen);
app.use('/akquise', akquise);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Serverfehler', detail: String(err.message || err) });
});

export default app;
