"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Eye,
  ThumbsUp,
  Bookmark,
  Share2,
  Link2,
  Smartphone,
  Clock,
  User,
  Lock,
  Globe2,
  Brain,
  Compass,
  Lightbulb,
  Sparkles,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaywallCTA } from "@/components/paywall/PaywallCTA";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { useSession } from "@/store/session";
import { cn, formatViews, formatFormula } from "@/lib/utils";
import { normalizeTemplate } from "@/lib/reading-templates";
import { PILLARS_CONFIG } from "@/lib/data";
import { getTranslation } from "@/lib/i18n/translations";
import type { AccessCheckResult } from "@/lib/server/access-control";

export function PostDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [readProgress, setReadProgress] = useState(0);

  const bookmarks = useSession((s) => s.bookmarks);
  const userReactions = useSession((s) => s.userReactions);
  const toggleBookmark = useSession((s) => s.toggleBookmark);
  const toggleReaction = useSession((s) => s.toggleReaction);
  const recordPostView = useSession((s) => s.recordPostView);
  const user = useSession((s) => s.user);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  // Fetches the real post from the server, which is also the paywall
  // enforcement point: `access.allowed === false` means `post.fullContent`
  // is already a truncated ~30% teaser, not the full body — see
  // src/app/api/posts/[slug]/route.ts.
  const [post, setPost] = useState<Post | null>(null);
  const [access, setAccess] = useState<AccessCheckResult>({ allowed: true });
  const [notFound, setNotFound] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([]);

  useEffect(() => {
    let cancelled = false;
    setNotFound(false);
    fetch(`/api/posts/${id}`)
      .then((res) => res.json() as Promise<{ ok: boolean; post?: Post; access?: AccessCheckResult }>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok && data.post && data.access) {
          setPost(data.post);
          setAccess(data.access);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  useEffect(() => {
    if (!post) return;
    let cancelled = false;
    fetch(`/api/posts?pillar=${post.pillar}&pageSize=3`)
      .then((res) => res.json() as Promise<{ ok: boolean; posts?: Post[] }>)
      .then((data) => {
        if (!cancelled && data.ok && data.posts) {
          setRecommendedPosts(data.posts.filter((p) => p.id !== post.id).slice(0, 2));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post]);

  // Record view exactly once per post ID
  const recordedPostIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (post && recordedPostIdRef.current !== post.id) {
      recordedPostIdRef.current = post.id;
      recordPostView(post.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-record when the post identity changes, not on every refetched field
  }, [post?.id, recordPostView]);

  // Scroll reading progress listener
  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setReadProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!post) {
    if (notFound) {
      return (
        <div className="container mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold">{t.detail.notFoundTitle}</h2>
          <p className="text-muted-foreground text-sm">
            {t.detail.notFoundDesc}
          </p>
          <Button asChild className="rounded-full">
            <Link href="/">{t.detail.backHomeBtn}</Link>
          </Button>
        </div>
      );
    }
    return <div className="container mx-auto max-w-3xl px-4 py-20 text-center text-sm text-muted-foreground">{t.detail.loadingLabel}</div>;
  }

  const pillarMeta = PILLARS_CONFIG[post.pillar] || PILLARS_CONFIG.MENTAL_MODEL;
  const isSaved = bookmarks.includes(post.id);
  const userReaction = userReactions[post.id];
  const hasAccess = access.allowed;

  const PillarIcon =
    post.pillar === "MENTAL_MODEL"
      ? Brain
      : post.pillar === "BUSINESS_STRATEGY"
      ? Compass
      : Lightbulb;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function trackShare() {
    fetch(`/api/posts/${post!.slug}/share`, { method: "POST" }).catch(() => {});
  }

  function copyShareLink() {
    navigator.clipboard.writeText(shareUrl);
    trackShare();
    toast.success(t.detail.linkCopiedToast);
  }

  function openShareWindow(url: string) {
    trackShare();
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=520");
  }

  async function shareViaDevice() {
    try {
      await navigator.share({ title: post!.title, text: post!.summarySnippet, url: shareUrl });
      trackShare();
    } catch {
      // User cancelled the native share sheet — nothing to do.
    }
  }

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 transition-all duration-75 origin-left"
        style={{ transform: `scaleX(${readProgress / 100})` }}
      />

      <div className="container mx-auto max-w-4xl px-3 sm:px-6 py-6 md:py-10 pb-36">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between mb-6 gap-2">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5 transition-transform group-hover:-translate-x-1" />
            {t.nav.home}
          </Link>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border",
              pillarMeta.badgeBg,
              pillarMeta.badgeText
            )}>
              <PillarIcon className="w-3 h-3" />
              <span>{pillarMeta.titleVi}</span>
            </span>

            {(post.accessLevel === "MEMBER_PLUS" || post.accessLevel === "MEMBER_PRO") && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Lock className="w-2.5 h-2.5" /> {post.accessLevel === "MEMBER_PRO" ? t.detail.proOnlyBadge : "PLUS"}
              </span>
            )}

            {post.accessLevel === "OPEN" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <Globe2 className="w-2.5 h-2.5" /> {t.detail.freeReadBadge}
              </span>
            )}
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-8 space-y-4">
          <h1 className="font-display text-2.5xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.18]">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed font-normal">
            {post.summarySnippet || post.shortDescription}
          </p>

          {/* Academic Formula Callout Banner */}
          {post.academicFormula && (
            <div className="p-4 sm:p-5 rounded-2xl bg-secondary/80 border border-border space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> {t.detail.formulaLabel}
              </span>
              <div className="font-mono text-sm sm:text-base md:text-lg text-foreground font-semibold academic-formula">
                {formatFormula(post.academicFormula)}
              </div>
            </div>
          )}

          {/* Key Takeaways Box */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border space-y-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.detail.takeawaysLabel}
              </span>
              <ul className="space-y-1.5 text-xs sm:text-sm text-foreground/90">
                {post.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Author, Time, Metrics bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{post.author}</p>
                <p className="text-[10px] text-muted-foreground">{t.detail.authorDeskLabel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {post.readingTimeMinutes || 5} {t.detail.minutesReadSuffix}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {formatViews(post.views)} {t.detail.viewsSuffix}
              </span>
            </div>
          </div>
        </header>

        {/* Minimalist Vector Schematic Display Box */}
        {post.schematicSvg && (
          <div className="mb-10 p-6 sm:p-10 rounded-3xl bg-secondary/50 border border-border flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-full max-w-md h-48 sm:h-64 flex items-center justify-center text-foreground">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: post.schematicSvg }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground mt-3 uppercase tracking-widest">
              {t.detail.schematicCaption}
            </span>
          </div>
        )}

        {/* Article Body & Paywall Gate.
            The reader's size control feeds --reader-size rather than Tailwind
            text-* classes: everything inside .prose-academic is sized in em,
            so one root value rescales the whole surface — headings, quotes,
            captions and rhythm together — instead of resizing body copy while
            the rest stays put. */}
        <article
          className="relative min-h-[300px] prose-academic"
          data-reading-template={normalizeTemplate(post.readingTemplate)}
          style={{
            ["--reader-size" as string]:
              fontSize === "large" ? "1.3125rem" : fontSize === "xlarge" ? "1.4375rem" : "1.1875rem",
          }}
        >
          {hasAccess ? (
            <div dangerouslySetInnerHTML={{ __html: post.fullContent }} />
          ) : (
            <div className="relative">
              {/* Server already truncated fullContent to a ~30% teaser
                  (src/app/api/posts/[slug]/route.ts) — the rest was never
                  sent to the browser, so this just fades it out visually
                  rather than hiding content that's already absent. */}
              <div
                className="relative max-h-[220px] overflow-hidden pointer-events-none select-none"
                aria-hidden="true"
              >
                <div dangerouslySetInnerHTML={{ __html: post.fullContent }} />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
              </div>

              <PaywallCTA
                reason={access.reason}
                limit={access.limit}
                currentReads={access.currentReads}
              />
            </div>
          )}
        </article>

        {/* Tags Section */}
        {post.tags && post.tags.length > 0 && hasAccess && (
          <div className="flex flex-wrap items-center gap-2 pt-8 mt-10 border-t border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              {t.detail.tagsLabel}
            </span>
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full px-3 py-0.5 text-xs font-normal">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Next Recommended in same pillar */}
        {recommendedPosts.length > 0 && (
          <div className="mt-14 pt-8 border-t border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                {t.detail.relatedInPillarTitle}
              </h3>
              <Link href="/explore" className="text-xs text-primary font-semibold hover:underline">
                {t.detail.viewAllLink} &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedPosts.map((r) => (
                <InteractiveSquareCard key={r.id} post={r} />
              ))}
            </div>
          </div>
        )}

        {/* FLOATING MOBILE READER DOCK */}
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border/80 rounded-full shadow-2xl px-4 sm:px-5 py-2 flex items-center gap-2 sm:gap-3 z-40">
          <button
            type="button"
            onClick={async () => {
              const res = await toggleReaction(post.id, "like");
              if (!res.ok && res.message) toast.error(res.message);
            }}
            className={cn(
              "p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground",
              userReaction === "like" && "text-primary bg-primary/10"
            )}
            title={t.detail.likeTooltip}
          >
            <ThumbsUp className={cn("w-4 h-4", userReaction === "like" && "fill-primary")} />
          </button>

          <button
            type="button"
            onClick={async () => {
              const res = await toggleBookmark(post.id);
              if (!res.ok && res.message) toast.error(res.message);
              else toast.success(isSaved ? t.detail.unsavedToast : t.detail.savedToast);
            }}
            className={cn(
              "p-2 rounded-full hover:bg-secondary transition-colors",
              !isSaved && "text-muted-foreground"
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
          >
            <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
          </button>

          {/* Font Size Adjuster */}
          <button
            type="button"
            onClick={() => {
              setFontSize((prev) =>
                prev === "normal" ? "large" : prev === "large" ? "xlarge" : "normal"
              );
            }}
            className="p-2 rounded-full hover:bg-secondary text-muted-foreground text-xs font-bold"
            title={t.detail.fontSizeTooltip}
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Share — explicit picker (copy link, Facebook, X) instead of
              silently falling back to "just copy the link" on desktop,
              where navigator.share() mostly doesn't exist. Zalo/Messenger/
              etc. are reached through "Chia sẻ qua thiết bị", which opens
              the OS share sheet where those apps register themselves. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-secondary text-muted-foreground"
                title={t.detail.shareTooltip}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={10} className="w-52 rounded-2xl p-1.5 shadow-2xl border-border/80">
              <DropdownMenuItem onClick={copyShareLink} className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-foreground shrink-0">
                  <Link2 className="w-3 h-3" />
                </span>
                <span className="font-medium">{t.detail.copyLinkAction}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#1877F2] text-white text-[11px] font-bold shrink-0">f</span>
                <span className="font-medium">{t.detail.shareFacebookAction}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`)}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-foreground text-background text-[10px] font-bold shrink-0">X</span>
                <span className="font-medium">{t.detail.shareXAction}</span>
              </DropdownMenuItem>
              {typeof navigator !== "undefined" && !!navigator.share && (
                <DropdownMenuItem onClick={shareViaDevice} className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs cursor-pointer">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-foreground shrink-0">
                    <Smartphone className="w-3 h-3" />
                  </span>
                  <span className="font-medium">{t.detail.shareDeviceAction}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}

export const IdeaDetailPage = PostDetailPage;
