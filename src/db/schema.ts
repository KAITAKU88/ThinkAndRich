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
