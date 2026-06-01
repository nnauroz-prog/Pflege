import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import './db.js';
import caregivers from './routes/caregivers.js';
import patients from './routes/patients.js';
import vermittlungen from './routes/vermittlungen.js';
import { db } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    pfleger: db.prepare('SELECT COUNT(*) AS n FROM caregivers').get().n,
    anfragen: db.prepare('SELECT COUNT(*) AS n FROM patients').get().n,
    offen: db.prepare("SELECT COUNT(*) AS n FROM patients WHERE status='offen'").get().n,
    vermittelt: db.prepare('SELECT COUNT(*) AS n FROM vermittlungen').get().n,
  });
});

app.use('/api/caregivers', caregivers);
app.use('/api/patients', patients);
app.use('/api/vermittlungen', vermittlungen);

// Gebautes Frontend ausliefern (Produktion)
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(join(clientDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`Pflege-Plattform API laeuft auf http://localhost:${PORT}`);
});
