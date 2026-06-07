// Lead-Provider: findet Zuweiser (Krankenhäuser, Ärzte, Apotheken …) in einem
// Gebiet. Live über die Overpass-API (OpenStreetMap, kostenlos, ohne Key).
// Ist Overpass nicht erreichbar (z. B. gesperrtes Netz), wird ein realistischer
// Demo-Datensatz erzeugt, damit die App immer funktioniert.

import { KATEGORIEN } from './categories.js';
import { haversineKm } from './geo.js';

// km -> Grad (grobe Umrechnung) für die Bounding-Box
const kmToDeg = (km) => km / 111;

function overpassQuery(lat, lon, radiusKm, kategorien) {
  const r = Math.round(radiusKm * 1000);
  const teile = [];
  for (const key of kategorien) {
    const cfg = KATEGORIEN[key];
    if (!cfg) continue;
    for (const { k, v } of cfg.osm) {
      teile.push(`node["${k}"="${v}"](around:${r},${lat},${lon});`);
      teile.push(`way["${k}"="${v}"](around:${r},${lat},${lon});`);
    }
  }
  return `[out:json][timeout:25];(${teile.join('')});out center tags 60;`;
}

function osmKategorie(tags) {
  for (const [key, cfg] of Object.entries(KATEGORIEN)) {
    for (const { k, v } of cfg.osm) {
      if (tags[k] === v) return key;
    }
  }
  return null;
}

async function fetchOverpass(lat, lon, radiusKm, kategorien) {
  const body = 'data=' + encodeURIComponent(overpassQuery(lat, lon, radiusKm, kategorien));
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'PflegeMatch/1.0' },
    body,
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
  const j = await res.json();
  const leads = [];
  for (const el of j.elements || []) {
    const t = el.tags || {};
    const kat = osmKategorie(t);
    if (!kat) continue;
    const plat = el.lat ?? el.center?.lat;
    const plon = el.lon ?? el.center?.lon;
    if (plat == null) continue;
    const adresse = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
    leads.push({
      name: t.name || KATEGORIEN[kat].label,
      kategorie: kat,
      adresse,
      plz: t['addr:postcode'] || '',
      stadt: t['addr:city'] || '',
      lat: plat,
      lon: plon,
      telefon: t.phone || t['contact:phone'] || '',
      website: t.website || t['contact:website'] || '',
      quelle: 'osm',
    });
  }
  return leads;
}

// Realistischer Demo-Generator rund um das Zentrum.
function demoLeads(lat, lon, radiusKm, kategorien) {
  const NAMEN = {
    krankenhaus: ['Klinikum am Park', 'St.-Marien-Krankenhaus', 'DRK-Klinik', 'Städtisches Klinikum'],
    seniorenheim: ['Seniorenresidenz Sonnengarten', 'Haus Abendfrieden', 'AWO Pflegeheim', 'Kursana Domizil'],
    hausarzt: ['Hausarztpraxis Dr. Weber', 'Praxis am Markt', 'Gemeinschaftspraxis Nord', 'Dr. Schmidt & Kollegen'],
    sanitaetshaus: ['Sanitätshaus Vital', 'OrthoCare GmbH', 'RehaTechnik Müller'],
    apotheke: ['Stadt-Apotheke', 'Apotheke am Rathaus', 'Marien-Apotheke', 'Sonnen-Apotheke'],
    physiotherapie: ['Physio Aktiv', 'PhysioZentrum', 'Praxis für Krankengymnastik'],
    pflegestuetzpunkt: ['Pflegestützpunkt der Stadt', 'Pflegeberatung Caritas'],
  };
  const STRASSEN = ['Hauptstraße', 'Bahnhofstraße', 'Lindenallee', 'Gartenweg', 'Marktplatz', 'Schulstraße', 'Ringstraße'];
  // deterministischer Pseudo-Zufall: gleiches Gebiet -> gleiche Leads (keine Dubletten
  // bei wiederholter Suche, da UNIQUE(name,lat,lon) dann per Upsert greift)
  const rnd = (seed) => {
    const x = Math.sin(seed * 999.137 + lat * 12.9898 + lon * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  let id = 1;
  const leads = [];
  for (const kat of kategorien) {
    const namen = NAMEN[kat] || [KATEGORIEN[kat]?.label || kat];
    const anzahl = Math.max(2, Math.round((KATEGORIEN[kat]?.gewicht || 50) / 20));
    for (let i = 0; i < anzahl; i++) {
      const winkel = rnd(id) * 2 * Math.PI;
      const dist = rnd(id + 0.5) * radiusKm;
      const dLat = (dist / 111) * Math.cos(winkel);
      const dLon = (dist / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(winkel);
      leads.push({
        name: `${namen[i % namen.length]}${i >= namen.length ? ' ' + (i + 1) : ''}`,
        kategorie: kat,
        adresse: `${STRASSEN[id % STRASSEN.length]} ${1 + (id * 7) % 90}`,
        plz: '',
        stadt: '',
        lat: lat + dLat,
        lon: lon + dLon,
        telefon: `0${30 + (id % 9)}${(1000000 + id * 13579) % 9000000}`,
        website: '',
        quelle: 'demo',
      });
      id++;
    }
  }
  return leads;
}

// Liefert angereicherte Leads (mit Distanz und Potenzial-Score), nach Score sortiert.
export async function findeLeads({ lat, lon, radiusKm, kategorien, live = true }) {
  let roh = [];
  let quelle = 'demo';
  if (live) {
    try {
      roh = await fetchOverpass(lat, lon, radiusKm, kategorien);
      quelle = 'osm';
    } catch {
      roh = [];
    }
  }
  if (roh.length === 0) {
    roh = demoLeads(lat, lon, radiusKm, kategorien);
    quelle = live ? 'demo-fallback' : 'demo';
  }

  const angereichert = roh.map((l) => {
    const distanz = haversineKm(lat, lon, l.lat, l.lon);
    const gewicht = KATEGORIEN[l.kategorie]?.gewicht || 50;
    // Potenzial: Kategorie-Gewicht, leicht abgewertet mit Entfernung
    const naehe = Math.max(0, 1 - distanz / (radiusKm + 1));
    const score = Math.round(gewicht * 0.7 + gewicht * 0.3 * naehe);
    return { ...l, distanz, potenzial_score: Math.min(100, score) };
  });
  angereichert.sort((a, b) => b.potenzial_score - a.potenzial_score);
  return { quelle, leads: angereichert };
}

// Fahrplan: Nearest-Neighbor-Route vom Zentrum aus ("wo genau hinfahren").
export function routenReihenfolge(center, leads) {
  const rest = [...leads];
  const route = [];
  let cur = center;
  while (rest.length) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < rest.length; i++) {
      const d = haversineKm(cur.lat, cur.lon, rest[i].lat, rest[i].lon);
      if (d < bestD) { bestD = d; best = i; }
    }
    const next = rest.splice(best, 1)[0];
    route.push({ ...next, etappe_km: bestD });
    cur = next;
  }
  return route;
}
