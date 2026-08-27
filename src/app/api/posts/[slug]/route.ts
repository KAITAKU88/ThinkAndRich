import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { eq, or } from "drizzle-orm";
import { posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { requireSession } from "@/lib/api-auth";
import { checkPostAccess, truncateHtmlContent } from "@/lib/server/access-control";
import type { MembershipTier } from "@/lib/types";
import { loadPublishedRelatedPosts } from "@/lib/server/related-posts";

// Single post fetch, by slug (falling back to id for older links). This is
// the server-side enforcement point for the paywall: fullContent is only
// ever sent in full when checkPostAccess says so — otherwise it's sliced
// to a ~30% teaser before it ever reaches the client.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

  const ctx = await requireSession(request);
  const sessionUser = ctx
    ? { id: ctx.session.sub, role: ctx.session.role, tier: ctx.session.tier as MembershipTier }
    : null;

  const post = rowToPost(row);
  const access = await checkPostAccess(db, post, sessionUser);

  const responsePost = access.allowed
    ? post
    : { ...post, fullContent: truncateHtmlContent(post.fullContent, 0.3) };
  const relatedPosts = await loadPublishedRelatedPosts(db, post.id);

  return NextResponse.json({ ok: true, post: responsePost, relatedPosts, access });
}
