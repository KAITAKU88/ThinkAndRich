import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tr_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface SessionPayload {
  sub: string; // user id
  email: string;
  role: string;
  tier: string;
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
    .sign(new TextEncoder().encode(secret));
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.tier !== "string"
    ) {
      return null;
    }
    return { sub: payload.sub, email: payload.email, role: payload.role, tier: payload.tier };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  // Secure cookies are dropped by browsers over plain http://localhost —
  // only require it once actually served over https in production.
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/**
 * The configured parent domain, but only for hosts that actually sit inside
 * it.
 *
 * SESSION_COOKIE_DOMAIN is a plain var in wrangler.jsonc, and those reach
 * `next dev` through getCloudflareContext() exactly as they reach the
 * deployed Worker — so "leave it unset locally" was never true. Every local
 * login was handing the browser a cookie scoped to
 * `.thinkandrich.ankiva.cc` while being served from localhost; a browser
 * drops a cookie whose Domain does not cover the host that sent it, so the
 * session silently never existed and /admin bounced straight back to the
 * login page. Deriving the scope from the request host fixes that without
 * requiring a second, easily-forgotten override in .dev.vars.
 */
export function sessionCookieDomain(
  domain: string | undefined,
  host: string | null | undefined
): string | undefined {
  const configured = domain?.trim().toLowerCase();
  if (!configured) return undefined;

  const hostname = host?.toLowerCase().split(":")[0];
  if (!hostname) return undefined;

  const bare = configured.startsWith(".") ? configured.slice(1) : configured;
  return hostname === bare || hostname.endsWith(`.${bare}`) ? configured : undefined;
}

/**
 * Cookie options widened to a parent domain when SESSION_COOKIE_DOMAIN is set
 * (e.g. ".thinkandrich.ankiva.cc") and the request is actually being served
 * from inside it.
 *
 * The console lives on its own hostname, but /mcp/authorize — the OAuth
 * consent screen — is served from the public one and has to see the same
 * admin session, so a host-only cookie would break that flow.
 */
export function sessionCookieOptions(domain?: string, host?: string | null) {
  const scoped = sessionCookieDomain(domain, host);
  return scoped ? { ...SESSION_COOKIE_OPTIONS, domain: scoped } : SESSION_COOKIE_OPTIONS;
}
