"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Crown,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  CreditCard,
  Lock,
  Globe2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { MembershipTier, CountryCode } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";
import { getPppPricing, COUNTRIES_LIST } from "@/lib/geo-pricing";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planId = (searchParams.get("plan") as MembershipTier) || "PRO";

  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const upgradeTier = useSession((s) => s.upgradeTier);
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);
  const setCountryCode = useSession((s) => s.setCountryCode);

  const t = getTranslation(language);
  const ppp = getPppPricing(countryCode);

  const [copied, setCopied] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Lemon Squeezy form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState(user?.name || "");

  const isPro = planId === "PRO";
  const planName = isPro ? t.pricing.plans.proName : t.pricing.plans.plusName;
  const planLimitText = isPro ? t.pricing.plans.proLimit : t.pricing.plans.plusLimit;
  const planPriceFormatted = isPro ? ppp.plans.PRO.formatted : ppp.plans.PLUS.formatted;
  const planNumericPrice = isPro ? ppp.plans.PRO.price : ppp.plans.PLUS.price;

  const memoCode = user
    ? `TR ${user.email.split("@")[0].toUpperCase()}`
    : "TR HOIVIEN";

  // VietQR parameters for SePay
  const bankAccount = "0987654321";
  const bankName = "MBBank (Ngân hàng Quân Đội)";
  const accountHolder = "THINK AND RICH CO LTD";
  const vietQrUrl = `https://img.vietqr.io/image/MB-${bankAccount}-compact2.png?amount=${planNumericPrice}&addInfo=${encodeURIComponent(
    memoCode
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success(`${t.checkout.copied}: ${text}`);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleConfirmPayment(gatewayUsed: "sepay" | "lemonsqueezy") {
    if (!user) {
      setAuthOpen(true);
      toast.info("Vui lòng xác thực Email OTP trước khi kích hoạt gói.");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      upgradeTier(planId);
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success(
        gatewayUsed === "sepay"
          ? `🎉 SePay: Đã xác thực thanh toán thành công ${planName}!`
          : `🎉 Lemon Squeezy: Payment verified! Activated ${planName} (${ppp.currency}).`
      );
    }, 1500);
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
            <span className="text-muted-foreground">Cổng thanh toán:</span>
            <span className="font-semibold text-foreground">
              {ppp.gateway === "sepay" ? "SePay (VietQR)" : "Lemon Squeezy (MoR)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tiền tệ đã khóa:</span>
            <span className="font-semibold text-primary">{ppp.currency} ({planPriceFormatted})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quyền truy cập:</span>
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
    <div className="container mx-auto max-w-4xl px-4 py-12">
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
        {/* Left: Plan Summary & Currency Lock Info */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-border/80 bg-card p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isPro ? (
                  <Crown className="w-5 h-5 text-amber-500" />
                ) : (
                  <Flame className="w-5 h-5 text-blue-600" />
                )}
                <h3 className="font-display text-xl font-bold">{planName}</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPro ? t.pricing.plans.proTagline : t.pricing.plans.plusTagline}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{t.checkout.duration}</span>
                <span className="font-semibold text-foreground">{t.checkout.durationValue}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{t.checkout.readingLimit}</span>
                <span className="font-semibold text-primary">{planLimitText}</span>
              </div>
              <div className="pt-2 border-t border-border/50 flex justify-between items-baseline">
                <span className="text-sm font-semibold">{t.checkout.totalAmount}</span>
                <span className="text-2xl font-extrabold text-primary">
                  {planPriceFormatted}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Globe2 className="w-4 h-4 text-primary" />
                <span>{t.checkout.currencyLockedNotice}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border">
                <span>Khu vực IP nhận diện:</span>
                <Badge variant="outline" className="font-bold">
                  {ppp.flag} {ppp.countryName} ({ppp.currency})
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border">
                <span>Cổng thanh toán tự động:</span>
                <Badge
                  className={
                    ppp.gateway === "sepay"
                      ? "bg-emerald-600 text-white font-bold"
                      : "bg-blue-600 text-white font-bold"
                  }
                >
                  {ppp.gateway === "sepay"
                    ? "SePay (VietQR Nội địa)"
                    : "Lemon Squeezy (Thẻ Quốc tế)"}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mô phỏng IP quốc gia khác:</span>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                className="text-[11px] bg-muted border border-border rounded-lg px-2 py-1 font-medium cursor-pointer"
              >

                {COUNTRIES_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.gateway === "sepay" ? "SePay" : "Lemon"})
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <span>
              Theo tài liệu đặc tả PRD, tiền tệ thanh toán được khóa độc lập hoàn toàn với ngôn ngữ hiển thị.
            </span>
          </div>
        </div>

        {/* Right: Payment Method (Dynamic Routing SePay vs Lemon Squeezy) */}
        <div>
          {ppp.gateway === "sepay" ? (
            /* SEPAY GATEWAY (VIETNAM VNĐ) */
            <Card className="rounded-3xl border-2 border-primary shadow-lg bg-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-none text-[11px] font-semibold mb-1">
                    Cổng Thanh Toán Nội Địa
                  </Badge>
                  <h3 className="font-display text-lg font-bold flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-primary" />
                    {t.checkout.sepayTitle}
                  </h3>
                </div>
              </div>

              {/* VietQR Display */}
              <div className="flex flex-col items-center p-4 rounded-2xl bg-white border border-border shadow-inner text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vietQrUrl}
                  alt="VietQR SePay Transfer"
                  className="w-52 h-52 object-contain rounded-xl"
                />
                <p className="text-[11px] text-slate-600 font-medium mt-2">
                  {t.checkout.sepayDesc}
                </p>
              </div>

              {/* Transfer Details with Copy Buttons */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">{t.checkout.bankName}</span>
                    <span className="font-semibold text-foreground">{bankName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border/50">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">{t.checkout.accountNumber}</span>
                    <span className="font-mono font-bold text-sm text-foreground">{bankAccount}</span>
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

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div>
                    <span className="text-amber-700 dark:text-amber-400 block text-[10px] font-semibold">
                      {t.checkout.transferMemo}
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
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

              {/* Action Button */}
              <Button
                size="lg"
                className="w-full rounded-full font-semibold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isProcessing}
                onClick={() => handleConfirmPayment("sepay")}
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
            /* LEMON SQUEEZY GATEWAY (INTERNATIONAL USD/EUR/JPY/KRW/TWD/CNY) */
            <Card className="rounded-3xl border-2 border-primary shadow-lg bg-card p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-none text-[11px] font-semibold">
                    Global Merchant of Record
                  </Badge>
                  <Badge variant="outline" className="font-bold text-xs">
                    {ppp.currency} ({ppp.currencySymbol})
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {t.checkout.lemonTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.checkout.lemonDesc}
                </p>
              </div>

              {/* Lemon Squeezy Card Form Inputs */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    {t.checkout.cardNumber}
                  </Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="rounded-xl h-10 text-xs font-mono pr-10"
                    />
                    <CreditCard className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      {t.checkout.expiry}
                    </Label>
                    <Input
                      type="text"
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      {t.checkout.cvc}
                    </Label>
                    <Input
                      type="text"
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="rounded-xl h-10 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    {t.checkout.nameOnCard}
                  </Label>
                  <Input
                    type="text"
                    placeholder="ALEXANDER NGUYEN"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="rounded-xl h-10 text-xs uppercase"
                  />
                </div>
              </div>

              {/* Tax Compliance Notice */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t.checkout.taxIncluded}</span>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  size="lg"
                  className="w-full rounded-full font-semibold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isProcessing}
                  onClick={() => handleConfirmPayment("lemonsqueezy")}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin" /> {t.checkout.processing}
                    </span>
                  ) : (
                    <span>
                      {t.checkout.payWithCard} ({planPriceFormatted}) &rarr;
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-full font-semibold border-border hover:bg-muted"
                  disabled={isProcessing}
                  onClick={() => handleConfirmPayment("lemonsqueezy")}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {t.checkout.payWithApplePay}
                </Button>
              </div>
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
