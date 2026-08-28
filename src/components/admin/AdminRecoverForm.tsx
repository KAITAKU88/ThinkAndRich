"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/store/session";

export function AdminRecoverForm() {
  const router = useRouter();
  const restoreSession = useSession((s) => s.restoreSession);
  const [step, setStep] = useState<"CODE" | "OTP">("CODE");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    useSession.persist.rehydrate();
  }, []);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/recover/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryCode: recoveryCode.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.message || "Không xác thực được mã khôi phục.");
        return;
      }
      setStep("OTP");
      toast.success("Đã gửi OTP tới email chủ sở hữu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/recover/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recoveryCode: recoveryCode.trim(), code: otp.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.message || "Không khôi phục được tài khoản.");
        return;
      }
      await restoreSession();
      toast.success("Đã thu hồi phiên cũ và đăng nhập lại.");
      router.replace("/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-border p-6">
        <div>
          <h1 className="text-lg font-semibold">Khôi phục tài khoản chủ sở hữu</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Dùng khi phiên admin bị chiếm. Mã khôi phục + OTP gửi tới email chủ sở hữu sẽ hủy mọi phiên admin cũ.
          </p>
        </div>
        {step === "CODE" ? (
          <form onSubmit={(e) => void handleStart(e)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="recovery-code">Mã khôi phục</Label>
              <Input
                id="recovery-code"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                autoComplete="off"
                className="h-9 font-mono text-xs"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || recoveryCode.trim().length < 16}>
              {loading ? "Đang kiểm tra..." : "Tiếp"}
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleConfirm(e)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="recover-otp">OTP</Label>
              <Input
                id="recover-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="h-9"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || otp.length < 6}>
              {loading ? "Đang khôi phục..." : "Khôi phục và đăng nhập"}
            </Button>
          </form>
        )}
        <a href="/admin/login" className="block text-xs text-muted-foreground underline">
          Quay lại đăng nhập
        </a>
      </div>
    </div>
  );
}
