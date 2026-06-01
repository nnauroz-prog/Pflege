// Vercel-Serverless-Funktion: stellt die gesamte API bereit.
// vercel.json leitet /api/* hierher. Die Express-App ist ein gültiger
// (req, res)-Handler und kann direkt exportiert werden.
import app from '../server/src/app.js';

export default app;
