import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET(request) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const rows = await query(
      `
        SELECT
          c.client_id,
          c.name,
          c.email,
          c.phone,
          c.city,
          COUNT(p.project_id) AS project_count
        FROM clients c
        LEFT JOIN projects p
          ON p.client_id = c.client_id
        WHERE
          ? = ''
          OR c.name LIKE CONCAT('%', ?, '%')
          OR c.email LIKE CONCAT('%', ?, '%')
          OR c.phone LIKE CONCAT('%', ?, '%')
          OR c.city LIKE CONCAT('%', ?, '%')
        GROUP BY
          c.client_id,
          c.name,
          c.email,
          c.phone,
          c.city
        ORDER BY c.name
      `,
      [search, search, search, search, search]
    );

    return Response.json(rows);
  } catch (error) {
    console.error("GET /api/clients error:", error);

    return Response.json(
      { error: "Failed to load clients." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { error } = await requireUser();
  if (error) return error;

  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim() || null;
    const phone = body.phone?.trim() || null;
    const city = body.city?.trim() || null;

    if (!name) {
      return Response.json(
        { error: "Client name is required." },
        { status: 400 }
      );
    }

    const result = await query(
      `
        INSERT INTO clients (name, email, phone, city)
        VALUES (?, ?, ?, ?)
      `,
      [name, email, phone, city]
    );

    return Response.json(
      {
        client_id: result.insertId,
        message: "Client added successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/clients error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return Response.json(
        { error: "A client with this email already exists." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to add client." },
      { status: 500 }
    );
  }
}
