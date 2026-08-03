"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { listIdeas } from "@/lib/services/ideas";
import type { Idea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "trending" | "views";

export function HomePage() {
  const [category, setCategory] = useState("Tất cả");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Idea[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listIdeas({ category, sort, page, pageSize: 9 }).then((res) => {
      if (cancelled) return;
      setItems(res.items);
      setTotalPages(res.totalPages);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [category, sort, page]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <section className="relative py-12 md:py-16 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <Badge
          variant="secondary"
          className="mb-6 rounded-full px-4 py-1.5 border border-border"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Dossier ý tưởng cập nhật mỗi ngày
        </Badge>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 max-w-3xl mx-auto leading-tight">
          Kho ý tưởng khởi nghiệp đã phân tích — sẵn sàng để bạn mở
        </h1>
        <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Mỗi dossier gồm mô hình doanh thu, lộ trình triển khai và số liệu tài chính
          thực tế từ các startup toàn cầu.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <Button size="lg" className="rounded-full px-8" asChild>
            <a href="#ideas">Bắt đầu khám phá</a>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
            <Link href="/pricing">Xem gói đăng ký</Link>
          </Button>
        </div>
      </section>

      <div
        id="ideas"
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4 mb-8 scroll-mt-24"
      >
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={category === cat ? "default" : "outline"}
              className="rounded-full shrink-0"
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground shrink-0">
          {(
            [
              ["newest", "Mới nhất"],
              ["trending", "Trending"],
              ["views", "Xem nhiều"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSort(key);
                setPage(1);
              }}
              className={cn(
                "hover:text-foreground transition-colors",
                sort === key && "text-foreground font-semibold"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-16">Đang tải dossier...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-center text-muted-foreground py-16">
          Không có ý tưởng nào trong danh mục này.
        </p>
      )}

      <div className="flex justify-center items-center gap-1 mt-12 mb-4">
        <Button
          variant="ghost"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          &lt; Previous
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "outline" : "ghost"}
            className="w-10 h-10 p-0 rounded-full"
            onClick={() => setPage(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next &gt;
        </Button>
      </div>
    </div>
  );
}
