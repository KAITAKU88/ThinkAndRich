import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

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
