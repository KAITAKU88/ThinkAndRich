import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifySession, SESSION_COOKIE } from "@/lib/session-token";
import { ADMIN_SESSION_EPOCH_KEY, isAdminSessionStale } from "@/lib/owner-recovery";

export const config = {
  matcher: ["/api/:path*"],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminApi) {
    return maybeMaintenanceBlock(request, pathname);
  }

  const { env } = getCloudflareContext();

  // Admin API only on console hostname when split is configured.
  const adminHost = env.ADMIN_HOST?.trim().toLowerCase();
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (adminHost && host && host !== adminHost && host !== "localhost" && host !== "127.0.0.1") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const skipAuth =
    pathname === "/api/admin/owner" ||
    pathname.startsWith("/api/admin/owner/");

  if (skipAuth) return NextResponse.next();

  const secret = process.env.JWT_SECRET ?? env.JWT_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token && secret ? await verifySession(token, secret) : null;

  if (session?.role === "ADMIN") {
    try {
      const epoch = Number((await env.OTP_KV.get(ADMIN_SESSION_EPOCH_KEY)) ?? 0) || 0;
      if (isAdminSessionStale(session.iat, epoch)) {
        return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
      }
    } catch {
      // fail open on KV hiccup
    }
    return NextResponse.next();
  }

  return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
}

async function maybeMaintenanceBlock(request: NextRequest, pathname: string) {
  const skip =
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/auth/recover") ||
    pathname.startsWith("/api/mcp/oauth");

  if (skip) return NextResponse.next();

  try {
    const { env } = getCloudflareContext();
    const raw = await env.OTP_KV.get("maintenance:state");
    if (!raw) return NextResponse.next();

    const state = JSON.parse(raw) as {
      enabled?: boolean;
      enabledAt?: string | null;
      messageVi?: string | null;
    };
    const enabledAt = state.enabledAt ? new Date(state.enabledAt).getTime() : 0;
    const fresh = state.enabled && enabledAt > 0 && Date.now() - enabledAt <= 15 * 60 * 1000;
    if (fresh) {
      return NextResponse.json(
        { ok: false, message: state.messageVi || "Hệ thống đang bảo trì. Vui lòng thử lại sau." },
        { status: 503 }
      );
    }
  } catch {
    // fail open
  }

  return NextResponse.next();
}
