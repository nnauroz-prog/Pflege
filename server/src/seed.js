// Beispieldaten zum Ausprobieren des Matchings.
// Aufruf:  node src/seed.js
import { db } from './db.js';

db.exec('DELETE FROM vermittlungen; DELETE FROM patients; DELETE FROM caregivers;');
// IDs stabil zuruecksetzen, damit Demo-Daten reproduzierbar sind
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('caregivers','patients','vermittlungen');");

const pfleger = [
  { name: 'Anna Becker', email: 'anna@example.de', plz: '10115', stadt: 'Berlin', qualifikation: 'pflegefachkraft', spezialisierungen: ['demenz', 'wundmanagement'], radius_km: 25, stunden_woche: 30 },
  { name: 'Tomasz Kowalski', email: 'tomasz@example.de', plz: '10247', stadt: 'Berlin', qualifikation: 'spezialisiert', spezialisierungen: ['intensivpflege', 'beatmung'], radius_km: 40, stunden_woche: 35 },
  { name: 'Maria Schulz', email: 'maria@example.de', plz: '80331', stadt: 'Muenchen', qualifikation: 'pflegehelfer', spezialisierungen: ['grundpflege'], radius_km: 20, stunden_woche: 15 },
  { name: 'Jens Hoffmann', email: 'jens@example.de', plz: '20095', stadt: 'Hamburg', qualifikation: 'pflegefachkraft', spezialisierungen: ['palliativ', 'demenz'], radius_km: 30, stunden_woche: 25 },
];

const patienten = [
  { name: 'Herr M. (Pseudonym)', kontakt: 'angehoeriger@example.de', plz: '10178', stadt: 'Berlin', pflegegrad: 3, benoetigte_qualifikation: 'pflegefachkraft', benoetigte_leistungen: ['demenz'], stunden_woche: 20, dringlichkeit: 'hoch' },
  { name: 'Frau K. (Pseudonym)', kontakt: 'tochter@example.de', plz: '10405', stadt: 'Berlin', pflegegrad: 5, benoetigte_qualifikation: 'spezialisiert', benoetigte_leistungen: ['intensivpflege', 'beatmung'], stunden_woche: 35, dringlichkeit: 'hoch' },
  { name: 'Herr W. (Pseudonym)', kontakt: 'sohn@example.de', plz: '80637', stadt: 'Muenchen', pflegegrad: 2, benoetigte_qualifikation: 'pflegehelfer', benoetigte_leistungen: ['grundpflege'], stunden_woche: 12, dringlichkeit: 'normal' },
];

const insC = db.prepare(`INSERT INTO caregivers (name,email,plz,stadt,qualifikation,spezialisierungen,radius_km,stunden_woche,ist_gesellschafter,hat_patienten)
  VALUES (@name,@email,@plz,@stadt,@qualifikation,@spez,@radius_km,@stunden_woche,1,0)`);
for (const c of pfleger) insC.run({ ...c, spez: JSON.stringify(c.spezialisierungen) });

const insP = db.prepare(`INSERT INTO patients (name,kontakt,plz,stadt,pflegegrad,benoetigte_qualifikation,benoetigte_leistungen,stunden_woche,dringlichkeit,status)
  VALUES (@name,@kontakt,@plz,@stadt,@pflegegrad,@benoetigte_qualifikation,@leist,@stunden_woche,@dringlichkeit,'offen')`);
for (const p of patienten) insP.run({ ...p, leist: JSON.stringify(p.benoetigte_leistungen) });

console.log(`Seed fertig: ${pfleger.length} Pfleger, ${patienten.length} Anfragen.`);
