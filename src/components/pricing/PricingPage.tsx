"use client";

import { useState } from "react";
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
  PPP_PRICING_MAP,
  COUNTRIES_LIST,
  getPppPricing,
} from "@/lib/geo-pricing";
import type { CountryCode } from "@/lib/types";


export function PricingPage() {
  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);
  const setCountryCode = useSession((s) => s.setCountryCode);

  const [showPppTable, setShowPppTable] = useState(false);

  const t = getTranslation(language);
  const currentPpp = getPppPricing(countryCode);
  const currentTier = user?.tier || "FREE";

  const plans = [
    {
      id: "FREE" as const,
      name: t.pricing.plans.freeName,
      tagline: t.pricing.plans.freeTagline,
      priceFormatted: currentPpp.plans.FREE.formatted,
      dailyLimitText: t.pricing.plans.freeLimit,
      isPro: false,
      badge: undefined,
      features: [
        "10 bài viết tiêu chuẩn mỗi ngày",
        "Ghi chú & đánh dấu bài viết yêu thích",
        "Truy cập kho bài học mở",
        "Tra cứu nhanh bằng ô tìm kiếm toàn trang",
      ],
      ctaText: t.pricing.startFree,
    },
    {
      id: "PLUS" as const,
      name: t.pricing.plans.plusName,
      tagline: t.pricing.plans.plusTagline,
      priceFormatted: `${currentPpp.plans.PLUS.formatted} / năm`,
      dailyLimitText: t.pricing.plans.plusLimit,
      isPro: false,
      badge: "Gói Đột Phá",
      features: [
        "Đọc 15 bài viết / ngày",
        "Mở khóa toàn bộ Bài viết Member",
        "Xem sơ đồ tư duy & Mindmap tóm tắt",
        "Tải bản tóm tắt chiến lược",
        "Tự động ẩn các bài đã đọc / đã lưu",
      ],
      ctaText: t.pricing.upgradePlus,
    },
    {
      id: "PRO" as const,
      name: t.pricing.plans.proName,
      tagline: t.pricing.plans.proTagline,
      priceFormatted: `${currentPpp.plans.PRO.formatted} / năm`,
      dailyLimitText: t.pricing.plans.proLimit,
      isPro: true,
      badge: "👑 Khuyên dùng (Best Value)",
      features: [
        "Đọc KHÔNG GIỚI HẠN mọi bài viết",
        "Mở khóa 100% Bài viết Member độc quyền",
        "Toàn bộ Video phân tích case study thực chiến",
        "Tải trọn bộ Ebook PDF & Mindmap vector",
        "Huy hiệu PRO danh dự trên hồ sơ",
        "Quyền tham gia cộng đồng Think & Rich VIP",
      ],
      ctaText: t.pricing.upgradePro,
    },
  ];

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
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
                {currentPpp.gateway === "sepay"
                  ? "Cổng SePay (VietQR)"
                  : "Cổng Lemon Squeezy (Global)"}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5">
              Hệ số PPP: <em>{currentPpp.pppFactorNote}</em>. Tiền tệ bị khóa theo IP.
            </p>
          </div>
        </div>

        {/* IP Simulator Switcher for Reviewing */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground hidden sm:inline">Mô phỏng IP:</span>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value as CountryCode)}
            className="text-xs bg-muted border border-border rounded-xl px-2.5 py-1.5 font-medium cursor-pointer"
          >

            {COUNTRIES_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} - {c.gateway === "sepay" ? "SePay (VNĐ)" : "Lemon Squeezy"}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPppTable((v) => !v)}
            className="rounded-xl text-xs"
          >
            {showPppTable ? "Ẩn bảng PPP" : "Bảng giá Toàn cầu (PPP)"}
          </Button>
        </div>
      </div>

      {/* 3-Tier Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
        {plans.map((plan) => {
          const isCurrent = user && currentTier === plan.id;
          const isPro = plan.id === "PRO";

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col justify-between transition-all duration-300 rounded-3xl overflow-hidden",
                isPro
                  ? "border-2 border-primary shadow-xl bg-card scale-102 lg:scale-105 z-10"
                  : "border-border/80 bg-card hover:border-primary/40 shadow-sm"
              )}
            >
              {/* Highlight Badge */}
              {plan.badge && (
                <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 text-white text-[11px] font-bold py-1.5 text-center uppercase tracking-wider">
                  {plan.badge}
                </div>
              )}

              <CardHeader className={cn("text-center pb-4", plan.badge && "pt-8")}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-3 bg-muted">
                  {plan.id === "FREE" && <Zap className="w-6 h-6 text-muted-foreground" />}
                  {plan.id === "PLUS" && <Flame className="w-6 h-6 text-blue-600" />}
                  {plan.id === "PRO" && <Crown className="w-6 h-6 text-amber-500" />}
                </div>

                <CardTitle className="text-xl font-display font-bold">
                  {plan.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">
                  {plan.tagline}
                </p>

                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    {plan.priceFormatted}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {plan.dailyLimitText}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.pricing.featuresIncluded}
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-foreground/90">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className={cn("w-4 h-4 mt-0.5 shrink-0", isPro ? "text-primary" : "text-emerald-500")} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4 border-t border-border/50">
                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full rounded-full font-semibold">
                    ✓ {t.pricing.currentPlan}
                  </Button>
                ) : plan.id === "FREE" ? (
                  user ? (
                    <Button variant="outline" className="w-full rounded-full" asChild>
                      <Link href="/explore">{t.pricing.startFree} &rarr;</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full rounded-full font-semibold"
                      onClick={() => setAuthOpen(true)}
                    >
                      {t.auth.getOtpBtn}
                    </Button>
                  )
                ) : (
                  <Button
                    className={cn(
                      "w-full rounded-full font-semibold shadow-md",
                      isPro
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-foreground hover:bg-foreground/90 text-background"
                    )}
                    size="lg"
                    asChild
                  >
                    <Link href={`/checkout?plan=${plan.id}`}>
                      {plan.ctaText} &rarr;
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FULL PPP COMPARISON TABLE (SECTION 4 OF PRD) */}
      {showPppTable && (
        <div className="mb-16 rounded-3xl border border-border/80 bg-card p-6 shadow-sm overflow-hidden animate-in fade-in-50">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-bold">
              Bảng Định Giá Đa Quốc Gia Theo Sức Mua (PPP Index)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Giá được định tuyến tự động qua SePay (Việt Nam) hoặc Lemon Squeezy (Toàn cầu). Tiền tệ bị khóa cứng theo IP.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 font-semibold text-foreground">
                  <th className="p-3">Thị trường (IP)</th>
                  <th className="p-3">Cổng Thanh toán</th>
                  <th className="p-3">Gói Free</th>
                  <th className="p-3">Gói Plus (1 Năm)</th>
                  <th className="p-3">Gói Pro (1 Năm)</th>
                  <th className="p-3">Ghi chú PPP so với VN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {Object.values(PPP_PRICING_MAP).map((row) => (
                  <tr
                    key={row.countryCode}
                    className={
                      countryCode === row.countryCode
                        ? "bg-primary/10 font-medium"
                        : "hover:bg-muted/30"
                    }
                  >
                    <td className="p-3 font-semibold flex items-center gap-1.5">
                      <span>{row.flag}</span>
                      <span>{row.countryName} ({row.countryCode})</span>
                      {countryCode === row.countryCode && (
                        <Badge className="text-[9px] px-1 py-0 bg-primary">Hiện tại</Badge>
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
                        {row.gateway === "sepay" ? "SePay" : "Lemon Squeezy"}
                      </Badge>
                    </td>
                    <td className="p-3">{row.plans.FREE.formatted}</td>
                    <td className="p-3 font-semibold text-foreground">{row.plans.PLUS.formatted}</td>
                    <td className="p-3 font-bold text-primary">{row.plans.PRO.formatted}</td>
                    <td className="p-3 text-muted-foreground italic">{row.pppFactorNote}</td>
                  </tr>
                ))}
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
              {currentPpp.gateway === "sepay"
                ? "Thanh toán nội địa VN được bảo đảm qua hệ thống Ngân hàng Nhà nước & SePay VietQR 24/7."
                : "Thanh toán quốc tế được bảo vệ bởi Lemon Squeezy (Merchant of Record) với đầy đủ hóa đơn VAT/Sales Tax toàn cầu."}
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
            <span>Chiến lược định giá tâm lý</span>
            <Link href="/post/the-flywheel-effect" className="hover:underline flex items-center gap-1">
              Xem mô hình liên quan <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
