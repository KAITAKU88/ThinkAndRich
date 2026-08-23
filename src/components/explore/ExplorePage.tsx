"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  BookOpen,
  Filter,
  X,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  ChevronDown,
  Flame,
  Brain,
  Compass,
  Lightbulb,
} from "lucide-react";
import type { PillarType, Post, CardDisplaySize } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { SkylineSpine } from "@/components/ideas/SkylineSpine";
import {
  generateSkylineSlots,
  assignPostsToSkylineSlots,
  paginateSkylineRows,
  type SlottedPost,
} from "@/lib/algorithms/skyline-packer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";

type PillarFilter = "ALL" | PillarType;
type AccessFilter = "ALL" | "FREE" | "PLUS" | "PRO";
type SortOption = "DATE_DESC" | "DATE_ASC" | "VIEWS_DESC" | "VIEWS_ASC" | "LIKES_DESC" | "LIKES_ASC";
type ReadStatusFilter = "ALL" | "UNREAD" | "READ";

// Post.accessLevel stores "MEMBER_PLUS"/"MEMBER_PRO"; the filter UI speaks
// the shorter "PLUS"/"PRO" people actually recognize from the pricing page.
const ACCESS_LEVEL_MAP: Record<Exclude<AccessFilter, "ALL">, Post["accessLevel"]> = {
  FREE: "FREE",
  PLUS: "MEMBER_PLUS",
  PRO: "MEMBER_PRO",
};

