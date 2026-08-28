"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";

interface OwnerInfo {
  loginEmail: string;
  ownerEmail: string;
  recoveryConfigured: boolean;
}

export function OwnerSettingsPanel() {
  const [info, setInfo] = useState<OwnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/owner")
      .then((r) => r.json() as Promise<{ ok: boolean } & Partial<OwnerInfo>>)
      .then((data) => {
        if (data.ok) {
          setInfo({
            loginEmail: data.loginEmail ?? "",
            ownerEmail: data.ownerEmail ?? "",
            recoveryConfigured: Boolean(data.recoveryConfigured),
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function generate(code?: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", code }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        recoveryCode?: string;
        recoveryConfigured?: boolean;
      };
      if (!res.ok || !data.ok || !data.recoveryCode) {
        toast.error(data.message || "Không tạo được mã khôi phục.");
        return;
      }
      setFreshCode(data.recoveryCode);
      setAwaitingOtp(false);
      setOtp("");
      setInfo((current) =>
        current ? { ...current, recoveryConfigured: true } : current
      );
      toast.success("Đã tạo mã khôi phục. Sao chép ngay — hệ thống không hiện lại.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!info) return;
    if (!info.recoveryConfigured) {
      await generate();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-otp" }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.message || "Không gửi được OTP.");
        return;
      }
      setAwaitingOtp(true);
      toast.success(`Đã gửi OTP tới ${info.ownerEmail}.`);
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!freshCode) return;
    await navigator.clipboard.writeText(freshCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Đang tải cấu hình...</p>;
  }

  if (!info) {
    return <p className="text-sm text-muted-foreground">Không tải được cấu hình chủ sở hữu.</p>;
  }

  return (
    <div className="rounded-xl border border-border p-4 space-y-4 max-w-xl">
      <div>
        <h2 className="text-sm font-semibold">Tài khoản quản trị</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Đăng nhập admin dùng OTP gửi tới email, không có mật khẩu. Email chủ sở hữu không đổi được từ đây —
          đặt biến Worker <code className="text-[11px]">OWNER_EMAIL</code> (hoặc mục đầu trong{" "}
          <code className="text-[11px]">ADMIN_EMAILS</code>).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Email phiên hiện tại</Label>
        <Input value={info.loginEmail} readOnly className="h-9 bg-secondary/40" />
      </div>
      <div className="space-y-1.5">
        <Label>Email chủ sở hữu (bất biến)</Label>
        <Input value={info.ownerEmail || "Chưa cấu hình"} readOnly className="h-9 bg-secondary/40" />
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <h3 className="text-sm font-semibold">Mã khôi phục</h3>
        <p className="text-xs text-muted-foreground">
          Nếu kẻ xấu chiếm phiên admin, vào{" "}
          <a href="/admin/recover" className="underline">
            /admin/recover
          </a>{" "}
          với mã này rồi OTP gửi tới email chủ sở hữu. Mọi phiên admin cũ sẽ hết hiệu lực.
        </p>
        <p className="text-xs">
          Trạng thái: {info.recoveryConfigured ? "Đã có mã (chỉ hiện lúc tạo)." : "Chưa tạo."}
        </p>
        {freshCode && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
            <code className="text-xs break-all flex-1">{freshCode}</code>
            <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => void copyCode()}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Sao chép
            </Button>
          </div>
        )}
        {awaitingOtp ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void generate(otp);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="owner-otp">OTP</Label>
              <Input
                id="owner-otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="h-9 w-40"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>
            <Button type="submit" size="sm" className="h-9" disabled={busy || otp.length < 6}>
              Xác nhận và tạo mã
            </Button>
          </form>
        ) : (
          <Button size="sm" onClick={() => void handleCreate()} disabled={busy}>
            {info.recoveryConfigured ? "Tạo mã mới" : "Tạo mã khôi phục"}
          </Button>
        )}
      </div>
    </div>
  );
}
