import { dbError } from "@/lib/dberror";

// Must match the ENUMs on the materials table
export const UNITS = ["sqft", "sqm", "piece", "kg", "litre", "rft", "bag"];
export const MAINTENANCE_LEVELS = ["LOW", "MEDIUM", "HIGH"];

// Reads and checks the add/edit form body.
// Returns { values } or { error: Response }.
// The 1-5 durability range is deliberately left to the database CHECK
// constraint (chk_materials_durability) so that rule lives in one place.
export function parseMaterial(body) {
  const fail = (message) => ({
    error: Response.json({ error: message }, { status: 400 }),
  });

  const categoryId = Number(body.category_id);
  const name = body.name?.trim();
  const description = body.description?.trim();
  const unit = body.unit;
  const durability = Number(body.durability_rating);
  const maintenance = body.maintenance_level;

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return fail("Please select a category.");
  }

  if (!name) {
    return fail("Material name is required.");
  }

  if (!description) {
    return fail("Description is required.");
  }

  if (!UNITS.includes(unit)) {
    return fail("Please select a valid unit.");
  }

  if (body.durability_rating === "" || !Number.isInteger(durability)) {
    return fail("Durability rating must be a whole number.");
  }

  if (!MAINTENANCE_LEVELS.includes(maintenance)) {
    return fail("Please select a maintenance level.");
  }

  return {
    values: [categoryId, name, description, unit, durability, maintenance],
  };
}

// Material-specific messages first, then the shared dbError() mapping
export function materialDbError(err) {
  const send = (message, status) =>
    Response.json({ error: message }, { status });
  const sqlMessage = err.sqlMessage || "";

  if (err.errno === 1062 && sqlMessage.includes("uq_materials_name")) {
    console.error(err);
    return send(
      "A material with this name already exists in the selected category.",
      409
    );
  }

  if (
    (err.errno === 3819 && sqlMessage.includes("chk_materials_durability")) ||
    (err.errno === 1264 && sqlMessage.includes("durability_rating"))
  ) {
    console.error(err);
    return send("Durability rating must be between 1 and 5.", 400);
  }

  if (err.errno === 1452) {
    console.error(err);
    return send("The selected category does not exist.", 400);
  }

  return dbError(err);
}
