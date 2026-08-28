"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/store/session";
import { CreditCoin } from "@/components/credits/CreditCoin";
import type { AccessReason } from "@/lib/server/access-control";
import type { CreditCost } from "@/lib/types";

interface PaywallCTAProps {
  reason?: AccessReason;
  creditCost?: CreditCost;
  available?: number;
  shortfall?: number;
  slug: string;
  onUnlocked?: () => void;
}

export function PaywallCTA({
  reason = "AUTH_REQUIRED",
  creditCost = 1,
  slug,
  onUnlocked,
}: PaywallCTAProps) {
  const setAuthOpen = useSession((state) => state.setAuthOpen);
  const unlockPost = useSession((state) => state.unlockPost);
  const user = useSession((state) => state.user);
  const totalCredits = user?.totalCredits ?? 0;

  async function handleUnlock() {
    const result = await unlockPost(slug);
    if (result.ok) {
      toast.success("Đã mở khóa bài viết.");
      onUnlocked?.();
      return;
    }
    if (result.reason === "INSUFFICIENT_CREDITS") {
      toast.error(result.message || "Không đủ credit.");
      return;
    }
    if (result.message) toast.error(result.message);
  }

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
                Đăng nhập để mở khóa
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Bài viết này tốn {creditCost} credit. Đăng nhập để mở khóa vĩnh viễn.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm font-bold tabular-nums">
                {creditCost}
                <CreditCoin className="h-4 w-4" />
              </div>
              <Button
                className="mt-4 h-9 rounded-full px-5 text-sm font-semibold shadow-sm"
                onClick={() => setAuthOpen(true)}
              >
                <Lock className="mr-1.5 size-4" />
                Đăng nhập
              </Button>
            </>
          ) : reason === "INSUFFICIENT_CREDITS" ? (
            <>
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <CreditCoin className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                Không đủ credit
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Cần {creditCost} credit để mở khóa. Số dư hiện tại: {totalCredits}.
              </p>
              <Button asChild className="mt-4 h-9 rounded-full px-5 text-sm font-semibold shadow-sm">
                <Link href="/pricing">
                  Mua thêm credit
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <CreditCoin className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                Mở khóa bài viết
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Trừ credit một lần, đọc vĩnh viễn — không bị thu hồi khi credit hết hạn.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-sm font-bold tabular-nums">
                {creditCost}
                <CreditCoin className="h-4 w-4" />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Số dư: {totalCredits}</p>
              {totalCredits < creditCost ? (
                <Button asChild className="mt-4 h-9 rounded-full px-5 text-sm font-semibold shadow-sm">
                  <Link href="/pricing">
                    Mua thêm credit
                    <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="mt-4 h-9 rounded-full px-5 text-sm font-semibold shadow-sm"
                  onClick={() => void handleUnlock()}
                >
                  Mở khóa
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
