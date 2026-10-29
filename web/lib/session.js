import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "archiflow_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  return getIronSession(await cookies(), sessionOptions);
}

// Call at the top of protected API routes.
// requireUser() = any logged-in user, requireUser(["ADMIN"]) = admins only.
export async function requireUser(allowedRoles) {
  const session = await getSession();
  if (!session.user_id) {
    return { error: Response.json({ error: "Not logged in" }, { status: 401 }) };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return { error: Response.json({ error: "Not allowed" }, { status: 403 }) };
  }
  return { session };
}
