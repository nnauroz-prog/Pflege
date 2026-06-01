// Beispieldaten neu einspielen.  Aufruf:  npm run seed
import { client, init } from './db.js';
import { seedDemo } from './seedData.js';

await init();
const r = await seedDemo(client, { reset: true });
console.log(`Seed fertig: ${r.pfleger} Pfleger, ${r.patienten} Anfragen.`);
process.exit(0);