// Floor for how many cards a page must accumulate before it's allowed to
// cut at a flat skyline boundary — keeps pages from being tiny even when a
// flat line appears early.
const MIN_CARDS_PER_PAGE = 10;

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialPillar = (searchParams.get("pillar") as PillarFilter) || "ALL";

  const posts = useSession((s) => s.posts);
  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const hideSavedPosts = useSession((s) => s.hideSavedPosts);
  const setHideSavedPosts = useSession((s) => s.setHideSavedPosts);
  const isPostRead = useSession((s) => s.isPostRead);
  const getTodayReadCount = useSession((s) => s.getTodayReadCount);
  const getDailyLimit = useSession((s) => s.getDailyLimit);

  // Base filters — same shape and same bar as Trang chủ, always active.
  // Turning "Bộ lọc nâng cao" off leaves only these four controls, which
  // is what makes that state byte-for-byte the Trang chủ experience.
  const [pillarFilter, setPillarFilter] = useState<PillarFilter>(initialPillar);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("DATE_DESC");
  const [numCols, setNumCols] = useState(12);

  // Advanced-only filters — layered on top of the base set, and only
  // consulted while the sidebar is open.
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(initialQ));
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<"ALL" | CardDisplaySize>("ALL");
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const todayReadCount = user ? getTodayReadCount() : 0;
  const dailyLimit = user ? getDailyLimit() : 10;
  const isLimitInfinite = dailyLimit === Infinity;

  // A query arriving via ?q= (header search "Xem toàn bộ") implies the
  // visitor wants search results, not the plain bento wall — open the
  // advanced panel for them automatically.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
      setAdvancedOpen(true);
      setPage(1);
    }
  }, [searchParams]);

  // Responsive column count for the bento micro-grid, by viewport breakpoint.
  useEffect(() => {
    function updateCols() {
      const w = window.innerWidth;
      if (w < 640) setNumCols(4);
      else if (w < 1024) setNumCols(8);
      else setNumCols(12);
    }
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  // Cell size for the bento grid, measured from the grid's own actual
  // rendered width rather than derived in pure CSS. The old approach set
  // grid-auto-rows via a container-query calc that referenced the grid's
  // own inline-size — correct on its own, but once "Bộ lọc nâng cao" put
  // this grid next to a sidebar, that self-referencing calc no longer
  // tracked the real (narrowed) width, so cells stopped being square.
  // ResizeObserver reads the width after real layout, so it's correct
  // however the grid happens to be nested.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    function applyCellSize() {
      if (!el) return;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const width = el.clientWidth;
      if (width > 0) {
        const cell = (width - gap * (numCols - 1)) / numCols;
        el.style.setProperty("--cell", `${cell}px`);
      }
    }

    applyCellSize();
    const observer = new ResizeObserver(applyCellSize);
    observer.observe(el);
    return () => observer.disconnect();
    // advancedOpen is included because toggling it swaps the grid into a
    // differently-structured layout (sidebar next to it or not), which
    // remounts this element under a new ref binding.
  }, [numCols, advancedOpen]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach((p) => p.tags?.forEach((t) => tagsSet.add(t.trim())));
    return Array.from(tagsSet).slice(0, 16);
  }, [posts]);

  // 1. Base filter + sort pass — pillar / access / hide-saved / sort.
  const baseFilteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.status === "PUBLISHED");

    if (hideSavedPosts && user) list = list.filter((p) => !bookmarks.includes(p.id));
    if (pillarFilter !== "ALL") list = list.filter((p) => p.pillar === pillarFilter);
    if (accessFilter !== "ALL") list = list.filter((p) => p.accessLevel === ACCESS_LEVEL_MAP[accessFilter]);

    list = [...list].sort((a, b) => {
      switch (sortOption) {
        case "DATE_DESC":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "DATE_ASC":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "VIEWS_DESC":
          return b.views - a.views;
        case "VIEWS_ASC":
          return a.views - b.views;
        case "LIKES_DESC":
          return b.likes - a.likes;
        case "LIKES_ASC":
          return a.likes - b.likes;
        default:
          return 0;
      }
    });

    return list;
  }, [posts, hideSavedPosts, user, bookmarks, pillarFilter, accessFilter, sortOption]);

  const pillarCounts = useMemo(
    () => ({
      ALL: posts.filter((p) => p.status === "PUBLISHED").length,
      MENTAL_MODEL: posts.filter((p) => p.status === "PUBLISHED" && p.pillar === "MENTAL_MODEL").length,
      BUSINESS_STRATEGY: posts.filter((p) => p.status === "PUBLISHED" && p.pillar === "BUSINESS_STRATEGY").length,
      STARTUP_IDEA: posts.filter((p) => p.status === "PUBLISHED" && p.pillar === "STARTUP_IDEA").length,
    }),
    [posts]
  );

  // 2. Advanced narrowing — search / tag / size / read-status. A no-op
  // (returns the base list untouched) whenever the sidebar is closed.
  const advancedFilteredPosts = useMemo(() => {
    if (!advancedOpen) return baseFilteredPosts;
    let list = baseFilteredPosts;

    if (readStatusFilter === "UNREAD" && user) list = list.filter((p) => !isPostRead(p.id));
    else if (readStatusFilter === "READ" && user) list = list.filter((p) => isPostRead(p.id));

    if (selectedSize !== "ALL") list = list.filter((p) => (p.displaySize || "SQUARE_SM") === selectedSize);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summarySnippet?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.academicFormula?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTag) list = list.filter((p) => p.tags?.includes(selectedTag));

    return list;
  }, [advancedOpen, baseFilteredPosts, readStatusFilter, user, isPostRead, selectedSize, searchQuery, selectedTag]);

  const hasActiveAdvancedFilters =
    Boolean(searchQuery.trim()) || selectedTag !== null || selectedSize !== "ALL" || readStatusFilter !== "ALL";

  function resetAdvancedFilters() {
    setSearchQuery("");
    setSelectedTag(null);
    setSelectedSize("ALL");
    setReadStatusFilter("ALL");
    setPage(1);
  }

  function resetAllFilters() {
    setPillarFilter("ALL");
    setAccessFilter("ALL");
    setSortOption("DATE_DESC");
    setHideSavedPosts(false);
    resetAdvancedFilters();
  }

  // 3. Pack the WHOLE relevant list once — same pass whether the sidebar is
  // open or not, so a post's card size/position never depends on which
  // page it lands on. Pagination (when on) only decides which finished
  // rows of that one layout are currently shown.
  const gridSourcePosts = advancedOpen ? advancedFilteredPosts : baseFilteredPosts;

  const { slots, fillers } = useMemo(() => {
    if (gridSourcePosts.length === 0) return { slots: [], fillers: [] };
    return generateSkylineSlots(gridSourcePosts.length, numCols);
  }, [gridSourcePosts.length, numCols]);

  const slottedPosts: SlottedPost[] = useMemo(
    () => assignPostsToSkylineSlots(gridSourcePosts, slots),
    [gridSourcePosts, slots]
  );

  // Cut only where the skyline's bottom edge is flat (no card straddles the
  // line), and only once a page has accumulated at least MIN_CARDS_PER_PAGE
  // cards — never at an arbitrary card count, which is what produced the
  // jagged, staggered-bottom pages before.
  const pageCuts = useMemo(
    () => (advancedOpen ? paginateSkylineRows(slots, fillers, MIN_CARDS_PER_PAGE) : [0]),
    [advancedOpen, slots, fillers]
  );
  const totalPages = Math.max(1, pageCuts.length - 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const rowStart = advancedOpen ? pageCuts[currentPage - 1] : 0;
  const rowEnd = advancedOpen ? pageCuts[currentPage] : Infinity;

  const pageSlottedPosts = advancedOpen
    ? slottedPosts
        .filter((item) => item.slot.row >= rowStart && item.slot.row < rowEnd)
        .map((item) => ({ ...item, slot: { ...item.slot, row: item.slot.row - rowStart } }))
    : slottedPosts;
  const pageFillers = advancedOpen
    ? fillers
        .filter((f) => f.row >= rowStart && f.row < rowEnd)
        .map((f) => ({ ...f, row: f.row - rowStart }))
    : fillers;

  const bentoGrid =
    pageSlottedPosts.length > 0 ? (
      <div className="skyline-grid pb-4" ref={gridRef}>
        {pageSlottedPosts.map((item, idx) => (
          <InteractiveSquareCard
            key={`${item.post.id}-${item.slot.id}-${idx}`}
            post={item.post}
            slot={item.slot}
            priorityIndex={idx}
          />
        ))}
        {pageFillers.map((filler) => (
          <SkylineSpine key={filler.id} filler={filler} />
        ))}
      </div>
    ) : null;

  return (
    <div className="container mx-auto max-w-[1650px] px-2.5 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Header Bar — giữ nguyên */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/" className="hover:text-foreground transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Khám phá 3 Trụ cột</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Tra Cứu Trí Tuệ Chiến Lược & Mô Hình Tư Duy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Bộ lọc đa chiều phục vụ nghiên cứu học thuật, định giá mô hình và hoạch định chiến lược.
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm text-xs">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span>Hôm nay:</span>
                <span className="text-primary font-bold">
                  {isLimitInfinite ? `${todayReadCount} bài (Không giới hạn)` : `${todayReadCount}/${dailyLimit} bài`}
                </span>
                {user.tier === "PRO" && (
                  <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 border-none font-bold">PRO</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Base filter bar — cùng 4 điều khiển với Trang chủ, cộng thêm nút
          "Bộ lọc nâng cao". Khi tắt, phần dưới y hệt Trang chủ hiện tại. */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b border-border/70">
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 rounded-full text-xs font-semibold shadow-sm">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                {pillarFilter === "ALL"
                  ? "Tất cả Trụ cột"
                  : pillarFilter === "MENTAL_MODEL"
                  ? "Mô hình Tư duy"
                  : pillarFilter === "BUSINESS_STRATEGY"
                  ? "Chiến lược"
                  : "Khởi nghiệp"}
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Chọn trụ cột</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={pillarFilter}
                onValueChange={(v) => {
                  setPillarFilter(v as PillarFilter);
                  setPage(1);
                }}
              >
                <DropdownMenuRadioItem value="ALL">Tất cả ({pillarCounts.ALL})</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="MENTAL_MODEL">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-rose-500" />
                    Mô hình Tư duy
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="BUSINESS_STRATEGY">
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-amber-500" />
                    Chiến lược
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="STARTUP_IDEA">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
                    Khởi nghiệp
                  </div>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {user && bookmarks.length > 0 && (
            <label className="hidden sm:inline-flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground text-xs select-none mr-2">
              <input
                type="checkbox"
                checked={hideSavedPosts}
                onChange={(e) => setHideSavedPosts(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
              />
              <span>Ẩn đã lưu ({bookmarks.length})</span>
            </label>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 rounded-full text-xs font-semibold shadow-sm">
                {accessFilter === "ALL" ? "Tất cả gói" : `Gói: ${accessFilter}`}
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Quyền truy cập</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={accessFilter}
                onValueChange={(v) => {
                  setAccessFilter(v as AccessFilter);
                  setPage(1);
                }}
              >
                <DropdownMenuRadioItem value="ALL">Tất cả</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="FREE">Free</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PLUS">Plus</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PRO">Pro</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 rounded-full text-xs font-semibold shadow-sm">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                Sắp xếp
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={sortOption}
                onValueChange={(v) => {
                  setSortOption(v as SortOption);
                  setPage(1);
                }}
              >
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Theo ngày xuất bản</DropdownMenuLabel>
                <DropdownMenuRadioItem value="DATE_DESC">Mới nhất → Cũ nhất</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="DATE_ASC">Cũ nhất → Mới nhất</DropdownMenuRadioItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Theo lượt xem</DropdownMenuLabel>
                <DropdownMenuRadioItem value="VIEWS_DESC">Cao → Thấp</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="VIEWS_ASC">Thấp → Cao</DropdownMenuRadioItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Theo lượt thích</DropdownMenuLabel>
                <DropdownMenuRadioItem value="LIKES_DESC">Cao → Thấp</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="LIKES_ASC">Thấp → Cao</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bộ lọc nâng cao — điều khiển duy nhất Trang chủ không có. */}
          <Button
            variant={advancedOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="h-8 gap-1.5 rounded-full text-xs font-semibold shadow-sm relative"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bộ lọc nâng cao</span>
            {hasActiveAdvancedFilters && !advancedOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </div>
      </div>

      {advancedOpen ? (
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar — chỉ còn những bộ lọc mà thanh trên chưa có */}
          <aside className="w-full md:w-64 lg:w-72 shrink-0 space-y-5">
            <div className="sticky top-20 space-y-4 bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2 font-display font-bold text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-primary" /> Lọc nâng cao
                </div>
                {hasActiveAdvancedFilters && (
                  <button
                    type="button"
                    onClick={resetAdvancedFilters}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" /> Đặt lại
                  </button>
                )}
              </div>

              {user && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Trạng thái đọc
                  </label>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {[
                      { id: "ALL", label: "Tất cả" },
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
                          "py-1 px-1 rounded-lg text-[10px] font-medium border text-center transition-all",
                          readStatusFilter === item.id
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border/60 text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-3 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Kích thước / Định dạng thẻ
                </label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {(
                    [
                      { id: "ALL", label: "Tất cả" },
                      { id: "SQUARE_SM", label: "Compact" },
                      { id: "SQUARE_MD", label: "Medium" },
                      { id: "SQUARE_LG", label: "Dossier" },
                    ] satisfies { id: "ALL" | CardDisplaySize; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedSize(item.id);
                        setPage(1);
                      }}
                      className={cn(
                        "py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-all",
                        selectedSize === item.id
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border/60 text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-border/60">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Thẻ chủ đề
                </label>
                <div className="flex flex-wrap gap-1">
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
                          "text-[10px] px-2 py-0.5 rounded-md border transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-semibold"
                            : "bg-secondary text-muted-foreground border-border/60 hover:text-foreground"
                        )}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Nội dung chính */}
          <main className="flex-1 min-w-0 space-y-4">
            {/* Không đặt thêm ô tìm kiếm ở đây — header đã có sẵn (Ctrl+K),
                điều hướng tới đây kèm ?q= và tự bật khu này lên. Chỉ hiện
                lại từ khóa đang lọc dưới dạng chip để biết & xoá nhanh. */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1 gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Tìm thấy <strong>{advancedFilteredPosts.length}</strong> hồ sơ tri thức
                </span>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium"
                    title="Xóa từ khóa tìm kiếm"
                  >
                    <Search className="w-3 h-3" />
                    &quot;{searchQuery.trim()}&quot;
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {hasActiveAdvancedFilters && (
                <button
                  type="button"
                  onClick={resetAdvancedFilters}
                  className="text-primary hover:underline font-medium text-[11px]"
                >
                  Xóa bộ lọc nâng cao
                </button>
              )}
            </div>

            {bentoGrid ? (
              <>
                {bentoGrid}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2 pb-8">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 text-xs"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </Button>
                    <span className="text-xs text-muted-foreground font-mono px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full h-8 text-xs"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border p-6">
                <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <h3 className="font-display font-semibold text-base mb-1">Không tìm thấy kết quả phù hợp</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Hãy thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.
                </p>
                <Button size="sm" className="rounded-full text-xs" onClick={resetAdvancedFilters}>
                  Đặt lại bộ lọc
                </Button>
              </div>
            )}
          </main>
        </div>
      ) : bentoGrid ? (
        <div className="pb-8">{bentoGrid}</div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8 max-w-md mx-auto">
          <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-base mb-1">Không có thẻ tri thức phù hợp</h3>
          <p className="text-xs text-muted-foreground mb-4">Hãy thử chọn lại trụ cột hoặc đổi gói truy cập.</p>
          <Button size="sm" className="rounded-full text-xs" onClick={resetAllFilters}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Đặt lại bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
}

export function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-7xl px-4 py-16 text-center text-muted-foreground text-sm">
          Đang tải thư viện...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
