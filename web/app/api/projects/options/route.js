import { query } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  const { error } = await requireUser();

  if (error) return error;

  const clients = await query(
    `
      SELECT client_id, name
      FROM clients
      ORDER BY name
    `
  );

  const architects = await query(
    `
      SELECT user_id, full_name
      FROM users
      ORDER BY full_name
    `
  );

  return Response.json({
    clients,
    architects,
  });
}
