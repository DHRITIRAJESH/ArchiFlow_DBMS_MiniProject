import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function PUT(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

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
        UPDATE clients
        SET name = ?, email = ?, phone = ?, city = ?
        WHERE client_id = ?
      `,
      [name, email, phone, city, id]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { error: "Client not found." },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Client updated successfully.",
    });
  } catch (error) {
    console.error("PUT /api/clients/[id] error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return Response.json(
        { error: "A client with this email already exists." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to update client." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;

  try {
    const result = await query(
      `
        DELETE FROM clients
        WHERE client_id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return Response.json(
        { error: "Client not found." },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Client deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/clients/[id] error:", error);

    if (
      error.code === "ER_ROW_IS_REFERENCED_2" ||
      error.errno === 1451
    ) {
      return Response.json(
        {
          error:
            "This client cannot be deleted because they have one or more projects.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to delete client." },
      { status: 500 }
    );
  }
}
