import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { posts } from "@/db/schema";

// Sprint B1 proof-of-life: confirms the Worker can read the real D1
// database. Nothing in the app calls this yet — the frontend still runs
// on the mock Zustand store (src/store/session.ts, src/lib/data.ts).
export async function GET() {
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);
  const rows = await db.select().from(posts).all();
  return NextResponse.json({ ok: true, count: rows.length, posts: rows });
}
