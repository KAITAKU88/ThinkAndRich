"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  Brain,
  Compass,
  ArrowRight,
  ShieldCheck,
  BookmarkCheck,
  RotateCcw,
} from "lucide-react";

import { CATEGORIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/ideas/IdeaCard";
import { useSession, type ReadStatusFilter } from "@/store/session";
import { cn } from "@/lib/utils";
import { getTranslation } from "@/lib/i18n/translations";

type SortKey = "newest" | "views" | "likes";

function HomePageContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const posts = useSession((s) => s.posts);
  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const hideSavedPosts = useSession((s) => s.hideSavedPosts);
  const setHideSavedPosts = useSession((s) => s.setHideSavedPosts);
  const isPostRead = useSession((s) => s.isPostRead);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);

  const t = getTranslation(language);

  const [category, setCategory] = useState<string>("Tất cả");
  const [readStatus, setReadStatus] = useState<ReadStatusFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("newest");
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
      setPage(1);
    }
  }, [searchParams]);

  // Filter and sort posts from store
  const filteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.status === "PUBLISHED");

    // 1. Hide bookmarked posts
    if (hideSavedPosts && user) {
      list = list.filter((p) => !bookmarks.includes(p.id));
    }

    // 2. Read status
    if (readStatus === "UNREAD" && user) {
      list = list.filter((p) => !isPostRead(p.id));
    } else if (readStatus === "READ" && user) {
      list = list.filter((p) => isPostRead(p.id));
    }

    // 3. Category
    if (category !== "Tất cả") {
      list = list.filter((p) => p.category === category);
    }

    // 4. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // 5. Sort
    return list.sort((a, b) => {
      if (sort === "views") return b.views - a.views;
      if (sort === "likes") return b.likes - a.likes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [
    posts,
    category,
    searchQuery,
    sort,
    hideSavedPosts,
    readStatus,
    bookmarks,
    user,
    isPostRead,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, i) => i + 1),
    [totalPages]
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <Badge
          variant="secondary"
          className="mb-6 rounded-full px-4 py-1.5 border border-primary/20 bg-primary/5 text-primary text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          {t.hero.badge}
        </Badge>

        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5 max-w-4xl mx-auto leading-[1.15] text-foreground">
          {t.hero.title}
        </h1>

        <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Button size="lg" className="rounded-full px-7 font-semibold shadow-md gap-2" asChild>
            <Link href="/explore">
              <Compass className="w-4 h-4" /> {t.hero.exploreBtn} &rarr;
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-6" asChild>
            <Link href="/pricing">{t.hero.pricingBtn}</Link>
          </Button>
        </div>

        {/* Quick Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium pt-2">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-primary" />
            <span>{t.hero.highlight1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-primary" />
            <span>{t.hero.highlight2}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>{t.hero.highlight3}</span>
          </div>
        </div>
      </section>


      {/* Categories & Filter Control Toolbar */}
      <div
        id="models-grid"
        className="space-y-4 border-b border-border pb-4 mb-8 scroll-mt-24"
      >
        {/* Row 1: Categories */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={category === cat ? "default" : "outline"}
                className={cn(
                  "rounded-full shrink-0 text-xs md:text-sm font-medium transition-all",
                  category === cat && "shadow-sm"
                )}
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs md:text-sm font-medium text-muted-foreground shrink-0">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/70">Sắp xếp:</span>
            {(
              [
                ["newest", "Mới nhất"],
                ["views", "Xem nhiều nhất"],
                ["likes", "Yêu thích nhất"],
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
                  sort === key && "text-primary font-bold underline underline-offset-4"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Read Status Filters & Hide Saved Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          {/* Read status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Trạng thái:</span>
            <div className="flex items-center bg-muted/60 p-0.5 rounded-full border border-border/60">
              {(
                [
                  ["ALL", "Toàn bộ"],
                  ["UNREAD", "Chưa đọc"],
                  ["READ", "Đã đọc"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setReadStatus(id);
                    setPage(1);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all",
                    readStatus === id
                      ? "bg-background text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Hide Saved Checkbox */}
          {user && bookmarks.length > 0 && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={hideSavedPosts}
                onChange={(e) => {
                  setHideSavedPosts(e.target.checked);
                  setPage(1);
                }}
                className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
              />
              <span className="text-xs font-medium">
                Ẩn {bookmarks.length} bài đã lưu vào Tủ sách
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Posts Cards Grid */}
      {paginatedPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {paginatedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-lg mb-1">
            Không tìm thấy mô hình nào
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {hideSavedPosts && bookmarks.length > 0
              ? `Có thể các bài viết phù hợp đã được bạn lưu vào Tủ sách (${bookmarks.length} bài). Hãy thử tắt tùy chọn "Ẩn bài đã lưu".`
              : "Không có bài viết nào khớp với bộ lọc hiện tại."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {hideSavedPosts && bookmarks.length > 0 && (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setHideSavedPosts(false)}
              >
                <BookmarkCheck className="w-4 h-4 mr-2" /> Hiện bài đã lưu ({bookmarks.length})
              </Button>
            )}
            <Button
              className="rounded-full"
              onClick={() => {
                setCategory("Tất cả");
                setReadStatus("ALL");
                setSearchQuery("");
                setHideSavedPosts(false);
                setPage(1);
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Đặt lại bộ lọc
            </Button>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4 text-xs font-medium"
            disabled={currentPage <= 1}
            onClick={() => {
              setPage((p) => Math.max(1, p - 1));
              const el = document.getElementById("models-grid");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            &larr; Trang trước
          </Button>

          <div className="flex items-center gap-1">
            {pages.map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? "default" : "ghost"}
                className="w-8 h-8 p-0 rounded-full text-xs font-semibold"
                onClick={() => {
                  setPage(p);
                  const el = document.getElementById("models-grid");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {p}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-4 text-xs font-medium"
            disabled={currentPage >= totalPages}
            onClick={() => {
              setPage((p) => Math.min(totalPages, p + 1));
              const el = document.getElementById("models-grid");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Trang sau &rarr;
          </Button>
        </div>
      )}

      {/* Bottom Conversion Banner */}
      {!user && (
        <section className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <Badge className="bg-primary/20 text-primary border-none">
              Dành cho mọi người
            </Badge>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Bắt đầu hành trình nâng cấp tư duy với Think & Rich
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Đăng nhập chỉ với 1 bước xác thực Email OTP để đọc 10 bài viết tiêu chuẩn mỗi ngày hoặc nâng cấp Hội viên để mở khóa toàn bộ kho tàng tri thức.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="rounded-full px-8 font-semibold shadow-md"
                onClick={() => setAuthOpen(true)}
              >
                Đăng nhập nhận mã OTP ngay <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6"
                asChild
              >
                <Link href="/pricing">Bảng gói Hội viên</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export function HomePage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground text-sm">Đang tải mô hình tư duy...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
