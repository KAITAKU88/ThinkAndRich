"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Globe2 } from "lucide-react";
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
import { getPppPricing } from "@/lib/geo-pricing";
import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import type { CountryCode, MarketPricing } from "@/lib/types";
import { CreditCoin } from "@/components/credits/CreditCoin";


export function PricingPage() {
  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);

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
    return {
      id: pack.id,
      credits: pack.credits,
      priceFormatted: price.formatted,
      popular: i === 1,
    };
  });

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
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

      <div className="mb-12 p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex w-full sm:w-auto items-center gap-3 min-w-0">
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
          </div>
        </div>
      </div>

      <div id="plans" className="grid scroll-mt-24 grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
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
    </div>
  );
}
