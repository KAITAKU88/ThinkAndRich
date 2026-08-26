import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// Mirrors Post in src/lib/types.ts. key_takeaways/tags are JSON-encoded
// text (SQLite has no native array type).
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  pillar: text("pillar").notNull(),
  category: text("category").notNull(),
  displaySize: text("display_size").notNull(),

  academicFormula: text("academic_formula"),
  summarySnippet: text("summary_snippet").notNull(),
  fullContent: text("full_content").notNull(),
  schematicSvg: text("schematic_svg"),
  keyTakeaways: text("key_takeaways"), // JSON array

  accessLevel: text("access_level").notNull(),
  readingTimeMinutes: integer("reading_time_minutes").notNull(),
  // Which reading layout this article is set in — see
  // src/lib/reading-templates.ts. Nullable so existing rows keep the default
  // without a backfill.
  readingTemplate: text("reading_template"),
  status: text("status").notNull(),
  views: integer("views").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  dislikes: integer("dislikes").notNull().default(0),
  author: text("author").notNull(),
  tags: text("tags"), // JSON array
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Mirrors UserRecord in src/lib/types.ts, minus the flat
// bookmarkedPosts/likedPosts/dislikedPosts arrays — those become the
// bookmarks/reactions join tables below instead.
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  tier: text("tier").notNull(),
  avatar: text("avatar"),
  countryCode: text("country_code"),
  preferredLang: text("preferred_lang"),
  createdAt: text("created_at").notNull(),
  lastLoginAt: text("last_login_at").notNull(),
  dailyReadsDate: text("daily_reads_date"),
  dailyReadsCount: integer("daily_reads_count").notNull().default(0),

  // When the member's current paid term began and ends, ISO-8601.
  //
  // Until now a tier was permanent once granted: nothing recorded when it
  // started, so nothing could say how much of it had been used. Mid-term
  // upgrade pricing (src/lib/upgrade-pricing.ts) needs exactly that, since
  // what a PLUS member pays to reach PRO is the PRO price less the unspent
  // part of their PLUS term.
  //
  // Both are nullable and mean "no paid term": a FREE reader has neither.
  // planExpiresAt is recorded but NOT yet enforced anywhere — access still
  // follows `tier` alone. Making it enforcing is a separate feature with its
  // own decisions (renewal, notice before expiry, what a lapsed member sees),
  // and switching it on before those exist would silently revoke access from
  // every member whose stamp predates this column.
  planStartedAt: text("plan_started_at"),
  planExpiresAt: text("plan_expires_at"),
});

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })]
);

export const reactions = sqliteTable(
  "reactions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["like", "dislike"] }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })]
);

// Mirrors ReadLog in src/lib/types.ts directly.
export const readLogs = sqliteTable("read_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  postTitle: text("post_title").notNull(),
  pillar: text("pillar"),
  postCategory: text("post_category"),
  readAt: text("read_at").notNull(),
  reaction: text("reaction"),
});

// Attribution log for the "shares" counter on posts. userId is nullable
// because a share can be fired by an anonymous visitor; posts.shares is
// the fast denormalized total, this table only exists so the admin Users
// table can show a per-user share count via COUNT(...) WHERE userId = X.
export const shareLogs = sqliteTable(
  "share_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    sharedAt: text("shared_at").notNull(),
  },
  (table) => [index("share_logs_user_id_idx").on(table.userId)]
);

// Real order/payment lifecycle backing the admin Revenue tab and the
// SePay/Lemon Squeezy webhook (src/app/api/webhooks/billing/route.ts).
// amount is stored as the plain display integer in `currency` (VND has no
// subunits; USD would be cents) — always read amount together with
// currency, never assume a fixed subunit scale across rows.
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gateway: text("gateway", { enum: ["sepay", "lemonsqueezy"] }).notNull(),
    tier: text("tier", { enum: ["PLUS", "PRO"] }).notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    status: text("status", { enum: ["PENDING", "PAID", "FAILED", "CANCELED"] })
      .notNull()
      .default("PENDING"),
    gatewayReference: text("gateway_reference"),
    rawPayload: text("raw_payload"),
    createdAt: text("created_at").notNull(),
    paidAt: text("paid_at"),
  },
  (table) => [
    index("orders_gateway_reference_idx").on(table.gatewayReference),
    index("orders_user_id_idx").on(table.userId),
  ]
);

