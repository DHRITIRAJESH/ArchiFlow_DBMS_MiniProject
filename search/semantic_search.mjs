// Semantic search: Qdrant finds materials by meaning, MySQL adds live prices and usage.
// This function is reused later by the Next.js search page.
import { qdrant, COLLECTION } from './config.mjs';
import { embed } from './embedder.mjs';

export async function semanticSearch(db, queryText, { category, maxPrice, minDurability, limit = 5 } = {}) {
  // 1. Turn the architect's requirement into a vector
  const [queryVector] = await embed([queryText]);

  // 2. Optional filters, applied inside Qdrant
  const must = [];
  if (category) must.push({ key: 'category', match: { value: category } });
  if (maxPrice) must.push({ key: 'min_price', range: { lte: maxPrice } });
  if (minDurability) must.push({ key: 'durability_rating', range: { gte: minDurability } });

  // 3. Ask Qdrant for the closest materials (cosine similarity)
  const result = await qdrant.query(COLLECTION, {
    query: queryVector,
    limit,
    filter: must.length ? { must } : undefined,
    with_payload: true,
  });
  const hits = result.points;
  if (hits.length === 0) return [];

  // 4. Fetch live details from MySQL for those material_ids
  const ids = hits.map(h => h.id);
  const [rows] = await db.query(`
    SELECT m.material_id, mco.supplier_name, mco.unit_price, mco.lead_time_days,
           (SELECT COUNT(DISTINCT mu.project_id) FROM material_usage mu
             WHERE mu.material_id = m.material_id) AS projects_used_in
    FROM materials m
    LEFT JOIN material_cheapest_offer mco ON mco.material_id = m.material_id
    WHERE m.material_id IN (?)`, [ids]);
  const byId = new Map(rows.map(r => [r.material_id, r]));

  // 5. Combine, keeping Qdrant's similarity order
  return hits.map(h => {
    const r = byId.get(h.id) || {};
    return {
      material_id: h.id,
      name: h.payload.name,
      category: h.payload.category,
      similarity: Number(h.score.toFixed(3)),
      cheapest_supplier: r.supplier_name ?? '-',
      price: r.unit_price != null ? `₹${Number(r.unit_price)}/${h.payload.unit}` : '-',
      durability: h.payload.durability_rating,
      maintenance: h.payload.maintenance_level,
      projects_used_in: r.projects_used_in ?? 0,
    };
  });
}
