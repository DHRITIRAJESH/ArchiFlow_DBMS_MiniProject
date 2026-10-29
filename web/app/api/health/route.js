import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query("SELECT COUNT(*) AS projects FROM projects");
    return Response.json(rows[0]);
  } catch (err) {
    return Response.json({ error: "Database connection failed" }, { status: 500 });
  }
}
