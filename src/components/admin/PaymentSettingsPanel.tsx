"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_PAYMENT_SETTINGS, type PaymentSettings } from "@/lib/payment-settings";

/**
 * SePay bank details, editable by whoever runs the site.
 *
 * These four fields build the VietQR code a customer scans. They used to be
 * constants in the checkout component — including an account number that was
 * a placeholder — so getting them right needed a deploy and getting them
 * wrong pointed every transfer at an account nobody owned.
 */
export function PaymentSettingsPanel() {
  const [form, setForm] = useState<PaymentSettings>(EMPTY_PAYMENT_SETTINGS);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json() as Promise<{ ok: boolean; payment?: PaymentSettings; configured?: boolean }>)
      .then((data) => {
        if (data.ok && data.payment) {
          setForm(data.payment);
          setConfigured(Boolean(data.configured));
        }
      })
      .catch(() => toast.error("Không tải được cấu hình thanh toán."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment: form }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        payment?: PaymentSettings;
        configured?: boolean;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.message || "Không lưu được cấu hình.");
        return;
      }
      if (data.payment) setForm(data.payment);
      setConfigured(Boolean(data.configured));
      toast.success("Đã lưu cấu hình thanh toán.");
    } catch {
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof PaymentSettings) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value })),
  });

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải cấu hình...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold">Tài khoản nhận thanh toán (SePay)</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Bốn thông tin này tạo nên mã VietQR mà khách quét để chuyển khoản. Sai một trường là
          tiền đi sai chỗ, nên hãy đối chiếu kỹ trước khi lưu.
        </p>
      </div>

      {!configured && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>
            Chưa cấu hình đầy đủ — trang thanh toán sẽ <strong>không hiển thị mã QR</strong> và
            khách trong nước chưa mua được gói nào.
          </span>
        </div>
      )}

      {configured && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Đã cấu hình đầy đủ. Trang thanh toán đang dùng thông tin này.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bankCode">Mã ngân hàng</Label>
          <Input id="bankCode" placeholder="MB" {...field("bankCode")} />
          <p className="text-[11px] text-muted-foreground">
            Mã VietQR, không phải tên. Ví dụ: MB, VCB, TCB, ACB.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankName">Tên ngân hàng hiển thị</Label>
          <Input id="bankName" placeholder="MBBank (Ngân hàng Quân Đội)" {...field("bankName")} />
          <p className="text-[11px] text-muted-foreground">Chỉ dùng để hiển thị cho khách đọc.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankAccountNumber">Số tài khoản</Label>
          <Input
            id="bankAccountNumber"
            inputMode="numeric"
            placeholder="0123456789"
            {...field("bankAccountNumber")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankAccountHolder">Tên chủ tài khoản</Label>
          <Input
            id="bankAccountHolder"
            placeholder="THINK AND RICH CO LTD"
            {...field("bankAccountHolder")}
          />
          <p className="text-[11px] text-muted-foreground">
            Viết hoa không dấu — ngân hàng hiển thị đúng như vậy trên màn hình chuyển khoản.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="save-payment-settings">
          {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
}
