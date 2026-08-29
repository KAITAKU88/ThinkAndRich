"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  LayoutGrid,
  X,
  SlidersHorizontal,
  RotateCcw,
  ArrowUpDown,
  ChevronDown,
  Brain,
  Compass,
  Lightbulb,
  CheckCircle2,
  Hash,
} from "lucide-react";
import type { PillarType, Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { ExploreGridSkeleton } from "@/components/explore/ExploreGridSkeleton";
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
import { getTranslation, type TranslationDictionary } from "@/lib/i18n/translations";

type PillarFilter = "ALL" | PillarType;
type AccessFilter = "ALL" | "OPEN" | "PAID";
type SortOption = "DATE_DESC" | "DATE_ASC" | "VIEWS_DESC" | "VIEWS_ASC" | "LIKES_DESC" | "LIKES_ASC";
type ReadStatusFilter = "ALL" | "UNREAD" | "READ";

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
      trigger: "",
      row: "font-semibold",
    },
    BUSINESS_STRATEGY: {
      icon: Compass,
      label: t.pillars.businessStrategy,
      trigger: "",
      row: "font-semibold",
    },
    STARTUP_IDEA: {
      icon: Lightbulb,
      label: t.pillars.startupIdea,
      trigger: "",
      row: "font-semibold",
    },
  };
}

// Step 1: flat list pagination — no skyline/masonry packing until Step 3 grid.
const PAGE_SIZE = 24;

// How many topic-tag chips the "Thẻ chủ đề" filter shows at once.
const TAG_LIMIT = 16;

