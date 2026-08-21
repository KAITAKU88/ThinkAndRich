"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Search,
  BookOpen,
  Filter,
  X,
  SlidersHorizontal,
  Video,
  Clock,
  RotateCcw,
  LayoutGrid,
  LayoutList,
  Eye,
  ThumbsUp,
  Bookmark,
  Crown,
  CheckCircle2,
  BookmarkCheck,
  EyeOff,
  Flame,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PostCard } from "@/components/ideas/IdeaCard";
import { useSession } from "@/store/session";
import { cn, formatViews, timeAgo } from "@/lib/utils";

type SortOption = "newest" | "views" | "likes" | "readTime";
type ReadTimeFilter = "ALL" | "SHORT" | "MEDIUM" | "LONG";
type MediaFilter = "ALL" | "HAS_VIDEO";
type ReadStatusFilter = "ALL" | "UNREAD" | "READ";
type MemberFilter = "ALL" | "FREE_ONLY" | "MEMBER_ONLY";

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCat = searchParams.get("category") || "Tất cả";

  const posts = useSession((s) => s.posts);
  const bookmarks = useSession((s) => s.bookmarks);
  const toggleBookmark = useSession((s) => s.toggleBookmark);
  const isPostRead = useSession((s) => s.isPostRead);
  const hideSavedPosts = useSession((s) => s.hideSavedPosts);
  const setHideSavedPosts = useSession((s) => s.setHideSavedPosts);
  const user = useSession((s) => s.user);
  const getTodayReadCount = useSession((s) => s.getTodayReadCount);
  const getDailyLimit = useSession((s) => s.getDailyLimit);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState<string>(initialQ);
  const [readTimeFilter, setReadTimeFilter] = useState<ReadTimeFilter>("ALL");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("ALL");
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>("ALL");
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("ALL");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const todayReadCount = user ? getTodayReadCount() : 0;
  const dailyLimit = user ? getDailyLimit() : 10;
  const isLimitInfinite = dailyLimit === Infinity;

  // Sync with searchParams
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
      setPage(1);
    }
    const cat = searchParams.get("category");
    if (cat !== null) {
      setSelectedCategory(cat);
      setPage(1);
    }
  }, [searchParams]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((p) => {
      p.tags?.forEach((t) => tagsSet.add(t.trim()));
    });
    return Array.from(tagsSet).slice(0, 14);
  }, [posts]);

  // Count saved & read
  const savedCount = useMemo(() => bookmarks.length, [bookmarks]);
  const readCount = useMemo(() => {
    if (!user) return 0;
    return posts.filter((p) => isPostRead(p.id)).length;
  }, [posts, isPostRead, user]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.status === "PUBLISHED");

    // 1. Auto-hide saved posts if enabled
    if (hideSavedPosts && user) {
      list = list.filter((p) => !bookmarks.includes(p.id));
    }

    // 2. Read status filter: Chưa đọc / Đã đọc / Toàn bộ
    if (readStatusFilter === "UNREAD" && user) {
      list = list.filter((p) => !isPostRead(p.id));
    } else if (readStatusFilter === "READ" && user) {
      list = list.filter((p) => isPostRead(p.id));
    }

    // 3. Member post filter
    if (memberFilter === "FREE_ONLY") {
      list = list.filter((p) => !p.isMemberOnly && !p.isPro);
    } else if (memberFilter === "MEMBER_ONLY") {
      list = list.filter((p) => p.isMemberOnly || p.isPro);
    }


    // 4. Category filter
    if (selectedCategory !== "Tất cả") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // 5. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 6. Tag filter
    if (selectedTag) {
      list = list.filter((p) => p.tags?.includes(selectedTag));
    }

    // 7. Media filter
    if (mediaFilter === "HAS_VIDEO") {
      list = list.filter((p) => Boolean(p.videoUrl));
    }

    // 8. Read time filter
    if (readTimeFilter !== "ALL") {
      list = list.filter((p) => {
        const minutes = parseInt(p.readTime) || 5;
        if (readTimeFilter === "SHORT") return minutes <= 5;
        if (readTimeFilter === "MEDIUM") return minutes > 5 && minutes <= 8;
        if (readTimeFilter === "LONG") return minutes > 8;
        return true;
      });
    }

    // 9. Sorting
    if (sortOption === "views") {
      list = [...list].sort((a, b) => b.views - a.views);
    } else if (sortOption === "likes") {
      list = [...list].sort((a, b) => b.likes - a.likes);
    } else if (sortOption === "readTime") {
      list = [...list].sort(
        (a, b) => (parseInt(a.readTime) || 0) - (parseInt(b.readTime) || 0)
      );
    } else {
      list = [...list].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
      );
    }

    return list;
  }, [
    posts,
    hideSavedPosts,
    bookmarks,
    user,
    readStatusFilter,
    isPostRead,
    memberFilter,
    selectedCategory,
    searchQuery,
    selectedTag,
    mediaFilter,
    readTimeFilter,
    sortOption,
  ]);


  const hasActiveFilters =
    selectedCategory !== "Tất cả" ||
    Boolean(searchQuery.trim()) ||
    selectedTag !== null ||
    mediaFilter !== "ALL" ||
    readTimeFilter !== "ALL" ||
    readStatusFilter !== "ALL" ||
    memberFilter !== "ALL" ||
    !hideSavedPosts;

  function resetAllFilters() {
    setSelectedCategory("Tất cả");
    setSearchQuery("");
    setSelectedTag(null);
    setMediaFilter("ALL");
    setReadTimeFilter("ALL");
    setReadStatusFilter("ALL");
    setMemberFilter("ALL");
    setHideSavedPosts(true);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Random model for spotlight
  const randomPost = useMemo(() => {
    if (posts.length === 0) return null;
    return posts[Math.floor(Math.random() * posts.length)];
  }, [posts]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Top Banner / Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/" className="hover:text-foreground transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Khám phá thư viện</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Thư viện Mô hình Tư duy & Chiến lược
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Tổng hợp và phân loại các quy luật nhận thức, mô hình ra quyết định và chiến lược kinh doanh.
          </p>
        </div>

        {/* User Daily Limit Status Card */}
        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm text-xs">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span>Lượt đọc hôm nay:</span>
                <span className="text-primary font-bold">
                  {isLimitInfinite
                    ? `${todayReadCount} bài (Không giới hạn)`
                    : `${todayReadCount}/${dailyLimit} bài`}
                </span>
                {user.tier === "PRO" && (
                  <Badge className="bg-amber-500 text-white text-[9px] px-1.5 py-0">Pro</Badge>
                )}
                {user.tier === "PLUS" && (
                  <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0">Plus</Badge>
                )}
              </div>
              {!isLimitInfinite && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <span>Gói {user.tier === "PLUS" ? "Plus (15 bài/ngày)" : "Free (10 bài/ngày)"}.</span>
                  <Link href="/pricing" className="text-primary font-medium hover:underline">
                    Nâng cấp Gói Pro &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Mobile Filter Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen((v) => !v)}
            className="flex-1 rounded-full gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Bộ lọc & Chuyên mục
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT SIDEBAR (STICKY FILTER PANEL) */}
        <aside
          className={cn(
            "w-full md:w-64 lg:w-72 shrink-0 space-y-6",
            !mobileFilterOpen && "hidden md:block"
          )}
        >
          <div className="sticky top-20 space-y-5 bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm">
            {/* Sidebar Title & Clear Button */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2 font-display font-bold text-sm">
                <Filter className="w-4 h-4 text-primary" />
                Bộ lọc Mô hình
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> Đặt lại
                </button>
              )}
            </div>

            {/* TOGGLE 1: AUTO-HIDE SAVED POSTS */}
            {user && (
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="hide-saved" className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <EyeOff className="w-3.5 h-3.5 text-primary" />
                    Ẩn bài đã lưu vào Tủ sách
                  </label>
                  <input
                    id="hide-saved"
                    type="checkbox"
                    checked={hideSavedPosts}
                    onChange={(e) => {
                      setHideSavedPosts(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Tự động ẩn {savedCount} bài bạn đã lưu để ưu tiên khám phá các bài viết mới.
                </p>
              </div>
            )}

            {/* FILTER 2: READ STATUS (CHƯA ĐỌC / ĐÃ ĐỌC / TOÀN BỘ) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Trạng thái đọc bài
              </label>
              <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-xl border border-border/60">
                {[
                  { id: "ALL", label: "Toàn bộ" },
                  { id: "UNREAD", label: "Chưa đọc" },
                  { id: "READ", label: "Đã đọc" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setReadStatusFilter(item.id as ReadStatusFilter);
                      setPage(1);
                    }}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center",
                      readStatusFilter === item.id
                        ? "bg-background text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER 3: CATEGORIES */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Chuyên mục
              </label>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const count =
                    cat === "Tất cả"
                      ? posts.length
                      : posts.filter((p) => p.category === cat).length;
                  const isSelected = selectedCategory === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setPage(1);
                        setMobileFilterOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left",
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <span className="truncate pr-2">{cat}</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FILTER 4: TIER FILTER (FREE / MEMBER) */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Phân loại bài viết
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "FREE_ONLY", label: "Miễn phí" },
                  { id: "MEMBER_ONLY", label: "👑 Member" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMemberFilter(item.id as MemberFilter);
                      setPage(1);
                    }}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-medium text-center border transition-all",
                      memberFilter === item.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>


            {/* FILTER 5: MEDIA TYPE */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Định dạng nội dung
              </label>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setMediaFilter("ALL");
                    setPage(1);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                    mediaFilter === "ALL"
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span>Tất cả định dạng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaFilter("HAS_VIDEO");
                    setPage(1);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                    mediaFilter === "HAS_VIDEO"
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-rose-500" />
                    Có Video YouTube nhúng
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {posts.filter((p) => Boolean(p.videoUrl)).length}
                  </span>
                </button>
              </div>
            </div>

            {/* FILTER 6: READ TIME */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Thời lượng đọc
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "SHORT", label: "≤ 5 phút" },
                  { id: "MEDIUM", label: "6 - 8 phút" },
                  { id: "LONG", label: "> 8 phút" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setReadTimeFilter(item.id as ReadTimeFilter);
                      setPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium text-center border transition-all",
                      readTimeFilter === item.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/60 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER 7: POPULAR TAGS */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Thẻ chủ đề phổ biến
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTag(isSelected ? null : tag);
                        setPage(1);
                      }}
                      className={cn(
                        "text-[11px] px-2.5 py-1 rounded-full border transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-semibold"
                          : "bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spotlight Random Widget */}
            {randomPost && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gợi ý ngẫu nhiên
                </div>
                <h4 className="text-xs font-semibold line-clamp-2 text-foreground">
                  {randomPost.title}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-[11px] rounded-full border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <Link href={`/post/${randomPost.id}`}>
                    Đọc ngay &rarr;
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Top Control Bar: Search, Stats, Sort, View Mode */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Internal Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm theo tiêu đề, tác giả, chiến lược..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 pr-8 h-10 rounded-full bg-muted/40 text-xs sm:text-sm border-border/80 focus-visible:ring-primary"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown & View Mode */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value as SortOption);
                    setPage(1);
                  }}
                  className="h-10 px-3 rounded-full bg-muted/40 border border-border/80 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="views">Xem nhiều nhất</option>
                  <option value="likes">Yêu thích nhất</option>
                  <option value="readTime">Thời gian đọc ngắn nhất</option>
                </select>

                {/* Grid / List Mode */}
                <div className="hidden sm:flex items-center border border-border/80 rounded-full p-0.5 bg-muted/30">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setViewMode("grid")}
                    title="Hiển thị dạng lưới"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setViewMode("list")}
                    title="Hiển thị dạng danh sách"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60 text-xs">
                <span className="text-muted-foreground font-medium text-[11px]">
                  Đang lọc:
                </span>

                {hideSavedPosts && user && savedCount > 0 && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    Đang ẩn {savedCount} bài đã lưu
                    <button
                      type="button"
                      onClick={() => setHideSavedPosts(false)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {readStatusFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    {readStatusFilter === "UNREAD" ? "Chưa đọc" : "Đã đọc"}
                    <button
                      type="button"
                      onClick={() => setReadStatusFilter("ALL")}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {memberFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    {memberFilter === "MEMBER_ONLY" ? "👑 Bài Member" : "Bài miễn phí"}
                    <button
                      type="button"
                      onClick={() => setMemberFilter("ALL")}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}


                {selectedCategory !== "Tất cả" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    {selectedCategory}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("Tất cả")}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {searchQuery.trim() && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    &quot;{searchQuery}&quot;
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {selectedTag && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    #{selectedTag}
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {mediaFilter === "HAS_VIDEO" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    Có Video
                    <button
                      type="button"
                      onClick={() => setMediaFilter("ALL")}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                {readTimeFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1 rounded-full text-xs">
                    {readTimeFilter === "SHORT"
                      ? "≤ 5 phút"
                      : readTimeFilter === "MEDIUM"
                      ? "6 - 8 phút"
                      : "> 8 phút"}
                    <button
                      type="button"
                      onClick={() => setReadTimeFilter("ALL")}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}

                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[11px] text-primary hover:underline ml-auto font-medium"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Results Count Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Hiển thị <strong>{paginatedPosts.length}</strong> / <strong>{filteredPosts.length}</strong> mô hình tư duy & chiến lược
            </span>
            {user && (
              <span>
                (Đã lưu: <strong>{savedCount}</strong> | Đã đọc: <strong>{readCount}</strong>)
              </span>
            )}
          </div>

          {/* POSTS DISPLAY (GRID OR LIST) */}
          {paginatedPosts.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              /* LIST VIEW MODE */
              <div className="space-y-4">
                {paginatedPosts.map((post) => {
                  const isSaved = bookmarks.includes(post.id);
                  const isRead = isPostRead(post.id);
                  return (
                    <Card
                      key={post.id}
                      className="overflow-hidden hover:border-primary/40 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row items-stretch">
                        <div className="sm:w-56 h-44 sm:h-auto shrink-0 relative overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                            <Badge className="bg-background/90 text-foreground backdrop-blur-md text-[10px]">
                              {post.category}
                            </Badge>
                            {(post.isMemberOnly || post.isPro) && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-[9px] px-1.5 py-0 border-none">
                                <Crown className="w-2.5 h-2.5 mr-0.5" /> MEMBER
                              </Badge>
                            )}
                          </div>

                          {isRead && (
                            <Badge className="absolute top-3 right-3 bg-emerald-600 text-white text-[9px] font-medium border-none flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Đã đọc
                            </Badge>
                          )}
                          {post.videoUrl && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white rounded-full p-1">
                              <Video className="w-3.5 h-3.5 text-rose-400" />
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {post.readTime}
                              </span>
                              <span>•</span>
                              <span>{timeAgo(post.createdAt)}</span>
                            </div>
                            <Link href={`/post/${post.id}`}>
                              <h3 className="font-display font-bold text-base md:text-lg group-hover:text-primary transition-colors line-clamp-1">
                                {post.title}
                              </h3>
                            </Link>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {post.shortDescription}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                            <div className="flex items-center gap-4 text-muted-foreground font-mono">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-primary" /> {formatViews(post.views)}
                              </span>
                              <span className="flex items-center gap-1 text-emerald-600">
                                <ThumbsUp className="w-3.5 h-3.5" /> {post.likes}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleBookmark(post.id);
                                }}
                              >
                                <Bookmark
                                  className={cn("w-3.5 h-3.5", isSaved && "fill-primary text-primary")}
                                />
                              </Button>
                              <Button size="sm" className="rounded-full text-xs h-8 px-4" asChild>
                                <Link href={`/post/${post.id}`}>Đọc bài</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          ) : (
            /* EMPTY STATE */
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border p-8">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-lg mb-1">
                Không tìm thấy mô hình nào
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5 leading-relaxed">
                {hideSavedPosts && savedCount > 0
                  ? `Có thể các bài viết phù hợp đã được bạn lưu vào Tủ sách (${savedCount} bài). Hãy thử tắt tùy chọn "Ẩn bài đã lưu" hoặc đặt lại bộ lọc.`
                  : "Không có mô hình nào khớp với các tiêu chí tìm kiếm và bộ lọc hiện tại."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {hideSavedPosts && (
                  <Button variant="outline" onClick={() => setHideSavedPosts(false)} className="rounded-full">
                    <BookmarkCheck className="w-4 h-4 mr-2" /> Hiện các bài đã lưu ({savedCount})
                  </Button>
                )}
                <Button onClick={resetAllFilters} className="rounded-full">
                  <RotateCcw className="w-4 h-4 mr-2" /> Đặt lại tất cả bộ lọc
                </Button>
              </div>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-8 pb-4">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-3 text-xs"
                disabled={currentPage <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                &larr; Trước
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "ghost"}
                  className="w-9 h-9 p-0 rounded-full text-xs font-semibold"
                  onClick={() => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-3 text-xs"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Sau &rarr;
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export function ExplorePage() {
  return (
    <Suspense fallback={<div className="container mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground text-sm">Đang tải thư viện mô hình tư duy...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
