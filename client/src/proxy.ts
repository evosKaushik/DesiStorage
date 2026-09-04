import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "sid";

const PUBLIC_ONLY_PATHS = ["/login", "/register", "/forgot-password"];
const PROTECTED_PATHS = ["/dashboard", "/profile", "/verify-email"];

/**
 * First line of defence for auth (before React/guards render):
 * - authenticated users (sid cookie present) are kept out of login/register.
 * - unauthenticated users are kept out of protected routes.
 *
 * This is a fast heuristic — the cookie alone doesn't prove a valid session,
 * so the client-side AuthGuard/AuthRedirectGuard re-validate against GET /auth
 * as the second layer.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (PUBLIC_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (hasSession) return redirectTo(req, "/dashboard");
  }

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!hasSession) return redirectTo(req, "/login");
  }

  return NextResponse.next();
}

function redirectTo(req: NextRequest, path: string) {
  const url = req.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/login/:path*",
    "/register/:path*",
    "/forgot-password/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/verify-email/:path*",
  ],
};