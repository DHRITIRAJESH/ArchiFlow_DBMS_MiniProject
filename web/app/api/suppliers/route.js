import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { requireUser } from "@/lib/session";
import { parseSupplier, supplierDbError } from "@/lib/suppliers";

// List suppliers with how many materials each one offers. ?search= name or city
export async function GET(request) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const rows = await query(
      `
        SELECT
          s.supplier_id,
          s.name,
          s.email,
          s.phone,
          s.city,
          s.rating,
          COUNT(sm.material_id) AS material_count
        FROM suppliers s
        LEFT JOIN supplier_materials sm
          ON sm.supplier_id = s.supplier_id
        WHERE
          ? = ''
          OR s.name LIKE CONCAT('%', ?, '%')
          OR s.city LIKE CONCAT('%', ?, '%')
        GROUP BY
          s.supplier_id,
          s.name,
          s.email,
          s.phone,
          s.city,
          s.rating
        ORDER BY s.name
      `,
      [search, search, search]
    );

    const suppliers = rows.map((row) => ({
      ...row,
      rating: row.rating === null ? null : Number(row.rating),
      material_count: Number(row.material_count),
    }));

    return Response.json({ suppliers });
  } catch (err) {
    return dbError(err);
  }
}

// ADMIN only: add a supplier
export async function POST(request) {
  const { error } = await requireUser(["ADMIN"]);
  if (error) return error;

  try {
    const body = await request.json();

    const parsed = parseSupplier(body);
    if (parsed.error) return parsed.error;

    const result = await query(
      `
        INSERT INTO suppliers (name, email, phone, city, rating)
        VALUES (?, ?, ?, ?, ?)
      `,
      parsed.values
    );

    return Response.json(
      {
        supplier_id: result.insertId,
        message: "Supplier added successfully.",
      },
      { status: 201 }
    );
  } catch (err) {
    return supplierDbError(err);
  }
}
