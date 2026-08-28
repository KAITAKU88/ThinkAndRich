import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PILLAR_COUNT, LANGUAGE_COUNT } from "@/lib/site-config";
import { getPublicPostStats } from "@/lib/server/public-posts";

export async function GET() {
  const { env } = getCloudflareContext();
  const postStats = await getPublicPostStats(env.DB);

  return NextResponse.json({
    ok: true,
    stats: {
      ...postStats,
      pillarCount: PILLAR_COUNT,
      languageCount: LANGUAGE_COUNT,
    },
  });
}
