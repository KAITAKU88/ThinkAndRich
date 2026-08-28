"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { formatDateTime, formatViews } from "@/lib/utils";

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  remainingCredits: number;
  periodPaidSpent: number;
  userKind: "Free" | "Paid";
  paidCount: number;
  revenueVnd: number;
  createdAt: string;
  lastLoginAt: string;
  savedCount: number;
  shareCount: number;
  readCount: number;
}

type SortKey =
  | "name"
  | "createdAt"
  | "lastLoginAt"
  | "readCount"
  | "savedCount"
  | "shareCount"
  | "remainingCredits"
  | "periodPaidSpent"
  | "userKind"
  | "paidCount"
  | "revenue";

export function UsersTable() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastLoginAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ sort: sortKey, dir });
    if (search.trim()) qs.set("q", search.trim());
    fetch(`/api/admin/users?${qs.toString()}`)
      .then((r) => r.json() as Promise<{ ok: boolean; users?: AdminUserRow[] }>)
      .then((data) => {
        if (!cancelled && data.ok && data.users) setUsers(data.users);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, sortKey, dir]);

  function handleSort(key: string) {
    if (key === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key as SortKey);
      setDir("desc");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Chỉ độc giả. Tài khoản quản trị nằm ở mục Cấu hình.
      </p>
      <div className="relative w-full sm:w-64">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo email..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1180px] text-xs text-left">
          <thead className="uppercase bg-secondary/60 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-2.5">
                <SortableHeader label="Độc giả" sortKey="name" activeSort={sortKey} dir={dir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader
                  label="Credit còn lại"
                  sortKey="remainingCredits"
                  activeSort={sortKey}
                  dir={dir}
                  onSort={handleSort}
                  align="right"
                />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader
                  label="Credit đã dùng (phiên mua gần nhất)"
                  sortKey="periodPaidSpent"
                  activeSort={sortKey}
                  dir={dir}
                  onSort={handleSort}
                  align="right"
                />
              </th>
              <th className="px-4 py-2.5">
                <SortableHeader label="Phân loại" sortKey="userKind" activeSort={sortKey} dir={dir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader label="Số lần Paid" sortKey="paidCount" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader label="Doanh thu" sortKey="revenue" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader label="Đã đọc" sortKey="readCount" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" />
              </th>
              <th className="px-4 py-2.5">
                <SortableHeader
                  label="Lần truy cập cuối"
                  sortKey="lastLoginAt"
                  activeSort={sortKey}
                  dir={dir}
                  onSort={handleSort}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  Không có người dùng nào.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(u.remainingCredits)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(u.periodPaidSpent)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.userKind === "Paid" ? "default" : "secondary"} className="text-[10px]">
                      {u.userKind}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(u.paidCount)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">
                    {u.revenueVnd > 0 ? `${u.revenueVnd.toLocaleString("vi-VN")} ₫` : "0"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(u.readCount)}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                    {formatDateTime(u.lastLoginAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
