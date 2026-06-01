// Wiederverwendbare Demo-Daten (genutzt vom CLI-Seed und vom Auto-Seed beim
// ersten Start mit leerer Datenbank).

const PFLEGER = [
  { name: 'Anna Becker', email: 'anna@example.de', plz: '10115', stadt: 'Berlin', qualifikation: 'pflegefachkraft', spez: ['demenz', 'wundmanagement'], radius_km: 25, stunden_woche: 30 },
  { name: 'Tomasz Kowalski', email: 'tomasz@example.de', plz: '10247', stadt: 'Berlin', qualifikation: 'spezialisiert', spez: ['intensivpflege', 'beatmung'], radius_km: 40, stunden_woche: 35 },
  { name: 'Maria Schulz', email: 'maria@example.de', plz: '80331', stadt: 'Muenchen', qualifikation: 'pflegehelfer', spez: ['grundpflege'], radius_km: 20, stunden_woche: 15 },
  { name: 'Jens Hoffmann', email: 'jens@example.de', plz: '20095', stadt: 'Hamburg', qualifikation: 'pflegefachkraft', spez: ['palliativ', 'demenz'], radius_km: 30, stunden_woche: 25 },
];
const PATIENTEN = [
  { name: 'Herr M. (Pseudonym)', kontakt: 'angehoeriger@example.de', plz: '10178', stadt: 'Berlin', pflegegrad: 3, q: 'pflegefachkraft', leist: ['demenz'], stunden_woche: 20, dringlichkeit: 'hoch' },
  { name: 'Frau K. (Pseudonym)', kontakt: 'tochter@example.de', plz: '10405', stadt: 'Berlin', pflegegrad: 5, q: 'spezialisiert', leist: ['intensivpflege', 'beatmung'], stunden_woche: 35, dringlichkeit: 'hoch' },
  { name: 'Herr W. (Pseudonym)', kontakt: 'sohn@example.de', plz: '80637', stadt: 'Muenchen', pflegegrad: 2, q: 'pflegehelfer', leist: ['grundpflege'], stunden_woche: 12, dringlichkeit: 'normal' },
];

export async function seedDemo(client, { reset = false } = {}) {
  if (reset) {
    await client.batch(['DELETE FROM vermittlungen', 'DELETE FROM patients', 'DELETE FROM caregivers', 'DELETE FROM leads'], 'write');
  }
  await client.batch(
    PFLEGER.map((c) => ({
      sql: `INSERT INTO caregivers (name,email,plz,stadt,qualifikation,spezialisierungen,radius_km,stunden_woche,ist_gesellschafter,hat_patienten)
            VALUES (@name,@email,@plz,@stadt,@qualifikation,@spez,@radius_km,@stunden_woche,1,0)`,
      args: { ...c, spez: JSON.stringify(c.spez) },
    })),
    'write'
  );
  await client.batch(
    PATIENTEN.map((p) => ({
      sql: `INSERT INTO patients (name,kontakt,plz,stadt,pflegegrad,benoetigte_qualifikation,benoetigte_leistungen,stunden_woche,dringlichkeit,status)
            VALUES (@name,@kontakt,@plz,@stadt,@pflegegrad,@q,@leist,@stunden_woche,@dringlichkeit,'offen')`,
      args: { ...p, leist: JSON.stringify(p.leist) },
    })),
    'write'
  );
  return { pfleger: PFLEGER.length, patienten: PATIENTEN.length };
}
