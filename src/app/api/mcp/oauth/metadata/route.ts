import { NextResponse, type NextRequest } from "next/server";
import { authorizationServerMetadata, protectedResourceMetadata } from "@/lib/server/mcp-oauth";

// Both discovery documents are served from here and mapped onto their
// /.well-known/* URLs by rewrites in next.config.ts — Next's App Router will
// not route a directory whose name starts with a dot.
//
// `?doc=` picks which document to render; the rewrite supplies it.
export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const doc = request.nextUrl.searchParams.get("doc");

  const body =
    doc === "protected-resource" ? protectedResourceMetadata(origin) : authorizationServerMetadata(origin);

  return NextResponse.json(body, {
    headers: {
      // Discovery is public and stable; let clients and the edge cache it.
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
