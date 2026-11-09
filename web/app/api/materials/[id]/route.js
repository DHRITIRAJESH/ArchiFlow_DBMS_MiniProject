import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { syncMaterial } from "@/lib/materialSync";
import { requireUser } from "@/lib/session";
import { materialDbError, parseMaterial } from "@/lib/materials";

function parseId(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// One material with every column, its cheapest offer and project count
export async function GET(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const materialId = parseId(id);

  if (!materialId) {
    return Response.json({ error: "Material not found." }, { status: 404 });
  }

  try {
    const rows = await query(
      `
        SELECT
          m.material_id,
          m.category_id,
          mc.name AS category_name,
          m.name,
          m.description,
          m.unit,
          m.durability_rating,
          m.maintenance_level,
          (
            SELECT COUNT(DISTINCT mu.project_id)
            FROM material_usage mu
            WHERE mu.material_id = m.material_id
          ) AS projects_used_in
        FROM materials m
        JOIN material_categories mc
          ON mc.category_id = m.category_id
        WHERE m.material_id = ?
      `,
      [materialId]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Material not found." }, { status: 404 });
    }

    // Every supplier tied for the lowest price (usually just one)
    const offerRows = await query(
      `
        SELECT supplier_id, supplier_name, unit_price, lead_time_days
        FROM material_cheapest_offer
        WHERE material_id = ?
        ORDER BY lead_time_days, supplier_name
      `,
      [materialId]
    );

    // Stored procedure: every supplier for this material, ranked by price.
    // mysql2 returns CALL results nested: [resultRows, ResultSetHeader],
    // so the rows we want are the first element.
    const [comparisonRows] = await query("CALL compare_suppliers(?)", [
      materialId,
    ]);

    // compare_suppliers() returns the supplier name but not its id.
    // suppliers.name is UNIQUE, so we can map name -> id for the links.
    const supplierIdRows = await query(
      `
        SELECT s.supplier_id, s.name
        FROM supplier_materials sm
        JOIN suppliers s
          ON s.supplier_id = sm.supplier_id
        WHERE sm.material_id = ?
      `,
      [materialId]
    );
    const idByName = new Map(
      supplierIdRows.map((row) => [row.name, row.supplier_id])
    );

    const material = {
      ...rows[0],
      projects_used_in: Number(rows[0].projects_used_in),
    };

    const cheapestOffers = offerRows.map((row) => ({
      ...row,
      unit_price: Number(row.unit_price),
    }));

    const supplierComparison = comparisonRows.map((row) => ({
      supplier_id: idByName.get(row.supplier) ?? null,
      supplier_name: row.supplier,
      city: row.city,
      rating: row.rating === null ? null : Number(row.rating),
      unit_price: Number(row.unit_price),
      lead_time_days: Number(row.lead_time_days),
      price_rank: Number(row.price_rank),
    }));

    return Response.json({ material, cheapestOffers, supplierComparison });
  } catch (err) {
    return dbError(err);
  }
}

// ADMIN only: edit a material
export async function PUT(request, { params }) {
  const { error } = await requireUser(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const materialId = parseId(id);

  if (!materialId) {
    return Response.json({ error: "Material not found." }, { status: 404 });
  }

  try {
    const body = await request.json();

    const parsed = parseMaterial(body);
    if (parsed.error) return parsed.error;

    const result = await query(
      `
        UPDATE materials
        SET
          category_id = ?,
          name = ?,
          description = ?,
          unit = ?,
          durability_rating = ?,
          maintenance_level = ?
        WHERE material_id = ?
      `,
      [...parsed.values, materialId]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "Material not found." }, { status: 404 });
    }

    // MySQL write succeeded; now re-embed for semantic search (never throws)
    const { warning } = await syncMaterial(materialId);

    return Response.json({
      message: "Material updated successfully.",
      ...(warning && { warning }),
    });
  } catch (err) {
    return materialDbError(err);
  }
}
