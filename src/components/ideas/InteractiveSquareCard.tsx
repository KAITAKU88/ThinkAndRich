"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Eye,
  Heart,
  Brain,
  Compass,
  Lightbulb,
  Clock,
  Bookmark,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import type { Slot } from "@/lib/algorithms/skyline-packer";
import { useSession } from "@/store/session";
import { cn, formatViews, shareContent } from "@/lib/utils";
import { getTranslation } from "@/lib/i18n/translations";
import { CreditBadge } from "@/components/credits/CreditBadge";
import { CREDIT_COST_ACCENT, CREDIT_COST_BORDER, parseCreditCost } from "@/lib/credit-cost";

interface InteractiveSquareCardProps {
  post: Post;
  slot?: Slot;
  priorityIndex?: number;
  fontSizeClass?: string;
}

export function InteractiveSquareCard({ post, slot }: InteractiveSquareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [titleShiftX, setTitleShiftX] = useState(0);
  const [titleShiftY, setTitleShiftY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const toggleReaction = useSession((s) => s.toggleReaction);
  const userReactions = useSession((s) => s.userReactions);
  const isLiked = userReactions[post.id] === "like";
  const bookmarks = useSession((s) => s.bookmarks);
  const toggleBookmark = useSession((s) => s.toggleBookmark);
  const isSaved = bookmarks.includes(post.id);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  const slotSize = slot?.size || (post.displaySize === "SQUARE_LG" ? 4 : post.displaySize === "SQUARE_MD" ? 3 : 2);
  const isLarge = slotSize >= 3;

  // The card is a perfect square, so a bigger slot means more vertical room
  // too — the line count a title is allowed before truncating should grow
  // with the slot, not stay fixed. A fixed clamp either wastes the square's
  // extra height on big cards (cutting long titles short with room to
  // spare) or lets it run past a tiny card's actual space.
  const titleLineClamp = slotSize >= 4 ? 8 : slotSize === 3 ? 6 : 4;

  const creditCost = parseCreditCost(post.creditCost, 0);
  const isNew = post.createdAt && (new Date().getTime() - new Date(post.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000);

  // 3D Tilt calculation: dampened on larger cards to ensure buttons never slip
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const normX = (x - centerX) / centerX;
    const normY = (y - centerY) / centerY;

    // Small cards: 4.5deg max; Large cards: gentle 1.8deg max so buttons are 100% stable
    const maxRot = isLarge ? 1.8 : 4.5;
    const rotX = -normY * maxRot;
    const rotY = normX * maxRot;

    // Text parallax shift (floating title text)
    const maxShift = isLarge ? 6 : 4;
    const shiftX = normX * maxShift;
    const shiftY = normY * maxShift;

    setRotateX(rotX);
    setRotateY(rotY);
    setTitleShiftX(shiftX);
    setTitleShiftY(shiftY);

    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setTitleShiftX(0);
    setTitleShiftY(0);
  }

  async function handleLikeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await toggleReaction(post.id, "like");
  }

  async function handleBookmarkClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleBookmark(post.id);
    if (!res.ok && res.message) toast.error(res.message);
    else if (res.ok) toast.success(isSaved ? t.detail.unsavedToast : t.detail.savedToast);
  }

  async function handleShareClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.slug || post.id}`;
    const result = await shareContent({
      url,
      title: post.title,
      text: post.summarySnippet || post.shortDescription,
    });
    fetch(`/api/posts/${post.slug || post.id}/share`, { method: "POST" }).catch(() => {});
    if (result === "copied") toast.success(t.detail.linkCopiedToast);
  }

  const hoverScale = isLarge ? 1.008 : 1.02;
  const creditAccent = CREDIT_COST_ACCENT[creditCost];

  // Grid style computed from Slot coordinates if provided
  const gridStyle: React.CSSProperties = slot
    ? {
        gridColumn: `${slot.col + 1} / span ${slot.size}`,
        gridRow: `${slot.row + 1} / span ${slot.size}`,
      }
    : {};

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
        ...gridStyle,
      }}
      className={cn(
        "group relative w-full transition-all duration-200 select-none skyline-card-container",
        // Inside a Slot-driven skyline grid (Home), grid-auto-rows already
        // ties row height to column width, so both dimensions are already
        // definite and aspect-square is a no-op. Everywhere else (Explore,
        // Khu vực cá nhân, "Hồ sơ liên quan") these cards sit in a plain
        // uniform grid with auto row height — aspect-square is what forces
        // them square there too, instead of following each title's height.
        slot ? "h-full" : "aspect-square col-span-1"
      )}
    >
      <Link
        href={`/post/${post.slug || post.id}`}
        onClick={() => {
          fetch(`/api/posts/${post.slug || post.id}/click`, { method: "POST" }).catch(() => {});
        }}
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${hoverScale}, ${hoverScale}, ${hoverScale})`
            : "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
          transition: isHovered
            ? "transform 0.08s ease-out, box-shadow 0.2s ease-out, border-color 0.25s ease-out"
            : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease",
          transformStyle: "preserve-3d",
          // Credit cost owns the edge (same hue as CreditBadge). An inline
          // borderColor used to mix in the pillar accent and overrode the
          // Tailwind CREDIT_COST_BORDER class, so a 3C card wore a crimson
          // shelf-edge next to a violet label.
          borderColor: `color-mix(in oklab, ${creditAccent} ${isHovered ? "85%" : "65%"}, var(--border))`,
        }}
        className={cn(
          "relative flex flex-col justify-between w-full h-full p-3.5 sm:p-4.5 md:p-5 rounded-2xl md:rounded-3xl border-2 bg-card overflow-hidden",
          CREDIT_COST_BORDER[creditCost],
          "shadow-xs hover:shadow-xl",
        )}
      >
        {/* Dynamic glare overlay */}
        {isHovered && (
          <div
            className="pointer-events-none absolute inset-0 opacity-15 mix-blend-overlay transition-opacity duration-300 -z-0"
            style={{
              background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.9), transparent 60%)`,
            }}
          />
        )}

        {/* 1. TOP ROW: ONLY PILLAR ICON (LEFT) + ACCESS BADGE (RIGHT) */}
        <div className="relative z-10 flex items-center justify-between gap-1.5 w-full">
          {/* Pillar Icon & Optional 'Mới' Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "flex items-center justify-center rounded-xl p-1.5 sm:p-2 border transition-transform group-hover:scale-105",
                post.pillar === "MENTAL_MODEL" &&
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
                post.pillar === "BUSINESS_STRATEGY" &&
                  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                post.pillar === "STARTUP_IDEA" &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              )}
              title={
                post.pillar === "MENTAL_MODEL"
                  ? t.pillars.mentalModel
                  : post.pillar === "BUSINESS_STRATEGY"
                  ? t.pillars.businessStrategy
                  : t.pillars.startupIdea
              }
            >
              {post.pillar === "MENTAL_MODEL" && <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              {post.pillar === "BUSINESS_STRATEGY" && <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              {post.pillar === "STARTUP_IDEA" && <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </div>
            {isNew && (
              <span className="truncate px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                {t.card.newBadge}
              </span>
            )}
          </div>

          {/* Access Level Badge + Đọc sau (Read Later) toggle — always
              rendered, not hover-gated, so it's reachable on touch devices
              too, not just mouse hover. */}
          <div className="flex items-center gap-1.5 shrink-0">
            <CreditBadge cost={creditCost} />
            <button
              type="button"
              onClick={handleShareClick}
              className="flex items-center justify-center rounded-full p-1.5 -m-1 transition-all active:scale-90 select-none text-muted-foreground hover:text-primary hover:bg-primary/10"
              title={t.detail.shareTooltip}
              aria-label={t.detail.shareTooltip}
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleBookmarkClick}
              className={cn(
                "flex items-center justify-center rounded-full p-1.5 -m-1 transition-all active:scale-90 select-none",
                !isSaved && "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
              style={
                isSaved
                  ? {
                      color: "var(--pillar-jade)",
                      backgroundColor: "color-mix(in oklab, var(--pillar-jade) 15%, transparent)",
                    }
                  : undefined
              }
              title={isSaved ? t.detail.unsaveTooltip : t.detail.saveTooltip}
              aria-label={isSaved ? t.detail.unsaveTooltip : t.detail.saveTooltip}
            >
              <Bookmark className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isSaved && "fill-current")} />
            </button>
          </div>
        </div>

        {/* 2. MIDDLE BODY: ONLY CARD TITLE (Fluid Container Query Typography & 3D Parallax) */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-2 text-center overflow-hidden px-1">
          <h3
            style={{
              transform: isHovered
                ? `translate3d(${titleShiftX}px, ${titleShiftY}px, 20px)`
                : "translate3d(0px, 0px, 0px)",
              transition: isHovered
                ? "transform 0.08s ease-out"
                : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              transformStyle: "preserve-3d",
              WebkitLineClamp: titleLineClamp,
            }}
            className="font-display font-bold text-foreground tracking-tight group-hover:text-primary transition-colors text-balance skyline-card-title"
          >
            {post.title}
          </h3>
        </div>

        {/* 3. BOTTOM ROW: EYE + VIEWS | HEART + LIKES (Stable Click Target) */}
        <div className="relative z-20 flex items-center justify-between pt-1 text-muted-foreground text-[10px] sm:text-xs font-medium">
          {/* Eye Icon + View Count */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              title={`${post.views} lượt xem`}
            >
              <Eye className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-mono tabular-nums">{formatViews(post.views || 0)}</span>
            </div>
            {post.readingTimeMinutes && (
              <div className="flex items-center gap-1" title={`${post.readingTimeMinutes} phút đọc`}>
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono tabular-nums">{post.readingTimeMinutes}p</span>
              </div>
            )}
          </div>

          {/* Heart Icon + Likes Count (Generous Hit Target & Stable Click Area) */}
          <button
            type="button"
            onClick={handleLikeClick}
            className={cn(
              "flex items-center gap-1.5 p-1.5 -m-1 rounded-full transition-all active:scale-90 select-none",
              isLiked
                ? "text-rose-600 font-bold bg-rose-500/10"
                : "hover:text-rose-600 hover:bg-rose-500/10 text-muted-foreground"
            )}
            title={t.detail.likeTooltip}
          >
            <Heart
              className={cn(
                "w-3.5 h-3.5 transition-transform",
                isLiked ? "fill-rose-600 text-rose-600 scale-110" : ""
              )}
            />
            <span className="font-mono tabular-nums">{post.likes || 0}</span>
          </button>
        </div>
      </Link>
    </div>
  );
}
