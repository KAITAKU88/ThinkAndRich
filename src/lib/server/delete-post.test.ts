import { describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/d1";
import { deletePostCascade } from "@/lib/server/delete-post";

// Captures the SQL drizzle hands to D1 without needing a database: the point
// under test is which tables a delete touches, not what SQLite does with it.
function recordingDb() {
  const statements: string[] = [];
  const client = {
    prepare(sql: string) {
      statements.push(sql);
      return { bind: () => ({ sql }) };
    },
    async batch() {
      return [];
    },
  } as unknown as D1Database;
  return { db: drizzle(client), statements };
}

describe("deletePostCascade", () => {
  it("clears every table keyed by a post id before the post itself", async () => {
    const { db, statements } = recordingDb();

    await deletePostCascade(db, "bai-viet-nao-do");

    // A new post-keyed table added to the schema without a line here means
    // deleting an article would strand its rows — post_translations already
    // did exactly that until this helper existed.
    for (const table of [
      "bookmarks",
      "reactions",
      "read_logs",
      "share_logs",
      "post_translations",
      "post_relations",
    ]) {
      expect(statements.some((sql) => sql.includes(`delete from "${table}"`))).toBe(true);
    }
    expect(statements.at(-1)).toContain('delete from "posts"');
  });
});
