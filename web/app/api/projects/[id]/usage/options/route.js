import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { error } = await requireUser();

  if (error) return error;

  const rows = await query(`
    SELECT
      m.material_id,
      m.name AS material_name,
      m.unit,
      mc.category_id,
      mc.name AS category_name,
      s.supplier_id,
      s.name AS supplier_name,
      sm.unit_price
    FROM materials m
    JOIN material_categories mc
      ON mc.category_id = m.category_id
    JOIN supplier_materials sm
      ON sm.material_id = m.material_id
    JOIN suppliers s
      ON s.supplier_id = sm.supplier_id
    ORDER BY mc.name, m.name, sm.unit_price, s.name
  `);

  const options = rows.map((row) => ({
    ...row,
    unit_price: Number(row.unit_price),
  }));

  return Response.json({ options });
}
