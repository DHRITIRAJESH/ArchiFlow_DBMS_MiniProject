import { query } from "@/lib/db";
import { dbError } from "@/lib/dberror";

const fail = (message, status = 400) => ({
  error: Response.json({ error: message }, { status }),
});

const send = (message, status) => Response.json({ error: message }, { status });

export function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// ---------- Suppliers ----------

// Returns { values } or { error: Response }.
// The 0-5 rating range is left to the CHECK constraint chk_suppliers_rating.
export function parseSupplier(body) {
  const name = body.name?.trim();
  const email = body.email?.trim() || null;
  const phone = body.phone?.trim() || null;
  const city = body.city?.trim() || null;
  const rawRating = body.rating;
  const rating =
    rawRating === "" || rawRating === null || rawRating === undefined
      ? null
      : Number(rawRating);

  if (!name) {
    return fail("Supplier name is required.");
  }

  if (rating !== null && !Number.isFinite(rating)) {
    return fail("Rating must be a number between 0 and 5.");
  }

  return { values: [name, email, phone, city, rating] };
}

export function supplierDbError(err) {
  const sqlMessage = err.sqlMessage || "";

  if (err.errno === 1062) {
    console.error(err);
    return send("A supplier with this name already exists.", 409);
  }

  if (
    (err.errno === 3819 && sqlMessage.includes("chk_suppliers_rating")) ||
    (err.errno === 1264 && sqlMessage.includes("rating"))
  ) {
    console.error(err);
    return send("Rating must be between 0 and 5.", 400);
  }

  return dbError(err);
}

// ---------- Offers (supplier_materials) ----------

// The unit_price > 0 and lead_time_days >= 0 ranges are left to the
// CHECK constraints chk_sm_price and chk_sm_lead.
export function parseOffer(body) {
  const unitPrice =
    body.unit_price === "" || body.unit_price == null
      ? NaN
      : Number(body.unit_price);
  const leadTime =
    body.lead_time_days === "" || body.lead_time_days == null
      ? NaN
      : Number(body.lead_time_days);

  if (!Number.isFinite(unitPrice)) {
    return fail("Unit price is required and must be a number.");
  }

  if (!Number.isInteger(leadTime)) {
    return fail("Lead time must be a whole number of days.");
  }

  return { unitPrice, leadTime };
}

export function offerDbError(err) {
  const sqlMessage = err.sqlMessage || "";

  if (err.errno === 1062) {
    console.error(err);
    return send("This supplier already offers that material.", 409);
  }

  if (err.errno === 3819 && sqlMessage.includes("chk_sm_price")) {
    console.error(err);
    return send("Unit price must be greater than 0.", 400);
  }

  if (err.errno === 3819 && sqlMessage.includes("chk_sm_lead")) {
    console.error(err);
    return send("Lead time cannot be negative.", 400);
  }

  if (err.errno === 1264 && sqlMessage.includes("unit_price")) {
    console.error(err);
    return send("Unit price is too large.", 400);
  }

  if (err.errno === 1264 && sqlMessage.includes("lead_time_days")) {
    console.error(err);
    return send("Lead time is too large.", 400);
  }

  if (err.errno === 1452) {
    console.error(err);
    return send("That supplier or material no longer exists.", 400);
  }

  return dbError(err);
}

// Explains a 1451 (fk_usage_offer) when an offer that projects already
// bought from is deleted
export async function offerInUseError(err, supplierId, materialId) {
  console.error(err);

  try {
    const rows = await query(
      `
        SELECT
          COUNT(*) AS uses,
          COUNT(DISTINCT project_id) AS projects
        FROM material_usage
        WHERE supplier_id = ? AND material_id = ?
      `,
      [supplierId, materialId]
    );

    const uses = Number(rows[0].uses);
    const projects = Number(rows[0].projects);

    return send(
      `Cannot remove this offer: it has been used ${uses} time${uses === 1 ? "" : "s"} ` +
        `in ${projects} project${projects === 1 ? "" : "s"}. Material usage records keep a ` +
        "link to the supplier offer they were bought from, so the database blocks the delete " +
        "to protect those project costs. You can still change its price or lead time.",
      409
    );
  } catch {
    return send(
      "Cannot remove this offer: it is already used in recorded project material usage.",
      409
    );
  }
}
