import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  createMcpHandler,
  requireBearerAuth,
  OAuthError,
  OAuthErrorCode,
  type OAuthTokenVerifier,
} from "@modelcontextprotocol/server";
import { buildMcpServer } from "@/lib/mcp/server";

// Remote MCP server for content authoring — see src/lib/mcp/server.ts for
// the tools. Meant to be wired into Claude.ai / ChatGPT as a custom/remote
// MCP connector so an AI chat session can push a freshly-written article
// straight into D1 as a DRAFT post.
//
// Auth: a single static Bearer token (MCP_API_KEY) rather than real OAuth —
// this is a single-tenant tool for the site owner's own use, not a
// multi-tenant public MCP server, so the extra OAuth machinery
// (@cloudflare/workers-oauth-provider, dynamic client registration) isn't
// warranted here. Treat the key like a password: only the site owner's AI
// client config should ever hold it.
async function handleMcpRequest(request: NextRequest) {
  const { env } = getCloudflareContext();

  if (!env.MCP_API_KEY) {
    return Response.json({ error: "MCP server chưa được cấu hình (thiếu MCP_API_KEY)." }, { status: 503 });
  }

  const verifier: OAuthTokenVerifier = {
    async verifyAccessToken(token) {
      if (token !== env.MCP_API_KEY) {
        throw new OAuthError(OAuthErrorCode.InvalidToken, "Invalid API key.");
      }
      return {
        token,
        clientId: "think-and-rich-admin",
        scopes: ["mcp"],
        // Static long-lived key, not a real short-lived OAuth token — the
        // bearer-auth helper requires some expiresAt, so this is set far in
        // the future rather than genuinely rotating.
        expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
      };
    },
  };

  const gate = requireBearerAuth({ verifier, requiredScopes: ["mcp"] });
  const auth = await gate(request);
  if (auth instanceof Response) return auth;

  const handler = createMcpHandler(() => buildMcpServer(env));
  return handler.fetch(request, { authInfo: auth });
}

export const POST = handleMcpRequest;
export const GET = handleMcpRequest;
export const DELETE = handleMcpRequest;
