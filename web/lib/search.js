import { pool } from "@/lib/db";
import { embed } from "@/lib/embedder";
import { COLLECTION, qdrant } from "@/lib/qdrant";

export const RESULT_LIMIT = 6;

// Marks which step failed ("embed" or "qdrant") so the API can explain it
async function tagStage(stage, fn) {
  try {
    return await fn();
  } catch (err) {
    err.searchStage = stage;
    throw err;
  }
}

// One cheapest offer per material: material_cheapest_offer returns a row per
// supplier when several tie on the lowest price, so keep the first one.
const CHEAPEST_OFFER_JOIN = `
  LEFT JOIN (
    SELECT
      o.*,
      ROW_NUMBER() OVER (
        PARTITION BY o.material_id
        ORDER BY o.lead_time_days, o.supplier_name
      ) AS rn
    FROM material_cheapest_offer o
  ) mco
    ON mco.material_id = m.material_id
   AND mco.rn = 1
`;

const LIVE_COLUMNS = `
  m.material_id,
  m.name,
  m.unit,
  m.durability_rating,
  m.maintenance_level,
  mc.name AS category,
  mco.supplier_name,
  mco.unit_price,
  (
    SELECT COUNT(DISTINCT mu.project_id)
    FROM material_usage mu
    WHERE mu.material_id = m.material_id
  ) AS projects_used_in
`;

function toResult(row, score) {
  return {
    material_id: row.material_id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    score,
    cheapest_supplier: row.supplier_name ?? null,
    price: row.unit_price === null ? null : Number(row.unit_price),
    durability: row.durability_rating,
    maintenance: row.maintenance_level,
    projects_used_in: Number(row.projects_used_in),
  };
}

// Port of search/semantic_search.mjs.
// Qdrant finds materials by meaning; MySQL (the source of truth) supplies the
// live name, price, supplier and usage. Qdrant's ranking order is kept.
export async function semanticSearch(
  queryText,
  { category, maxPrice, minDurability, limit = RESULT_LIMIT } = {}
) {
  // 1. Turn the architect's requirement into a vector
  const [queryVector] = await tagStage("embed", () => embed([queryText]));

  // 2. Optional filters, applied inside Qdrant on the payload
  const must = [];
  if (category) must.push({ key: "category", match: { value: category } });
  if (maxPrice) must.push({ key: "min_price", range: { lte: maxPrice } });
  if (minDurability) {
    must.push({ key: "durability_rating", range: { gte: minDurability } });
  }

  // 3. Closest materials by cosine similarity
  const result = await tagStage("qdrant", () =>
    qdrant.query(COLLECTION, {
      query: queryVector,
      limit,
      filter: must.length ? { must } : undefined,
      with_payload: true,
    })
  );
  const hits = result.points;
  if (hits.length === 0) return [];

  // 4. Live details from MySQL for those material_ids.
  // pool.query (not execute) so mysql2 expands the array for IN (?)
  const ids = hits.map((h) => Number(h.id));
  const [rows] = await pool.query(
    `
      SELECT ${LIVE_COLUMNS}
      FROM materials m
      JOIN material_categories mc
        ON mc.category_id = m.category_id
      ${CHEAPEST_OFFER_JOIN}
      WHERE m.material_id IN (?)
    `,
    [ids]
  );
  const byId = new Map(rows.map((r) => [r.material_id, r]));

  // 5. Keep Qdrant's order; skip points whose material no longer exists in MySQL
  return hits
    .filter((h) => byId.has(Number(h.id)))
    .map((h) => toResult(byId.get(Number(h.id)), Number(h.score.toFixed(3))));
}

// Keyword baseline (sample query Q8): MySQL FULLTEXT on name + description,
// with the same optional filters, so the demo compares like with like.
export async function keywordSearch(
  queryText,
  { category, maxPrice, minDurability } = {}
) {
  const where = ["MATCH(m.name, m.description) AGAINST (? IN NATURAL LANGUAGE MODE)"];
  const params = [queryText, queryText];

  if (category) {
    where.push("mc.name = ?");
    params.push(category);
  }
  if (maxPrice) {
    where.push("mco.unit_price <= ?");
    params.push(maxPrice);
  }
  if (minDurability) {
    where.push("m.durability_rating >= ?");
    params.push(minDurability);
  }

  const [rows] = await pool.query(
    `
      SELECT
        ${LIVE_COLUMNS},
        MATCH(m.name, m.description) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
      FROM materials m
      JOIN material_categories mc
        ON mc.category_id = m.category_id
      ${CHEAPEST_OFFER_JOIN}
      WHERE ${where.join(" AND ")}
      ORDER BY score DESC, m.name
      LIMIT ${RESULT_LIMIT}
    `,
    params
  );

  return rows.map((row) => toResult(row, Number(Number(row.score).toFixed(3))));
}
