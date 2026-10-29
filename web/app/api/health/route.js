import { query } from "@/lib/db";

export async function GET() {
  const rows = await query("SELECT COUNT(*) AS projects FROM projects");
  return Response.json(rows[0]);
}
