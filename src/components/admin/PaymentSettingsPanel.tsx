"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EMPTY_PAYMENT_SETTINGS,
  type PaymentSettings,
  type PaymentStringKey,
} from "@/lib/payment-settings";

interface SettingsResponse {
  ok: boolean;
  message?: string;
  payment?: PaymentSettings;
  sepayBankConfigured?: boolean;
  sepayWebhookConfigured?: boolean;
  paddleConfigured?: boolean;
  webhookUrls?: { sepay: string; paddle: string };
}

export function PaymentSettingsPanel() {
  const [form, setForm] = useState<PaymentSettings>(EMPTY_PAYMENT_SETTINGS);
  const [sepayBankConfigured, setSepayBankConfigured] = useState(true);
  const [sepayWebhookConfigured, setSepayWebhookConfigured] = useState(true);
  const [paddleConfigured, setPaddleConfigured] = useState(true);
  const [webhookUrls, setWebhookUrls] = useState<{ sepay: string; paddle: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json() as Promise<SettingsResponse>)
      .then((data) => {
        if (data.ok && data.payment) applyResponse(data);
      })
      .catch(() => toast.error("Không tải được cấu hình thanh toán."))
      .finally(() => setLoading(false));
  }, []);

  function applyResponse(data: SettingsResponse) {
    if (data.payment) setForm(data.payment);
    setSepayBankConfigured(Boolean(data.sepayBankConfigured));
    setSepayWebhookConfigured(Boolean(data.sepayWebhookConfigured));
    setPaddleConfigured(Boolean(data.paddleConfigured));
    if (data.webhookUrls) setWebhookUrls(data.webhookUrls);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment: form }),
      });
      const data = (await res.json()) as SettingsResponse;
      if (!res.ok || !data.ok) {
        toast.error(data.message || "Không lưu được cấu hình.");
        return;
      }
      applyResponse(data);
      toast.success("Đã lưu cấu hình thanh toán.");
    } catch {
      toast.error("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const field = (key: PaymentStringKey) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: e.target.value })),
  });

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép URL webhook.");
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải cấu hình...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="font-display text-lg font-bold">Cấu hình thanh toán</h2>
        <p className="text-xs text-muted-foreground mt-1">
          SePay cho Việt Nam, Paddle cho quốc tế. Sửa xong dùng ngay, không cần deploy. Secret
          không bao giờ gửi ra trang thanh toán công khai.
        </p>
      </div>

      <section className="space-y-5">
        <div>
          <h3 className="font-display text-base font-bold">SePay (Việt Nam — VietQR)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Bốn thông tin tài khoản tạo mã QR khách quét. API key so khớp header{" "}
            <span className="font-mono">Authorization: Apikey …</span> khi SePay gọi webhook.
          </p>
        </div>

        {!sepayBankConfigured && (
          <StatusBanner tone="warn">
            Chưa đủ tài khoản nhận — trang thanh toán sẽ <strong>không hiển thị mã QR</strong>.
          </StatusBanner>
        )}
        {sepayBankConfigured && !sepayWebhookConfigured && (
          <StatusBanner tone="warn">
            Đã có tài khoản nhận nhưng chưa có API key webhook — tiền vào sẽ không được xác nhận tự động.
          </StatusBanner>
        )}
        {sepayBankConfigured && sepayWebhookConfigured && (
          <StatusBanner tone="ok">SePay đã cấu hình đầy đủ (tài khoản + webhook).</StatusBanner>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankCode">Mã ngân hàng</Label>
            <Input id="bankCode" placeholder="MB" {...field("bankCode")} />
            <p className="text-[11px] text-muted-foreground">Mã VietQR, không phải tên. Ví dụ: MB, VCB, TCB, ACB.</p>
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
            <Input id="bankAccountHolder" placeholder="THINK AND RICH CO LTD" {...field("bankAccountHolder")} />
            <p className="text-[11px] text-muted-foreground">
              Viết hoa không dấu — ngân hàng hiển thị đúng như vậy trên màn hình chuyển khoản.
            </p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="sepayWebhookSecret">API key webhook SePay</Label>
            <Input
              id="sepayWebhookSecret"
              type="password"
              autoComplete="off"
              placeholder="Lấy từ dashboard SePay"
              {...field("sepayWebhookSecret")}
            />
          </div>
        </div>

        {webhookUrls && (
          <WebhookUrlRow label="URL webhook SePay (dán vào dashboard SePay)" url={webhookUrls.sepay} onCopy={copyUrl} />
        )}
      </section>

      <section className="space-y-5 border-t border-border/60 pt-6">
        <div>
          <h3 className="font-display text-base font-bold">Paddle (Quốc tế — thẻ / Apple Pay)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            One-time checkout cho từng gói credit. Tạo 3 Price trên Paddle Billing rồi dán Price ID
            vào đây. Có thể để trống cho đến khi mở tài khoản Paddle.
          </p>
        </div>

        {!paddleConfigured ? (
          <StatusBanner tone="warn">
            Paddle chưa đủ thông số — khách quốc tế chưa mua được gói. Checkout sẽ báo cổng chưa sẵn sàng.
          </StatusBanner>
        ) : (
          <StatusBanner tone="ok">Paddle đã cấu hình đầy đủ.</StatusBanner>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-border"
            checked={form.paddleSandbox}
            onChange={(e) => setForm((current) => ({ ...current, paddleSandbox: e.target.checked }))}
          />
          Dùng Paddle Sandbox (<span className="font-mono text-xs">sandbox-api.paddle.com</span>)
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="paddleApiKey">API key</Label>
            <Input
              id="paddleApiKey"
              type="password"
              autoComplete="off"
              placeholder="pdl_sdbx_apikey_… hoặc pdl_live_apikey_…"
              {...field("paddleApiKey")}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="paddleWebhookSecret">Notification secret (chữ ký webhook)</Label>
            <Input
              id="paddleWebhookSecret"
              type="password"
              autoComplete="off"
              placeholder="Lấy từ Paddle → Notifications"
              {...field("paddleWebhookSecret")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paddlePricePack1">Price ID — 1.500 credit</Label>
            <Input id="paddlePricePack1" placeholder="pri_…" className="font-mono text-sm" {...field("paddlePricePack1")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paddlePricePack2">Price ID — 4.500 credit</Label>
            <Input id="paddlePricePack2" placeholder="pri_…" className="font-mono text-sm" {...field("paddlePricePack2")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="paddlePricePack3">Price ID — 10.000 credit</Label>
            <Input id="paddlePricePack3" placeholder="pri_…" className="font-mono text-sm" {...field("paddlePricePack3")} />
          </div>
        </div>

        {webhookUrls && (
          <WebhookUrlRow
            label="URL webhook Paddle (dán vào Paddle → Notifications)"
            url={webhookUrls.paddle}
            onCopy={copyUrl}
          />
        )}
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="save-payment-settings">
          {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          Lưu cấu hình
        </Button>
      </div>
    </div>
  );
}

function StatusBanner({ tone, children }: { tone: "warn" | "ok"; children: ReactNode }) {
  if (tone === "ok") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        {children}
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
      <span>{children}</span>
    </div>
  );
}

function WebhookUrlRow({
  label,
  url,
  onCopy,
}: {
  label: string;
  url: string;
  onCopy: (url: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input readOnly value={url} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => onCopy(url)}>
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
