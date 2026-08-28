import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { promotions } from "@/db/schema";
import { isCreditPackageId } from "@/lib/credit-packages";
import type { CreditPackageId } from "@/lib/types";

export interface PromotionRow {
  id: string;
  code: string;
  name: string;
  kind: "percent" | "fixed";
  discountPercent: number | null;
  discountAmountVnd: number | null;
  packageIds: string | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: number;
}

export interface AppliedPromotion {
  promotion: PromotionRow;
  discountAmount: number;
  finalAmount: number;
}

function parsePackageIds(raw: string | null): CreditPackageId[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const ids = parsed.filter(isCreditPackageId);
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function findPromotionByCode(db: DrizzleD1Database, code: string) {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;
  const row = await db.select().from(promotions).where(eq(promotions.code, normalized)).get();
  return row ?? null;
}

export function applyPromotionToAmount(
  promotion: PromotionRow,
  packageId: CreditPackageId,
  listAmount: number,
  now: Date = new Date()
): { ok: true; result: AppliedPromotion } | { ok: false; message: string } {
  if (!promotion.active) {
    return { ok: false, message: "Mã giảm giá không còn hiệu lực." };
  }

  const allowedPackages = parsePackageIds(promotion.packageIds);
  if (allowedPackages && !allowedPackages.includes(packageId)) {
    return { ok: false, message: "Mã này không áp dụng cho gói credit đã chọn." };
  }

  if (promotion.startsAt && new Date(promotion.startsAt) > now) {
    return { ok: false, message: "Mã giảm giá chưa bắt đầu." };
  }
  if (promotion.endsAt && new Date(promotion.endsAt) < now) {
    return { ok: false, message: "Mã giảm giá đã hết hạn." };
  }
  if (promotion.maxUses != null && promotion.usedCount >= promotion.maxUses) {
    return { ok: false, message: "Mã giảm giá đã hết lượt sử dụng." };
  }

  let discountAmount = 0;
  if (promotion.kind === "percent") {
    const pct = Math.min(100, Math.max(0, promotion.discountPercent ?? 0));
    discountAmount = Math.round((listAmount * pct) / 100);
  } else {
    discountAmount = Math.min(listAmount, Math.max(0, promotion.discountAmountVnd ?? 0));
  }

  const finalAmount = Math.max(0, listAmount - discountAmount);

  return {
    ok: true,
    result: {
      promotion: promotion as PromotionRow,
      discountAmount,
      finalAmount,
    },
  };
}

export async function validatePromotion(
  db: DrizzleD1Database,
  code: string,
  packageId: CreditPackageId,
  listAmount: number,
  now: Date = new Date()
) {
  const promotion = await findPromotionByCode(db, code);
  if (!promotion) {
    return { ok: false as const, message: "Mã giảm giá không hợp lệ." };
  }
  return applyPromotionToAmount(promotion as PromotionRow, packageId, listAmount, now);
}
