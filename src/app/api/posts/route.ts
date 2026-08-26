import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getPublicPosts } from "@/lib/server/public-posts";

// Public post listing — Home/Explore fetch from here instead of a mock
// array. Never returns `fullContent` (list cards only need the summary)
// and always forces status=PUBLISHED for these unauthenticated-safe
// results; drafts are only visible via /api/admin/posts.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pillar = searchParams.get("pillar");
  const q = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort") ?? "DATE_DESC";
  const pageSize = Math.min(Number(searchParams.get("pageSize")) || 200, 500);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const { env } = getCloudflareContext();
  const result = await getPublicPosts(env.DB, { pillar, q, sort, page, pageSize });

  return NextResponse.json({ ok: true, posts: result, page, pageSize });
}
