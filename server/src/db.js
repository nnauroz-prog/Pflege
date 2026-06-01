// Datenbankschicht auf libSQL/Turso. Lokal: file:-URL (eine Datei),
// in Produktion (Vercel): Turso über DB_URL + DB_AUTH_TOKEN – gleiche API.
// Wichtig: Remote (Turso) nutzt den reinen JS-Client (@libsql/client/web),
// damit in Vercels Serverless-Umgebung kein natives Modul geladen werden muss.

// Reihenfolge: explizit gesetzte DB_URL (Turso, dauerhaft) > Vercel ohne DB
// (In-Memory, läuft sofort mit Demo-Daten, aber flüchtig) > lokal (Datei).
const url = process.env.DB_URL || (process.env.VERCEL ? ':memory:' : 'file:pflege.db');
const authToken = process.env.DB_AUTH_TOKEN;
const isRemote = /^(libsql|https?|wss?):/i.test(url);

export let client; // wird in init() gesetzt (Treiberwahl je nach URL)

async function makeClient() {
  // beide Importe als Literale, damit der Vercel-Bundler sie einschließt
  const mod = isRemote ? await import('@libsql/client/web') : await import('@libsql/client');
  return mod.createClient(authToken ? { url, authToken } : { url });
}

// kleine Helfer mit synchron-ähnlicher Signatur
export async function all(sql, args) {
  await init();
  const r = await client.execute(args !== undefined ? { sql, args } : sql);
  return r.rows;
}
export async function get(sql, args) {
  return (await all(sql, args))[0];
}
export async function run(sql, args) {
  await init();
  const r = await client.execute(args !== undefined ? { sql, args } : sql);
  return { lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : null, rowsAffected: r.rowsAffected };
}
// mehrere Schreibvorgänge atomar
export async function batch(stmts) {
  await init();
  return client.batch(stmts, 'write');
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS caregivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, email TEXT NOT NULL,
    plz TEXT NOT NULL, stadt TEXT NOT NULL,
    qualifikation TEXT NOT NULL,
    spezialisierungen TEXT NOT NULL DEFAULT '[]',
    radius_km INTEGER NOT NULL DEFAULT 25,
    stunden_woche INTEGER NOT NULL DEFAULT 20,
    ist_gesellschafter INTEGER NOT NULL DEFAULT 1,
    hat_patienten INTEGER NOT NULL DEFAULT 0,
    notiz TEXT DEFAULT '',
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, kontakt TEXT NOT NULL,
    plz TEXT NOT NULL, stadt TEXT NOT NULL,
    pflegegrad INTEGER NOT NULL DEFAULT 1,
    benoetigte_qualifikation TEXT NOT NULL,
    benoetigte_leistungen TEXT NOT NULL DEFAULT '[]',
    stunden_woche INTEGER NOT NULL DEFAULT 10,
    dringlichkeit TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'offen',
    notiz TEXT DEFAULT '',
    quelle_lead_id INTEGER,
    quelle_lead TEXT DEFAULT '',
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, kategorie TEXT NOT NULL,
    adresse TEXT DEFAULT '', plz TEXT DEFAULT '', stadt TEXT DEFAULT '',
    lat REAL, lon REAL,
    telefon TEXT DEFAULT '', website TEXT DEFAULT '',
    distanz_km REAL DEFAULT 0, potenzial_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'neu',
    zustaendig TEXT DEFAULT '', notiz TEXT DEFAULT '',
    quelle TEXT DEFAULT 'demo', gebiet TEXT DEFAULT '',
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(name, lat, lon)
  )`,
  `CREATE TABLE IF NOT EXISTS vermittlungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caregiver_id INTEGER NOT NULL, patient_id INTEGER NOT NULL,
    score INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'vorgeschlagen',
    erstellt_am TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(caregiver_id, patient_id)
  )`,
];

let bereit;
export function init() {
  bereit ??= (async () => {
    client = await makeClient();
    for (const sql of SCHEMA) await client.execute(sql);
    // Beim ersten Start mit leerer DB Demo-Daten laden, damit sofort etwas
    // zu sehen ist (abschaltbar via SEED_ON_EMPTY=0).
    if (process.env.SEED_ON_EMPTY !== '0') {
      const n = (await client.execute('SELECT COUNT(*) AS n FROM caregivers')).rows[0].n;
      if (!n) {
        const { seedDemo } = await import('./seedData.js');
        await seedDemo(client);
      }
    }
  })();
  return bereit;
}
