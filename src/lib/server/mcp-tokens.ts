import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, isNull, or, gt } from "drizzle-orm";
import { mcpTokens } from "@/db/schema";

// Credential handling for the MCP server. The raw key never touches D1 — only
// its SHA-256 digest does — so a database dump can't be replayed against the
// endpoint. See the mcpTokens table comment in src/db/schema.ts.

const TOKEN_PREFIX = "tnr_mcp_";
/** Chars of the raw key kept in plaintext so the admin UI can label a row. */
const DISPLAY_CHARS = 8;

export interface McpTokenRecord {
  id: string;
  tokenPrefix: string;
  label: string;
  kind: "MANUAL" | "OAUTH";
  createdBy: string;
  clientId: string | null;
  scope: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashToken(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return toHex(new Uint8Array(digest));
}

/** 256 bits of entropy, prefixed so a leaked key is recognisable in logs. */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return TOKEN_PREFIX + toHex(bytes);
}

export function displayPrefix(raw: string): string {
  return raw.slice(0, TOKEN_PREFIX.length + DISPLAY_CHARS);
}

export interface CreateTokenInput {
  label: string;
  createdBy: string;
  kind?: "MANUAL" | "OAUTH";
  clientId?: string | null;
  scope?: string;
  /** Absolute expiry; omit for a key that never expires on its own. */
  expiresAt?: string | null;
}

/** Returns the record plus the plaintext key — the only time it exists. */
export async function createMcpToken(
  db: D1Database,
  input: CreateTokenInput
): Promise<{ record: McpTokenRecord; plaintext: string }> {
  const plaintext = generateToken();
  const now = new Date().toISOString();
  const record: McpTokenRecord = {
    id: crypto.randomUUID(),
    tokenPrefix: displayPrefix(plaintext),
    label: input.label,
    kind: input.kind ?? "MANUAL",
    createdBy: input.createdBy,
    clientId: input.clientId ?? null,
    scope: input.scope ?? "mcp",
    createdAt: now,
    expiresAt: input.expiresAt ?? null,
    lastUsedAt: null,
    revokedAt: null,
  };

  await drizzle(db)
    .insert(mcpTokens)
    .values({ ...record, tokenHash: await hashToken(plaintext) });

  return { record, plaintext };
}

export interface VerifiedToken {
  id: string;
  label: string;
  kind: "MANUAL" | "OAUTH";
  clientId: string | null;
  scope: string;
}

/**
 * Looks the key up by hash, so the comparison happens inside SQLite on a
 * digest rather than on the secret itself — no timing-sensitive string
 * compare, and a wrong key is indistinguishable from an unknown one.
 * Returns null for revoked or expired keys.
 */
export async function verifyMcpToken(db: D1Database, raw: string): Promise<VerifiedToken | null> {
  if (!raw) return null;
  const now = new Date().toISOString();
  const rows = await drizzle(db)
    .select()
    .from(mcpTokens)
    .where(
      and(
        eq(mcpTokens.tokenHash, await hashToken(raw)),
        isNull(mcpTokens.revokedAt),
        or(isNull(mcpTokens.expiresAt), gt(mcpTokens.expiresAt, now))!
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Best-effort "last used" stamp; a failed write must never cost the caller
  // its request, so this is deliberately not awaited into the failure path.
  try {
    await drizzle(db).update(mcpTokens).set({ lastUsedAt: now }).where(eq(mcpTokens.id, row.id));
  } catch {
    // ignore — telemetry only
  }

  return {
    id: row.id,
    label: row.label,
    kind: row.kind,
    clientId: row.clientId,
    scope: row.scope,
  };
}

/** Projects every column except tokenHash — the digest never leaves the server. */
export async function listMcpTokens(db: D1Database): Promise<McpTokenRecord[]> {
  return drizzle(db)
    .select({
      id: mcpTokens.id,
      tokenPrefix: mcpTokens.tokenPrefix,
      label: mcpTokens.label,
      kind: mcpTokens.kind,
      createdBy: mcpTokens.createdBy,
      clientId: mcpTokens.clientId,
      scope: mcpTokens.scope,
      createdAt: mcpTokens.createdAt,
      expiresAt: mcpTokens.expiresAt,
      lastUsedAt: mcpTokens.lastUsedAt,
      revokedAt: mcpTokens.revokedAt,
    })
    .from(mcpTokens)
    .orderBy(desc(mcpTokens.createdAt));
}

/** Revocation is a tombstone, not a delete, so the audit trail survives. */
export async function revokeMcpToken(db: D1Database, id: string): Promise<boolean> {
  const result = await drizzle(db)
    .update(mcpTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(mcpTokens.id, id), isNull(mcpTokens.revokedAt)))
    .returning({ id: mcpTokens.id });
  return result.length > 0;
}
