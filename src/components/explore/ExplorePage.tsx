"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  LayoutGrid,
  X,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  ChevronDown,
  Flame,
  Brain,
  Compass,
  Lightbulb,
  CheckCircle2,
  Hash,
} from "lucide-react";
import type { PillarType, Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { SkylineSpine } from "@/components/ideas/SkylineSpine";
import {
  generateSkylineSlots,
  assignPostsToSkylineSlots,
  paginateSkylineRows,
  MIN_CARDS_PER_PAGE,
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
import { usePosts } from "@/lib/hooks/use-posts";
import { cn } from "@/lib/utils";
import { getTranslation, type TranslationDictionary } from "@/lib/i18n/translations";

type PillarFilter = "ALL" | PillarType;
type AccessFilter = "ALL" | "OPEN" | "FREE" | "PLUS" | "PRO";
type SortOption = "DATE_DESC" | "DATE_ASC" | "VIEWS_DESC" | "VIEWS_ASC" | "LIKES_DESC" | "LIKES_ASC";
type ReadStatusFilter = "ALL" | "UNREAD" | "READ";

// Post.accessLevel stores "MEMBER_PLUS"/"MEMBER_PRO"; the filter UI speaks
// the shorter "PLUS"/"PRO" people actually recognize from the pricing page.
const ACCESS_LEVEL_MAP: Record<Exclude<AccessFilter, "ALL">, Post["accessLevel"]> = {
  OPEN: "OPEN",
  FREE: "FREE",
  PLUS: "MEMBER_PLUS",
  PRO: "MEMBER_PRO",
};

// The noun in "Có N ..." tracks which trụ cột is selected, so the count
// reads as "25 chiến lược kinh doanh" rather than a generic "25 hồ sơ" once
// the list is already known to be one specific pillar.
function resultNoun(t: TranslationDictionary, pillar: PillarFilter): string {
  switch (pillar) {
    case "MENTAL_MODEL":
      return t.explore.resultNounMental;
    case "BUSINESS_STRATEGY":
      return t.explore.resultNounStrategy;
    case "STARTUP_IDEA":
      return t.explore.resultNounStartup;
    default:
      return t.explore.resultNounAll;
  }
}

// Same rose/amber/emerald each pillar already wears everywhere else (card
// icon chips, dropdown list icons) — the trigger and the selected row
// borrow it too, instead of the dropdown staying neutral while its own
// open list is the colorful part.
function pillarStyle(t: TranslationDictionary): Record<
  PillarType,
  { icon: typeof Brain; label: string; trigger: string; row: string }
> {
  return {
    MENTAL_MODEL: {
      icon: Brain,
      label: t.pillars.mentalModel,
      trigger: "border-rose-500/40 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-400",
      row: "bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold",
    },
    BUSINESS_STRATEGY: {
      icon: Compass,
      label: t.pillars.businessStrategy,
      trigger: "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400",
      row: "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold",
    },
    STARTUP_IDEA: {
      icon: Lightbulb,
      label: t.pillars.startupIdea,
      trigger: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400",
      row: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold",
    },
  };
}

// Same accent the FREE/PLUS/PRO badges already wear on cards — pulled
// from the --tier-plus / --tier-pro tokens in globals.css so the dropdown
// and the badges never drift out of sync. FREE has no entry on purpose:
// it stays neutral, same as the badge.
const TIER_ACCENT_VAR: Record<"PLUS" | "PRO", string> = {
  PLUS: "var(--tier-plus)",
  PRO: "var(--tier-pro)",
};

// How many topic-tag chips the "Thẻ chủ đề" filter shows at once.
const TAG_LIMIT = 16;

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialPillar = (searchParams.get("pillar") as PillarFilter) || "ALL";

  const { posts } = usePosts({ pageSize: 200 });
  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const hideSavedPosts = useSession((s) => s.hideSavedPosts);
  const setHideSavedPosts = useSession((s) => s.setHideSavedPosts);
  const isPostRead = useSession((s) => s.isPostRead);
  const getTodayReadCount = useSession((s) => s.getTodayReadCount);
  const getDailyLimit = useSession((s) => s.getDailyLimit);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  const PILLAR_STYLE = pillarStyle(t);

  const [pillarFilter, setPillarFilter] = useState<PillarFilter>(initialPillar);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("DATE_DESC");
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>("ALL");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [numCols, setNumCols] = useState(12);
  const [page, setPage] = useState(1);

  const todayReadCount = user ? getTodayReadCount() : 0;
  const dailyLimit = user ? getDailyLimit() : 10;
  const isLimitInfinite = dailyLimit === Infinity;

  // A query arriving via ?q= (header search "Xem toàn bộ") should filter
  // immediately — there's no dedicated search box on this page itself.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchQuery(q);
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
  // rendered width rather than derived in pure CSS (a self-referencing
  // container-query calc broke as soon as this grid sat next to any
  // sibling that changed its available width — ResizeObserver reads the
  // real post-layout width instead, so it's correct however it's nested).
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
  }, [numCols]);

  // 1. Pillar / access / hide-saved — what the tag cloud below is computed
  // from, so a chosen tag never dead-ends into 0 results, and what every
  // other filter narrows further.
  const baseFilteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.status === "PUBLISHED");
    if (hideSavedPosts && user) list = list.filter((p) => !bookmarks.includes(p.id));
    if (pillarFilter !== "ALL") list = list.filter((p) => p.pillar === pillarFilter);
    if (accessFilter !== "ALL") list = list.filter((p) => p.accessLevel === ACCESS_LEVEL_MAP[accessFilter]);
    return list;
  }, [posts, hideSavedPosts, user, bookmarks, pillarFilter, accessFilter]);

  // Which topic tags show here, and in what order: only tags that actually
  // appear on a post matching the trụ cột/gói/ẩn-đã-lưu selection above,
  // ranked by how many of those posts carry it (most-used first), capped
  // so the list stays scannable rather than growing without bound.
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    baseFilteredPosts.forEach((p) =>
      p.tags?.forEach((raw) => {
        const t = raw.trim();
        if (!t) return;
        counts.set(t, (counts.get(t) || 0) + 1);
      })
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TAG_LIMIT)
      .map(([tag]) => tag);
  }, [baseFilteredPosts]);

  // A tag chosen under one trụ cột can stop existing once the selection
  // changes (e.g. it only ever appeared on Chiến lược posts) — clear it
  // rather than leave an invisible filter the chip list no longer shows.
  useEffect(() => {
    if (selectedTag && !allTags.includes(selectedTag)) setSelectedTag(null);
  }, [allTags, selectedTag]);

  // 2. Read status / tag / search, then sort — the full pipeline that
  // actually reaches the grid. Always active; there's no separate "basic"
  // vs "advanced" mode anymore.
  const filteredPosts = useMemo(() => {
    let list = baseFilteredPosts;

    if (readStatusFilter === "UNREAD" && user) list = list.filter((p) => !isPostRead(p.id));
    else if (readStatusFilter === "READ" && user) list = list.filter((p) => isPostRead(p.id));

    if (selectedTag) list = list.filter((p) => p.tags?.includes(selectedTag));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summarySnippet?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
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
  }, [baseFilteredPosts, readStatusFilter, user, isPostRead, selectedTag, searchQuery, sortOption]);

  const hasActiveFilters =
    pillarFilter !== "ALL" ||
    accessFilter !== "ALL" ||
    sortOption !== "DATE_DESC" ||
    readStatusFilter !== "ALL" ||
    selectedTag !== null ||
    Boolean(searchQuery.trim());

  function resetAllFilters() {
    setPillarFilter("ALL");
    setAccessFilter("ALL");
    setSortOption("DATE_DESC");
    setReadStatusFilter("ALL");
    setSelectedTag(null);
    setSearchQuery("");
    setHideSavedPosts(false);
    setPage(1);
  }

  // 3. Pack the whole filtered list once, then cut only where the
  // skyline's bottom edge is flat (no card straddles the line) and only
  // once a page has accumulated at least MIN_CARDS_PER_PAGE cards — never
  // at an arbitrary card count, which produces jagged, staggered-bottom
  // pages.
  const { slots, fillers } = useMemo(() => {
    if (filteredPosts.length === 0) return { slots: [], fillers: [] };
    return generateSkylineSlots(filteredPosts.length, numCols);
  }, [filteredPosts.length, numCols]);

  const slottedPosts: SlottedPost[] = useMemo(
    () => assignPostsToSkylineSlots(filteredPosts, slots),
    [filteredPosts, slots]
  );

  const pageCuts = useMemo(() => paginateSkylineRows(slots, fillers, MIN_CARDS_PER_PAGE), [slots, fillers]);
  const totalPages = Math.max(1, pageCuts.length - 1);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const rowStart = pageCuts[currentPage - 1] ?? 0;
  const rowEnd = pageCuts[currentPage] ?? Infinity;

  const pageSlottedPosts = slottedPosts
    .filter((item) => item.slot.row >= rowStart && item.slot.row < rowEnd)
    .map((item) => ({ ...item, slot: { ...item.slot, row: item.slot.row - rowStart } }));
  const pageFillers = fillers
    .filter((f) => f.row >= rowStart && f.row < rowEnd)
    .map((f) => ({ ...f, row: f.row - rowStart }));

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

  const paginationControls = totalPages > 1 && (
    <div className="flex items-center justify-center gap-2 pt-2 pb-8">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full h-8 text-xs"
        disabled={currentPage <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        {t.explore.prevBtn}
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
        {t.explore.nextBtn}
      </Button>
    </div>
  );

  // ── Option lists shared by the desktop bar's separate dropdowns and the
  // mobile "Bộ Lọc" consolidated menu — called once per layout, each call
  // produces its own element tree. ──

  function pillarItems() {
    return (
      <DropdownMenuRadioGroup
        value={pillarFilter}
        onValueChange={(v) => {
          setPillarFilter(v as PillarFilter);
          setPage(1);
        }}
      >
        <DropdownMenuRadioItem value="ALL" className={cn(pillarFilter === "ALL" && "bg-secondary font-semibold")}>
          {t.explore.allLabel}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="MENTAL_MODEL"
          className={cn(pillarFilter === "MENTAL_MODEL" && PILLAR_STYLE.MENTAL_MODEL.row)}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-rose-500" />
            {t.pillars.mentalModel}
          </div>
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="BUSINESS_STRATEGY"
          className={cn(pillarFilter === "BUSINESS_STRATEGY" && PILLAR_STYLE.BUSINESS_STRATEGY.row)}
        >
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            {t.pillars.businessStrategy}
          </div>
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="STARTUP_IDEA"
          className={cn(pillarFilter === "STARTUP_IDEA" && PILLAR_STYLE.STARTUP_IDEA.row)}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
            {t.pillars.startupIdea}
          </div>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
  }

  function accessItems() {
    return (
      <DropdownMenuRadioGroup
        value={accessFilter}
        onValueChange={(v) => {
          setAccessFilter(v as AccessFilter);
          setPage(1);
        }}
      >
        <DropdownMenuRadioItem value="ALL" className={cn(accessFilter === "ALL" && "bg-secondary font-semibold")}>
          {t.explore.allLabel}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="OPEN"
          className={cn(accessFilter === "OPEN" && "font-semibold")}
          style={
            accessFilter === "OPEN"
              ? { backgroundColor: "color-mix(in oklab, var(--pillar-jade) 12%, var(--card))", color: "var(--pillar-jade)" }
              : undefined
          }
        >
          Open
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="FREE" className={cn(accessFilter === "FREE" && "bg-secondary font-semibold")}>
          Free
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="PLUS"
          className={cn(accessFilter === "PLUS" && "font-semibold")}
          style={
            accessFilter === "PLUS"
              ? { backgroundColor: "color-mix(in oklab, var(--tier-plus) 12%, var(--card))", color: "var(--tier-plus)" }
              : undefined
          }
        >
          Plus
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="PRO"
          className={cn(accessFilter === "PRO" && "font-semibold")}
          style={
            accessFilter === "PRO"
              ? { backgroundColor: "color-mix(in oklab, var(--tier-pro) 12%, var(--card))", color: "var(--tier-pro)" }
              : undefined
          }
        >
          Pro
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
  }

  function sortItems() {
    return (
      <DropdownMenuRadioGroup
        value={sortOption}
        onValueChange={(v) => {
          setSortOption(v as SortOption);
          setPage(1);
        }}
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.sortByDate}</DropdownMenuLabel>
        <DropdownMenuRadioItem value="DATE_DESC">{t.explore.sortNewestFirst}</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="DATE_ASC">{t.explore.sortOldestFirst}</DropdownMenuRadioItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.sortByViews}</DropdownMenuLabel>
        <DropdownMenuRadioItem value="VIEWS_DESC">{t.explore.sortHighToLow}</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="VIEWS_ASC">{t.explore.sortLowToHigh}</DropdownMenuRadioItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.sortByLikes}</DropdownMenuLabel>
        <DropdownMenuRadioItem value="LIKES_DESC">{t.explore.sortHighToLow}</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="LIKES_ASC">{t.explore.sortLowToHigh}</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
  }

  function readStatusItems() {
    return (
      <DropdownMenuRadioGroup
        value={readStatusFilter}
        onValueChange={(v) => {
          setReadStatusFilter(v as ReadStatusFilter);
          setPage(1);
        }}
      >
        <DropdownMenuRadioItem value="ALL" className={cn(readStatusFilter === "ALL" && "bg-secondary font-semibold")}>
          {t.explore.allLabel}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="UNREAD" className={cn(readStatusFilter === "UNREAD" && "bg-secondary font-semibold")}>
          {t.filter.unread}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="READ" className={cn(readStatusFilter === "READ" && "bg-secondary font-semibold")}>
          {t.filter.read}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
  }

  function tagChips() {
    return (
      <div className="flex flex-wrap gap-1 px-1.5 py-1">
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
    );
  }

  const resultCount = (
    <span className="text-xs text-muted-foreground">
      {t.explore.resultPrefix} <strong className="text-foreground">{filteredPosts.length}</strong> {resultNoun(t, pillarFilter)}
    </span>
  );

  const searchChip = searchQuery.trim() && (
    <button
      type="button"
      onClick={() => {
        setSearchQuery("");
        setPage(1);
      }}
      className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium"
      title={t.search.clearKeywordTooltip}
    >
      <Search className="w-3 h-3" />
      &quot;{searchQuery.trim()}&quot;
      <X className="w-3 h-3" />
    </button>
  );

  return (
    <div className="container mx-auto max-w-[1650px] px-2.5 sm:px-4 md:px-6 py-4 sm:py-6">
      {/* Header Bar — giữ nguyên */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border mb-4 sm:mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t.explore.pageTitle}
          </h1>
        </div>

        {user && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm text-xs">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span>{t.explore.todayLabel}</span>
                <span className="text-primary font-bold">
                  {isLimitInfinite
                    ? `${todayReadCount} ${t.explore.todayCountSuffix} ${t.explore.todayUnlimited}`
                    : `${todayReadCount}/${dailyLimit} ${t.explore.todayCountSuffix}`}
                </span>
                {user.tier === "PRO" && (
                  <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 border-none font-bold">PRO</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop filter bar — mỗi bộ lọc là 1 dropdown riêng, luôn hiển thị,
          không còn khái niệm "nâng cao" hay sidebar nữa. */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b border-border/70">
        <div className="flex items-center gap-3 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 gap-2 rounded-full text-xs font-semibold shadow-sm",
                  pillarFilter !== "ALL" && PILLAR_STYLE[pillarFilter].trigger
                )}
              >
                {pillarFilter === "ALL" ? (
                  <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  (() => {
                    const ActiveIcon = PILLAR_STYLE[pillarFilter].icon;
                    return <ActiveIcon className="w-3.5 h-3.5" />;
                  })()
                )}
                {pillarFilter === "ALL" ? t.explore.allLabel : PILLAR_STYLE[pillarFilter].label}
                <ChevronDown className={cn("w-3 h-3 ml-1", pillarFilter === "ALL" ? "text-muted-foreground" : "opacity-70")} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {pillarItems()}
            </DropdownMenuContent>
          </DropdownMenu>

          {resultCount}
          {searchChip}
        </div>

        <div className="flex items-center gap-2 text-xs">
          {user && bookmarks.length > 0 && (
            <label className="hidden md:inline-flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground text-xs select-none mr-2">
              <input
                type="checkbox"
                checked={hideSavedPosts}
                onChange={(e) => setHideSavedPosts(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
              />
              <span>{t.explore.hideSavedPrefix} ({bookmarks.length})</span>
            </label>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 gap-2 rounded-full text-xs font-semibold shadow-sm"
                style={
                  accessFilter === "PLUS" || accessFilter === "PRO"
                    ? {
                        color: TIER_ACCENT_VAR[accessFilter],
                        borderColor: `color-mix(in oklab, ${TIER_ACCENT_VAR[accessFilter]} 40%, var(--border))`,
                        backgroundColor: `color-mix(in oklab, ${TIER_ACCENT_VAR[accessFilter]} 10%, var(--card))`,
                      }
                    : undefined
                }
              >
                {accessFilter === "ALL" ? t.explore.accessAllPlans : `${t.explore.accessPlanPrefix} ${accessFilter}`}
                <ChevronDown className={cn("w-3 h-3", accessFilter === "ALL" || accessFilter === "FREE" ? "text-muted-foreground" : "opacity-70")} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.accessLevelLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accessItems()}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 rounded-full text-xs font-semibold shadow-sm">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                {t.explore.sortBtn}
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {sortItems()}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 gap-2 rounded-full text-xs font-semibold shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                  {readStatusFilter === "ALL" ? t.explore.readStatusBtn : readStatusFilter === "UNREAD" ? t.filter.unread : t.filter.read}
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {readStatusItems()}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 gap-2 rounded-full text-xs font-semibold shadow-sm",
                    selectedTag && "border-primary/40 bg-primary/10 text-primary"
                  )}
                >
                  <Hash className={cn("w-3.5 h-3.5", !selectedTag && "text-muted-foreground")} />
                  {selectedTag || t.explore.tagFilterLabel}
                  <ChevronDown className={cn("w-3 h-3", !selectedTag && "text-muted-foreground")} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.chooseTagLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tagChips()}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-primary hover:underline font-medium text-[11px]"
            >
              {t.explore.clearFiltersBtn}
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter bar — mọi dropdown gộp chung vào 1 nút "Bộ Lọc" */}
      <div className="flex sm:hidden items-center justify-between gap-3 pb-3 mb-3 border-b border-border/70">
        {resultCount}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 rounded-full text-xs font-semibold shadow-sm relative"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t.explore.filterBtn}
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 max-h-[75vh] overflow-y-auto">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.pillarSectionLabel}</DropdownMenuLabel>
            {pillarItems()}

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.accessLevelLabel}</DropdownMenuLabel>
            {accessItems()}

            <DropdownMenuSeparator />
            {sortItems()}

            {user && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.readStatusBtn}</DropdownMenuLabel>
                {readStatusItems()}
              </>
            )}

            {allTags.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t.explore.tagFilterLabel}</DropdownMenuLabel>
                {tagChips()}
              </>
            )}

            {user && bookmarks.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <label className="flex items-center gap-1.5 px-2 py-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideSavedPosts}
                    onChange={(e) => setHideSavedPosts(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-primary accent-primary cursor-pointer"
                  />
                  <span>{t.explore.hideSavedPrefix} ({bookmarks.length})</span>
                </label>
              </>
            )}

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-primary font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> {t.explore.clearFiltersBtn}
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchChip && <div className="sm:hidden -mt-1 mb-3">{searchChip}</div>}

      {bentoGrid ? (
        <div className="pb-2">
          {bentoGrid}
          {paginationControls}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8 max-w-md mx-auto">
          <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-display font-semibold text-base mb-1">{t.explore.emptyTitle}</h3>
          <p className="text-xs text-muted-foreground mb-4">{t.explore.emptyDesc}</p>
          <Button size="sm" className="rounded-full text-xs" onClick={resetAllFilters}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> {t.explore.resetFiltersBtn}
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
          {getTranslation().explore.loadingLibrary}
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
