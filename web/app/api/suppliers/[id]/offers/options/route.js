import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { requireUser } from "@/lib/session";
import { parseId } from "@/lib/suppliers";

// Materials this supplier does not offer yet (for the "Add offer" dropdown)
export async function GET(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const supplierId = parseId(id);

  if (!supplierId) {
    return Response.json({ error: "Supplier not found." }, { status: 404 });
  }

  try {
    const materials = await query(
      `
        SELECT
          m.material_id,
          m.name,
          m.unit,
          mc.name AS category_name
        FROM materials m
        JOIN material_categories mc
          ON mc.category_id = m.category_id
        WHERE NOT EXISTS (
          SELECT 1
          FROM supplier_materials sm
          WHERE sm.supplier_id = ?
            AND sm.material_id = m.material_id
        )
        ORDER BY mc.name, m.name
      `,
      [supplierId]
    );

    return Response.json({ materials });
  } catch (err) {
    return dbError(err);
  }
}
