import { NextResponse } from "next/server";

// Quick gate: no session cookie -> go to /login.
// The real security check (decrypting the cookie, checking the role) happens
// in the API routes through requireUser().
export function proxy(req) {
  const hasSession = req.cookies.has("archiflow_session");
  const { pathname } = req.nextUrl;

  if (!hasSession && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
