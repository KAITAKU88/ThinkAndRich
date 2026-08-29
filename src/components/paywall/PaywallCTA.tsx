"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/store/session";
import { CreditCoin } from "@/components/credits/CreditCoin";
import { GIFT_DAILY_GRANT } from "@/lib/credits";
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
  available,
  slug,
  onUnlocked,
}: PaywallCTAProps) {
  const setAuthOpen = useSession((state) => state.setAuthOpen);
  const unlockPost = useSession((state) => state.unlockPost);
  const user = useSession((state) => state.user);
  const availableCredits = available ?? user?.totalCredits ?? 0;

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
    <div>
      <Card>
        <CardContent>
          {reason === "AUTH_REQUIRED" ? (
            <>
              <div>
                <Lock />
              </div>
              <h3>
                Đăng nhập để mở khóa
              </h3>
              <p>
                Bài viết này tốn {creditCost} credit. Đăng nhập để mở khóa vĩnh viễn.
              </p>
              <div>
                {creditCost}
                <CreditCoin />
              </div>
              <Button
                onClick={() => setAuthOpen(true)}
              >
                <Lock />
                Đăng nhập
              </Button>
            </>
          ) : reason === "INSUFFICIENT_CREDITS" ? (
            <>
              <div>
                <CreditCoin />
              </div>
              <h3>
                Không đủ credit để mở khóa
              </h3>
              <p>
                Bạn không đủ credit để mở khóa, vui lòng đợi đến ngày mai để nhận {GIFT_DAILY_GRANT} credit
                miễn phí, hoặc mua thêm credit để đọc ngay.
              </p>
              <Button asChild variant="default">
                <Link href="/pricing">
                  Mua thêm credit
                  <ArrowRight />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div>
                <CreditCoin />
              </div>
              <h3>
                Mở khóa bài viết
              </h3>
              <p>
                Trừ credit một lần, đọc vĩnh viễn — không bị thu hồi khi credit hết hạn.
              </p>
              <div>
                {creditCost}
                <CreditCoin />
              </div>
              <p>Số dư: {availableCredits}</p>
              {availableCredits < creditCost ? (
                <>
                  <p>
                    Bạn không đủ credit để mở khóa, vui lòng đợi đến ngày mai để nhận {GIFT_DAILY_GRANT} credit
                    miễn phí, hoặc mua thêm credit để đọc ngay.
                  </p>
                  <Button asChild variant="default">
                    <Link href="/pricing">
                      Mua thêm credit
                      <ArrowRight />
                    </Link>
                  </Button>
                </>
              ) : (
                <Button
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
