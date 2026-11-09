import { query } from "@/lib/db";
import { syncMinPrice } from "@/lib/materialSync";
import { requireUser } from "@/lib/session";
import { offerDbError, parseId, parseOffer } from "@/lib/suppliers";

// ADMIN only: add a new offer (a material this supplier doesn't sell yet)
export async function POST(request, { params }) {
  const { error } = await requireUser(["ADMIN"]);
  if (error) return error;

  const { id } = await params;
  const supplierId = parseId(id);

  if (!supplierId) {
    return Response.json({ error: "Supplier not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const materialId = parseId(body.material_id);

    if (!materialId) {
      return Response.json(
        { error: "Please select a material." },
        { status: 400 }
      );
    }

    const parsed = parseOffer(body);
    if (parsed.error) return parsed.error;

    await query(
      `
        INSERT INTO supplier_materials
          (supplier_id, material_id, unit_price, lead_time_days)
        VALUES (?, ?, ?, ?)
      `,
      [supplierId, materialId, parsed.unitPrice, parsed.leadTime]
    );

    // A new offer may lower the material's min_price in Qdrant
    const { warning } = await syncMinPrice(materialId);

    return Response.json(
      { message: "Offer added successfully.", ...(warning && { warning }) },
      { status: 201 }
    );
  } catch (err) {
    return offerDbError(err);
  }
}
