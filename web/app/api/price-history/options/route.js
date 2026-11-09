import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { requireUser } from "@/lib/session";

// Dropdown data for the price history filters
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  try {
    const suppliers = await query(
      `
        SELECT supplier_id, name
        FROM suppliers
        ORDER BY name
      `
    );

    const materials = await query(
      `
        SELECT m.material_id, m.name, mc.name AS category_name
        FROM materials m
        JOIN material_categories mc
          ON mc.category_id = m.category_id
        ORDER BY mc.name, m.name
      `
    );

    return Response.json({ suppliers, materials });
  } catch (err) {
    return dbError(err);
  }
}
