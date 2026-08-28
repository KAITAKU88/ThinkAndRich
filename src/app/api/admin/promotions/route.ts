import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { desc } from "drizzle-orm";
import { promotions } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { isCreditPackageId } from "@/lib/credit-packages";
import { normalizePromoCode } from "@/lib/server/promotions";
import type { CreditPackageId } from "@/lib/types";

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const db = drizzle(ctx.env.DB);
  const rows = await db.select().from(promotions).orderBy(desc(promotions.createdAt)).all();

  return NextResponse.json({
    ok: true,
    promotions: rows.map((p) => ({
      ...p,
      packageIds: p.packageIds ? (JSON.parse(p.packageIds) as CreditPackageId[]) : null,
      active: Boolean(p.active),
    })),
  });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

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

  const code = normalizePromoCode(body?.code || "");
  const name = body?.name?.trim();
  if (!code || !name) {
    return NextResponse.json({ ok: false, message: "Mã và tên chiến dịch là bắt buộc." }, { status: 400 });
  }
  if (body?.kind !== "percent" && body?.kind !== "fixed") {
    return NextResponse.json({ ok: false, message: "Loại giảm giá không hợp lệ." }, { status: 400 });
  }

  let packageIdsJson: string | null = null;
  if (body.packageIds?.length) {
    const ids = body.packageIds.filter(isCreditPackageId);
    if (!ids.length) {
      return NextResponse.json({ ok: false, message: "Gói credit không hợp lệ." }, { status: 400 });
    }
    packageIdsJson = JSON.stringify(ids);
  }

  const now = new Date().toISOString();
  const id = `promo_${crypto.randomUUID()}`;

  const db = drizzle(ctx.env.DB);
  try {
    await db.insert(promotions).values({
      id,
      code,
      name,
      kind: body.kind,
      discountPercent: body.kind === "percent" ? Math.min(100, Math.max(0, body.discountPercent ?? 0)) : null,
      discountAmountVnd: body.kind === "fixed" ? Math.max(0, body.discountAmountVnd ?? 0) : null,
      packageIds: packageIdsJson,
      maxUses: body.maxUses ?? null,
      usedCount: 0,
      startsAt: body.startsAt || null,
      endsAt: body.endsAt || null,
      active: body.active === false ? 0 : 1,
      createdAt: now,
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Mã giảm giá đã tồn tại." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, id, message: "Đã tạo mã giảm giá." });
}
