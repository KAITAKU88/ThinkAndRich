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
import { getTranslation } from "@/lib/i18n/translations";
import { getPppPricing } from "@/lib/geo-pricing";
import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import { paidTermPricingCardNote } from "@/lib/site-config";
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

  const termPhrase = paidTermPricingCardNote(language);

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
    <div>
      <div>
        <Badge>
          <Sparkles /> {t.pricing.badge}
        </Badge>
        <h1>
          {t.pricing.title}
        </h1>
        <p>
          {t.pricing.subtitle}
        </p>
      </div>

      <div>
        <div>
          <div>
            <Globe2 />
          </div>
          <div >
            <div>
              <span>
                {t.pricing.detectedRegion}
              </span>
              <Badge variant="outline">
                {currentPpp.flag} {currentPpp.countryName} ({currentPpp.currency})
              </Badge>
              <Badge

              >
                {currentPpp.gateway === "sepay" ? t.pricing.gatewaySepayFull : t.pricing.gatewayLemonFull}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div id="plans">
        {packages.map((pack) => (
          <Card key={pack.id}>
            {pack.popular && <p>Chiết khấu tốt nhất theo số lượng</p>}
            <CardHeader>
              <div>
                <CreditCoin />
              </div>
              <CardTitle>
                {pack.credits.toLocaleString("vi-VN")} credit
              </CardTitle>
              <div>
                <div>
                  {pack.priceFormatted}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {termPhrase}
            </CardContent>
            <CardFooter>
              {!user ? (
                <Button onClick={() => setAuthOpen(true)}>
                  Đăng nhập để mua
                </Button>
              ) : (
                <Button size="lg" asChild>
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
