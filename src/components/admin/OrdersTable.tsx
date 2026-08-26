"use client";

import { useEffect, useMemo, useState } from "react";
import { Wallet, CircleCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { cn, timeAgo } from "@/lib/utils";

interface AdminOrderRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  gateway: string;
  tier: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELED";
  createdAt: string;
  paidAt: string | null;
}

interface OrderStats {
  revenueByCurrency: { currency: string; total: number; count: number }[];
  countByStatus: { status: string; count: number }[];
  paidByTier: { tier: string; count: number }[];
}

type SortKey = "createdAt" | "amount" | "status";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  FAILED: "bg-destructive/15 text-destructive border-destructive/20",
  CANCELED: "bg-muted text-muted-foreground border-border",
};

export function OrdersTable() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminOrderRow["status"]>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/orders${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`).then(
        (r) => r.json() as Promise<{ ok: boolean; orders?: AdminOrderRow[] }>
      ),
      fetch("/api/admin/orders/stats").then((r) => r.json() as Promise<{ ok: boolean } & OrderStats>),
    ]).then(([ordersRes, statsRes]) => {
      if (cancelled) return;
      if (ordersRes.ok && ordersRes.orders) setOrders(ordersRes.orders);
      if (statsRes.ok) setStats(statsRes);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  function handleSort(key: string) {
    if (key === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key as SortKey);
      setDir("desc");
    }
  }

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }, [orders, sortKey, dir]);

  const countMap = Object.fromEntries((stats?.countByStatus ?? []).map((s) => [s.status, s.count]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(stats?.revenueByCurrency ?? []).map((r) => (
          <StatCard key={r.currency} icon={<Wallet className="w-4 h-4" />} label={`Doanh thu (${r.currency})`} value={r.total.toLocaleString("vi-VN")} />
        ))}
        <StatCard icon={<CircleCheck className="w-4 h-4 text-emerald-600" />} label="Đã thanh toán" value={String(countMap.PAID ?? 0)} />
        <StatCard icon={<Clock className="w-4 h-4 text-amber-600" />} label="Đang chờ" value={String(countMap.PENDING ?? 0)} />
      </div>

      <div className="flex items-center gap-2">
        {(["ALL", "PENDING", "PAID", "FAILED", "CANCELED"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs text-left">
          <thead className="uppercase bg-secondary/60 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-2.5">Người dùng</th>
              <th className="px-4 py-2.5">Cổng / Gói</th>
              <th className="px-4 py-2.5 text-right"><SortableHeader label="Số tiền" sortKey="amount" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" /></th>
              <th className="px-4 py-2.5"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sortKey} dir={dir} onSort={handleSort} /></th>
              <th className="px-4 py-2.5"><SortableHeader label="Ngày tạo" sortKey="createdAt" activeSort={sortKey} dir={dir} onSort={handleSort} /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Đang tải...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Chưa có đơn hàng nào.</td></tr>
            ) : (
              sorted.map((o) => (
                <tr key={o.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{o.userName}</div>
                    <div className="text-[11px] text-muted-foreground">{o.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="uppercase text-[11px] text-muted-foreground">{o.gateway}</span> · <span className="font-semibold">{o.tier}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{o.amount.toLocaleString("vi-VN")} {o.currency}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-[10px] border", STATUS_STYLE[o.status])} variant="outline">{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{timeAgo(o.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3.5 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase font-semibold truncate">{label}</p>
        <p className="text-base font-bold font-mono text-foreground">{value}</p>
      </div>
    </div>
  );
}
