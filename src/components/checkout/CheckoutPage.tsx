"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, QrCode, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/lib/data";
import {
  confirmCheckout,
  createCheckoutSession,
  type PaymentGateway,
} from "@/lib/services/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/store/session";

function CheckoutInner() {
  const search = useSearchParams();
  const router = useRouter();
  const planParam = (search.get("plan") || "premium").toUpperCase();
  const plan = useMemo(
    () => PLANS.find((p) => p.id === planParam) ?? PLANS[1],
    [planParam]
  );

  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const setTier = useSession((s) => s.setTier);

  const [gateway, setGateway] = useState<PaymentGateway>("STRIPE");
  const [loading, setLoading] = useState(false);

  if (plan.id === "FREE") {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4">Gói Free không cần thanh toán.</p>
        <Button asChild>
          <Link href="/pricing">Quay lại bảng giá</Link>
        </Button>
      </div>
    );
  }

  async function complete() {
    if (!user) {
      setAuthOpen(true);
      toast.message("Đăng nhập trước khi thanh toán.");
      return;
    }
    setLoading(true);
    try {
      const session = await createCheckoutSession({
        plan: plan.id as "PREMIUM" | "SUPER",
        gateway,
        userId: user.id,
      });
      await confirmCheckout(session.id);
      setTier(plan.id);
      router.push(
        `/checkout/success?plan=${plan.id.toLowerCase()}&gateway=${gateway.toLowerCase()}`
      );
    } catch {
      toast.error("Thanh toán thất bại. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-10 md:py-16">
      <Link
        href="/pricing"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại bảng giá
      </Link>

      <h1 className="font-display text-3xl font-semibold mb-2">Thanh toán</h1>
      <p className="text-muted-foreground mb-8">
        Hoàn tất đăng ký gói {plan.name}. Đây là luồng demo — không thu tiền thật.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Tóm tắt đơn hàng</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{plan.name}</p>
            <p className="text-sm text-muted-foreground">{plan.period}</p>
          </div>
          <p className="text-2xl font-bold">{plan.priceLabel}</p>
        </CardContent>
      </Card>

      {!user && (
        <Card className="mb-6 border-dashed">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Bạn cần đăng nhập trước khi thanh toán.
            </p>
            <Button onClick={() => setAuthOpen(true)}>Đăng nhập</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={gateway}
            onValueChange={(v) => setGateway(v as PaymentGateway)}
          >
            <TabsList>
              <TabsTrigger value="STRIPE">
                <CreditCard className="w-4 h-4" /> Stripe
              </TabsTrigger>
              <TabsTrigger value="SEPAY">
                <QrCode className="w-4 h-4" /> Sepay QR
              </TabsTrigger>
            </TabsList>

            <TabsContent value="STRIPE" className="space-y-4">
              <div className="space-y-2">
                <Label>Số thẻ (demo)</Label>
                <Input placeholder="4242 4242 4242 4242" className="font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hết hạn</Label>
                  <Input placeholder="12 / 28" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>CVC</Label>
                  <Input placeholder="•••" type="password" className="font-mono" />
                </div>
              </div>
              <Button
                className="w-full h-11"
                disabled={loading}
                onClick={complete}
              >
                {loading ? "Đang xử lý..." : "Hoàn tất thanh toán"}
              </Button>
            </TabsContent>

            <TabsContent value="SEPAY">
              <div className="flex flex-col items-center py-4">
                <div className="w-48 h-48 bg-white p-3 rounded-xl border mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=IdeaVault-${plan.id}-${user?.id ?? "guest"}`}
                    alt="QR Sepay"
                    className="w-full h-full"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Quét QR bằng app ngân hàng. Nội dung CK sẽ map userId (mock).
                </p>
                <Button
                  className="w-full h-11"
                  disabled={loading}
                  onClick={complete}
                >
                  {loading ? "Đang xác nhận..." : "Tôi đã chuyển khoản"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-muted-foreground">Đang tải...</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
