import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { createMcpToken, listMcpTokens, revokeMcpToken } from "@/lib/server/mcp-tokens";

// Admin management for MCP credentials. The plaintext key is returned by POST
// and never again — the table only holds its digest (see mcp-tokens.ts).

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const keys = await listMcpTokens(ctx.env.DB);
  return NextResponse.json({ ok: true, keys });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { label?: string; expiresInDays?: number };
  const label = body.label?.trim();
  if (!label) {
    return NextResponse.json({ ok: false, message: "Cần đặt tên cho key." }, { status: 400 });
  }

  let expiresAt: string | null = null;
  if (typeof body.expiresInDays === "number" && body.expiresInDays > 0) {
    expiresAt = new Date(Date.now() + body.expiresInDays * 86_400_000).toISOString();
  }

  const { record, plaintext } = await createMcpToken(ctx.env.DB, {
    label,
    createdBy: ctx.session.email,
    expiresAt,
  });

  return NextResponse.json({ ok: true, key: record, plaintext });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, message: "Thiếu id." }, { status: 400 });

  const revoked = await revokeMcpToken(ctx.env.DB, id);
  if (!revoked) {
    return NextResponse.json({ ok: false, message: "Key không tồn tại hoặc đã bị thu hồi." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
