"use client";

import Link from "next/link";
import { Lock, Sparkles, Crown, Flame, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";
import { getPppPricing } from "@/lib/geo-pricing";

interface PaywallCTAProps {
  reason?: "AUTH_REQUIRED" | "PRO_REQUIRED" | "DAILY_LIMIT_REACHED";
  limit?: number;
  currentReads?: number;
}

export function PaywallCTA({
  reason = "AUTH_REQUIRED",
  limit = 10,
  currentReads = 10,
}: PaywallCTAProps) {
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);

  const t = getTranslation(language);
  const ppp = getPppPricing(countryCode);

  return (
    <div className="absolute bottom-0 left-0 right-0 min-h-[75%] bg-gradient-to-t from-background via-background/95 to-transparent flex flex-col items-center justify-end pb-4 pt-28">
      <Card className="max-w-lg w-full mx-3 border-primary/30 bg-card/95 backdrop-blur-md relative overflow-hidden shadow-2xl rounded-3xl">
        <CardContent className="p-6 sm:p-8 text-center relative">
          {reason === "PRO_REQUIRED" ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-amber-500/10 text-amber-500">
                <Crown className="w-7 h-7" />
              </div>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-none text-xs px-3 py-1 mb-2 font-semibold">
                {t.paywall.memberRequiredBadge}
              </Badge>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-foreground">
                {t.paywall.memberRequiredTitle}
              </h3>
              <p className="text-muted-foreground mb-6 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                {t.paywall.memberRequiredDesc}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <Button size="lg" className="w-full font-semibold rounded-full shadow-md bg-amber-500 hover:bg-amber-600 text-white" asChild>
                  <Link href="/pricing">
                    <Crown className="w-4 h-4 mr-1.5" /> {t.paywall.memberUpgradeBtn} ({ppp.plans.PLUS.formatted} / {ppp.plans.PRO.formatted}) &rarr;
                  </Link>
                </Button>
              </div>
            </>
          ) : reason === "DAILY_LIMIT_REACHED" ? (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-blue-600/10 text-blue-600">
                <Flame className="w-7 h-7" />
              </div>
              <Badge className="bg-blue-600/15 text-blue-600 dark:text-blue-400 border-none text-xs px-3 py-1 mb-2 font-semibold">
                {t.paywall.limitReachedBadge} ({limit})
              </Badge>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-foreground">
                {t.paywall.limitReachedTitle} ({currentReads}/{limit})
              </h3>
              <p className="text-muted-foreground mb-6 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                {t.paywall.limitReachedDesc}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <Button size="lg" className="w-full font-semibold rounded-full shadow-md" asChild>
                  <Link href="/pricing">
                    <Sparkles className="w-4 h-4 mr-1.5" /> {t.paywall.limitUpgradeBtn} ({ppp.plans.PRO.formatted}) <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (


            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary/10 text-primary">
                <Lock className="w-7 h-7" />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-2">
                Đăng nhập để đọc toàn bộ
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-2 text-foreground">
                Xác thực Email OTP để mở khóa bài viết
              </h3>
              <p className="text-muted-foreground mb-6 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                Nhập email của bạn để nhận mã OTP 6 chữ số và mở khóa nội dung bài viết, case study phân tích và video chuyên sâu.
              </p>
              <Button
                size="lg"
                className="w-full font-semibold rounded-full shadow-md"
                onClick={() => setAuthOpen(true)}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Đăng nhập nhận mã OTP miễn phí
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
