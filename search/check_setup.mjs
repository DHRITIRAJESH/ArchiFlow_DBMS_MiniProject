// Step check: confirms MySQL and Qdrant are both reachable before embedding.
import { getDb, qdrant } from './config.mjs';

const db = getDb();
try {
  const [rows] = await db.query('SELECT COUNT(*) AS n FROM materials');
  console.log(`MySQL OK: ${rows[0].n} materials found`);
} catch (err) {
  console.error('MySQL FAILED:', err.message);
}
try {
  const { collections } = await qdrant.getCollections();
  console.log(`Qdrant OK: ${collections.length} collection(s) exist`);
} catch (err) {
  console.error('Qdrant FAILED (is Docker running?):', err.message);
}
await db.end();
