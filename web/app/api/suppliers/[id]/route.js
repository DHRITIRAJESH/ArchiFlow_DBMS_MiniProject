import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { requireUser } from "@/lib/session";
import { parseId, parseSupplier, supplierDbError } from "@/lib/suppliers";

// One supplier with all of its offers
export async function GET(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const supplierId = parseId(id);

  if (!supplierId) {
    return Response.json({ error: "Supplier not found." }, { status: 404 });
  }

  try {
    const supplierRows = await query(
      `
        SELECT supplier_id, name, email, phone, city, rating
        FROM suppliers
        WHERE supplier_id = ?
      `,
      [supplierId]
    );

    if (supplierRows.length === 0) {
      return Response.json({ error: "Supplier not found." }, { status: 404 });
    }

    const offerRows = await query(
      `
        SELECT
          sm.material_id,
          m.name AS material_name,
          m.unit,
          mc.category_id,
          mc.name AS category_name,
          sm.unit_price,
          sm.lead_time_days,
          sm.updated_at,
          (
            SELECT COUNT(*)
            FROM material_usage mu
            WHERE mu.supplier_id = sm.supplier_id
              AND mu.material_id = sm.material_id
          ) AS usage_count
        FROM supplier_materials sm
        JOIN materials m
          ON m.material_id = sm.material_id
        JOIN material_categories mc
          ON mc.category_id = m.category_id
        WHERE sm.supplier_id = ?
        ORDER BY mc.name, m.name
      `,
      [supplierId]
    );

    const supplier = {
      ...supplierRows[0],
      rating:
        supplierRows[0].rating === null ? null : Number(supplierRows[0].rating),
    };

    const offers = offerRows.map((row) => ({
      ...row,
      unit_price: Number(row.unit_price),
      usage_count: Number(row.usage_count),
    }));

    return Response.json({ supplier, offers });
  } catch (err) {
    return dbError(err);
  }
}

// ADMIN only: edit a supplier
export async function PUT(request, { params }) {
  const { error } = await requireUser(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const supplierId = parseId(id);

  if (!supplierId) {
    return Response.json({ error: "Supplier not found." }, { status: 404 });
  }

  try {
    const body = await request.json();

    const parsed = parseSupplier(body);
    if (parsed.error) return parsed.error;

    const result = await query(
      `
        UPDATE suppliers
        SET name = ?, email = ?, phone = ?, city = ?, rating = ?
        WHERE supplier_id = ?
      `,
      [...parsed.values, supplierId]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "Supplier not found." }, { status: 404 });
    }

    return Response.json({ message: "Supplier updated successfully." });
  } catch (err) {
    return supplierDbError(err);
  }
}
