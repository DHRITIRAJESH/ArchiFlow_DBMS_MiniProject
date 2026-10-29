import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const rows = await query(
    "SELECT user_id, full_name, password_hash, role FROM users WHERE email = ?",
    [email]
  );
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    return Response.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const session = await getSession();
  session.user_id = user.user_id;
  session.name = user.full_name;
  session.role = user.role;
  await session.save();

  return Response.json({ ok: true, role: user.role });
}
