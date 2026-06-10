import { Router } from 'express';
import { generiereRueckfragen, generierePlan, kiVerfuegbar, kiProvider } from '../sis/claude.js';
import { THEMENFELDER } from '../sis/prompt.js';

const router = Router();

router.get('/status', (req, res) => {
  res.json({ ki: kiVerfuegbar(), provider: kiProvider(), themenfelder: THEMENFELDER });
});

function pruefeKi(res) {
  if (!kiVerfuegbar()) {
    res.status(503).json({
      error: 'KI nicht konfiguriert',
      detail: 'Kein KI-Schlüssel gesetzt. Setze GEMINI_API_KEY (kostenlos, ohne Karte) oder ANTHROPIC_API_KEY.',
    });
    return false;
  }
  return true;
}

// Phase 1: Rückfragen aus Eckdaten
router.post('/rueckfragen', async (req, res, next) => {
  if (!pruefeKi(res)) return;
  const b = req.body || {};
  if (!b.stammdaten?.name?.trim()) return res.status(400).json({ error: 'Mindestens Name/Pseudonym angeben', felder: ['name'] });
  try {
    const out = await generiereRueckfragen({ stammdaten: b.stammdaten, freitext: b.freitext || '' });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

// Phase 2: vollständige SIS + Maßnahmenplan
router.post('/erstellen', async (req, res, next) => {
  if (!pruefeKi(res)) return;
  const b = req.body || {};
  if (!b.stammdaten?.name?.trim()) return res.status(400).json({ error: 'Mindestens Name/Pseudonym angeben', felder: ['name'] });
  try {
    const out = await generierePlan({ stammdaten: b.stammdaten, freitext: b.freitext || '', antworten: b.antworten || [] });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

export default router;