function ExploreContent({ initialPosts }: { initialPosts: Post[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialQ = searchParams.get("q") || "";
  const initialPillar = (searchParams.get("pillar") as PillarFilter) || "ALL";

  const urlQ = searchParams.get("q") || "";
  const { posts } = usePosts({ pageSize: 200, q: urlQ || undefined }, urlQ ? undefined : initialPosts);
  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const hideSavedPosts = useSession((s) => s.hideSavedPosts);
  const setHideSavedPosts = useSession((s) => s.setHideSavedPosts);
  const isPostRead = useSession((s) => s.isPostRead);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  const PILLAR_STYLE = pillarStyle(t);

  const [pillarFilter, setPillarFilter] = useState<PillarFilter>(initialPillar);
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("ALL");
  const [sortOption, setSortOption] = useState<SortOption>("DATE_DESC");
  const [readStatusFilter, setReadStatusFilter] = useState<ReadStatusFilter>("ALL");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [page, setPage] = useState(1);

  // A query arriving via ?q= (article tags, header search "Xem toàn bộ")
  // should filter immediately — there's no dedicated search box here.
  // Also follow the URL when q is *removed*, otherwise "Xóa bộ lọc" only
  // cleared React state and the chip/effect snapped the keyword back.
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setPage(1);
  }, [searchParams]);

  function replaceExploreParams(mutate: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    mutate(next);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // 1. Pillar / access / hide-saved — what the tag cloud below is computed
  // from, so a chosen tag never dead-ends into 0 results, and what every
  // other filter narrows further.
  const baseFilteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.status === "PUBLISHED");
    if (hideSavedPosts && user) list = list.filter((p) => !bookmarks.includes(p.id));
    if (pillarFilter !== "ALL") list = list.filter((p) => p.pillar === pillarFilter);
    if (accessFilter === "OPEN") list = list.filter((p) => p.creditCost === 0);
    if (accessFilter === "PAID") list = list.filter((p) => p.creditCost > 0);
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
  }, [baseFilteredPosts, readStatusFilter, user, isPostRead, selectedTag, sortOption]);

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
    replaceExploreParams((params) => {
      params.delete("q");
      params.delete("pillar");
    });
  }

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pagePosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const postList =
    pagePosts.length > 0 ? (
      <ul className="card-grid">
        {pagePosts.map((post) => (
          <li key={post.id}>
            <InteractiveSquareCard post={post} />
          </li>
        ))}
      </ul>
    ) : null;

  const paginationControls = totalPages > 1 && (
    <div className="explore-pagination">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        {t.explore.prevBtn}
      </Button>
      <span>
        {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
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
        <DropdownMenuRadioItem value="ALL" >
          {t.explore.allLabel}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="MENTAL_MODEL"

        >
          <div>
            <Brain />
            {t.pillars.mentalModel}
          </div>
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="BUSINESS_STRATEGY"

        >
          <div>
            <Compass />
            {t.pillars.businessStrategy}
          </div>
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="STARTUP_IDEA"

        >
          <div>
            <Lightbulb />
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
        <DropdownMenuRadioItem value="ALL" >
          {t.explore.allLabel}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem
          value="OPEN"

        >
          Open
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="PAID" >
          1–5 credit
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
        <DropdownMenuLabel>{t.explore.sortByDate}</DropdownMenuLabel>
        <DropdownMenuRadioItem value="DATE_DESC">{t.explore.sortNewestFirst}</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="DATE_ASC">{t.explore.sortOldestFirst}</DropdownMenuRadioItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t.explore.sortByViews}</DropdownMenuLabel>
        <DropdownMenuRadioItem value="VIEWS_DESC">{t.explore.sortHighToLow}</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="VIEWS_ASC">{t.explore.sortLowToHigh}</DropdownMenuRadioItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t.explore.sortByLikes}</DropdownMenuLabel>
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
        <DropdownMenuRadioItem value="ALL" >
          {t.explore.allLabel}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="UNREAD" >
          {t.filter.unread}
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="READ" >
          {t.filter.read}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
  }

  function tagChips() {
    return (
      <div>
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

            >
              #{tag}
            </button>
          );
        })}
      </div>
    );
  }

  const resultCount = (
    <span>
      {t.explore.resultPrefix} <strong >{filteredPosts.length}</strong> {resultNoun(t, pillarFilter)}
    </span>
  );

  const searchChip = searchQuery.trim() && (
    <button
      type="button"
      onClick={() => {
        setSearchQuery("");
        setPage(1);
        replaceExploreParams((params) => {
          params.delete("q");
        });
      }}
      title={t.search.clearKeywordTooltip}
    >
      <Search />
      &quot;{searchQuery.trim()}&quot;
      <X />
    </button>
  );

  return (
    <div>
      <div className="explore-page-header">
        <h1>{t.explore.pageTitle}</h1>
      </div>

      <div className="explore-sticky-toolbar">
      {/* Desktop filter bar — mỗi bộ lọc là 1 dropdown riêng, luôn hiển thị,
          không còn khái niệm "nâng cao" hay sidebar nữa. */}
      <div className="explore-toolbar-row">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"

              >
                {pillarFilter === "ALL" ? (
                  <LayoutGrid />
                ) : (
                  (() => {
                    const ActiveIcon = PILLAR_STYLE[pillarFilter].icon;
                    return <ActiveIcon />;
                  })()
                )}
                {pillarFilter === "ALL" ? t.explore.allLabel : PILLAR_STYLE[pillarFilter].label}
                <ChevronDown  />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {pillarItems()}
            </DropdownMenuContent>
          </DropdownMenu>

          {resultCount}
          {searchChip}
        </div>

        <div className="explore-toolbar-row">
          {user && bookmarks.length > 0 && (
            <label>
              <input
                type="checkbox"
                checked={hideSavedPosts}
                onChange={(e) => setHideSavedPosts(e.target.checked)}
              />
              <span>{t.explore.hideSavedPrefix} ({bookmarks.length})</span>
            </label>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
              >
                {accessFilter === "ALL" ? t.explore.accessAllPlans : accessFilter === "OPEN" ? "Open" : "1–5 credit"}
                <ChevronDown  />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t.explore.accessLevelLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {accessItems()}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ArrowUpDown />
                {t.explore.sortBtn}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortItems()}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <CheckCircle2 />
                  {readStatusFilter === "ALL" ? t.explore.readStatusBtn : readStatusFilter === "UNREAD" ? t.filter.unread : t.filter.read}
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {readStatusItems()}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"

                >
                  <Hash  />
                  {selectedTag || t.explore.tagFilterLabel}
                  <ChevronDown  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t.explore.chooseTagLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tagChips()}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
            >
              {t.explore.clearFiltersBtn}
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter bar — mọi dropdown gộp chung vào 1 nút "Bộ Lọc" */}
      <div className="explore-toolbar-row">
        {resultCount}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
            >
              <SlidersHorizontal />
              {t.explore.filterBtn}
              {hasActiveFilters && <span />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t.explore.pillarSectionLabel}</DropdownMenuLabel>
            {pillarItems()}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t.explore.accessLevelLabel}</DropdownMenuLabel>
            {accessItems()}

            <DropdownMenuSeparator />
            {sortItems()}

            {user && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t.explore.readStatusBtn}</DropdownMenuLabel>
                {readStatusItems()}
              </>
            )}

            {allTags.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t.explore.tagFilterLabel}</DropdownMenuLabel>
                {tagChips()}
              </>
            )}

            {user && bookmarks.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <label>
                  <input
                    type="checkbox"
                    checked={hideSavedPosts}
                    onChange={(e) => setHideSavedPosts(e.target.checked)}
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
                >
                  <RotateCcw /> {t.explore.clearFiltersBtn}
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {searchChip && <div>{searchChip}</div>}
      </div>

      {postList ? (
        <div>
          {postList}
          {paginationControls}
        </div>
      ) : (
        <div className="explore-empty neo-shadow">
          <Brain aria-hidden="true" />
          <h3>{t.explore.emptyTitle}</h3>
          <p>{t.explore.emptyDesc}</p>
          <Button className="neo-btn neo-btn--sm" size="sm" onClick={resetAllFilters}>
            <RotateCcw /> {t.explore.resetFiltersBtn}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ExplorePage({ initialPosts }: { initialPosts: Post[] }) {
  return (
    <Suspense fallback={<ExploreGridSkeleton />}>
      <ExploreContent initialPosts={initialPosts} />
    </Suspense>
  );
}
