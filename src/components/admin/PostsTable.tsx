"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Pencil, Trash2, PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { PILLARS_CONFIG } from "@/lib/data";
import { cn, formatDateTime, formatViews } from "@/lib/utils";
import type { AdminPost, AdminPostCounts, AdminPostsQuery } from "@/lib/admin/use-admin-posts";
import type { PillarType } from "@/lib/types";
import { CreditBadge } from "@/components/credits/CreditBadge";
import { parseCreditCost } from "@/lib/credit-cost";

interface PostsTableProps {
  posts: AdminPost[];
  total: number;
  counts: AdminPostCounts;
  loading: boolean;
  onQuery: (query: AdminPostsQuery) => Promise<void>;
  onEdit: (post: AdminPost) => void;
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>;
  onCreateNew: () => void;
}

type SortKey = "title" | "creditCost" | "views" | "clicks" | "shares" | "bookmarkCount" | "updatedAt";
type StatusFilter = "ALL" | "DRAFT" | "PUBLISHED";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "DRAFT", label: "Bản nháp" },
  { id: "PUBLISHED", label: "Đã xuất bản" },
];

export function PostsTable({
  posts,
  total,
  counts,
  loading,
  onQuery,
  onEdit,
  onDelete,
  onCreateNew,
}: PostsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [pillarFilter, setPillarFilter] = useState<"ALL" | PillarType>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<50 | 100>(50);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void onQuery({
        q: search.trim() || undefined,
        pillar: pillarFilter,
        status: statusFilter,
        sort: sortKey,
        dir,
        page,
        pageSize,
      });
    }, search ? 250 : 0);
    return () => window.clearTimeout(handle);
  }, [search, pillarFilter, statusFilter, sortKey, dir, page, pageSize, onQuery]);

  function handleSort(key: string) {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setDir(key === "title" ? "asc" : "desc");
    }
    setPage(1);
  }

  async function handleDelete(id: string) {
    const res = await onDelete(id);
    if (res.ok) toast.success("Đã xóa bài viết.");
    else toast.error(res.message || "Không xóa được bài viết.");
    setConfirmDeleteId(null);
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-hide">
        {STATUS_TABS.map((statusTab) => {
          const active = statusFilter === statusTab.id;
          return (
            <button
              key={statusTab.id}
              onClick={() => {
                setStatusFilter(statusTab.id);
                setPage(1);
              }}
              className={cn(
                "relative px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors -mb-px border-b-2",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {statusTab.label}
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                  active ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                )}
              >
                {counts[statusTab.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo tiêu đề..."
              className="h-8 w-full sm:w-56 pl-8 text-xs"
            />
          </div>
          <select
            value={pillarFilter}
            onChange={(e) => {
              setPillarFilter(e.target.value as "ALL" | PillarType);
              setPage(1);
            }}
            className="h-8 w-full sm:w-auto text-xs bg-background border border-border rounded-lg px-2"
          >
            <option value="ALL">Tất cả trụ cột</option>
            <option value="MENTAL_MODEL">Mô hình Tư duy</option>
            <option value="BUSINESS_STRATEGY">Chiến lược Kinh doanh</option>
            <option value="STARTUP_IDEA">Ý tưởng Khởi nghiệp</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) === 100 ? 100 : 50);
              setPage(1);
            }}
            className="h-8 text-xs bg-background border border-border rounded-lg px-2"
          >
            <option value={50}>50 bài / trang</option>
            <option value={100}>100 bài / trang</option>
          </select>
        </div>
        <Button size="sm" className="h-8 w-full sm:w-auto text-xs gap-1.5" onClick={onCreateNew}>
          <PlusCircle className="w-3.5 h-3.5" /> Viết bài mới
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1120px] text-xs text-left">
          <thead className="uppercase bg-secondary/60 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-2.5">
                <SortableHeader label="Bài viết" sortKey="title" activeSort={sortKey} dir={dir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">
                <SortableHeader label="Phân loại" sortKey="creditCost" activeSort={sortKey} dir={dir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">Trụ cột</th>
              <th className="px-4 py-2.5">
                <SortableHeader label="Last edit" sortKey="updatedAt" activeSort={sortKey} dir={dir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader label="Lượt xem" sortKey="views" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader label="Lượt click" sortKey="clicks" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader label="Lượt share" sortKey="shares" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" />
              </th>
              <th className="px-4 py-2.5 text-right">
                <SortableHeader label="Lượt lưu" sortKey="bookmarkCount" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" />
              </th>
              <th className="px-4 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                  {statusFilter === "DRAFT"
                    ? "Không có bản nháp nào đang chờ duyệt."
                    : statusFilter === "PUBLISHED"
                      ? "Chưa có bài viết nào được xuất bản."
                      : "Không có bài viết nào."}
                </td>
              </tr>
            ) : (
              posts.map((post) => {
                const pillarMeta = PILLARS_CONFIG[post.pillar];
                return (
                  <tr key={post.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 max-w-[320px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{post.title}</span>
                        {post.status === "DRAFT" && (
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                            NHÁP
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <CreditBadge cost={parseCreditCost(post.creditCost, 0)} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] border ${pillarMeta?.badgeBg}`}>{pillarMeta?.titleVi}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                      {formatDateTime(post.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(post.views)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(post.clicks)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(post.shares)}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{formatViews(post.bookmarkCount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                          <Link href={`/post/${post.slug}`} target="_blank" title="Xem bài viết">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Sửa" onClick={() => onEdit(post)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {confirmDeleteId === post.id ? (
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="destructive" className="h-7 text-[10px] px-2" onClick={() => handleDelete(post.id)}>
                              Xác nhận xóa
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={() => setConfirmDeleteId(null)}>
                              Hủy
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Xóa"
                            onClick={() => setConfirmDeleteId(post.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {total === 0
            ? "0 bài"
            : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, total)} / ${total} bài`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            disabled={currentPage <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Trước
          </Button>
          <span className="px-2 tabular-nums">
            {currentPage}/{pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            disabled={currentPage >= pageCount || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
