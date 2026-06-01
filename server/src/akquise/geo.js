// Geocoding (Ort/PLZ -> Koordinaten) und Distanzberechnung.
// Live über Nominatim (OSM); wenn nicht erreichbar, Fallback über eine
// eingebaute Tabelle (Städte + PLZ-Leitzonen), damit alles offline läuft.

const STAEDTE = {
  berlin: [52.52, 13.405], hamburg: [53.55, 9.993], münchen: [48.137, 11.575],
  muenchen: [48.137, 11.575], köln: [50.938, 6.96], koeln: [50.938, 6.96],
  frankfurt: [50.11, 8.682], stuttgart: [48.776, 9.182], düsseldorf: [51.227, 6.773],
  duesseldorf: [51.227, 6.773], dortmund: [51.514, 7.466], essen: [51.456, 7.012],
  leipzig: [51.34, 12.375], dresden: [51.05, 13.738], hannover: [52.376, 9.732],
  nürnberg: [49.452, 11.077], nuernberg: [49.452, 11.077], bremen: [53.079, 8.802],
  bonn: [50.737, 7.098], münster: [51.96, 7.626], muenster: [51.96, 7.626],
  karlsruhe: [49.007, 8.404], augsburg: [48.366, 10.898], wiesbaden: [50.082, 8.24],
  kiel: [54.323, 10.135], mannheim: [49.488, 8.466], bielefeld: [52.03, 8.532],
};

// PLZ-Leitzonen (erste Ziffer) -> ungefährer Regionsmittelpunkt
const PLZ_ZONE = {
  '0': [51.34, 12.375], '1': [52.52, 13.405], '2': [53.55, 9.993], '3': [52.376, 9.732],
  '4': [51.456, 7.012], '5': [50.938, 6.96], '6': [50.11, 8.682], '7': [48.776, 9.182],
  '8': [48.137, 11.575], '9': [49.452, 11.077],
};

export function haversineKm(a, b, c, d) {
  const R = 6371;
  const dLat = ((c - a) * Math.PI) / 180;
  const dLon = ((d - b) * Math.PI) / 180;
  const la1 = (a * Math.PI) / 180;
  const la2 = (c * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

function fallbackGeocode(ort) {
  const s = String(ort || '').trim().toLowerCase();
  if (STAEDTE[s]) return { lat: STAEDTE[s][0], lon: STAEDTE[s][1], quelle: 'tabelle', label: ort };
  const plz = s.match(/\b(\d{5})\b/);
  if (plz) {
    const z = PLZ_ZONE[plz[1][0]];
    if (z) return { lat: z[0], lon: z[1], quelle: 'plz-zone', label: `PLZ ${plz[1]}` };
  }
  // letzter Versuch: enthaltener Städtename
  for (const [name, [lat, lon]] of Object.entries(STAEDTE)) {
    if (s.includes(name)) return { lat, lon, quelle: 'tabelle', label: ort };
  }
  return null;
}

export async function geocode(ort, { live = true } = {}) {
  if (live) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ort + ', Deutschland')}&format=json&limit=1&countrycodes=de`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PflegeMatch/1.0 (Akquise)' },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const j = await res.json();
        if (j[0]) return { lat: +j[0].lat, lon: +j[0].lon, quelle: 'osm', label: j[0].display_name };
      }
    } catch {
      /* offline -> Fallback */
    }
  }
  const fb = fallbackGeocode(ort);
  if (fb) return fb;
  // Default: Mitte Deutschlands
  return { lat: 51.16, lon: 10.45, quelle: 'default', label: 'Deutschland (Mitte)' };
}
