import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SESSION_COOKIE } from "@/lib/session-token";

export async function POST() {
  const { env } = getCloudflareContext();
  const res = NextResponse.json({ ok: true });
  // A cookie scoped to a parent domain is only removed by a deletion carrying
  // that same domain and path — otherwise the browser keeps the original and
  // "log out" silently leaves the session alive.
  res.cookies.delete({
    name: SESSION_COOKIE,
    path: "/",
    ...(env.SESSION_COOKIE_DOMAIN ? { domain: env.SESSION_COOKIE_DOMAIN } : {}),
  });
  return res;
}
