import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";
import { requireUser } from "@/lib/session";

export async function POST(request, { params }) {
  const { session, error } = await requireUser();

  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();

    const supplierId = Number(body.supplier_id);
    const materialId = Number(body.material_id);
    const quantity = Number(body.quantity);
    const areaApplied = body.area_applied?.trim() || null;
    const usedOn = body.used_on;

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return Response.json( { error: "Please select a supplier." }, { status: 400 });
    }

    if (!Number.isInteger(materialId) || materialId <= 0) {
      return Response.json( { error: "Please select a material." }, { status: 400 });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return Response.json({ error: "Quantity must be greater than 0." }, { status: 400 });
    }

    if (!usedOn) {
      return Response.json({ error: "Please select a usage date." }, { status: 400 });
    }

    const projectRows = await query(
      "SELECT project_id FROM projects WHERE project_id = ?",
      [id]
    );

    if (projectRows.length === 0) {
      return Response.json({ error: "Project not found." }, { status: 404 });
    }

    await query(
      "CALL record_material_usage(?, ?, ?, ?, ?, ?, ?)",
      [id, supplierId, materialId, session.user_id, quantity, areaApplied, usedOn]
    );

    return Response.json( { message: "Material usage recorded successfully." }, { status: 201 });
  } catch (err) {
    return dbError(err);
  }
}
