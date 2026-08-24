import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { posts, shareLogs } from "@/db/schema";
import { verifySession, SESSION_COOKIE } from "@/lib/session-token";

// `posts.shares` is the fast denormalized total (bumped for anonymous
// shares too); `share_logs` only gets a row when a session exists, so the
// admin Users table can show a real per-user share count.
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);

  const post = await db.select({ id: posts.id, shares: posts.shares }).from(posts).where(eq(posts.slug, slug)).get();
  if (!post) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy bài viết." }, { status: 404 });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token, env.JWT_SECRET) : null;

  await db.batch([
    db.update(posts).set({ shares: post.shares + 1 }).where(eq(posts.id, post.id)),
    db.insert(shareLogs).values({
      id: crypto.randomUUID(),
      userId: session?.sub ?? null,
      postId: post.id,
      sharedAt: new Date().toISOString(),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
