import { NextResponse } from "next/server";

/** Root — API service index (no public UI). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "think-and-rich-api",
    docs: "/api/stats",
    endpoints: {
      health: "GET /api/stats",
      posts: "GET /api/posts",
      auth: "POST /api/auth/request-otp, POST /api/auth/verify-otp",
      mcp: "POST /api/mcp",
      mcpOAuth: "GET /.well-known/oauth-authorization-server",
      admin: "GET /api/admin/* (ADMIN session required)",
    },
  });
}
