import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { requireUser } from "@/lib/session";

// Dropdown data for the filters and the add/edit form
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  try {
    const categories = await query(
      `
        SELECT category_id, name
        FROM material_categories
        ORDER BY name
      `
    );

    return Response.json({ categories });
  } catch (err) {
    return dbError(err);
  }
}
