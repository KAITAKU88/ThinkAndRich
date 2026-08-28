import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifySession, SESSION_COOKIE } from "@/lib/session-token";
import { isLoopbackHostname, surfaceFor } from "@/lib/host-routing";

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
//
// Hostnames come from ADMIN_HOST / PUBLIC_HOST rather than being hardcoded,
// so moving either to a different domain is a config change plus a route in
// wrangler.jsonc.
//
// The matcher covers every page request because each hostname has to be able
// to turn away what does not belong to it. Static assets and image
// optimisation are excluded: they are shared by both surfaces and gain
// nothing from the check.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminApi = pathname.startsWith("/api/admin");
  const isApi = pathname.startsWith("/api");
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const { env } = getCloudflareContext();

  const publicHost = env.PUBLIC_HOST?.trim().toLowerCase();

  // Which surface this hostname is asking for. The rule itself, with its
  // full truth table and its tests, lives in src/lib/host-routing.ts.
  //
  // ADMIN_HOST is a plain var in wrangler.jsonc, and those reach `next dev`
  // too, so on localhost it names a hostname this origin can never match —
  // which would hide the console from its own developers. `next dev` is also
  // the only thing that answers on loopback, and it has no second hostname
  // to split across, so the split simply does not apply there. Next inlines
  // NODE_ENV at build time, so this is dead code in a deployed Worker.
  const surface = surfaceFor(request.headers.get("host"), {
    adminHost: env.ADMIN_HOST,
    isLoopbackDev:
      process.env.NODE_ENV === "development" && isLoopbackHostname(request.nextUrl.hostname),
  });
  const onAdminHost = surface === "console";

  const isMaintenancePath = pathname === "/maintenance";
  const skipMaintenance =
    isAdminApi || isAdminPage || pathname === "/admin" || isMaintenancePath || pathname.startsWith("/api/cron") || pathname.startsWith("/api/webhooks");
  if (!skipMaintenance) {
    try {
      const raw = await env.OTP_KV.get("maintenance:state");
      if (raw) {
        const state = JSON.parse(raw) as {
          enabled?: boolean;
          enabledAt?: string | null;
          messageVi?: string | null;
          messageEn?: string | null;
        };
        const enabledAt = state.enabledAt ? new Date(state.enabledAt).getTime() : 0;
        const fresh = state.enabled && enabledAt > 0 && Date.now() - enabledAt <= 15 * 60 * 1000;
        if (fresh) {
          if (isApi) {
            return NextResponse.json(
              { ok: false, message: state.messageVi || "Hệ thống đang bảo trì. Vui lòng thử lại sau." },
              { status: 503 }
            );
          }
          const url = new URL("/maintenance", request.url);
          if (state.messageVi) url.searchParams.set("vi", state.messageVi);
          if (state.messageEn) url.searchParams.set("en", state.messageEn);
          return NextResponse.rewrite(url);
        }
      }
    } catch {
      // Fail open: a KV hiccup must not take the public site down.
    }
  }

  function sendTo(targetHost: string) {
    const target = new URL(request.url);
    target.host = targetHost;
    target.protocol = "https:";
    target.port = "";
    return NextResponse.redirect(target);
  }

  // Public hostname: the console does not exist here. This used to redirect
  // to the console host, which was convenient but meant the old
  // public-site/admin URL still reached a working login form — two front
  // doors when the point of the split was to have one. Answering exactly as
  // any unknown path does also means the public site never advertises that a
  // console exists, or where.
  if (surface === "public") {
    if (isAdminApi) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }
    if (isAdminPage) {
      return NextResponse.rewrite(new URL("/_admin-not-here", request.url));
    }
  }

  // Console hostname: it serves the console and nothing else. Public pages
  // were reachable here too, which put the whole site at a second address —
  // the same duplication the split was meant to remove, pointing the other
  // way. These redirect rather than 404 because the content genuinely
  // exists; it just lives at the public address.
  //
  // APIs are exempt: the session store shared with the public site calls
  // /api/geo, /api/bookmarks and friends from inside the console, and every
  // one of those routes authenticates itself.
  if (onAdminHost && publicHost && !isApi && !isAdminPage && pathname !== "/") {
    return sendTo(publicHost);
  }

  // The console serves itself at the root of its hostname. Gate it as if it
  // were /admin and rewrite only once that passes — rewriting first would
  // hand out the console shell without ever checking the session, which is
  // precisely the server-side gate this file exists to provide.
  const servesConsoleAtRoot = onAdminHost && pathname === "/";
  const effectivePath = servesConsoleAtRoot ? "/admin" : pathname;

  // The public home page is not this middleware's business.
  if (pathname === "/" && !servesConsoleAtRoot) return NextResponse.next();

  // Nothing below applies to routes that are neither the console nor its API.
  if (!isAdminApi && !isAdminPage && !servesConsoleAtRoot) return NextResponse.next();

  // The login page itself must stay reachable, or an unauthenticated user
  // has nowhere to go — everything else under /admin requires a real
  // ADMIN session.
  if (effectivePath === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    // process.env doesn't carry plain Worker vars into the Edge middleware
    // runtime under this OpenNext-for-Cloudflare setup — fall back to the
    // Cloudflare context binding.
    secret = env.JWT_SECRET;
  }
  const session = token && secret ? await verifySession(token, secret) : null;

  if (!session || session.role !== "ADMIN") {
    if (isAdminApi) {
      return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", effectivePath);
    return NextResponse.redirect(loginUrl);
  }

  if (servesConsoleAtRoot) {
    return NextResponse.rewrite(new URL("/admin", request.url));
  }

  return NextResponse.next();
}
