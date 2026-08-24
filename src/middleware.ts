import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifySession, SESSION_COOKIE } from "@/lib/session-token";

// Real server-side admin gate — previously /admin was a fully public route
// at the routing layer, gated only by a client-side check inside
// AdminPage (viewable via page source / bypassed by disabling JS). The
// JWT already carries role/tier, so this never needs a D1 round-trip.
//
// Empirically (logged and confirmed under `next dev`): process.env.JWT_SECRET
// is NOT populated inside this Edge middleware runtime under OpenNext-for-
// Cloudflare, even though the same var works fine in regular route
// handlers — getCloudflareContext() is required here instead. That import
// is exactly the kind of dependency OpenNext-for-Cloudflare's middleware
// bundler has had breakage with on production builds (opennextjs-cloudflare
// issues #483/#494) — this file's import surface is deliberately minimal
// (just `jose` + `getCloudflareContext`, no Drizzle/D1 schema) to reduce
// that risk, but it MUST be verified with `npm run preview` (a real
// Workers build), not just `next dev`, before trusting it in production.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminApi = pathname.startsWith("/api/admin");

  // The login page itself must stay reachable, or an unauthenticated user
  // has nowhere to go — everything else under /admin requires a real
  // ADMIN session.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    // process.env doesn't carry plain Worker vars into the Edge middleware
    // runtime under this OpenNext-for-Cloudflare setup — fall back to the
    // Cloudflare context binding.
    secret = getCloudflareContext().env.JWT_SECRET;
  }
  const session = token && secret ? await verifySession(token, secret) : null;

  if (!session || session.role !== "ADMIN") {
    if (isAdminApi) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
