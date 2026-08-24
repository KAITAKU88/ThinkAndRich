// Generates a SQL file from the mock SEED_POSTS/SEED_USERS/SEED_READ_LOGS
// (src/lib/data.ts) and loads it into D1 — both the local simulated copy
// and the real remote database — via `wrangler d1 execute`.
//
// Usage: npx tsx scripts/seed-d1.ts

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SEED_POSTS, SEED_USERS, SEED_READ_LOGS } from "../src/lib/data";

const DB_NAME = "thinkandrich-db";

// SQLite string-literal escaping: double up single quotes. NULL for
// null/undefined, numbers/booleans passed through unquoted.
function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insert(table: string, columns: string[], rows: unknown[][]): string {
  if (rows.length === 0) return "";
  const values = rows
    .map((row) => `(${row.map(sqlValue).join(", ")})`)
    .join(",\n  ");
  return `INSERT INTO ${table} (${columns.join(", ")})\nVALUES\n  ${values};\n`;
}

const statements: string[] = [];

statements.push(
  insert(
    "posts",
    [
      "id", "slug", "title", "pillar", "category", "display_size",
      "academic_formula", "summary_snippet", "full_content", "schematic_svg",
      "key_takeaways", "access_level", "reading_time_minutes", "status",
      "views", "likes", "dislikes", "author", "tags", "created_at", "updated_at",
    ],
    SEED_POSTS.map((p) => [
      p.id, p.slug, p.title, p.pillar, p.category, p.displaySize,
      p.academicFormula ?? null, p.summarySnippet, p.fullContent, p.schematicSvg ?? null,
      p.keyTakeaways ? JSON.stringify(p.keyTakeaways) : null,
      p.accessLevel, p.readingTimeMinutes, p.status,
      p.views, p.likes, p.dislikes, p.author,
      p.tags ? JSON.stringify(p.tags) : null, p.createdAt, p.updatedAt,
    ])
  )
);

statements.push(
  insert(
    "users",
    [
      "id", "email", "name", "role", "tier", "avatar", "country_code",
      "preferred_lang", "created_at", "last_login_at", "daily_reads_date",
      "daily_reads_count",
    ],
    SEED_USERS.map((u) => [
      u.id, u.email, u.name, u.role, u.tier, u.avatar ?? null,
      u.countryCode ?? null, u.preferredLang ?? null, u.createdAt, u.lastLoginAt,
      u.dailyReads?.date ?? null, u.dailyReads?.count ?? 0,
    ])
  )
);

const bookmarkRows: unknown[][] = [];
const reactionRows: unknown[][] = [];
for (const u of SEED_USERS) {
  for (const postId of u.bookmarkedPosts ?? []) {
    bookmarkRows.push([u.id, postId, u.lastLoginAt]);
  }
  for (const postId of u.likedPosts ?? []) {
    reactionRows.push([u.id, postId, "like", u.lastLoginAt]);
  }
  for (const postId of u.dislikedPosts ?? []) {
    reactionRows.push([u.id, postId, "dislike", u.lastLoginAt]);
  }
}
statements.push(insert("bookmarks", ["user_id", "post_id", "created_at"], bookmarkRows));
statements.push(insert("reactions", ["user_id", "post_id", "type", "created_at"], reactionRows));

statements.push(
  insert(
    "read_logs",
    [
      "id", "user_id", "user_email", "user_name", "post_id", "post_title",
      "pillar", "post_category", "read_at", "reaction",
    ],
    SEED_READ_LOGS.map((l) => [
      l.id, l.userId, l.userEmail, l.userName, l.postId, l.postTitle,
      l.pillar ?? null, l.postCategory ?? null, l.readAt, l.reaction ?? null,
    ])
  )
);

const sql = statements.filter(Boolean).join("\n");
const tmpFile = path.join(mkdtempSync(path.join(tmpdir(), "thinkandrich-seed-")), "seed.sql");
writeFileSync(tmpFile, sql);

console.log(`Seed SQL written to ${tmpFile} (${SEED_POSTS.length} posts, ${SEED_USERS.length} users)`);

for (const target of ["--local", "--remote"]) {
  console.log(`\n=== wrangler d1 execute ${target} ===`);
  execFileSync(
    "npx",
    ["wrangler", "d1", "execute", DB_NAME, target, `--file=${tmpFile}`],
    { stdio: "inherit", env: { ...process.env, CI: "true" } }
  );
}
