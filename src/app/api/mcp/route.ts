import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createMcpHandler, type AuthInfo } from "@modelcontextprotocol/server";
import { buildMcpServer } from "@/lib/mcp/server";
import { verifyMcpToken } from "@/lib/server/mcp-tokens";

// Remote MCP server for content authoring — see src/lib/mcp/server.ts for
// the tools. Meant to be wired into Claude.ai / ChatGPT as a custom/remote
// MCP connector so an AI chat session can push a freshly-written article
// straight into D1 as a DRAFT post.
//
// Auth: a single static token (MCP_API_KEY) rather than real OAuth — this is
// a single-tenant tool for the site owner's own use, not a multi-tenant
// public MCP server, so the extra OAuth machinery (dynamic client
// registration, authorize/token endpoints) isn't warranted here. Claude.ai's
// "Add custom connector" dialog has no field for a raw bearer token/API key
// (only Name, URL, and optional OAuth Client ID/Secret), so the token is
// also accepted as a `?key=` query param — meant to be embedded directly in
// the connector URL. Treat the key like a password either way: only the
// site owner's AI client config should ever hold it.
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

async function handleMcpRequest(request: NextRequest) {
  const { env } = getCloudflareContext();

  const authHeader = request.headers.get("authorization");
  const headerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const queryToken = request.nextUrl.searchParams.get("key") ?? undefined;
  const token = headerToken ?? queryToken;

  if (!token) {
    return Response.json({ error: "Missing API key." }, { status: 401 });
  }

  // Keys created in the admin console (revocable, hashed at rest, per-client)
  // are the real credential. MCP_API_KEY stays accepted as a fallback so the
  // already-connected client keeps working while keys are migrated over —
  // remove it from the Worker's secrets once every client holds a D1 key.
  const dbToken = await verifyMcpToken(env.DB, token);
  const legacyOk = !dbToken && !!env.MCP_API_KEY && (await secretsMatch(token, env.MCP_API_KEY));

  if (!dbToken && !legacyOk) {
    return Response.json({ error: "Invalid or revoked API key." }, { status: 401 });
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
