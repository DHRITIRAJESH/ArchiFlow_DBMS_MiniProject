import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { requireUser } from "@/lib/session";
import { parseId } from "@/lib/suppliers";

// Price changes logged by trg_price_change_log, newest first.
// Optional filters: ?supplier_id=  ?material_id=
export async function GET(request) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const supplierId = parseId(searchParams.get("supplier_id"));
    const materialId = parseId(searchParams.get("material_id"));

    const where = [];
    const params = [];

    if (supplierId) {
      where.push("ph.supplier_id = ?");
      params.push(supplierId);
    }

    if (materialId) {
      where.push("ph.material_id = ?");
      params.push(materialId);
    }

    const rows = await query(
      `
        SELECT
          ph.history_id,
          s.supplier_id,
          s.name AS supplier_name,
          m.material_id,
          m.name AS material_name,
          m.unit,
          ph.old_price,
          ph.new_price,
          ROUND((ph.new_price - ph.old_price) / ph.old_price * 100, 1) AS pct_change,
          ph.changed_at
        FROM price_history ph
        JOIN suppliers s
          ON s.supplier_id = ph.supplier_id
        JOIN materials m
          ON m.material_id = ph.material_id
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY ph.changed_at DESC, ph.history_id DESC
      `,
      params
    );

    const history = rows.map((row) => ({
      ...row,
      old_price: Number(row.old_price),
      new_price: Number(row.new_price),
      pct_change: Number(row.pct_change),
    }));

    return Response.json({ history });
  } catch (err) {
    return dbError(err);
  }
}
