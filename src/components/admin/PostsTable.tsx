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
import type { CreditCost, PillarType, Post } from "@/lib/types";
import { BulkUploadPostsButton } from "@/components/admin/BulkUploadPostsButton";
import { CreditBadge } from "@/components/credits/CreditBadge";
import { CREDIT_COSTS, parseCreditCost } from "@/lib/credit-cost";

interface PostsTableProps {
  posts: AdminPost[];
  total: number;
  counts: AdminPostCounts;
  loading: boolean;
  onQuery: (query: AdminPostsQuery) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Post>) => Promise<{ ok: boolean; message?: string; post?: Post }>;
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
  onUpdate,
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
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

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

  async function patchPost(
    id: string,
    updates: Partial<Post>,
    success: string,
    options?: { blockStatus?: boolean }
  ) {
    if (options?.blockStatus && statusBusyId === id) return;
    if (options?.blockStatus) setStatusBusyId(id);
    try {
      const res = await onUpdate(id, updates);
      if (res.ok) toast.success(success);
      else toast.error(res.message || "Không cập nhật được bài viết.");
    } finally {
      if (options?.blockStatus) setStatusBusyId(null);
    }
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
        <BulkUploadPostsButton
          onDone={() =>
            void onQuery({
              q: search.trim() || undefined,
              pillar: pillarFilter,
              status: statusFilter,
              sort: sortKey,
              dir,
              page,
              pageSize,
            })
          }
        />
      </div>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1240px] text-xs text-left">
          <thead className="uppercase bg-secondary/60 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-2.5">
                <SortableHeader label="Bài viết" sortKey="title" activeSort={sortKey} dir={dir} onSort={handleSort} />
              </th>
              <th className="px-4 py-2.5">Tình trạng</th>
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
                <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
                  Đang tải...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">
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
                      <div className="font-medium text-foreground truncate">{post.title}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground truncate" title={post.id}>
                        ID {post.id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={statusBusyId === post.id}
                        title={post.status === "DRAFT" ? "Bấm để xuất bản" : "Bấm để chuyển về nháp"}
                        onClick={() =>
                          void patchPost(
                            post.id,
                            { status: post.status === "DRAFT" ? "PUBLISHED" : "DRAFT" },
                            post.status === "DRAFT" ? "Đã xuất bản." : "Đã chuyển về nháp. Bookmark và đã đọc của độc giả vẫn giữ theo ID bài.",
                            { blockStatus: true }
                          )
                        }
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide disabled:opacity-50",
                          post.status === "PUBLISHED"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-border bg-secondary text-muted-foreground"
                        )}
                      >
                        {post.status === "PUBLISHED" ? "Xuất bản" : "Nháp"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {post.status === "DRAFT" ? (
                        <select
                          value={parseCreditCost(post.creditCost, 0)}
                          title="Chỉ đổi được khi bài còn nháp"
                          onChange={(e) =>
                            void patchPost(
                              post.id,
                              { creditCost: Number(e.target.value) as CreditCost },
                              "Đã cập nhật credit."
                            )
                          }
                          className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px] font-medium"
                        >
                          {CREDIT_COSTS.map((cost) => (
                            <option key={cost} value={cost}>
                              {cost === 0 ? "Open" : `${cost} credit`}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span title="Chuyển về nháp để đổi credit">
                          <CreditBadge cost={parseCreditCost(post.creditCost, 0)} />
                        </span>
                      )}
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
