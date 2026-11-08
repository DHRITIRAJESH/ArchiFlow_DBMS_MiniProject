import { getSession } from "@/lib/session";

export async function GET() {
  const s = await getSession();
  if (!s.user_id) return Response.json({ user: null });
  return Response.json({ user: { user_id: s.user_id, name: s.name, role: s.role } });
}
