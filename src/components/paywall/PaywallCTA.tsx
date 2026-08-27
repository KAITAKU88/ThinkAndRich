"use client";

import Link from "next/link";
import { ArrowRight, Crown, Flame, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";
import type { MembershipTier } from "@/lib/types";

interface PaywallCTAProps {
  reason?: "AUTH_REQUIRED" | "PLUS_REQUIRED" | "PRO_REQUIRED" | "DAILY_LIMIT_REACHED";
  limit?: number;
  currentReads?: number;
  tier?: MembershipTier;
}

export function PaywallCTA({
  reason = "AUTH_REQUIRED",
  limit = 10,
  currentReads = 10,
  tier,
}: PaywallCTAProps) {
  const setAuthOpen = useSession((state) => state.setAuthOpen);
  const language = useSession((state) => state.language);
  const t = getTranslation(language);

  const requiredPlan = reason === "PLUS_REQUIRED" ? "PLUS" : "PRO";
  const tierCopy =
    requiredPlan === "PLUS"
      ? {
          badge: t.paywall.plusRequiredBadge,
          title: t.paywall.plusRequiredTitle,
          description: t.paywall.plusRequiredDesc,
          button: t.paywall.plusUpgradeBtn,
        }
      : {
          badge: t.paywall.memberRequiredBadge,
          title: t.paywall.memberRequiredTitle,
          description: t.paywall.memberRequiredDesc,
          button: t.paywall.memberUpgradeBtn,
        };

  const freeLimitReached = tier === "FREE";

  return (
    <div className="absolute inset-x-0 bottom-0 min-h-[72%] bg-gradient-to-t from-background via-background/95 to-transparent flex items-end justify-center px-3 pb-3 pt-24 sm:pb-5">
      <Card className="w-full max-w-md overflow-hidden rounded-3xl border-primary/25 bg-card/95 shadow-xl backdrop-blur-md">
        <CardContent className="px-5 py-5 text-center sm:px-7 sm:py-6">
          {reason === "AUTH_REQUIRED" ? (
            <>
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="size-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                {t.paywall.authRequiredTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {t.paywall.authRequiredDesc}
              </p>
              <Button
                className="mt-4 h-9 rounded-full px-5 text-sm font-semibold shadow-sm"
                onClick={() => setAuthOpen(true)}
              >
                <Lock className="mr-1.5 size-4" />
                {t.paywall.authBtn}
              </Button>
            </>
          ) : reason === "PLUS_REQUIRED" || reason === "PRO_REQUIRED" ? (
            <>
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Crown className="size-5" />
              </div>
              <Badge className="border-none bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {tierCopy.badge}
              </Badge>
              <h3 className="mt-3 font-display text-lg font-bold text-foreground sm:text-xl">
                {tierCopy.title}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {tierCopy.description}
              </p>
              <Button
                asChild
                className="mt-4 h-9 rounded-full bg-amber-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
              >
                <Link href="/pricing#plans">
                  {tierCopy.button}
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                <Flame className="size-5" />
              </div>
              <Badge className="border-none bg-blue-600/15 px-3 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                {t.paywall.limitReachedBadge} ({limit})
              </Badge>
              <h3 className="mt-3 font-display text-lg font-bold text-foreground sm:text-xl">
                {t.paywall.limitReachedTitle} ({currentReads}/{limit})
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {freeLimitReached ? t.paywall.freeLimitReachedDesc : t.paywall.limitReachedDesc}
              </p>
              <Button asChild className="mt-4 h-9 rounded-full px-5 text-sm font-semibold shadow-sm">
                <Link href="/pricing#plans">
                  <Sparkles className="mr-1.5 size-4" />
                  {freeLimitReached ? t.paywall.freeLimitUpgradeBtn : t.paywall.limitUpgradeBtn}
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
