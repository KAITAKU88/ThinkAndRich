"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  Flame,
  Lightbulb,
  Globe2,
  ShieldCheck,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";
import { getTranslation } from "@/lib/i18n/translations";
import {
  COUNTRIES_LIST,
  getPppPricing,
} from "@/lib/geo-pricing";
import { CREDIT_PACKAGES, getMarket } from "@/lib/credit-packages";
import type { CountryCode, CreditPackageId, MarketPricing } from "@/lib/types";
import { CreditCoin } from "@/components/credits/CreditCoin";


export function PricingPage() {
  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);
  const setCountryCode = useSession((s) => s.setCountryCode);

  const [showPppTable, setShowPppTable] = useState(false);
  const [markets, setMarkets] = useState<Record<CountryCode, MarketPricing> | null>(null);

  const t = getTranslation(language);
  const currentPpp = markets?.[countryCode] ?? getPppPricing(countryCode);

  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json() as Promise<{ ok: boolean; markets?: Record<CountryCode, MarketPricing> }>)
      .then((data) => {
        if (data.ok && data.markets) setMarkets(data.markets);
      })
      .catch(() => {});
  }, []);

  const packages = CREDIT_PACKAGES.map((pack, i) => {
    const price = currentPpp.packages[pack.id];
    const perCredit = pack.credits > 0 ? price.price / pack.credits : 0;
    return {
      id: pack.id,
      credits: pack.credits,
      priceFormatted: price.formatted,
      popular: i === 1,
    };
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
      {/* Header Banner */}
      <div className="text-center mb-10 max-w-3xl mx-auto space-y-4">
        <Badge className="bg-primary/15 text-primary border-none px-3.5 py-1 text-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> {t.pricing.badge}
        </Badge>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          {t.pricing.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t.pricing.subtitle}
        </p>
      </div>

      {/* GeoIP & Payment Routing Info Bar */}
      <div className="mb-12 p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex w-full md:w-auto items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                {t.pricing.detectedRegion}
              </span>
              <Badge variant="outline" className="font-bold text-xs">
                {currentPpp.flag} {currentPpp.countryName} ({currentPpp.currency})
              </Badge>
              <Badge
                className={
                  currentPpp.gateway === "sepay"
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 text-white"
                }
              >
                {currentPpp.gateway === "sepay" ? t.pricing.gatewaySepayFull : t.pricing.gatewayLemonFull}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5">
              {t.pricing.pppFactorPrefix} x{currentPpp.pppMultiplier}. {t.pricing.currencyLockSuffix}
            </p>
          </div>
        </div>

        {/* IP Simulator Switcher for Reviewing */}
        <div className="flex w-full md:w-auto flex-wrap items-center gap-2 shrink-0">
          <span className="text-muted-foreground hidden sm:inline">{t.pricing.ipSimulatorLabel}</span>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value as CountryCode)}
            className="min-w-0 flex-1 md:flex-none text-xs bg-muted border border-border rounded-xl px-2.5 py-1.5 font-medium cursor-pointer"
          >

            {COUNTRIES_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} - {c.gateway === "sepay" ? "SePay (VNĐ)" : "Paddle"}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPppTable((v) => !v)}
            className="rounded-xl text-xs"
          >
            {showPppTable ? t.pricing.hidePppTableBtn : t.pricing.showPppTableBtn}
          </Button>
        </div>
      </div>

      <div id="plans" className="grid scroll-mt-24 grid-cols-1 sm:grid-cols-3 gap-6 items-stretch mb-16">
        {packages.map((pack) => (
          <Card
            key={pack.id}
            className={cn(
              "relative flex flex-col justify-between transition-all duration-300 rounded-3xl overflow-hidden",
              pack.popular
                ? "border-2 border-primary shadow-xl bg-card z-10"
                : "border-border/80 bg-card hover:border-primary/40 shadow-sm"
            )}
          >
            {pack.popular && (
              <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white text-[11px] font-bold py-1.5 text-center uppercase tracking-wider">
                Chiết khấu tốt nhất theo số lượng
              </div>
            )}
            <CardHeader className={cn("text-center pb-4", pack.popular && "pt-8")}>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-3 bg-amber-400/15">
                <CreditCoin className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl font-display font-bold tabular-nums">
                {pack.credits.toLocaleString("vi-VN")} credit
              </CardTitle>
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                  {pack.priceFormatted}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground text-center">
              Cộng dồn vào số dư. Hạn dùng 365 ngày kể từ lần mua gần nhất.
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/50">
              {!user ? (
                <Button className="w-full rounded-full font-semibold" onClick={() => setAuthOpen(true)}>
                  Đăng nhập để mua
                </Button>
              ) : (
                <Button className="w-full rounded-full font-semibold shadow-md" size="lg" asChild>
                  <Link href={`/checkout?package=${pack.id}`}>Mua gói này</Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FULL PPP COMPARISON TABLE (SECTION 4 OF PRD) */}
      {showPppTable && (
        <div className="mb-16 rounded-3xl border border-border/80 bg-card p-6 shadow-sm overflow-hidden animate-in fade-in-50">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-bold">
              {t.pricing.pppTableTitle}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {t.pricing.pppTableDesc}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 font-semibold text-foreground">
                  <th className="p-3">{t.pricing.colMarket}</th>
                  <th className="p-3">{t.pricing.colGateway}</th>
                  <th className="p-3">1.500C</th>
                  <th className="p-3">4.500C</th>
                  <th className="p-3">10.000C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(COUNTRIES_LIST.map((c) => c.code) as CountryCode[]).map((code) => {
                  const row = markets?.[code] ?? getMarket(code);
                  const prices = markets?.[code]?.packages ?? getPppPricing(code).packages;
                  return (
                  <tr
                    key={code}
                    className={
                      countryCode === code
                        ? "bg-primary/10 font-medium"
                        : "hover:bg-muted/30"
                    }
                  >
                    <td className="p-3 font-semibold">
                      <span>{row.flag}</span>{" "}
                      <span>{row.countryName} ({row.countryCode})</span>
                      {countryCode === code && (
                        <Badge className="ml-1.5 text-[9px] px-1 py-0 bg-primary">{t.pricing.currentRowBadge}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          row.gateway === "sepay"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                            : "border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                        }
                      >
                        {row.gateway === "sepay" ? t.pricing.gatewaySepayShort : t.pricing.gatewayLemonShort}
                      </Badge>
                    </td>
                    <td className="p-3">{prices.pack_1.formatted}</td>
                    <td className="p-3 font-semibold text-foreground">{prices.pack_2.formatted}</td>
                    <td className="p-3 font-bold text-primary">{prices.pack_3.formatted}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CURRENCY LOCK & SECURITY DISCLOSURE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="p-6 rounded-3xl bg-muted/40 border border-border/80 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-sm">
            <Lock className="w-4 h-4 text-primary" />
            <span>{t.pricing.currencyLockTitle}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.pricing.currencyLockDesc}
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              {currentPpp.gateway === "sepay" ? t.pricing.sepaySecurityNote : t.pricing.lemonSecurityNote}
            </span>
          </div>
        </div>

        {/* PSYCHOLOGY LESSON CALLOUT: THE DECOY EFFECT (HIỆU ỨNG CHIM MỒI) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Lightbulb className="w-4 h-4" />
            <span>{t.pricing.decoyEffectTitle}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.pricing.decoyEffectDesc}
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-primary font-medium">
            <span>{t.pricing.decoyFooterLabel}</span>
            <Link href="/post/the-flywheel-effect" className="hover:underline flex items-center gap-1">
              {t.pricing.decoyRelatedLink} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
