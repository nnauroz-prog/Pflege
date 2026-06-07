// Lokaler Server: liefert die API UND (falls gebaut) das Frontend aus.
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import app from './app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Frontend (gebaut) ausliefern, wenn vorhanden
const clientDist = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(join(clientDist, 'index.html')));
}

// 0.0.0.0 explizit – nötig, damit Hosting-Plattformen (z. B. Render) den Dienst erreichen.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pflege-Plattform laeuft auf Port ${PORT}`);
});
