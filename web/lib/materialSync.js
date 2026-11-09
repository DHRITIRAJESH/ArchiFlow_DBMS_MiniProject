import { query } from "@/lib/db";
import { embed } from "@/lib/embedder";
import { COLLECTION, describeQdrantError, qdrant } from "@/lib/qdrant";

// Keeps the Qdrant "materials" collection in step with MySQL after app edits.
// MySQL is the source of truth: these functions never throw. They run after
// the MySQL write has succeeded and return { warning } if Qdrant could not be
// updated, so the API can still report success and show the warning.

// Same text format as search/embed_materials.mjs
export function materialText(m) {
  return (
    `${m.name}. Category: ${m.category}. ${m.description} ` +
    `Durability ${m.durability_rating} out of 5, ${m.maintenance_level.toLowerCase()} maintenance.`
  );
}

// Same columns as search/embed_materials.mjs, for one material
async function loadMaterial(materialId) {
  const rows = await query(
    `
      SELECT
        m.material_id,
        m.name,
        m.description,
        m.unit,
        m.durability_rating,
        m.maintenance_level,
        mc.name AS category,
        MIN(sm.unit_price) AS min_price
      FROM materials m
      JOIN material_categories mc
        ON mc.category_id = m.category_id
      LEFT JOIN supplier_materials sm
        ON sm.material_id = m.material_id
      WHERE m.material_id = ?
      GROUP BY
        m.material_id, m.name, m.description, m.unit,
        m.durability_rating, m.maintenance_level, mc.name
    `,
    [materialId]
  );
  return rows[0] || null;
}

function warn(action, materialId, err) {
  const reason = describeQdrantError(err);
  console.warn(`[qdrant-sync] ${action} for material ${materialId} failed: ${reason}`, err);
  return {
    warning:
      `Saved in MySQL, but semantic search was not updated: ${reason}. ` +
      `Save this material again once Qdrant is running, or run "npm run embed" in search/ to rebuild it.`,
  };
}

// After a material is created or edited: re-embed it and upsert its point
export async function syncMaterial(materialId) {
  try {
    const m = await loadMaterial(materialId);
    if (!m) return {};

    const [vector] = await embed([materialText(m)]);

    await qdrant.upsert(COLLECTION, {
      wait: true,
      points: [
        {
          id: m.material_id, // point ID = MySQL material_id
          vector,
          payload: {
            name: m.name,
            category: m.category,
            unit: m.unit,
            durability_rating: m.durability_rating,
            maintenance_level: m.maintenance_level,
            min_price: m.min_price === null ? null : Number(m.min_price),
          },
        },
      ],
    });

    return {};
  } catch (err) {
    return warn("re-embed", materialId, err);
  }
}

// After an offer's price is added, changed or removed: refresh min_price only
// (no re-embedding needed; the text didn't change)
export async function syncMinPrice(materialId) {
  try {
    const rows = await query(
      `
        SELECT MIN(unit_price) AS min_price
        FROM supplier_materials
        WHERE material_id = ?
      `,
      [materialId]
    );
    const minPrice = rows[0].min_price === null ? null : Number(rows[0].min_price);

    try {
      await qdrant.setPayload(COLLECTION, {
        wait: true,
        points: [materialId],
        payload: { min_price: minPrice },
      });
    } catch (err) {
      // Point missing (e.g. created while Qdrant was down): embed it fully
      if (err?.status === 404 && !/collection/i.test(JSON.stringify(err?.data || ""))) {
        return syncMaterial(materialId);
      }
      throw err;
    }

    return {};
  } catch (err) {
    return warn("price update", materialId, err);
  }
}
