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

  // 0 = Open (no login). 1–5 = credits charged to unlock permanently.
  creditCost: integer("credit_cost").notNull().default(0),
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

// Editorially curated reading paths. `position` preserves the order chosen
// in the console; a composite primary key prevents the same destination from
// appearing twice under one article. The application caps each source at
// three rows so this stays a focused continuation, not another feed.
export const postRelations = sqliteTable(
  "post_relations",
  {
    sourcePostId: text("source_post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    relatedPostId: text("related_post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.sourcePostId, table.relatedPostId] }),
    uniqueIndex("post_relations_source_position_idx").on(table.sourcePostId, table.position),
    index("post_relations_related_post_idx").on(table.relatedPostId),
  ]
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  countryCode: text("country_code"),
  preferredLang: text("preferred_lang"),
  createdAt: text("created_at").notNull(),
  lastLoginAt: text("last_login_at").notNull(),

  // Paid credits: one rolling balance, one shared expiry. Every purchase
  // adds to the balance and overwrites expires_at to now+365d.
  paidCreditBalance: integer("paid_credit_balance").notNull().default(0),
  paidCreditExpiresAt: text("paid_credit_expires_at"),

  // Gift credits: 5/day, no rollover, 30/month cap. Applied lazily on read.
  giftCreditBalance: integer("gift_credit_balance").notNull().default(0),
  giftCreditDate: text("gift_credit_date"),
  giftGrantedThisMonth: integer("gift_granted_this_month").notNull().default(0),
  giftMonth: text("gift_month"),
});

// Permanent unlocks. Independent of credit balance and paid-credit expiry —
// a post stays readable even after the credits that paid for it expire.
export const userUnlocks = sqliteTable(
  "user_unlocks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    unlockedAt: text("unlocked_at").notNull(),
    creditsSpent: integer("credits_spent").notNull(),
    giftSpent: integer("gift_spent").notNull().default(0),
    paidSpent: integer("paid_spent").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("user_unlocks_user_id_idx").on(table.userId),
    index("user_unlocks_unlocked_at_idx").on(table.unlockedAt),
  ]
);

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

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gateway: text("gateway", { enum: ["sepay", "paddle"] }).notNull(),
    packageId: text("package_id", { enum: ["pack_1", "pack_2", "pack_3"] }).notNull(),
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
    uniqueIndex("orders_gateway_reference_idx").on(table.gatewayReference),
    index("orders_user_id_idx").on(table.userId),
  ]
);

export const postTranslations = sqliteTable(
  "post_translations",
  {
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    title: text("title").notNull(),
    summarySnippet: text("summary_snippet").notNull(),
    fullContent: text("full_content").notNull(),
    academicFormula: text("academic_formula"),
    keyTakeaways: text("key_takeaways"),
    tags: text("tags"),
    status: text("status", { enum: ["DRAFT", "PUBLISHED"] }).notNull().default("DRAFT"),
    translatedBy: text("translated_by"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("post_translations_post_language_idx").on(table.postId, table.language),
    index("post_translations_language_idx").on(table.language),
  ]
);

export const mcpTokens = sqliteTable(
  "mcp_tokens",
  {
    id: text("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    tokenPrefix: text("token_prefix").notNull(),
    label: text("label").notNull(),
    kind: text("kind", { enum: ["MANUAL", "OAUTH"] }).notNull().default("MANUAL"),
    createdBy: text("created_by").notNull(),
    clientId: text("client_id"),
    scope: text("scope").notNull().default("mcp"),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at"),
    lastUsedAt: text("last_used_at"),
    revokedAt: text("revoked_at"),
  },
  (table) => [index("mcp_tokens_revoked_idx").on(table.revokedAt)]
);

export const mcpOauthClients = sqliteTable("mcp_oauth_clients", {
  id: text("id").primaryKey(),
  secretHash: text("secret_hash"),
  name: text("name").notNull(),
  redirectUris: text("redirect_uris").notNull(),
  createdAt: text("created_at").notNull(),
});

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

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by"),
});

// Login / recovery codes. D1 is strongly consistent; the previous KV store
// was not, so a code emailed in one colo was often invisible to verify in
// another for up to a minute — the user saw "OTP hết hạn hoặc không chính xác".
export const authOtps = sqliteTable(
  "auth_otps",
  {
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.email, table.code] }),
    index("auth_otps_expires_idx").on(table.expiresAt),
  ]
);

export const marketPricing = sqliteTable(
  "market_pricing",
  {
    countryCode: text("country_code").notNull(),
    packageId: text("package_id").notNull(),
    fxRatePerVnd: text("fx_rate_per_vnd").notNull(),
    pppMultiplier: text("ppp_multiplier").notNull(),
    computedPrice: integer("computed_price").notNull(),
    currency: text("currency").notNull(),
    updatedAt: text("updated_at").notNull(),
    updatedBy: text("updated_by").notNull(),
    source: text("source", { enum: ["auto", "manual"] }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.countryCode, table.packageId] })]
);

export const pricingRefreshSettings = sqliteTable("pricing_refresh_settings", {
  id: text("id").primaryKey(),
  mode: text("mode", { enum: ["AUTO", "MANUAL"] }).notNull().default("MANUAL"),
  intervalDays: integer("interval_days").notNull().default(90),
  scheduledHourUtc: integer("scheduled_hour_utc").notNull().default(3),
  lastRunAt: text("last_run_at"),
  nextRunAt: text("next_run_at"),
});

export const pricingRefreshLog = sqliteTable("pricing_refresh_log", {
  id: text("id").primaryKey(),
  triggeredBy: text("triggered_by").notNull(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  status: text("status", { enum: ["SUCCESS", "FAILED", "CANCELLED"] }).notNull(),
  diff: text("diff"),
  error: text("error"),
});

export const maintenanceMode = sqliteTable("maintenance_mode", {
  id: text("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  enabledAt: text("enabled_at"),
  enabledBy: text("enabled_by"),
  reason: text("reason", { enum: ["pricing_refresh", "manual"] }),
  messageVi: text("message_vi"),
  messageEn: text("message_en"),
});
