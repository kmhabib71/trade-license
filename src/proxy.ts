import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/**
 * Edge auth guard. Verifies the JWT and enforces role-based access at the route
 * boundary. Tenant-scoping and the subscription paywall are enforced server-side
 * (they need DB access, which middleware avoids).
 */

const PUBLIC_PATHS = ["/login"];
const ADMIN_PREFIXES = ["/admin"];
const INSPECTOR_PREFIXES = ["/dashboard", "/licenses", "/upload", "/sms", "/billing"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  // Signed-in users shouldn't see the login page.
  if (isPublic) {
    if (session) {
      return NextResponse.redirect(
        new URL(session.role === "super_admin" ? "/admin" : "/dashboard", req.url),
      );
    }
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Role fencing
  const wantsAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const wantsInspector = INSPECTOR_PREFIXES.some((p) => pathname.startsWith(p));

  if (wantsAdmin && session.role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (wantsInspector && session.role !== "inspector") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Guard page routes only. API routes (/api/*) enforce their own auth and return
  // JSON status codes, so they're excluded here (no HTML redirect for API clients).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-.*\\.png).*)",
  ],
};
