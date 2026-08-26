import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE, sessionCookieDomain } from "@/lib/session-token";

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  const res = NextResponse.json({ ok: true });
  // A cookie scoped to a parent domain is only removed by a deletion carrying
  // that same domain and path — otherwise the browser keeps the original and
  // "log out" silently leaves the session alive. The scope has to be derived
  // from the request host the same way it was when the cookie was set, or
  // the deletion misses on any host outside the configured domain.
  const domain = sessionCookieDomain(env.SESSION_COOKIE_DOMAIN, request.headers.get("host"));
  res.cookies.delete({
    name: SESSION_COOKIE,
    path: "/",
    ...(domain ? { domain } : {}),
  });
  return res;
}
