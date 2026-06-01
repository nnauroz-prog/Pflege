// Matching-Engine: bewertet, wie gut ein Pfleger (Gesellschafter) zu einer
// offenen Patientenanfrage passt. Ergebnis ist ein Score von 0..100 plus
// nachvollziehbare Begruendungen.

const QUALI_RANG = {
  pflegehelfer: 1,
  pflegefachkraft: 2,
  spezialisiert: 3,
};

// Grobe geografische Naehe ueber die PLZ: gleiche PLZ = 0, gleiches
// PLZ-Leitgebiet (erste 2 Stellen) = ca. naheliegend. Ohne externe Geo-API
// schaetzen wir die Distanz anhand der PLZ-Praefix-Differenz.
function plzDistanzKm(a, b) {
  const pa = String(a).padStart(5, '0');
  const pb = String(b).padStart(5, '0');
  if (pa === pb) return 0;
  if (pa.slice(0, 3) === pb.slice(0, 3)) return 12;
  if (pa.slice(0, 2) === pb.slice(0, 2)) return 35;
  if (pa.slice(0, 1) === pb.slice(0, 1)) return 90;
  return 250;
}

function parseArray(value) {
  try {
    const v = JSON.parse(value || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

// Bewertet Pfleger c gegen Patientenanfrage p.
export function bewerte(c, p) {
  const gruende = [];
  let score = 0;

  // --- Region (max 35) ---
  const distanz = plzDistanzKm(c.plz, p.plz);
  const radius = c.radius_km || 25;
  let regionScore = 0;
  if (distanz <= radius) {
    // innerhalb des Einsatzradius: je naeher, desto besser
    regionScore = Math.round(35 * (1 - distanz / (radius + 1)));
    gruende.push(`Im Einsatzradius (ca. ${distanz} km, Radius ${radius} km)`);
  } else {
    gruende.push(`Ausserhalb des Einsatzradius (ca. ${distanz} km > ${radius} km)`);
  }
  score += regionScore;

  // --- Qualifikation (max 30, K.o.-Kriterium) ---
  const need = QUALI_RANG[p.benoetigte_qualifikation] || 1;
  const have = QUALI_RANG[c.qualifikation] || 1;
  let qualiScore = 0;
  if (have >= need) {
    qualiScore = have === need ? 30 : 22; // exakte Passung bevorzugt
    gruende.push(
      have === need
        ? `Qualifikation passt genau (${c.qualifikation})`
        : `Qualifikation uebertrifft Anforderung (${c.qualifikation})`
    );
  } else {
    gruende.push(`Qualifikation reicht nicht (${c.qualifikation} < ${p.benoetigte_qualifikation})`);
  }
  score += qualiScore;

  // --- Leistungen / Spezialisierung (max 20) ---
  const koennen = parseArray(c.spezialisierungen).map((s) => s.toLowerCase());
  const noetig = parseArray(p.benoetigte_leistungen).map((s) => s.toLowerCase());
  let leistungScore = 0;
  if (noetig.length === 0) {
    leistungScore = 12;
    gruende.push('Keine speziellen Leistungen gefordert');
  } else {
    const treffer = noetig.filter((n) => koennen.includes(n));
    leistungScore = Math.round((treffer.length / noetig.length) * 20);
    gruende.push(
      `Leistungen abgedeckt: ${treffer.length}/${noetig.length}` +
        (treffer.length ? ` (${treffer.join(', ')})` : '')
    );
  }
  score += leistungScore;

  // --- Kapazitaet / Stunden (max 15) ---
  let kapaScore = 0;
  if (c.stunden_woche >= p.stunden_woche) {
    kapaScore = 15;
    gruende.push(`Kapazitaet ausreichend (${c.stunden_woche} h/Woche frei)`);
  } else if (c.stunden_woche > 0) {
    kapaScore = Math.round(15 * (c.stunden_woche / p.stunden_woche));
    gruende.push(`Teilkapazitaet (${c.stunden_woche}/${p.stunden_woche} h/Woche)`);
  } else {
    gruende.push('Keine freie Kapazitaet');
  }
  score += kapaScore;

  // --- Dringlichkeit (Bonus, Pfleger ohne Patienten priorisieren) ---
  if (p.dringlichkeit === 'hoch') {
    score = Math.min(100, score + 5);
    gruende.push('Bonus: hohe Dringlichkeit');
  }

  // K.o.: ohne passende Qualifikation kein sinnvolles Match
  const machbar = have >= need && (distanz <= radius);

  return {
    score: Math.max(0, Math.min(100, score)),
    machbar,
    gruende,
  };
}

// Liefert sortierte Matches eines Pflegers ueber alle offenen Anfragen.
export function matchesFuerPfleger(c, patienten) {
  return patienten
    .filter((p) => p.status === 'offen')
    .map((p) => ({ patient: p, ...bewerte(c, p) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}

// Liefert sortierte Pfleger-Vorschlaege fuer eine Anfrage.
export function matchesFuerPatient(p, pfleger) {
  return pfleger
    .map((c) => ({ caregiver: c, ...bewerte(c, p) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);
}
