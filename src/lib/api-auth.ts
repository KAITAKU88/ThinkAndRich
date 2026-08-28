import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifySession, SESSION_COOKIE, type SessionPayload } from "@/lib/session-token";
import { ADMIN_SESSION_EPOCH_KEY, isAdminSessionStale } from "@/lib/owner-recovery";

export interface ApiAuthContext {
  session: SessionPayload;
  env: CloudflareEnv;
}

// Every session-scoped route handler starts with one of these two instead
// of re-deriving env/cookie/JWT verification inline (mirrors the pattern
// already used in src/app/api/auth/verify-otp/route.ts).
export async function requireSession(request: NextRequest): Promise<ApiAuthContext | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { env } = getCloudflareContext();
  const session = await verifySession(token, env.JWT_SECRET);
  if (!session) return null;
  if (session.role === "ADMIN") {
    try {
      const epoch = Number((await env.OTP_KV.get(ADMIN_SESSION_EPOCH_KEY)) ?? 0) || 0;
      if (isAdminSessionStale(session.iat, epoch)) return null;
    } catch {
      // KV outage must not lock the console; epoch is a revocation signal, not a gate.
    }
  }
  return { session, env };
}

export async function requireAdmin(request: NextRequest): Promise<ApiAuthContext | null> {
  const ctx = await requireSession(request);
  if (!ctx || ctx.session.role !== "ADMIN") return null;
  return ctx;
}
