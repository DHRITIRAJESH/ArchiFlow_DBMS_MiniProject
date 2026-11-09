import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { syncMaterial } from "@/lib/materialSync";
import { requireUser } from "@/lib/session";
import {
  MAINTENANCE_LEVELS,
  materialDbError,
  parseMaterial,
} from "@/lib/materials";

// List materials with their cheapest offer.
// Optional filters: ?category_id=  ?min_durability=  ?maintenance=  ?q=
export async function GET(request) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = Number(searchParams.get("category_id"));
    const minDurability = Number(searchParams.get("min_durability"));
    const maintenance = searchParams.get("maintenance");
    const keyword = searchParams.get("q")?.trim() || "";

    const where = [];
    const params = [];

    // Relevance column is only computed when a keyword is given
    let relevance = "NULL";
    if (keyword) {
      relevance = "MATCH(m.name, m.description) AGAINST (? IN NATURAL LANGUAGE MODE)";
      params.push(keyword);

      where.push("MATCH(m.name, m.description) AGAINST (? IN NATURAL LANGUAGE MODE)");
      params.push(keyword);
    }

    if (Number.isInteger(categoryId) && categoryId > 0) {
      where.push("m.category_id = ?");
      params.push(categoryId);
    }

    if (Number.isInteger(minDurability) && minDurability >= 1 && minDurability <= 5) {
      where.push("m.durability_rating >= ?");
      params.push(minDurability);
    }

    if (MAINTENANCE_LEVELS.includes(maintenance)) {
      where.push("m.maintenance_level = ?");
      params.push(maintenance);
    }

    // material_cheapest_offer returns one row per supplier when several tie
    // on the lowest price, so ROW_NUMBER() keeps one row per material
    // (shortest lead time wins the tie). LEFT JOIN keeps materials with no offers.
    const sql = `
      SELECT
        m.material_id,
        m.name,
        m.unit,
        m.durability_rating,
        m.maintenance_level,
        mc.category_id,
        mc.name AS category_name,
        mco.unit_price AS cheapest_price,
        mco.supplier_id AS cheapest_supplier_id,
        mco.supplier_name AS cheapest_supplier,
        ${relevance} AS relevance
      FROM materials m
      JOIN material_categories mc
        ON mc.category_id = m.category_id
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
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY ${keyword ? "relevance DESC, m.name" : "mc.name, m.name"}
    `;

    const rows = await query(sql, params);

    const materials = rows.map((row) => ({
      ...row,
      cheapest_price:
        row.cheapest_price === null ? null : Number(row.cheapest_price),
      relevance: row.relevance === null ? null : Number(row.relevance),
    }));

    return Response.json({ materials });
  } catch (err) {
    return dbError(err);
  }
}

// ADMIN only: add a material
export async function POST(request) {
  const { error } = await requireUser(["ADMIN"]);
  if (error) return error;

  try {
    const body = await request.json();

    const parsed = parseMaterial(body);
    if (parsed.error) return parsed.error;

    const result = await query(
      `
        INSERT INTO materials
          (category_id, name, description, unit, durability_rating, maintenance_level)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      parsed.values
    );

    // MySQL write succeeded; now add it to semantic search (never throws)
    const { warning } = await syncMaterial(result.insertId);

    return Response.json(
      {
        material_id: result.insertId,
        message: "Material added successfully.",
        ...(warning && { warning }),
      },
      { status: 201 }
    );
  } catch (err) {
    return materialDbError(err);
  }
}
