import { drizzle } from "drizzle-orm/d1";
import { and, eq, isNull, lt } from "drizzle-orm";
import { mcpAuthCodes, mcpOauthClients } from "@/db/schema";
import { hashToken } from "@/lib/server/mcp-tokens";

// Authorization-server half of the MCP OAuth flow. The MCP SDK covers the
// resource-server side (challenges, metadata shapes) but not this, so the
// authorize/token/register endpoints are hand-written here.
//
// Scope of the implementation, deliberately narrow: authorization_code +
// PKCE only. No implicit grant, no client_credentials (there is no
// non-interactive caller to serve), and no refresh tokens — access tokens
// are long-lived and revoked from the admin console instead, which for a
// single-tenant tool is both simpler and easier to reason about than a
// rotation scheme nobody is watching.

export const AUTH_CODE_TTL_MS = 10 * 60 * 1000;
export const MCP_SCOPE = "mcp";

export interface OAuthClient {
  id: string;
  name: string;
  redirectUris: string[];
  hasSecret: boolean;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(byteLength = 32): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)));
}

/**
 * A redirect URI must match one the client registered, character for
 * character. Prefix or host matching is what turns an OAuth server into an
 * open redirector, so it is never attempted here.
 */
export function redirectUriAllowed(client: OAuthClient, redirectUri: string): boolean {
  return client.redirectUris.includes(redirectUri);
}

export interface RegisterClientInput {
  name: string;
  redirectUris: string[];
  /** RFC 7591 token_endpoint_auth_method; "none" means a public PKCE client. */
  authMethod?: string;
}

export async function registerOAuthClient(
  db: D1Database,
  input: RegisterClientInput
): Promise<{ client: OAuthClient; clientSecret: string | null }> {
  const wantsSecret = input.authMethod !== undefined && input.authMethod !== "none";
  const clientSecret = wantsSecret ? randomToken(32) : null;
  const id = `mcpc_${randomToken(16)}`;

  await drizzle(db).insert(mcpOauthClients).values({
    id,
    secretHash: clientSecret ? await hashToken(clientSecret) : null,
    name: input.name,
    redirectUris: JSON.stringify(input.redirectUris),
    createdAt: new Date().toISOString(),
  });

  return {
    client: { id, name: input.name, redirectUris: input.redirectUris, hasSecret: wantsSecret },
    clientSecret,
  };
}

export async function getOAuthClient(db: D1Database, clientId: string): Promise<OAuthClient | null> {
  const rows = await drizzle(db)
    .select()
    .from(mcpOauthClients)
    .where(eq(mcpOauthClients.id, clientId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  let redirectUris: string[] = [];
  try {
    const parsed: unknown = JSON.parse(row.redirectUris);
    if (Array.isArray(parsed)) redirectUris = parsed.filter((u): u is string => typeof u === "string");
  } catch {
    // A malformed row can only ever fail closed: no redirect URI matches.
  }

  return { id: row.id, name: row.name, redirectUris, hasSecret: row.secretHash !== null };
}

async function clientSecretMatches(db: D1Database, clientId: string, secret: string): Promise<boolean> {
  const rows = await drizzle(db)
    .select({ secretHash: mcpOauthClients.secretHash })
    .from(mcpOauthClients)
    .where(eq(mcpOauthClients.id, clientId))
    .limit(1);
  const stored = rows[0]?.secretHash;
  if (!stored) return false;
  return stored === (await hashToken(secret));
}

export interface IssueCodeInput {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  userId: string;
  userEmail: string;
  resource?: string | null;
}

export async function issueAuthCode(db: D1Database, input: IssueCodeInput): Promise<string> {
  const code = randomToken(32);
  const now = Date.now();

  await drizzle(db).insert(mcpAuthCodes).values({
    codeHash: await hashToken(code),
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod,
    scope: input.scope,
    userId: input.userId,
    userEmail: input.userEmail,
    resource: input.resource ?? null,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + AUTH_CODE_TTL_MS).toISOString(),
  });

  // Opportunistic sweep so expired codes don't accumulate; failure here is
  // harmless because redemption re-checks expiry anyway.
  try {
    await drizzle(db).delete(mcpAuthCodes).where(lt(mcpAuthCodes.expiresAt, new Date(now).toISOString()));
  } catch {
    // ignore — housekeeping only
  }

  return code;
}

async function pkceMatches(method: string, challenge: string, verifier: string): Promise<boolean> {
  if (method === "S256") {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return base64UrlEncode(new Uint8Array(digest)) === challenge;
  }
  // "plain" is accepted by the spec but offers no protection against a
  // stolen code, so it is refused outright.
  return false;
}

export interface ConsumedCode {
  clientId: string;
  scope: string;
  userId: string;
  userEmail: string;
}

export type ConsumeCodeResult =
  | { ok: true; value: ConsumedCode }
  | { ok: false; error: string; description: string };

export async function consumeAuthCode(
  db: D1Database,
  params: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
    clientSecret?: string;
  }
): Promise<ConsumeCodeResult> {
  const invalidGrant = (description: string): ConsumeCodeResult => ({
    ok: false,
    error: "invalid_grant",
    description,
  });

  const client = await getOAuthClient(db, params.clientId);
  if (!client) {
    return { ok: false, error: "invalid_client", description: "Unknown client_id." };
  }
  if (client.hasSecret) {
    if (!params.clientSecret || !(await clientSecretMatches(db, params.clientId, params.clientSecret))) {
      return { ok: false, error: "invalid_client", description: "Client authentication failed." };
    }
  }

  const codeHash = await hashToken(params.code);
  const db_ = drizzle(db);
  const rows = await db_.select().from(mcpAuthCodes).where(eq(mcpAuthCodes.codeHash, codeHash)).limit(1);
  const row = rows[0];
  if (!row) return invalidGrant("Authorization code not found.");

  // Mark used before any further checks so a code can never be redeemed
  // twice, even by two requests racing each other.
  const claimed = await db_
    .update(mcpAuthCodes)
    .set({ usedAt: new Date().toISOString() })
    .where(and(eq(mcpAuthCodes.codeHash, codeHash), isNull(mcpAuthCodes.usedAt)))
    .returning({ codeHash: mcpAuthCodes.codeHash });
  if (claimed.length === 0) return invalidGrant("Authorization code has already been used.");

  if (new Date(row.expiresAt).getTime() < Date.now()) return invalidGrant("Authorization code has expired.");
  if (row.clientId !== params.clientId) return invalidGrant("Authorization code was issued to another client.");
  if (row.redirectUri !== params.redirectUri) return invalidGrant("redirect_uri does not match the authorization request.");
  if (!(await pkceMatches(row.codeChallengeMethod, row.codeChallenge, params.codeVerifier))) {
    return invalidGrant("PKCE verification failed.");
  }

  return {
    ok: true,
    value: { clientId: row.clientId, scope: row.scope, userId: row.userId, userEmail: row.userEmail },
  };
}

// --- Discovery metadata -----------------------------------------------

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/mcp/authorize`,
    token_endpoint: `${origin}/api/mcp/oauth/token`,
    registration_endpoint: `${origin}/api/mcp/oauth/register`,
    scopes_supported: [MCP_SCOPE],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    code_challenge_methods_supported: ["S256"],
  };
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ["header"],
  };
}
