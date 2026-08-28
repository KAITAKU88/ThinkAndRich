"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, KeyRound, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/store/session";

// Deliberately separate from the public AuthDialog (src/components/auth/
// AuthDialog.tsx) — a distinct admin login screen, not the same OTP modal
// reused with different copy, per the requirement that admin auth must be
// visually and structurally its own thing.
export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `from` is attacker-controllable — anyone can hand out
  // /admin/login?from=https://example.com — so only same-origin paths are
  // honoured. A protocol-relative "//host" would be read as a host by the
  // browser, hence the second check.
  const requested = searchParams.get("from");
  const from = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/admin";

  const user = useSession((s) => s.user);
  const requestOtp = useSession((s) => s.requestOtp);
  const verifyOtp = useSession((s) => s.verifyOtp);
  const restoreSession = useSession((s) => s.restoreSession);

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [deniedReason, setDeniedReason] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  useEffect(() => {
    useSession.persist.rehydrate();
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      router.replace(from);
    }
  }, [user, from, router]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === "OTP" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

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
      toast.error(res.message || "Không gửi được mã OTP.");
      return;
    }
    setDeniedReason(null);
    setStep("OTP");
    setCountdown(60);
    if (res.devCode) {
      setDevCode(res.devCode);
      setOtpCode(res.devCode);
      toast.success("Môi trường local — Cloudflare không gửi email. Mã OTP đã điền sẵn.");
    } else {
      setDevCode(null);
      toast.success("Đã gửi mã xác thực OTP tới email quản trị.");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }
    setLoading(true);
    const result = await verifyOtp(email, otpCode);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.message || "Mã OTP không hợp lệ.");
      return;
    }
    const loggedInUser = useSession.getState().user;
    if (loggedInUser?.role !== "ADMIN") {
      setDeniedReason("Tài khoản này không có quyền quản trị.");
      return;
    }
    router.replace(from);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Đăng nhập Quản trị</h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            Khu vực nội bộ Think & Rich — chỉ dành cho quản trị viên.
          </p>
          <a href="/admin/recover" className="mt-2 text-[11px] text-muted-foreground underline">
            Khôi phục tài khoản chủ sở hữu
          </a>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          {deniedReason && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {deniedReason}
            </div>
          )}

          {step === "EMAIL" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email quản trị viên</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@congty.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
                {loading ? "Đang gửi mã..." : (
                  <>Đăng nhập bằng Email OTP <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-otp" className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Mã xác thực OTP (6 chữ số)
                </Label>
                <Input
                  id="admin-otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  required
                  autoFocus
                  className="text-center font-mono text-xl tracking-[0.35em] h-11"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                {devCode && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Local không gửi được email. Mã OTP:{" "}
                    <code className="font-mono text-foreground">{devCode}</code>
                    . Email phải nằm trong <code className="text-[10px]">ADMIN_EMAILS</code> ở{" "}
                    <code className="text-[10px]">.dev.vars</code>.
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-10 font-medium" disabled={loading || otpCode.length < 6}>
                {loading ? "Đang xác thực..." : (
                  <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Xác nhận</>
                )}
              </Button>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <button type="button" className="hover:text-foreground underline" onClick={() => setStep("EMAIL")}>
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
        </div>
      </div>
    </div>
  );
}
