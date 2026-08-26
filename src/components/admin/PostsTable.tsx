"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, Pencil, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/admin/SortableHeader";
import { PILLARS_CONFIG } from "@/lib/data";
import { cn, formatViews } from "@/lib/utils";
import type { AdminPost } from "@/lib/admin/use-admin-posts";
import type { PillarType } from "@/lib/types";

interface PostsTableProps {
  posts: AdminPost[];
  loading: boolean;
  onEdit: (post: AdminPost) => void;
  onDelete: (id: string) => Promise<{ ok: boolean; message?: string }>;
  onCreateNew: () => void;
}

type SortKey = "title" | "views" | "clicks" | "shares" | "bookmarkCount";
type StatusFilter = "ALL" | "DRAFT" | "PUBLISHED";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "DRAFT", label: "Bản nháp" },
  { id: "PUBLISHED", label: "Đã xuất bản" },
];

export function PostsTable({ posts, loading, onEdit, onDelete, onCreateNew }: PostsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [pillarFilter, setPillarFilter] = useState<"ALL" | PillarType>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleSort(key: string) {
    if (key === sortKey) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setDir("desc");
    }
  }

  // Counts come from the full set, not the filtered one, so each tab keeps
  // showing how many posts it holds while a search is narrowing the table.
  const statusCounts = useMemo(
    () => ({
      ALL: posts.length,
      DRAFT: posts.filter((p) => p.status === "DRAFT").length,
      PUBLISHED: posts.filter((p) => p.status === "PUBLISHED").length,
    }),
    [posts]
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (statusFilter !== "ALL") list = list.filter((p) => p.status === statusFilter);
    if (pillarFilter !== "ALL") list = list.filter((p) => p.pillar === pillarFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const av = sortKey === "title" ? a.title.toLowerCase() : a[sortKey];
      const bv = sortKey === "title" ? b.title.toLowerCase() : b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return dir === "asc" ? cmp : -cmp;
    });
  }, [posts, statusFilter, pillarFilter, search, sortKey, dir]);

  async function handleDelete(id: string) {
    const res = await onDelete(id);
    if (res.ok) toast.success("Đã xóa bài viết.");
    else toast.error(res.message || "Không xóa được bài viết.");
    setConfirmDeleteId(null);
  }

  return (
    <div className="space-y-4">
      {/* Drafts are the reason this exists: posts arriving over MCP land as
          drafts and need reviewing, which was impossible to see in a list
          mixing them with everything already published. */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-hide">
        {STATUS_TABS.map((statusTab) => {
          const active = statusFilter === statusTab.id;
          return (
            <button
              key={statusTab.id}
              onClick={() => setStatusFilter(statusTab.id)}
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
                {statusCounts[statusTab.id]}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="h-8 w-full sm:w-56 pl-8 text-xs"
            />
          </div>
          <select
            value={pillarFilter}
            onChange={(e) => setPillarFilter(e.target.value as "ALL" | PillarType)}
            className="h-8 w-full sm:w-auto text-xs bg-background border border-border rounded-lg px-2"
          >
            <option value="ALL">Tất cả trụ cột</option>
            <option value="MENTAL_MODEL">Mô hình Tư duy</option>
            <option value="BUSINESS_STRATEGY">Chiến lược Kinh doanh</option>
            <option value="STARTUP_IDEA">Ý tưởng Khởi nghiệp</option>
          </select>
        </div>
        <Button size="sm" className="h-8 w-full sm:w-auto text-xs gap-1.5" onClick={onCreateNew}>
          <PlusCircle className="w-3.5 h-3.5" /> Viết bài mới
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[900px] text-xs text-left">
          <thead className="uppercase bg-secondary/60 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-2.5"><SortableHeader label="Bài viết" sortKey="title" activeSort={sortKey} dir={dir} onSort={handleSort} /></th>
              <th className="px-4 py-2.5">Trụ cột</th>
              <th className="px-4 py-2.5 text-right"><SortableHeader label="Lượt xem" sortKey="views" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" /></th>
              <th className="px-4 py-2.5 text-right"><SortableHeader label="Lượt click" sortKey="clicks" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" /></th>
              <th className="px-4 py-2.5 text-right"><SortableHeader label="Lượt share" sortKey="shares" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" /></th>
              <th className="px-4 py-2.5 text-right"><SortableHeader label="Lượt lưu" sortKey="bookmarkCount" activeSort={sortKey} dir={dir} onSort={handleSort} align="right" /></th>
              <th className="px-4 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  {statusFilter === "DRAFT"
                    ? "Không có bản nháp nào đang chờ duyệt."
                    : statusFilter === "PUBLISHED"
                      ? "Chưa có bài viết nào được xuất bản."
                      : "Không có bài viết nào."}
                </td>
              </tr>
            ) : (
              filtered.map((post) => {
                const pillarMeta = PILLARS_CONFIG[post.pillar];
                return (
                  <tr key={post.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 max-w-[320px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{post.title}</span>
                        {post.status === "DRAFT" && (
                          <Badge variant="outline" className="text-[9px] h-4 shrink-0">NHÁP</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] border ${pillarMeta?.badgeBg}`}>{pillarMeta?.titleVi}</Badge>
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
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" title="Xóa" onClick={() => setConfirmDeleteId(post.id)}>
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
    </div>
  );
}
