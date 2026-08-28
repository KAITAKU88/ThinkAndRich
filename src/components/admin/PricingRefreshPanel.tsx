"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreditPackageId, CountryCode } from "@/lib/types";

interface PricingSettings {
  mode?: "AUTO" | "MANUAL";
  intervalDays?: number;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

interface MaintenanceState {
  enabled?: boolean;
  reason?: string | null;
  messageVi?: string | null;
  messageEn?: string | null;
}

interface PriceDiff {
  countryCode: CountryCode;
  packageId: CreditPackageId;
  from: number;
  to: number;
}

export function PricingRefreshPanel() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceState | null>(null);
  const [intervalDays, setIntervalDays] = useState(90);
  const [messageVi, setMessageVi] = useState("");
  const [messageEn, setMessageEn] = useState("");
  const [diffs, setDiffs] = useState<PriceDiff[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/pricing");
    const data = (await res.json()) as {
      ok?: boolean;
      settings?: PricingSettings;
      maintenance?: MaintenanceState;
    };
    if (data.ok) {
      setSettings(data.settings ?? null);
      setMaintenance(data.maintenance ?? null);
      setIntervalDays(Math.max(30, data.settings?.intervalDays ?? 90));
      setMessageVi(data.maintenance?.messageVi ?? "");
      setMessageEn(data.maintenance?.messageEn ?? "");
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      error?: string;
      message?: string;
      diffs?: PriceDiff[];
    };
    setBusy(false);
    if (!res.ok || data.ok === false) {
      toast.error(data.error || data.message || "Không thực hiện được.");
      return null;
    }
    return data;
  }

  async function saveMode(mode: "AUTO" | "MANUAL") {
    const data = await post({ action: "save-settings", mode, intervalDays });
    if (data) {
      toast.success("Đã lưu cấu hình.");
      await load();
    }
  }

  async function preview() {
    const data = await post({ action: "preview" });
    if (!data) return;
    const changed = (data.diffs ?? []).filter((d) => d.from !== d.to);
    setDiffs(changed);
    if (changed.length === 0) {
      toast.message("Không có thay đổi giá so với bảng hiện tại.");
    }
  }

  async function apply() {
    const data = await post({ action: "apply" });
    if (data) {
      toast.success("Đã ghi đè bảng giá.");
      setDiffs(null);
      await load();
    }
  }

  async function toggleMaintenance(on: boolean) {
    const data = await post(
      on
        ? { action: "maintenance-on", messageVi, messageEn }
        : { action: "maintenance-off" }
    );
    if (data) {
      toast.success(on ? "Đã bật bảo trì." : "Đã tắt bảo trì.");
      await load();
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Đang tải cấu hình giá…</p>;
  }

  const changed = diffs?.filter((d) => d.from !== d.to) ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold">Giá theo thị trường & bảo trì</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Bảng giá 3 gói credit lưu trong DB. Cron hàng ngày chỉ refresh khi tới hạn.
          </p>
        </div>
        <Badge variant="outline">{settings?.mode ?? "MANUAL"}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="interval-days">Khoảng cách refresh (ngày, tối thiểu 30)</Label>
          <Input
            id="interval-days"
            type="number"
            min={30}
            value={intervalDays}
            onChange={(e) => setIntervalDays(Math.max(30, Number(e.target.value) || 30))}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void saveMode(settings?.mode === "AUTO" ? "MANUAL" : "AUTO")}
          >
            Chuyển {settings?.mode === "AUTO" ? "Manual" : "Auto"}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void saveMode(settings?.mode ?? "MANUAL")}>
            Lưu khoảng cách
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void preview()}>
          Xem diff giá
        </Button>
        <Button size="sm" disabled={busy || diffs === null} onClick={() => void apply()}>
          Xác nhận ghi đè
        </Button>
      </div>

      {diffs && (
        <div className="rounded-xl border border-border overflow-hidden text-xs">
          {changed.length === 0 ? (
            <p className="p-3 text-muted-foreground">Không có dòng nào đổi giá. Vẫn có thể ghi đè để cập nhật metadata.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-2 font-medium">Thị trường</th>
                  <th className="p-2 font-medium">Gói</th>
                  <th className="p-2 font-medium">Cũ</th>
                  <th className="p-2 font-medium">Mới</th>
                </tr>
              </thead>
              <tbody>
                {changed.map((d) => (
                  <tr key={`${d.countryCode}-${d.packageId}`} className="border-t border-border">
                    <td className="p-2">{d.countryCode}</td>
                    <td className="p-2">{d.packageId}</td>
                    <td className="p-2 tabular-nums">{d.from}</td>
                    <td className="p-2 tabular-nums font-semibold">{d.to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="maint-vi">Thông báo bảo trì (VI)</Label>
          <Input
            id="maint-vi"
            value={messageVi}
            onChange={(e) => setMessageVi(e.target.value)}
            placeholder="Hệ thống đang bảo trì. Vui lòng quay lại sau."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maint-en">Maintenance message (EN)</Label>
          <Input
            id="maint-en"
            value={messageEn}
            onChange={(e) => setMessageEn(e.target.value)}
            placeholder="The site is under maintenance. Please try again later."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {maintenance?.enabled ? (
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => void toggleMaintenance(false)}>
            Tắt bảo trì
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void toggleMaintenance(true)}>
            Bật bảo trì
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Lần chạy gần nhất: {settings?.lastRunAt ?? "chưa có"} · Lần tới: {settings?.nextRunAt ?? "—"}
      </p>
    </div>
  );
}
