import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { marketPricing, pricingRefreshLog, pricingRefreshSettings } from "@/db/schema";
import {
  CREDIT_PACKAGES,
  computePackagePrice,
  getMarket,
} from "@/lib/credit-packages";
import type { CountryCode, CreditPackageId } from "@/lib/types";
import { DISABLED_MAINTENANCE, setMaintenance } from "@/lib/server/maintenance";

const COUNTRIES: CountryCode[] = ["VN", "US", "EU", "JP", "KR", "TW", "CN", "DEFAULT"];
const REFRESH_TIMEOUT_MS = 10 * 60 * 1000;

export interface PriceDiff {
  countryCode: CountryCode;
  packageId: CreditPackageId;
  from: number;
  to: number;
}

export function computeRefreshDiffs(
  existing: { countryCode: string; packageId: string; computedPrice: number }[]
): PriceDiff[] {
  // FX/PPP providers are still unspecified (CREDIT_PRICING_MODEL.md §11).
  // A refresh recomputes from the documented reference rates until those
  // feeds are wired in — so this is a real apply path, not a stub, just
  // using the same source the seed used.
  const current = new Map(existing.map((r) => [`${r.countryCode}:${r.packageId}`, r.computedPrice]));
  const diffs: PriceDiff[] = [];
  for (const country of COUNTRIES) {
    for (const pack of CREDIT_PACKAGES) {
      const next = computePackagePrice(pack.vndPrice, country);
      const prev = current.get(`${country}:${pack.id}`);
      diffs.push({
        countryCode: country,
        packageId: pack.id,
        from: prev ?? next,
        to: next,
      });
    }
  }
  return diffs;
}

export async function previewPriceRefresh(db: DrizzleD1Database): Promise<PriceDiff[]> {
  const existing = await db.select().from(marketPricing).all();
  return computeRefreshDiffs(existing);
}

export async function applyPriceRefresh(
  db: DrizzleD1Database,
  kv: KVNamespace | undefined,
  triggeredBy: string,
  source: "auto" | "manual"
): Promise<{ ok: true; diffs: PriceDiff[] } | { ok: false; error: string }> {
  const started = new Date();
  const logId = `prf_${crypto.randomUUID()}`;

  await db.insert(pricingRefreshLog).values({
    id: logId,
    triggeredBy,
    startedAt: started.toISOString(),
    finishedAt: null,
    status: "SUCCESS",
    diff: null,
    error: null,
  });

  await setMaintenance(db, kv, {
    enabled: true,
    enabledAt: started.toISOString(),
    enabledBy: triggeredBy,
    reason: "pricing_refresh",
    messageVi: "Hệ thống đang cập nhật bảng giá. Vui lòng quay lại sau ít phút.",
    messageEn: "Prices are being refreshed. Please try again in a few minutes.",
  });

  try {
    const existing = await db.select().from(marketPricing).all();
    const nowIso = new Date().toISOString();

    if (Date.now() - started.getTime() > REFRESH_TIMEOUT_MS) {
      throw new Error("Pricing refresh exceeded 10 minutes");
    }

    const diffs = computeRefreshDiffs(existing).filter((d) => d.from !== d.to);

    const rows = COUNTRIES.flatMap((country) => {
      const market = getMarket(country);
      return CREDIT_PACKAGES.map((pack) => {
        const next = computePackagePrice(pack.vndPrice, country);
        return {
          countryCode: country,
          packageId: pack.id,
          fxRatePerVnd: String(market.fxVndPerUnit),
          pppMultiplier: String(market.pppMultiplier),
          computedPrice: next,
          currency: market.currency,
          updatedAt: nowIso,
          updatedBy: triggeredBy,
          source,
        };
      });
    });

    for (const row of rows) {
      await db
        .insert(marketPricing)
        .values(row)
        .onConflictDoUpdate({
          target: [marketPricing.countryCode, marketPricing.packageId],
          set: {
            fxRatePerVnd: row.fxRatePerVnd,
            pppMultiplier: row.pppMultiplier,
            computedPrice: row.computedPrice,
            currency: row.currency,
            updatedAt: row.updatedAt,
            updatedBy: row.updatedBy,
            source: row.source,
          },
        });
    }

    const settings = await db.select().from(pricingRefreshSettings).where(eq(pricingRefreshSettings.id, "default")).get();
    const intervalDays = Math.max(30, settings?.intervalDays ?? 90);
    const nextRun = new Date(started.getTime() + intervalDays * 86_400_000).toISOString();
    await db
      .update(pricingRefreshSettings)
      .set({ lastRunAt: nowIso, nextRunAt: nextRun })
      .where(eq(pricingRefreshSettings.id, "default"));

    await db
      .update(pricingRefreshLog)
      .set({ finishedAt: nowIso, status: "SUCCESS", diff: JSON.stringify(diffs) })
      .where(eq(pricingRefreshLog.id, logId));

    await setMaintenance(db, kv, DISABLED_MAINTENANCE);
    return { ok: true, diffs };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown refresh error";
    await db
      .update(pricingRefreshLog)
      .set({ finishedAt: new Date().toISOString(), status: "FAILED", error: message })
      .where(eq(pricingRefreshLog.id, logId));
    await setMaintenance(db, kv, DISABLED_MAINTENANCE);
    return { ok: false, error: message };
  }
}

export async function runDuePricingRefresh(
  db: DrizzleD1Database,
  kv: KVNamespace | undefined
): Promise<"skipped" | "ran" | "failed"> {
  const settings = await db.select().from(pricingRefreshSettings).where(eq(pricingRefreshSettings.id, "default")).get();
  if (!settings || settings.mode !== "AUTO") return "skipped";
  if (settings.nextRunAt && new Date(settings.nextRunAt).getTime() > Date.now()) return "skipped";
  const result = await applyPriceRefresh(db, kv, "cron", "auto");
  return result.ok ? "ran" : "failed";
}
