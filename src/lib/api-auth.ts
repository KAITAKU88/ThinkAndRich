import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifySession, SESSION_COOKIE, type SessionPayload } from "@/lib/session-token";

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
  return { session, env };
}

export async function requireAdmin(request: NextRequest): Promise<ApiAuthContext | null> {
  const ctx = await requireSession(request);
  if (!ctx || ctx.session.role !== "ADMIN") return null;
  return ctx;
}
