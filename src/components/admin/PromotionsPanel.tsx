"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import type { CreditPackageId } from "@/lib/types";

interface PromotionRow {
  id: string;
  code: string;
  name: string;
  kind: "percent" | "fixed";
  discountPercent: number | null;
  discountAmountVnd: number | null;
  packageIds: CreditPackageId[] | null;
  maxUses: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}

export function PromotionsPanel() {
  const [rows, setRows] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [discountPercent, setDiscountPercent] = useState(10);
  const [discountAmountVnd, setDiscountAmountVnd] = useState(50000);
  const [maxUses, setMaxUses] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await fetch("/api/admin/promotions")
      .then((r) => r.json() as Promise<{ ok: boolean; promotions?: PromotionRow[] }>)
      .catch(() => ({ ok: false as const }));
    if (data.ok && "promotions" in data && data.promotions) setRows(data.promotions);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        name,
        kind,
        discountPercent,
        discountAmountVnd,
        maxUses: maxUses ? Number(maxUses) : null,
      }),
    }).then((r) => r.json() as Promise<{ ok: boolean; message?: string }>);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.message || "Không tạo được mã.");
      return;
    }
    toast.success(res.message || "Đã tạo mã giảm giá.");
    setCode("");
    setName("");
    void load();
  }

  async function toggleActive(row: PromotionRow) {
    await fetch(`/api/admin/promotions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Xóa mã giảm giá này?")) return;
    const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" }).then(
      (r) => r.json() as Promise<{ ok: boolean; message?: string }>
    );
    if (!res.ok) toast.error(res.message || "Không xóa được.");
    else void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Promotion & mã giảm giá</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Tạo mã theo gói hoặc toàn bộ gói. Người dùng nhập mã tại trang thanh toán.
        </p>
      </div>

      <form onSubmit={(e) => void handleCreate(e)} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 p-4 border border-border rounded-xl bg-card">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã (VD: TET2026)" className="h-9 text-xs" required />
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên chiến dịch" className="h-9 text-xs" required />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "percent" | "fixed")}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value="percent">Giảm %</option>
          <option value="fixed">Giảm cố định (VND)</option>
        </select>
        {kind === "percent" ? (
          <Input
            type="number"
            min={1}
            max={100}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(Number(e.target.value))}
            placeholder="% giảm"
            className="h-9 text-xs"
          />
        ) : (
          <Input
            type="number"
            min={0}
            value={discountAmountVnd}
            onChange={(e) => setDiscountAmountVnd(Number(e.target.value))}
            placeholder="Số tiền VND"
            className="h-9 text-xs"
          />
        )}
        <Input
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="Giới hạn lượt (để trống = không giới hạn)"
          className="h-9 text-xs sm:col-span-2"
        />
        <Button type="submit" size="sm" className="h-9 gap-1.5 sm:col-span-2" disabled={saving}>
          <Plus className="w-3.5 h-3.5" /> Tạo mã
        </Button>
      </form>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs text-left">
          <thead className="bg-secondary/60 text-muted-foreground uppercase border-b border-border">
            <tr>
              <th className="px-4 py-2.5">Mã</th>
              <th className="px-4 py-2.5">Chiến dịch</th>
              <th className="px-4 py-2.5">Giảm</th>
              <th className="px-4 py-2.5">Gói</th>
              <th className="px-4 py-2.5 text-right">Đã dùng</th>
              <th className="px-4 py-2.5">Trạng thái</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Chưa có mã giảm giá.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono font-semibold">{row.code}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">
                    {row.kind === "percent" ? `${row.discountPercent ?? 0}%` : `${(row.discountAmountVnd ?? 0).toLocaleString("vi-VN")} ₫`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.packageIds?.length
                      ? row.packageIds.map((id) => CREDIT_PACKAGES.find((p) => p.id === id)?.credits.toLocaleString("vi-VN")).join(", ")
                      : "Tất cả gói"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.usedCount}
                    {row.maxUses != null ? ` / ${row.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void toggleActive(row)}>
                      <Badge variant={row.active ? "default" : "secondary"}>{row.active ? "Đang bật" : "Tắt"}</Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void remove(row.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Tag className="w-3.5 h-3.5" />
        Mã 100% (giảm toàn bộ) dùng cho chiến dịch hoặc cấp thủ công qua tab Người dùng.
      </p>
    </div>
  );
}
