import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { and, eq, like } from "drizzle-orm";
import { posts, readLogs, users } from "@/db/schema";
import { verifySession, SESSION_COOKIE } from "@/lib/session-token";

// Increments views unconditionally (even anonymous) and, when a session
// exists, records a read_logs row + updates the daily quota counter — one
// quota slot per distinct post per day, matching the store's old
// getTodayReadCount semantics (re-reading the same article today must not
// burn a second slot).
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token, env.JWT_SECRET) : null;

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) {
    return NextResponse.json({ ok: false, message: "Không tìm thấy bài viết." }, { status: 404 });
  }

  await db.update(posts).set({ views: post.views + 1 }).where(eq(posts.id, post.id));

  if (session) {
    const today = new Date().toISOString().slice(0, 10);
    const alreadyReadToday = await db
      .select({ id: readLogs.id })
      .from(readLogs)
      .where(
        and(eq(readLogs.userId, session.sub), eq(readLogs.postId, post.id), like(readLogs.readAt, `${today}%`))
      )
      .get();

    const now = new Date().toISOString();
    const user = await db.select().from(users).where(eq(users.id, session.sub)).get();

    if (user) {
      const insertLog = db.insert(readLogs).values({
        id: crypto.randomUUID(),
        userId: session.sub,
        userEmail: session.email,
        userName: user.name,
        postId: post.id,
        postTitle: post.title,
        pillar: post.pillar,
        postCategory: post.category,
        readAt: now,
        reaction: null,
      });

      if (!alreadyReadToday) {
        const nextCount = user.dailyReadsDate === today ? user.dailyReadsCount + 1 : 1;
        await db.batch([
          insertLog,
          db.update(users).set({ dailyReadsDate: today, dailyReadsCount: nextCount }).where(eq(users.id, user.id)),
        ]);
      } else {
        await insertLog;
      }
    }
  }

  return NextResponse.json({ ok: true });
}
