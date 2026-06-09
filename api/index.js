// Vercel-Serverless-Funktion (Catch-all): beantwortet alle /api/*-Routen.
// Eine Datei als "[...slug].js" wird von Vercel automatisch für jeden Pfad
// unter /api aufgerufen – ohne zusätzliche Rewrites. Die Express-App ist ein
// gültiger (req, res)-Handler und kann direkt exportiert werden.
import app from '../server/src/app.js';

export default app;
