import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { posts } from "@/db/schema";

// Card click-through tracking, distinct from `views` (a view is a
// detail-page read; a click is just reaching the detail page). Anonymous
// OK — this is aggregate content analytics, not a per-user record.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);

  const post = await db.select({ id: posts.id, clicks: posts.clicks }).from(posts).where(eq(posts.slug, slug)).get();
  if (!post) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy bài viết." }, { status: 404 });
  }
  await db.update(posts).set({ clicks: post.clicks + 1 }).where(eq(posts.id, post.id));
  return NextResponse.json({ ok: true });
}
