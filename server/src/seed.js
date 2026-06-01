// Beispieldaten zum Ausprobieren.  Aufruf:  npm run seed
import { client, init } from './db.js';

await init();
await client.batch(
  ['DELETE FROM vermittlungen', 'DELETE FROM patients', 'DELETE FROM caregivers', 'DELETE FROM leads'],
  'write'
);

const pfleger = [
  { name: 'Anna Becker', email: 'anna@example.de', plz: '10115', stadt: 'Berlin', qualifikation: 'pflegefachkraft', spez: ['demenz', 'wundmanagement'], radius_km: 25, stunden_woche: 30 },
  { name: 'Tomasz Kowalski', email: 'tomasz@example.de', plz: '10247', stadt: 'Berlin', qualifikation: 'spezialisiert', spez: ['intensivpflege', 'beatmung'], radius_km: 40, stunden_woche: 35 },
  { name: 'Maria Schulz', email: 'maria@example.de', plz: '80331', stadt: 'Muenchen', qualifikation: 'pflegehelfer', spez: ['grundpflege'], radius_km: 20, stunden_woche: 15 },
  { name: 'Jens Hoffmann', email: 'jens@example.de', plz: '20095', stadt: 'Hamburg', qualifikation: 'pflegefachkraft', spez: ['palliativ', 'demenz'], radius_km: 30, stunden_woche: 25 },
];
const patienten = [
  { name: 'Herr M. (Pseudonym)', kontakt: 'angehoeriger@example.de', plz: '10178', stadt: 'Berlin', pflegegrad: 3, q: 'pflegefachkraft', leist: ['demenz'], stunden_woche: 20, dringlichkeit: 'hoch' },
  { name: 'Frau K. (Pseudonym)', kontakt: 'tochter@example.de', plz: '10405', stadt: 'Berlin', pflegegrad: 5, q: 'spezialisiert', leist: ['intensivpflege', 'beatmung'], stunden_woche: 35, dringlichkeit: 'hoch' },
  { name: 'Herr W. (Pseudonym)', kontakt: 'sohn@example.de', plz: '80637', stadt: 'Muenchen', pflegegrad: 2, q: 'pflegehelfer', leist: ['grundpflege'], stunden_woche: 12, dringlichkeit: 'normal' },
];

await client.batch(
  pfleger.map((c) => ({
    sql: `INSERT INTO caregivers (name,email,plz,stadt,qualifikation,spezialisierungen,radius_km,stunden_woche,ist_gesellschafter,hat_patienten)
          VALUES (@name,@email,@plz,@stadt,@qualifikation,@spez,@radius_km,@stunden_woche,1,0)`,
    args: { ...c, spez: JSON.stringify(c.spez) },
  })),
  'write'
);
await client.batch(
  patienten.map((p) => ({
    sql: `INSERT INTO patients (name,kontakt,plz,stadt,pflegegrad,benoetigte_qualifikation,benoetigte_leistungen,stunden_woche,dringlichkeit,status)
          VALUES (@name,@kontakt,@plz,@stadt,@pflegegrad,@q,@leist,@stunden_woche,@dringlichkeit,'offen')`,
    args: { ...p, leist: JSON.stringify(p.leist) },
  })),
  'write'
);

console.log(`Seed fertig: ${pfleger.length} Pfleger, ${patienten.length} Anfragen.`);
process.exit(0);
