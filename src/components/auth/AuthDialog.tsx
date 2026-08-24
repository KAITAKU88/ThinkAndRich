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


export function AuthDialog() {
  const authOpen = useSession((s) => s.authOpen);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const requestOtp = useSession((s) => s.requestOtp);
  const verifyOtp = useSession((s) => s.verifyOtp);

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

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
      toast.error("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setLoading(true);
    const res = await requestOtp(email);
    setLoading(false);

    if (!res.ok) {
      toast.error(res.message || "Không gửi được mã OTP. Vui lòng thử lại.");
      return;
    }

    setStep("OTP");
    setCountdown(60);
    toast.success("Đã gửi mã xác thực OTP!", {
      description: `Vui lòng kiểm tra hộp thư ${email}. Mã có hiệu lực trong 5 phút.`,
      duration: 8000,
    });
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setLoading(true);
    const result = await verifyOtp(email, otpCode);
    setLoading(false);

    if (result.ok) {
      toast.success("Xác thực Email OTP thành công!", {
        description: "Chào mừng bạn đến với Think & Rich. Toàn bộ nội dung đã được mở khóa.",
      });
      handleClose(false);
    } else {
      toast.error(result.message || "Mã OTP không hợp lệ.");
    }
  }

  return (
    <Dialog open={authOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
            {step === "EMAIL" ? (
              <Mail className="w-6 h-6" />
            ) : (
              <KeyRound className="w-6 h-6" />
            )}
          </div>
          <DialogTitle className="text-center font-display text-2xl font-bold">
            {step === "EMAIL"
              ? "Đăng nhập Think & Rich"
              : "Xác thực mã OTP"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {step === "EMAIL"
              ? "Xác thực bảo mật qua Email OTP (không cần mật khẩu) để mở khóa toàn bộ mô hình tư duy & chiến lược kinh doanh."
              : `Chúng tôi đã gửi mã xác thực 6 số đến email ${email}`}
          </DialogDescription>
        </DialogHeader>

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="auth-email">Địa chỉ Email của bạn</Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="tenban@congty.com"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Mã OTP 6 chữ số sẽ được gửi tức thì để bạn xác nhận danh tính.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-full font-medium"
              disabled={loading}
            >
              {loading ? (
                "Đang gửi mã..."
              ) : (
                <>
                  Nhận mã xác thực OTP <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="auth-otp">Mã xác thực OTP (6 chữ số)</Label>
              <Input
                id="auth-otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                required
                autoFocus
                className="text-center font-mono text-2xl tracking-[0.4em] h-12"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-full font-medium"
              disabled={loading || otpCode.length < 6}
            >
              {loading ? (
                "Đang xác thực..."
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Xác nhận & Mở khóa
                  nội dung
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <button
                type="button"
                className="hover:text-foreground underline transition-colors"
                onClick={() => setStep("EMAIL")}
              >
                Đổi email khác
              </button>

              {countdown > 0 ? (
                <span>Gửi lại mã sau {countdown}s</span>
              ) : (
                <button
                  type="button"
                  className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                  onClick={() => handleSendOtp()}
                >
                  <RefreshCw className="w-3 h-3" /> Gửi lại mã OTP
                </button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

