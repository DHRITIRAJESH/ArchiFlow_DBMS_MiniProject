import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  offerDbError,
  offerInUseError,
  parseId,
  parseOffer,
} from "@/lib/suppliers";

// ADMIN only: change an offer's price / lead time.
// This is a plain UPDATE on purpose: the AFTER UPDATE trigger
// trg_price_change_log writes the price_history row. The app never does.
export async function PUT(request, { params }) {
  const { error } = await requireUser(["ADMIN"]);
  if (error) return error;

  const { id, materialId: rawMaterialId } = await params;
  const supplierId = parseId(id);
  const materialId = parseId(rawMaterialId);

  if (!supplierId || !materialId) {
    return Response.json({ error: "Offer not found." }, { status: 404 });
  }

  try {
    const body = await request.json();

    const parsed = parseOffer(body);
    if (parsed.error) return parsed.error;

    // Old price, only to tell the user whether the trigger logged a change
    const existing = await query(
      `
        SELECT unit_price
        FROM supplier_materials
        WHERE supplier_id = ? AND material_id = ?
      `,
      [supplierId, materialId]
    );

    if (existing.length === 0) {
      return Response.json({ error: "Offer not found." }, { status: 404 });
    }

    await query(
      `
        UPDATE supplier_materials
        SET unit_price = ?, lead_time_days = ?
        WHERE supplier_id = ? AND material_id = ?
      `,
      [parsed.unitPrice, parsed.leadTime, supplierId, materialId]
    );

    // DECIMAL(10,2): compare in paise, the same way MySQL rounds
    const priceChanged =
      Math.round(Number(existing[0].unit_price) * 100) !==
      Math.round(parsed.unitPrice * 100);

    return Response.json({
      message: priceChanged
        ? "Offer updated. The price change was logged to price history by the database trigger."
        : "Offer updated.",
      price_changed: priceChanged,
    });
  } catch (err) {
    return offerDbError(err);
  }
}

// ADMIN only: remove an offer. Blocked by fk_usage_offer (1451) when
// material_usage rows reference it.
export async function DELETE(request, { params }) {
  const { error } = await requireUser(["ADMIN"]);
  if (error) return error;

  const { id, materialId: rawMaterialId } = await params;
  const supplierId = parseId(id);
  const materialId = parseId(rawMaterialId);

  if (!supplierId || !materialId) {
    return Response.json({ error: "Offer not found." }, { status: 404 });
  }

  try {
    const result = await query(
      `
        DELETE FROM supplier_materials
        WHERE supplier_id = ? AND material_id = ?
      `,
      [supplierId, materialId]
    );

    if (result.affectedRows === 0) {
      return Response.json({ error: "Offer not found." }, { status: 404 });
    }

    return Response.json({ message: "Offer removed successfully." });
  } catch (err) {
    if (err.errno === 1451) {
      return offerInUseError(err, supplierId, materialId);
    }
    return offerDbError(err);
  }
}
