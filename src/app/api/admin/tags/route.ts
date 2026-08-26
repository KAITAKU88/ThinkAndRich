import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { isNotNull } from "drizzle-orm";
import { posts } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { normalizeTag } from "@/lib/tags";

// Every tag already in use, so the editor can offer them back.
//
// The point is not convenience — it is that "Ra quyết định" and "Ra Quyết
// Định" should not both exist. Seeing what is already there is what stops a
// near-duplicate being coined, and there is no other place in the console
// that shows the tag vocabulary.
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const db = drizzle(ctx.env.DB);
  const rows = await db
    .select({ tags: posts.tags })
    .from(posts)
    .where(isNotNull(posts.tags))
    .all();

  // Tags are JSON text on the row (SQLite has no array type), and a row
  // written before the column existed can hold anything — so parse
  // defensively rather than trusting the column.
  const byNormalized = new Map<string, string>();
  for (const row of rows) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(row.tags ?? "[]");
    } catch {
      continue;
    }
    if (!Array.isArray(parsed)) continue;

    for (const tag of parsed) {
      if (typeof tag !== "string" || !tag.trim()) continue;
      // First spelling seen wins, so the list shows a real existing label
      // rather than a normalised one nobody typed.
      byNormalized.set(normalizeTag(tag), tag.trim());
    }
  }

  const tags = [...byNormalized.values()].sort((a, b) => a.localeCompare(b, "vi"));
  return NextResponse.json({ ok: true, tags });
}
