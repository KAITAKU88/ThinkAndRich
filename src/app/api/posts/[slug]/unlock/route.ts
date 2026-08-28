import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import { posts } from "@/db/schema";
import { requireSession } from "@/lib/api-auth";
import { rowToPost } from "@/lib/server/post-row";
import { unlockPost } from "@/lib/server/access-control";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await requireSession(request);
  if (!ctx) {
    return NextResponse.json(
      { ok: false, reason: "AUTH_REQUIRED", message: "Vui lòng đăng nhập để mở khóa bài viết." },
      { status: 401 }
    );
  }

  const { env } = getCloudflareContext();
  const db = drizzle(env.DB);
  const row = await db
    .select()
    .from(posts)
    .where(or(eq(posts.slug, slug), eq(posts.id, slug)))
    .get();

  if (!row || row.status !== "PUBLISHED") {
    return NextResponse.json({ ok: false, message: "Không tìm thấy bài viết." }, { status: 404 });
  }

  const post = rowToPost(row);
  const result = await unlockPost(db, post, ctx.session.sub);

  if (!result.ok) {
    const status = result.reason === "INSUFFICIENT_CREDITS" ? 402 : 403;
    const message =
      result.reason === "INSUFFICIENT_CREDITS"
        ? `Không đủ credit. Cần ${result.creditCost}C, hiện có ${result.available ?? 0}C.`
        : "Không mở khóa được bài viết.";
    return NextResponse.json({ ...result, message }, { status });
  }

  return NextResponse.json({
    ok: true,
    giftSpent: result.giftSpent,
    paidSpent: result.paidSpent,
    totalCredits: result.totalCredits,
    giftCreditBalance: result.giftCreditBalance,
    paidCreditBalance: result.paidCreditBalance,
    post: { ...post },
  });
}
