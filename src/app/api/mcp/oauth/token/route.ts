import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { consumeAuthCode } from "@/lib/server/mcp-oauth";
import { createMcpToken } from "@/lib/server/mcp-tokens";

// Token endpoint: authorization_code + PKCE only. Redeeming a code mints a
// row in mcp_tokens with kind "OAUTH", so a token issued here shows up on the
// same admin screen — and the same revoke button — as a hand-made key.

function oauthError(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status });
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();

  // RFC 6749 requires form encoding here; some clients still send JSON.
  let params: Record<string, string> = {};
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (body) {
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === "string") params[key] = value;
      }
    }
  } else {
    const form = await request.formData().catch(() => null);
    if (form) {
      params = Object.fromEntries(
        Array.from(form.entries()).filter((entry): entry is [string, string] => typeof entry[1] === "string")
      );
    }
  }

  if (params.grant_type !== "authorization_code") {
    return oauthError("unsupported_grant_type", "Only authorization_code is supported.");
  }

  // A confidential client may authenticate with HTTP Basic instead of form
  // fields, so both are accepted.
  let clientId = params.client_id;
  let clientSecret = params.client_secret;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    try {
      const [id, secret] = atob(authHeader.slice(6)).split(":");
      clientId ||= decodeURIComponent(id);
      clientSecret ||= decodeURIComponent(secret ?? "");
    } catch {
      return oauthError("invalid_client", "Malformed Basic authorization header.", 401);
    }
  }

  const missing = ["code", "redirect_uri", "code_verifier"].filter((key) => !params[key]);
  if (!clientId) missing.push("client_id");
  if (missing.length > 0) {
    return oauthError("invalid_request", `Missing parameter(s): ${missing.join(", ")}.`);
  }

  const result = await consumeAuthCode(env.DB, {
    code: params.code,
    clientId,
    redirectUri: params.redirect_uri,
    codeVerifier: params.code_verifier,
    clientSecret,
  });

  if (!result.ok) {
    return oauthError(result.error, result.description, result.error === "invalid_client" ? 401 : 400);
  }

  const { record, plaintext } = await createMcpToken(env.DB, {
    label: `OAuth · ${result.value.userEmail}`,
    createdBy: result.value.userEmail,
    kind: "OAUTH",
    clientId: result.value.clientId,
    scope: result.value.scope,
  });

  return NextResponse.json(
    {
      access_token: plaintext,
      token_type: "Bearer",
      scope: record.scope,
    },
    { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } }
  );
}
