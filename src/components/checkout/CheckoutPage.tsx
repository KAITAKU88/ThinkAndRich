"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  CreditCard,
  Globe2,
} from "lucide-react";
import { toast } from "sonner";
import type { CreditPackageId } from "@/lib/types";
import type { PublicPaymentSettings } from "@/lib/payment-settings";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";
import { getPppPricing } from "@/lib/geo-pricing";
import { isCreditPackageId, packageById } from "@/lib/credit-packages";
import { CreditCoin } from "@/components/credits/CreditCoin";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const rawPackage = searchParams.get("package") || searchParams.get("plan");
  const packageId: CreditPackageId = isCreditPackageId(rawPackage) ? rawPackage : "pack_2";
  const pack = packageById(packageId);
  const [payment, setPayment] = useState<PublicPaymentSettings | null>(null);
  const [paymentConfigured, setPaymentConfigured] = useState(false);

  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);

  const t = getTranslation(language);
  const ppp = getPppPricing(countryCode);

  const [copied, setCopied] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [order, setOrder] = useState<{ id: string; reference: string; amount: number; currency: string } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paddleCheckoutUrl, setPaddleCheckoutUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const planName = `${pack.credits.toLocaleString("vi-VN")} credit`;
  const planLimitText = "Hạn 365 ngày kể từ lần mua";
  const listPriceFormatted = ppp.packages[packageId].formatted;
  const planPriceFormatted = order
    ? `${order.amount.toLocaleString("vi-VN")} ${order.currency}`
    : listPriceFormatted;

  // Real PENDING order, created server-side (amount/currency computed from
  // the user's country there too — never trust a client-submitted price).
  // For Paddle this also opens a real hosted checkout session and
  // returns its URL to redirect the user to.
  useEffect(() => {
    fetch("/api/settings/payment")
      .then((res) => res.json() as Promise<{ ok: boolean; payment?: PublicPaymentSettings; configured?: boolean }>)
      .then((data) => {
        if (data.ok && data.payment) {
          setPayment(data.payment);
          setPaymentConfigured(Boolean(data.configured));
        }
      })
      .catch(() => setPaymentConfigured(false));
  }, []);

  useEffect(() => {
    setOrder(null);
    setPaddleCheckoutUrl(null);
    setOrderError(null);
  }, [countryCode]);

  useEffect(() => {
    if (!user || order) return;

    // Creating a second order here would charge a different list price and
    // strand the first pending order.
    fetch(`/api/checkout?country=${countryCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    })
      .then(
        (res) =>
          res.json() as Promise<{
            ok: boolean;
            message?: string;
            orderId?: string;
            reference?: string;
            amount?: number;
            currency?: string;
            checkoutUrl?: string;
          }>
      )
      .then((data) => {
        if (data.ok && data.orderId) {
          setOrder({ id: data.orderId, reference: data.reference!, amount: data.amount!, currency: data.currency! });
          if (data.checkoutUrl) setPaddleCheckoutUrl(data.checkoutUrl);
        } else {
          setOrderError(data.message || t.checkout.genericOrderError);
        }
      })
      .catch(() => setOrderError(t.checkout.genericConnError));
  }, [user, countryCode, packageId, order, t.checkout.genericOrderError, t.checkout.genericConnError]);

  // Poll for the webhook flipping the order to PAID — this page never
  // decides success itself (see src/app/api/webhooks/billing/route.ts).
  useEffect(() => {
    if (!order || isSuccess) return;
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/orders/${order.id}`).then((r) => r.json() as Promise<{ ok: boolean; order?: { status: string } }>);
      if (res.ok && res.order?.status === "PAID") {
        setIsSuccess(true);
        setIsProcessing(false);
        if (pollRef.current) clearInterval(pollRef.current);
        const gatewayLabel = ppp.gateway === "sepay" ? t.checkout.sepayGatewayLabel : t.checkout.lemonGatewayLabel;
        toast.success(`🎉 ${gatewayLabel}: ${t.checkout.paymentConfirmedPrefix} ${planName}!`);
      }
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [order, isSuccess, planName, ppp.gateway, t.checkout.sepayGatewayLabel, t.checkout.lemonGatewayLabel, t.checkout.paymentConfirmedPrefix]);

  // The transfer memo is the short reference, not the order id: a bank
  // rewrites this field, and forty characters of underscores and hyphens do
  // not survive the trip. See src/lib/order-reference.ts.
  const memoCode = order ? order.reference : t.common.loading;

  // The bank details come from the console (Cấu hình Thanh toán), not from
  // this file. They were constants here, including a placeholder account
  // number, so every QR the site had ever drawn pointed somewhere nobody
  // owned and fixing it meant a deploy.
  const bankAccount = payment?.bankAccountNumber ?? "";
  const bankName = payment?.bankName ?? "";
  const accountHolder = payment?.bankAccountHolder ?? "";

  // No QR at all until all four fields are set. Half-configured details
  // produce a scannable code that sends money to the wrong place, which is
  // far worse than a checkout that plainly says it is not ready.
  const vietQrUrl =
    order && paymentConfigured
      ? `https://img.vietqr.io/image/${payment!.bankCode}-${bankAccount}-compact2.png?amount=${order.amount}&addInfo=${encodeURIComponent(
          memoCode
        )}&accountName=${encodeURIComponent(accountHolder)}`
      : "";

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success(`${t.checkout.copied}: ${text}`);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleConfirmPayment() {
    if (!user) {
      setAuthOpen(true);
      toast.info(t.checkout.loginBeforeCheckout);
      return;
    }
    setIsProcessing(true);
    toast.info(t.checkout.confirmedWatchingNote);
  }

  if (isSuccess) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center animate-in zoom-in-75 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <Badge className="bg-primary/20 text-primary border-none text-xs px-3 py-1">
          {t.checkout.badge}
        </Badge>
        <h1 className="font-display text-3xl font-bold">
          {t.checkout.successTitle} {planName}!
        </h1>
        <p className="text-muted-foreground leading-relaxed text-sm">
          {t.checkout.successDesc}
        </p>
        <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 text-xs text-left space-y-1.5 max-w-sm mx-auto">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.checkout.successGatewayLabel}</span>
            <span className="font-semibold text-foreground">
              {ppp.gateway === "sepay" ? "SePay (VietQR)" : "Paddle (MoR)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.checkout.successCurrencyLabel}</span>
            <span className="font-semibold text-primary">{ppp.currency} ({planPriceFormatted})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.checkout.successAccessLabel}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{planLimitText}</span>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="w-full sm:w-auto rounded-full px-8 font-semibold shadow-md" asChild>
            <Link href="/explore">
              {t.checkout.goToExplore} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full" asChild>
            <Link href="/profile">{t.checkout.goToLibrary}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4 py-8 sm:py-12">
      <div className="text-center mb-10 space-y-2">
        <Badge className="bg-primary/15 text-primary border-none text-xs">
          {t.checkout.badge}
        </Badge>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
          {t.checkout.title} {planName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.checkout.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Plan summary */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-border/80 bg-card p-4 sm:p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCoin className="w-5 h-5" />
                <h3 className="font-display text-xl font-bold">{planName}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Cộng dồn vào số dư. Hạn dùng 365 ngày kể từ lần mua này.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 space-y-3">
              <div className="flex justify-between items-start gap-3 text-xs">
                <span className="text-muted-foreground">{t.checkout.readingLimit}</span>
                <span className="font-semibold text-primary">{planLimitText}</span>
              </div>
              <div className="pt-2 border-t border-border/50 flex justify-between items-baseline">
                <span className="text-sm font-semibold">{t.checkout.totalAmount}</span>
                <span className="text-xl min-[375px]:text-2xl font-extrabold text-primary text-right break-words">
                  {planPriceFormatted}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex flex-col min-[375px]:flex-row min-[375px]:items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border">
                <span className="inline-flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary" />
                  {t.checkout.regionDetectedLabel}
                </span>
                <Badge variant="outline" className="font-bold">
                  {ppp.flag} {ppp.countryName} ({ppp.currency})
                </Badge>
              </div>
              <div className="flex flex-col min-[375px]:flex-row min-[375px]:items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border">
                <span>{t.checkout.gatewayAutoLabel}</span>
                <Badge
                  className={
                    ppp.gateway === "sepay"
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-blue-600 text-white font-bold"
                  }
                >
                  {ppp.gateway === "sepay" ? t.checkout.sepayGatewayBadge : t.checkout.lemonGatewayBadge}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Payment Method (Dynamic Routing SePay vs Paddle) */}
        <div>
          {ppp.gateway === "sepay" ? (
            /* SEPAY GATEWAY (VIETNAM VNĐ) */
            <Card className="rounded-3xl border-2 border-primary shadow-lg bg-card p-4 sm:p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[11px] font-semibold mb-1">
                    {t.checkout.sepayGatewayBadge}
                  </Badge>
                  <h3 className="font-display text-lg font-bold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    {t.checkout.sepayTitle}
                  </h3>
                </div>
              </div>

              {/* VietQR Display. No bank details configured means no QR: a
                  code drawn from half-filled details is scannable and sends
                  money to the wrong account, which is worse than a checkout
                  that says plainly it is not ready. */}
              {paymentConfigured ? (
                // The only pure white left in the light theme, and it is not
                // a style choice: a QR code is read by contrast, and banking
                // apps scan it off the screen. The paper tones every other
                // surface now wears would eat into that margin.
                <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-border shadow-inner text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQrUrl}
                    alt="VietQR SePay Transfer"
                    className="w-full max-w-52 aspect-square object-contain rounded-xl"
                  />
                  <p className="text-[11px] text-slate-600 font-medium mt-2">
                    {t.checkout.sepayDesc}
                  </p>
                </div>
              ) : (
                <div
                  data-testid="payment-not-configured"
                  className="flex items-start gap-2.5 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                  <span>{t.checkout.paymentNotConfigured}</span>
                </div>
              )}

              {/* Transfer Details with Copy Buttons */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/60 border border-border/50">
                  <div className="min-w-0">
                    <span className="text-muted-foreground block text-[10px]">{t.checkout.bankName}</span>
                    <span className="font-semibold text-foreground">{bankName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">{t.checkout.accountNumber}</span>
                    <span className="font-mono font-bold text-sm text-foreground break-all">{bankAccount}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg gap-1"
                    onClick={() => handleCopy(bankAccount, "acc")}
                  >
                    {copied === "acc" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied === "acc" ? t.checkout.copied : t.checkout.copy}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">{t.checkout.accountHolder}</span>
                    <span className="font-semibold text-foreground">{accountHolder}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="min-w-0">
                    <span className="text-amber-700 dark:text-amber-400 block text-[10px] font-semibold">
                      {t.checkout.transferMemo}
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400 break-all">
                      {memoCode}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-lg gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                    onClick={() => handleCopy(memoCode, "memo")}
                  >
                    {copied === "memo" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied === "memo" ? t.checkout.copied : t.checkout.copy}
                  </Button>
                </div>
              </div>

              {orderError && (
                <p className="text-xs text-destructive text-center">{orderError}</p>
              )}

              {/* Action Button — the order is confirmed by the SePay
                  webhook polling above, not by this click; it just tells
                  the user we're watching for their transfer. Stays
                  clickable for a signed-out visitor (order is null then)
                  so handleConfirmPayment's own auth check can open the
                  login dialog instead of the button just sitting dead. */}
              <Button
                size="lg"
                className="w-full rounded-full font-semibold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isProcessing || (!!user && !order)}
                onClick={handleConfirmPayment}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" /> {t.checkout.processing}
                  </span>
                ) : (
                  <span>{t.checkout.confirmSePay}</span>
                )}
              </Button>
            </Card>
          ) : (
            /* PADDLE GATEWAY (INTERNATIONAL) — creates a real order
               row and a real hosted Paddle checkout session (see
               src/app/api/checkout/route.ts); the webhook
               (src/app/api/webhooks/billing/route.ts?gateway=paddle)
               flips the order to PAID the same way SePay's does, and this
               page polls for that exactly like the SePay branch above. */
            <Card className="rounded-3xl border-2 border-primary shadow-lg bg-card p-4 sm:p-6 space-y-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 mx-auto flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">{t.checkout.lemonTitle}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.checkout.lemonSubtitle}
                </p>
              </div>

              {orderError && <p className="text-xs text-destructive">{orderError}</p>}

              {!orderError && !paddleCheckoutUrl && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> {t.checkout.lemonInitializing}
                </p>
              )}

              {paddleCheckoutUrl && (
                <Button
                  size="lg"
                  className="w-full rounded-full font-semibold shadow-md bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    window.location.href = paddleCheckoutUrl;
                  }}
                >
                  {t.checkout.lemonContinueBtn} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              <p className="text-[11px] text-muted-foreground">
                {t.checkout.lemonPostPaymentNote}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-20 text-center text-sm text-muted-foreground">
          Đang tải trang thanh toán...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
