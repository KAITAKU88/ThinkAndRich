"use client";

import { useEffect, useState } from "react";
import { Mail, KeyRound, ArrowRight, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";
import { OTP_TTL_MINUTES } from "@/lib/otp-policy";

export function AuthDialog() {
  const authOpen = useSession((s) => s.authOpen);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const requestOtp = useSession((s) => s.requestOtp);
  const verifyOtp = useSession((s) => s.verifyOtp);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "OTP" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  function handleClose(open: boolean) {
    setAuthOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep("EMAIL");
        setOtpCode("");
      }, 300);
    }
  }

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(t.auth.invalidEmail);
      return;
    }

    setLoading(true);
    const res = await requestOtp(email);
    setLoading(false);

    if (!res.ok) {
      toast.error(res.message || t.auth.otpSendFailed);
      return;
    }

    setStep("OTP");
    setCountdown(60);
    if (res.devCode) {
      setDevCode(res.devCode);
      setOtpCode(res.devCode);
      toast.success("Môi trường local — mã OTP đã điền sẵn.");
    } else {
      setDevCode(null);
      toast.success(t.auth.otpSentToastTitle, {
        description: `${t.auth.otpSentToastDescPrefix} ${email}. ${t.auth.otpSentToastDescSuffix.replace("{minutes}", String(OTP_TTL_MINUTES))}`,
        duration: 8000,
      });
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error(t.auth.otpIncomplete);
      return;
    }

    setLoading(true);
    const result = await verifyOtp(email, otpCode);
    setLoading(false);

    if (result.ok) {
      toast.success(t.auth.verifiedToastTitle, {
        description: t.auth.verifiedToastDesc,
      });
      handleClose(false);
    } else {
      toast.error(result.message || t.auth.otpInvalid);
    }
  }

  return (
    <Dialog open={authOpen} onOpenChange={handleClose}>
      <DialogContent >
        <DialogHeader>
          <div>
            {step === "EMAIL" ? (
              <Mail />
            ) : (
              <KeyRound />
            )}
          </div>
          <DialogTitle>
            {step === "EMAIL" ? t.auth.title : t.auth.otpStepTitle}
          </DialogTitle>
          <DialogDescription>
            {step === "EMAIL"
              ? t.auth.subtitle
              : `${t.auth.otpStepSubtitlePrefix} ${email}`}
          </DialogDescription>
        </DialogHeader>

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp}>
            <div>
              <Label htmlFor="auth-email">{t.auth.emailLabel}</Label>
              <Input
                id="auth-email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p>
                <ShieldCheck />
                {t.auth.otpSecureHint}
              </p>
            </div>

            <Button
              type="submit"
              data-testid="auth-send-otp"
              disabled={loading}
            >
              {loading ? (
                t.auth.sendingLabel
              ) : (
                <>
                  {t.auth.getOtpBtn} <ArrowRight />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div>
              <Label htmlFor="auth-otp">{t.auth.otpLabel}</Label>
              <Input
                id="auth-otp"
                type="text"
                maxLength={6}
                placeholder={t.auth.otpPlaceholder}
                required
                autoFocus
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
              {devCode && (
                <p>
                  Local không gửi email. Mã OTP: <code>{devCode}</code>
                </p>
              )}
            </div>

            <Button
              type="submit"
              data-testid="auth-verify-otp"
              disabled={loading || otpCode.length < 6}
            >
              {loading ? (
                t.auth.verifyingLabel
              ) : (
                <>
                  <CheckCircle2 /> {t.auth.confirmUnlockBtn}
                </>
              )}
            </Button>

            <div>
              <button
                type="button"
                onClick={() => setStep("EMAIL")}
              >
                {t.auth.changeEmailBtn}
              </button>

              {countdown > 0 ? (
                <span>{t.auth.resendCountdownPrefix} {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                >
                  <RefreshCw /> {t.auth.resend}
                </button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

