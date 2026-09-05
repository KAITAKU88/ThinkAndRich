import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/api-auth";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";
import { MCP_SCOPE, getOAuthClient, issueAuthCode, redirectUriAllowed } from "@/lib/server/mcp-oauth";
import {
  mcpConsentApproveHtml,
  mcpConsentErrorHtml,
  mcpConsentLoginHtml,
} from "@/lib/server/mcp-consent-html";

function param(url: URL, key: string): string {
  return url.searchParams.get(key) ?? "";
}

/** OAuth consent screen (plain HTML, no React UI). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const clientId = param(url, "client_id");
  const redirectUri = param(url, "redirect_uri");
  const responseType = param(url, "response_type");
  const codeChallenge = param(url, "code_challenge");
  const codeChallengeMethod = param(url, "code_challenge_method") || "S256";
  const state = param(url, "state");
  const resource = param(url, "resource");

  if (!clientId || !redirectUri) {
    return new NextResponse(mcpConsentErrorHtml("Yêu cầu không hợp lệ", "Thiếu client_id hoặc redirect_uri."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (responseType && responseType !== "code") {
    return new NextResponse(mcpConsentErrorHtml("Không hỗ trợ", "Chỉ hỗ trợ response_type=code."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return new NextResponse(
      mcpConsentErrorHtml("Thiếu bảo vệ PKCE", "Ứng dụng phải gửi code_challenge với code_challenge_method=S256."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const { env } = getCloudflareContext();
  const client = await getOAuthClient(env.DB, clientId);
  if (!client) {
    return new NextResponse(mcpConsentErrorHtml("Ứng dụng chưa đăng ký", "Không tìm thấy client_id này."), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (!redirectUriAllowed(client, redirectUri)) {
    return new NextResponse(
      mcpConsentErrorHtml("redirect_uri không khớp", "Địa chỉ chuyển hướng không nằm trong danh sách đã đăng ký."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token, env.JWT_SECRET) : null;
  if (!session || session.role !== "ADMIN") {
    return new NextResponse(mcpConsentLoginHtml(), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const html = mcpConsentApproveHtml({
    clientName: client.name,
    adminEmail: session.email,
    clientId,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
    resource,
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Approve OAuth authorization — mint auth code and redirect. */
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
