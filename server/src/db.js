import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, '..', 'pflege.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS caregivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    plz TEXT NOT NULL,
    stadt TEXT NOT NULL,
    qualifikation TEXT NOT NULL,          -- pflegehelfer | pflegefachkraft | spezialisiert
    spezialisierungen TEXT NOT NULL DEFAULT '[]',  -- JSON array
    radius_km INTEGER NOT NULL DEFAULT 25,
    stunden_woche INTEGER NOT NULL DEFAULT 20,
    ist_gesellschafter INTEGER NOT NULL DEFAULT 1,
    hat_patienten INTEGER NOT NULL DEFAULT 0,
    notiz TEXT DEFAULT '',
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kontakt TEXT NOT NULL,
    plz TEXT NOT NULL,
    stadt TEXT NOT NULL,
    pflegegrad INTEGER NOT NULL DEFAULT 1,            -- 1..5
    benoetigte_qualifikation TEXT NOT NULL,           -- pflegehelfer | pflegefachkraft | spezialisiert
    benoetigte_leistungen TEXT NOT NULL DEFAULT '[]', -- JSON array
    stunden_woche INTEGER NOT NULL DEFAULT 10,
    dringlichkeit TEXT NOT NULL DEFAULT 'normal',     -- niedrig | normal | hoch
    status TEXT NOT NULL DEFAULT 'offen',             -- offen | vermittelt
    notiz TEXT DEFAULT '',
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kategorie TEXT NOT NULL,                 -- siehe akquise/categories.js
    adresse TEXT DEFAULT '',
    plz TEXT DEFAULT '',
    stadt TEXT DEFAULT '',
    lat REAL,
    lon REAL,
    telefon TEXT DEFAULT '',
    website TEXT DEFAULT '',
    distanz_km REAL DEFAULT 0,
    potenzial_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'neu',       -- neu | kontaktiert | termin | gewonnen | kein_interesse
    zustaendig TEXT DEFAULT '',               -- Teammitglied
    notiz TEXT DEFAULT '',
    quelle TEXT DEFAULT 'demo',               -- osm | demo
    gebiet TEXT DEFAULT '',                   -- Such-Einsatzgebiet
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(name, lat, lon)
  );

  CREATE TABLE IF NOT EXISTS vermittlungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caregiver_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'vorgeschlagen',  -- vorgeschlagen | angenommen | abgelehnt
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(caregiver_id, patient_id),
    FOREIGN KEY (caregiver_id) REFERENCES caregivers(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
`);

export default db;
