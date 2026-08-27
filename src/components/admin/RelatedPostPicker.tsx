"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Link2, Plus, Search, X } from "lucide-react";
import type { AdminPost } from "@/lib/admin/use-admin-posts";
import { MAX_RELATED_POSTS } from "@/lib/related-posts";
import { cn } from "@/lib/utils";

interface RelatedPostPickerProps {
  posts: AdminPost[];
  currentPostId: string | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function RelatedPostPicker({ posts, currentPostId, selectedIds, onChange }: RelatedPostPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const postById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
  const candidates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return posts
      .filter(
        (post) =>
          post.status === "PUBLISHED" &&
          post.id !== currentPostId &&
          !selectedIds.includes(post.id) &&
          (!normalized || post.title.toLocaleLowerCase("vi").includes(normalized))
      )
      .slice(0, 8);
  }, [currentPostId, posts, query, selectedIds]);

  const full = selectedIds.length >= MAX_RELATED_POSTS;

  function select(id: string) {
    if (full) return;
    onChange([...selectedIds, id]);
    setQuery("");
    setOpen(false);
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2" data-testid="related-post-picker">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium">Bài viết liên quan</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {selectedIds.length}/{MAX_RELATED_POSTS}
        </span>
      </div>

      {selectedIds.length > 0 && (
        <ol className="space-y-1.5" data-testid="selected-related-posts">
          {selectedIds.map((id, index) => {
            const post = postById.get(id);
            return (
              <li
                key={id}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-xs" title={post?.title ?? id}>
                  {post?.title ?? "Bài viết không còn khả dụng"}
                </span>
                <button
                  type="button"
                  aria-label={`Đưa ${post?.title ?? id} lên trên`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Đưa ${post?.title ?? id} xuống dưới`}
                  disabled={index === selectedIds.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Xoá ${post?.title ?? id} khỏi bài liên quan`}
                  onClick={() => onChange(selectedIds.filter((selectedId) => selectedId !== id))}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={full}
          onClick={() => {
            setOpen((value) => !value);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className={cn(
            "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-medium transition-colors",
            full ? "cursor-not-allowed opacity-50" : "hover:border-primary hover:bg-primary/5 hover:text-primary"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          {full ? "Đã chọn đủ 3 bài" : "Thêm bài liên quan"}
        </button>

        {open && !full && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            <div className="flex items-center gap-2 border-b border-border px-2.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                data-testid="related-post-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setOpen(false);
                  if (event.key === "Enter" && candidates[0]) {
                    event.preventDefault();
                    select(candidates[0].id);
                  }
                }}
                placeholder="Tìm theo tiêu đề…"
                className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
              />
            </div>
            <div className="max-h-56 overflow-y-auto p-1" data-testid="related-post-options">
              {candidates.length > 0 ? (
                candidates.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => select(post.id)}
                    className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-secondary"
                  >
                    <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{post.title}</span>
                      <span className="block text-[10px] text-muted-foreground">{post.category}</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-2.5 py-4 text-center text-xs text-muted-foreground">
                  Không tìm thấy bài đã xuất bản phù hợp.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Hiển thị theo thứ tự này dưới bài viết. Chỉ bài đã xuất bản mới có thể được chọn.
      </p>
    </div>
  );
}
