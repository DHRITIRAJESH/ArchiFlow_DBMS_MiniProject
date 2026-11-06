// Try semantic search from the terminal.
// Usage:  npm run search -- "your requirement here"
import { getDb } from './config.mjs';
import { semanticSearch } from './semantic_search.mjs';

const db = getDb();
const query = process.argv[2] || 'affordable, low-maintenance flooring suitable for high-traffic areas';

console.log(`\nSearch: "${query}"`);
console.table(await semanticSearch(db, query));

console.log('Same search, only Flooring under ₹100 with durability 4+:');
console.table(await semanticSearch(db, query, { category: 'Flooring', maxPrice: 100, minDurability: 4 }));

await db.end();
