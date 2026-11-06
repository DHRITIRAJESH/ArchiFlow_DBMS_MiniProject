// Reads every material from MySQL, embeds its text, and loads it into Qdrant.
// Safe to re-run: it rebuilds the collection from scratch each time.
import { getDb, qdrant, COLLECTION, VECTOR_SIZE } from './config.mjs';
import { embed } from './embedder.mjs';

const db = getDb();

// 1. Read materials with their category and cheapest current price
const [materials] = await db.query(`
  SELECT m.material_id, m.name, m.description, m.unit,
         m.durability_rating, m.maintenance_level,
         mc.name AS category,
         MIN(sm.unit_price) AS min_price
  FROM materials m
  JOIN material_categories mc ON mc.category_id = m.category_id
  LEFT JOIN supplier_materials sm ON sm.material_id = m.material_id
  GROUP BY m.material_id, m.name, m.description, m.unit,
           m.durability_rating, m.maintenance_level, mc.name
  ORDER BY m.material_id`);
console.log(`Read ${materials.length} materials from MySQL`);

// 2. Build the text to embed: name, category, description and key properties together
const texts = materials.map(m =>
  `${m.name}. Category: ${m.category}. ${m.description} ` +
  `Durability ${m.durability_rating} out of 5, ${m.maintenance_level.toLowerCase()} maintenance.`);

// 3. Create embeddings (first run downloads the model, so it may take a minute)
console.log('Creating embeddings...');
const vectors = await embed(texts);
console.log(`Created ${vectors.length} vectors of ${vectors[0].length} dimensions`);

// 4. (Re)create the Qdrant collection with cosine distance
const { exists } = await qdrant.collectionExists(COLLECTION);
if (exists) await qdrant.deleteCollection(COLLECTION);
await qdrant.createCollection(COLLECTION, {
  vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
});
// Payload indexes make filtering by these fields fast
await qdrant.createPayloadIndex(COLLECTION, { field_name: 'category', field_schema: 'keyword' });
await qdrant.createPayloadIndex(COLLECTION, { field_name: 'maintenance_level', field_schema: 'keyword' });
await qdrant.createPayloadIndex(COLLECTION, { field_name: 'durability_rating', field_schema: 'integer' });
await qdrant.createPayloadIndex(COLLECTION, { field_name: 'min_price', field_schema: 'float' });

// 5. Upload: point ID = MySQL material_id, so the two databases stay linked
const points = materials.map((m, i) => ({
  id: m.material_id,
  vector: vectors[i],
  payload: {
    name: m.name,
    category: m.category,
    unit: m.unit,
    durability_rating: m.durability_rating,
    maintenance_level: m.maintenance_level,
    min_price: m.min_price === null ? null : Number(m.min_price),
  },
}));
await qdrant.upsert(COLLECTION, { wait: true, points });

const info = await qdrant.getCollection(COLLECTION);
console.log(`Done: ${info.points_count} materials stored in Qdrant collection "${COLLECTION}"`);
await db.end();
