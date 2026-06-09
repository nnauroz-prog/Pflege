// Lokaler Server: app.js liefert bereits Frontend (falls gebaut) + API aus.
import app from './app.js';

const PORT = process.env.PORT || 3001;

// 0.0.0.0 explizit – nötig, damit Hosting-Plattformen den Dienst erreichen.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pflege-Plattform laeuft auf Port ${PORT}`);
});
