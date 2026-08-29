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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";
import { getPppPricing } from "@/lib/geo-pricing";
import { paidTermCheckoutSummary, paidTermPurchasePhrase } from "@/lib/site-config";
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
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paddleCheckoutUrl, setPaddleCheckoutUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const planName = `${pack.credits.toLocaleString("vi-VN")} credit`;
  const planLimitText = paidTermPurchasePhrase(language);
  const listPriceFormatted = ppp.packages[packageId].formatted;
  const marketListAmount = () => ppp.packages[packageId].price;
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
  }, [countryCode, packageId, appliedPromo]);

  useEffect(() => {
    if (!user || order) return;

    // Creating a second order here would charge a different list price and
    // strand the first pending order.
    fetch(`/api/checkout?country=${countryCode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, promoCode: appliedPromo || undefined }),
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
  }, [user, countryCode, packageId, order, appliedPromo, t.checkout.genericOrderError, t.checkout.genericConnError]);

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
      <div>
        <div>
          <CheckCircle2 />
        </div>
        <Badge>
          {t.checkout.badge}
        </Badge>
        <h1>
          {t.checkout.successTitle} {planName}!
        </h1>
        <p>
          {t.checkout.successDesc}
        </p>
        <div>
          <div>
            <span >{t.checkout.successGatewayLabel}</span>
            <span>
              {ppp.gateway === "sepay" ? "SePay (VietQR)" : "Paddle (MoR)"}
            </span>
          </div>
          <div>
            <span >{t.checkout.successCurrencyLabel}</span>
            <span>{ppp.currency} ({planPriceFormatted})</span>
          </div>
          <div>
            <span >{t.checkout.successAccessLabel}</span>
            <span>{planLimitText}</span>
          </div>
        </div>

        <div>
          <Button size="lg" asChild>
            <Link href="/explore">
              {t.checkout.goToExplore} <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/profile">{t.checkout.goToLibrary}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <Badge>
          {t.checkout.badge}
        </Badge>
        <h1>
          {t.checkout.title} {planName}
        </h1>
        <p>
          {t.checkout.subtitle}
        </p>
      </div>

      <div>
        {/* Left: Plan summary */}
        <div>
          <Card>
            <div>
              <div>
                <CreditCoin />
                <h3>{planName}</h3>
              </div>
              <p>
                {paidTermCheckoutSummary(language)}
              </p>
            </div>

            <div>
              <div>
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Mã giảm giá"
                  disabled={!user || Boolean(order)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!user || !promoCode.trim() || Boolean(order)}
                  onClick={() => setAppliedPromo(promoCode.trim())}
                >
                  Áp dụng
                </Button>
              </div>
              {appliedPromo ? (
                <p>
                  Đã áp dụng mã <strong>{appliedPromo}</strong>
                  {order && order.amount < marketListAmount() ? ` — giảm còn ${planPriceFormatted}` : ""}
                </p>
              ) : null}
              <div>
                <span >{t.checkout.readingLimit}</span>
                <span>{planLimitText}</span>
              </div>
              <div>
                <span>{t.checkout.totalAmount}</span>
                <span>
                  {planPriceFormatted}
                </span>
              </div>
            </div>

            <div>
              <div>
                <span>
                  <Globe2 />
                  {t.checkout.regionDetectedLabel}
                </span>
                <Badge variant="outline">
                  {ppp.flag} {ppp.countryName} ({ppp.currency})
                </Badge>
              </div>
              <div>
                <span>{t.checkout.gatewayAutoLabel}</span>
                <Badge

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
            <Card>
              <div>
                <div>
                  <Badge>
                    {t.checkout.sepayGatewayBadge}
                  </Badge>
                  <h3>
                    <QrCode />
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
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQrUrl}
                    alt="VietQR SePay Transfer"
                  />
                  <p>
                    {t.checkout.sepayDesc}
                  </p>
                </div>
              ) : (
                <div
                  data-testid="payment-not-configured"
                >
                  <AlertTriangle />
                  <span>{t.checkout.paymentNotConfigured}</span>
                </div>
              )}

              {/* Transfer Details with Copy Buttons */}
              <div>
                <div>
                  <div >
                    <span>{t.checkout.bankName}</span>
                    <span>{bankName}</span>
                  </div>
                </div>

                <div>
                  <div>
                    <span>{t.checkout.accountNumber}</span>
                    <span>{bankAccount}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(bankAccount, "acc")}
                  >
                    {copied === "acc" ? <Check /> : <Copy />}
                    {copied === "acc" ? t.checkout.copied : t.checkout.copy}
                  </Button>
                </div>

                <div>
                  <div>
                    <span>{t.checkout.accountHolder}</span>
                    <span>{accountHolder}</span>
                  </div>
                </div>

                <div>
                  <div >
                    <span>
                      {t.checkout.transferMemo}
                    </span>
                    <span>
                      {memoCode}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(memoCode, "memo")}
                  >
                    {copied === "memo" ? <Check /> : <Copy />}
                    {copied === "memo" ? t.checkout.copied : t.checkout.copy}
                  </Button>
                </div>
              </div>

              {orderError && (
                <p>{orderError}</p>
              )}

              {/* Action Button — the order is confirmed by the SePay
                  webhook polling above, not by this click; it just tells
                  the user we're watching for their transfer. Stays
                  clickable for a signed-out visitor (order is null then)
                  so handleConfirmPayment's own auth check can open the
                  login dialog instead of the button just sitting dead. */}
              <Button
                size="lg"
                disabled={isProcessing || (!!user && !order)}
                onClick={handleConfirmPayment}
              >
                {isProcessing ? (
                  <span>
                    <Sparkles /> {t.checkout.processing}
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
            <Card>
              <div>
                <CreditCard />
              </div>
              <div>
                <h3>{t.checkout.lemonTitle}</h3>
                <p>
                  {t.checkout.lemonSubtitle}
                </p>
              </div>

              {orderError && <p>{orderError}</p>}

              {!orderError && !paddleCheckoutUrl && (
                <p>
                  <Sparkles /> {t.checkout.lemonInitializing}
                </p>
              )}

              {paddleCheckoutUrl && (
                <Button
                  size="lg"
                  onClick={() => {
                    window.location.href = paddleCheckoutUrl;
                  }}
                >
                  {t.checkout.lemonContinueBtn} <ArrowRight />
                </Button>
              )}

              <p>
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
        <div>
          Đang tải trang thanh toán...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
