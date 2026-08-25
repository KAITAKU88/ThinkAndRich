import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { MCP_SCOPE, getOAuthClient, issueAuthCode, redirectUriAllowed } from "@/lib/server/mcp-oauth";

// The approval step itself. Only ever reached by a POST from the consent
// screen, and only an ADMIN session can mint a code — this is the one gate
// standing between an anonymous registered client and a working token.

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) {
    return NextResponse.json({ ok: false, message: "Chỉ quản trị viên mới được ủy quyền." }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, message: "Yêu cầu không hợp lệ." }, { status: 400 });

  const get = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value : "";
  };

  const clientId = get("client_id");
  const redirectUri = get("redirect_uri");
  const state = get("state");
  const codeChallenge = get("code_challenge");
  const codeChallengeMethod = get("code_challenge_method") || "S256";
  const resource = get("resource");

  const client = await getOAuthClient(ctx.env.DB, clientId);
  if (!client || !redirectUriAllowed(client, redirectUri)) {
    // Never redirect to an unverified URI — report in place instead.
    return NextResponse.json({ ok: false, message: "client_id hoặc redirect_uri không hợp lệ." }, { status: 400 });
  }

  const target = new URL(redirectUri);
  if (codeChallengeMethod !== "S256" || !codeChallenge) {
    target.searchParams.set("error", "invalid_request");
    target.searchParams.set("error_description", "PKCE with S256 is required.");
    if (state) target.searchParams.set("state", state);
    return NextResponse.redirect(target, 303);
  }

  const code = await issueAuthCode(ctx.env.DB, {
    clientId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    scope: MCP_SCOPE,
    userId: ctx.session.sub,
    userEmail: ctx.session.email,
    resource: resource || null,
  });

  target.searchParams.set("code", code);
  if (state) target.searchParams.set("state", state);
  return NextResponse.redirect(target, 303);
}
