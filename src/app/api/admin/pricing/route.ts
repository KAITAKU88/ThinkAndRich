import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { pricingRefreshSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { loadAllMarketPricing } from "@/lib/server/market-pricing";
import { applyPriceRefresh, previewPriceRefresh } from "@/lib/server/pricing-refresh";
import { readMaintenanceFromKv, setMaintenance, DISABLED_MAINTENANCE } from "@/lib/server/maintenance";

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const db = drizzle(ctx.env.DB);
  const markets = await loadAllMarketPricing(db);
  const settings = await db.select().from(pricingRefreshSettings).where(eq(pricingRefreshSettings.id, "default")).get();
  const maintenance = await readMaintenanceFromKv(ctx.env.OTP_KV);
  return NextResponse.json({ ok: true, markets, settings, maintenance });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | {
        action?: "preview" | "apply" | "save-settings" | "maintenance-on" | "maintenance-off";
        mode?: "AUTO" | "MANUAL";
        intervalDays?: number;
        messageVi?: string;
        messageEn?: string;
      }
    | null;

  const db = drizzle(ctx.env.DB);

  if (body?.action === "preview") {
    return NextResponse.json({ ok: true, diffs: await previewPriceRefresh(db) });
  }

  if (body?.action === "apply") {
    const result = await applyPriceRefresh(db, ctx.env.OTP_KV, ctx.session.email, "manual");
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  }

  if (body?.action === "save-settings") {
    const intervalDays = Math.max(30, body.intervalDays ?? 90);
    const mode = body.mode === "AUTO" ? "AUTO" : "MANUAL";
    const existing = await db.select().from(pricingRefreshSettings).where(eq(pricingRefreshSettings.id, "default")).get();
    const nextRunAt =
      mode === "AUTO" && (!existing?.nextRunAt || new Date(existing.nextRunAt).getTime() <= Date.now())
        ? new Date(Date.now() + intervalDays * 86_400_000).toISOString()
        : existing?.nextRunAt ?? null;
    await db
      .insert(pricingRefreshSettings)
      .values({
        id: "default",
        mode,
        intervalDays,
        scheduledHourUtc: existing?.scheduledHourUtc ?? 3,
        lastRunAt: existing?.lastRunAt ?? null,
        nextRunAt,
      })
      .onConflictDoUpdate({
        target: pricingRefreshSettings.id,
        set: { mode, intervalDays, nextRunAt },
      });
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "maintenance-on") {
    await setMaintenance(db, ctx.env.OTP_KV, {
      enabled: true,
      enabledAt: new Date().toISOString(),
      enabledBy: ctx.session.email,
      reason: "manual",
      messageVi: body.messageVi?.trim() || "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
      messageEn: body.messageEn?.trim() || "The site is under maintenance. Please try again later.",
    });
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "maintenance-off") {
    await setMaintenance(db, ctx.env.OTP_KV, DISABLED_MAINTENANCE);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
}
