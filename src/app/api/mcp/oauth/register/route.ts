import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { registerOAuthClient } from "@/lib/server/mcp-oauth";
import { checkRateLimit, clientIp, tooManyRequests } from "@/lib/server/rate-limit";

// Unauthenticated by necessity, so every call counts — otherwise a stranger
// can fill the clients table for free.
const REGISTRATIONS = { limit: 10, windowSeconds: 60 * 60 };

// RFC 7591 dynamic client registration. Claude.ai calls this itself before it
// can present a consent screen, so it cannot require authentication — the
// real gate is the ADMIN login plus explicit approval on /mcp/authorize.
// Registering only reserves a client_id; it grants no access to anything.

interface RegistrationRequest {
  redirect_uris?: unknown;
  client_name?: unknown;
  token_endpoint_auth_method?: unknown;
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  const throttle = await checkRateLimit(env.OTP_KV, "oauth-register", clientIp(request), REGISTRATIONS);
  if (!throttle.allowed) {
    return tooManyRequests("Too many client registrations.", throttle.retryAfterSeconds);
  }

  const body = (await request.json().catch(() => null)) as RegistrationRequest | null;

  if (!body || !Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
    return NextResponse.json(
      { error: "invalid_client_metadata", error_description: "redirect_uris is required." },
      { status: 400 }
    );
  }

  const redirectUris: string[] = [];
  for (const uri of body.redirect_uris) {
    if (typeof uri !== "string") {
      return NextResponse.json(
        { error: "invalid_redirect_uri", error_description: "redirect_uris must be strings." },
        { status: 400 }
      );
    }
    let parsed: URL;
    try {
      parsed = new URL(uri);
    } catch {
      return NextResponse.json(
        { error: "invalid_redirect_uri", error_description: `Not a valid URL: ${uri}` },
        { status: 400 }
      );
    }
    // Codes are delivered through this URI, so anything that could leak one
    // over the network in clear text is refused. Loopback stays allowed for
    // desktop clients, which cannot obtain a certificate.
    const isLoopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
    if (parsed.protocol !== "https:" && !isLoopback) {
      return NextResponse.json(
        { error: "invalid_redirect_uri", error_description: "redirect_uris must use https (loopback excepted)." },
        { status: 400 }
      );
    }
    redirectUris.push(uri);
  }

  const name = typeof body.client_name === "string" && body.client_name.trim() ? body.client_name.trim() : "Unnamed MCP client";
  const authMethod = typeof body.token_endpoint_auth_method === "string" ? body.token_endpoint_auth_method : "none";

  const { client, clientSecret } = await registerOAuthClient(env.DB, {
    name,
    redirectUris,
    authMethod,
  });

  return NextResponse.json(
    {
      client_id: client.id,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: client.name,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: authMethod,
      grant_types: ["authorization_code"],
      response_types: ["code"],
    },
    { status: 201 }
  );
}