// Per-language content for a post. The `posts` row above stays the
// canonical Vietnamese source (this is a Vietnamese-first product — see
// project overview) and is also the fallback shown whenever a post has no
// row here for the requested language yet, or that row's own `status` is
// still DRAFT. Shared/taxonomy fields (pillar, category, displaySize,
// accessLevel, engagement counters, schematicSvg) intentionally stay only
// on `posts` — they don't vary by language, and splitting engagement
// counters per-language would make a single post's stats meaningless
// without summing across rows. `academicFormula`/`keyTakeaways`/`tags` are
// nullable so a translation can go live before every field is filled in;
// unset ones fall back to the vi original's value (see
// src/lib/server/post-translation.ts).
export const postTranslations = sqliteTable(
  "post_translations",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    language: text("language").notNull(), // SupportedLanguage, excluding "vi" (that's the posts row itself)
    title: text("title").notNull(),
    summarySnippet: text("summary_snippet").notNull(),
    fullContent: text("full_content").notNull(),
    academicFormula: text("academic_formula"),
    keyTakeaways: text("key_takeaways"), // JSON array
    tags: text("tags"), // JSON array — falls back to posts.tags when null
    status: text("status", { enum: ["DRAFT", "PUBLISHED"] }).notNull().default("DRAFT"),
    translatedBy: text("translated_by"), // admin user id/email, for audit — nullable
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("post_translations_post_language_idx").on(table.postId, table.language),
    index("post_translations_language_idx").on(table.language),
  ]
);

// Credentials for the MCP content-authoring server (src/app/api/mcp).
// Replaces the single MCP_API_KEY env var, which could only be rotated from
// the CLI and gave no way to tell one AI client from another. Keys live here
// hashed (SHA-256 — the raw key is 256 bits of entropy, so a slow KDF buys
// nothing) and the plaintext is shown exactly once, at creation.
//
// `kind` distinguishes an admin-pasted key from a token minted by the OAuth
// authorize flow, so both share one revocation list and one admin screen.
export const mcpTokens = sqliteTable(
  "mcp_tokens",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    // First few chars of the raw key, kept so the admin UI can identify a key
    // it can never show again ("tnr_mcp_9f3a…").
    tokenPrefix: text("token_prefix").notNull(),
    label: text("label").notNull(),
    kind: text("kind", { enum: ["MANUAL", "OAUTH"] }).notNull().default("MANUAL"),
    // Admin who created/authorized it, for audit.
    createdBy: text("created_by").notNull(),
    clientId: text("client_id"), // OAuth client that holds it; null for MANUAL
    scope: text("scope").notNull().default("mcp"),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at"), // null = never expires
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
  },
  (table) => [
    index("mcp_tokens_revoked_idx").on(table.revokedAt),
  ]
);

// OAuth clients that registered themselves through RFC 7591 dynamic client
// registration. Registration is deliberately open — Claude.ai registers
// itself before it can even show a consent screen, and there is no chance to
// pre-share credentials with it. Registering buys an anonymous caller
// nothing on its own: minting a token still requires a logged-in ADMIN to
// approve the request on /mcp/authorize.
export const mcpOauthClients = sqliteTable("mcp_oauth_clients", {
  id: text("id").primaryKey(), // client_id
  secretHash: text("secret_hash"), // null for public (PKCE-only) clients
  name: text("name").notNull(),
  redirectUris: text("redirect_uris").notNull(), // JSON array of exact-match URIs
  createdAt: text("created_at").notNull(),
});

// Short-lived authorization codes. Stored hashed and single-use: `usedAt` is
// set on redemption, and a code presented twice is treated as an attack on
// the client that holds it rather than a retry.
export const mcpAuthCodes = sqliteTable(
  "mcp_auth_codes",
  {
    codeHash: text("code_hash").primaryKey(),
    clientId: text("client_id").notNull(),
    redirectUri: text("redirect_uri").notNull(),
    codeChallenge: text("code_challenge").notNull(),
    codeChallengeMethod: text("code_challenge_method").notNull(),
    scope: text("scope").notNull(),
    userId: text("user_id").notNull(),
    userEmail: text("user_email").notNull(),
    resource: text("resource"),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"),
  },
  (table) => [index("mcp_auth_codes_expires_idx").on(table.expiresAt)]
);

// Operator-editable configuration, so things like the bank account a
// customer is told to transfer to can be corrected from the console instead
// of a redeploy.
//
// A key/value shape rather than a column per setting: these are read one
// group at a time by code that already knows what it is looking for, and a
// new setting should not need a migration. Values are stored as text and
// parsed by the reader (src/lib/server/settings.ts), which owns the
// defaults — a missing row means "never configured", not an error.
//
// SECRETS DO NOT BELONG HERE. The SePay webhook secret, the Lemon Squeezy
// API key and JWT_SECRET stay Worker secrets: this table is readable by
// every admin and is dumped into backups, and its whole point is being
// editable from a web form. What lives here is configuration a customer
// sees anyway — the bank details printed on their transfer QR.
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by"), // admin email, for audit
});
