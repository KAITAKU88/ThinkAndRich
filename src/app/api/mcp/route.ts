import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createMcpHandler, type AuthInfo } from "@modelcontextprotocol/server";
import { buildMcpServer } from "@/lib/mcp/server";
import { verifyMcpToken } from "@/lib/server/mcp-tokens";
import { clientIp, peekRateLimit, recordRateLimitHit, tooManyRequests } from "@/lib/server/rate-limit";

// Counts only rejected credentials, so ordinary authenticated MCP traffic
// costs no KV writes — the Free plan allows barely a thousand a day. A valid
// key is 256 bits, so this exists to make bulk guessing pointless rather than
// to defend a weak secret.
const FAILED_AUTH = { limit: 20, windowSeconds: 10 * 60 };

// Remote MCP server for content authoring — see src/lib/mcp/server.ts for
// the tools. Wired into Claude.ai / ChatGPT as a custom connector so an AI
// chat session can push a freshly-written article straight into D1 as a
// DRAFT post.
//
// Three ways to authenticate, in descending order of preference:
//   1. An OAuth access token (src/lib/server/mcp-oauth.ts) in the
//      Authorization header. Nothing secret ever appears in a URL, and the
//      401 below is what sets that negotiation going.
//   2. An admin-created key from the MCP Connector screen, also as a bearer
//      header, or as `?key=` for clients whose UI offers nowhere to put a
//      header — Claude.ai's connector dialog being one.
//   3. The legacy MCP_API_KEY secret, kept only so the connector that was
//      already set up did not break. Drop it once nothing uses it.

// Constant-time comparison so a wrong key can't be recovered by timing the
// response. Both sides are hashed first so the loop length — and therefore
// the timing — never depends on the supplied key's length either. Only the
// legacy MCP_API_KEY path needs this; D1-backed keys are matched by digest
// inside SQLite (see verifyMcpToken).
async function secretsMatch(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [digestA, digestB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  const bytesA = new Uint8Array(digestA);
  const bytesB = new Uint8Array(digestB);
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

// A 401 here is what starts the OAuth dance: RFC 9728 says the challenge must
// name the resource-metadata document, and that is how a client such as
// Claude.ai discovers where to register and send the user to authorize.
function unauthorized(request: NextRequest, description: string) {
  const metadataUrl = `${new URL(request.url).origin}/.well-known/oauth-protected-resource`;
  return Response.json(
    { error: "invalid_token", error_description: description },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}", error="invalid_token", error_description="${description}"`,
      },
    }
  );
}

async function handleMcpRequest(request: NextRequest) {
  const { env } = getCloudflareContext();

  const authHeader = request.headers.get("authorization");
  const headerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const queryToken = request.nextUrl.searchParams.get("key") ?? undefined;
  const token = headerToken ?? queryToken;

  const ip = clientIp(request);
  const throttle = await peekRateLimit(env.OTP_KV, "mcp-auth", ip, FAILED_AUTH);
  if (!throttle.allowed) {
    return tooManyRequests("Too many failed authentication attempts.", throttle.retryAfterSeconds);
  }

  if (!token) return unauthorized(request, "Missing credentials.");

  // Keys created in the admin console (revocable, hashed at rest, per-client)
  // are the real credential. MCP_API_KEY stays accepted as a fallback so the
  // already-connected client keeps working while keys are migrated over —
  // remove it from the Worker's secrets once every client holds a D1 key.
  const dbToken = await verifyMcpToken(env.DB, token);
  const legacyOk = !dbToken && !!env.MCP_API_KEY && (await secretsMatch(token, env.MCP_API_KEY));

  if (!dbToken && !legacyOk) {
    await recordRateLimitHit(env.OTP_KV, "mcp-auth", ip, FAILED_AUTH);
    return unauthorized(request, "Invalid or revoked credentials.");
  }

  const authInfo: AuthInfo = {
    token,
    clientId: dbToken?.clientId ?? dbToken?.id ?? "think-and-rich-legacy-key",
    scopes: (dbToken?.scope ?? "mcp").split(" "),
    // Long-lived credential rather than a short-lived OAuth token; actual
    // expiry/revocation is enforced by verifyMcpToken on every request.
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  };

  const handler = createMcpHandler(() => buildMcpServer(env));
  return handler.fetch(request, { authInfo });
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;
