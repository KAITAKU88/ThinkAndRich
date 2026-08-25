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
// Two ways to authenticate, both backed by the mcp_tokens table:
//   1. An OAuth access token (src/lib/server/mcp-oauth.ts) in the
//      Authorization header. Nothing secret ever appears in a URL, and the
//      401 below is what sets that negotiation going.
//   2. An admin-created key from the MCP Connector screen, also as a bearer
//      header, or as `?key=` for clients whose UI offers nowhere to put a
//      header — Claude.ai's connector dialog being one.
//
// A third route used to exist: a single MCP_API_KEY held in the Worker's
// secrets. It was removed once the live connector had moved to OAuth, because
// it could not be revoked without a redeploy and was invisible to the admin
// console. Every credential is now revocable from there, and every one of
// them is checked against a stored digest rather than a value in the config.

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

  const dbToken = await verifyMcpToken(env.DB, token);
  if (!dbToken) {
    await recordRateLimitHit(env.OTP_KV, "mcp-auth", ip, FAILED_AUTH);
    return unauthorized(request, "Invalid or revoked credentials.");
  }

  const authInfo: AuthInfo = {
    token,
    clientId: dbToken.clientId ?? dbToken.id,
    scopes: dbToken.scope.split(" "),
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
