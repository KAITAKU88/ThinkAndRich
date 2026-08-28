import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { promotions } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { isCreditPackageId } from "@/lib/credit-packages";
import { normalizePromoCode } from "@/lib/server/promotions";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    code?: string;
    name?: string;
    kind?: "percent" | "fixed";
    discountPercent?: number;
    discountAmountVnd?: number;
    packageIds?: string[] | null;
    maxUses?: number | null;
    startsAt?: string | null;
    endsAt?: string | null;
    active?: boolean;
  } | null;

  const patch: Record<string, unknown> = {};
  if (body?.code) patch.code = normalizePromoCode(body.code);
  if (body?.name?.trim()) patch.name = body.name.trim();
  if (body?.kind === "percent" || body?.kind === "fixed") {
    patch.kind = body.kind;
    patch.discountPercent = body.kind === "percent" ? Math.min(100, Math.max(0, body.discountPercent ?? 0)) : null;
    patch.discountAmountVnd = body.kind === "fixed" ? Math.max(0, body.discountAmountVnd ?? 0) : null;
  }
  if (body?.packageIds !== undefined) {
    if (!body.packageIds?.length) patch.packageIds = null;
    else {
      const ids = body.packageIds.filter(isCreditPackageId);
      patch.packageIds = JSON.stringify(ids);
    }
  }
  if (body?.maxUses !== undefined) patch.maxUses = body.maxUses;
  if (body?.startsAt !== undefined) patch.startsAt = body.startsAt;
  if (body?.endsAt !== undefined) patch.endsAt = body.endsAt;
  if (body?.active !== undefined) patch.active = body.active ? 1 : 0;

  const db = drizzle(ctx.env.DB);
  await db.update(promotions).set(patch).where(eq(promotions.id, id));

  return NextResponse.json({ ok: true, message: "Đã cập nhật mã giảm giá." });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(_request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = drizzle(ctx.env.DB);
  await db.delete(promotions).where(eq(promotions.id, id));

  return NextResponse.json({ ok: true, message: "Đã xóa mã giảm giá." });
}
