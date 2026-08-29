"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
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
import { ReadingColumn, ReadingSheet } from "@/components/reading/ReadingSheet";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { useSession } from "@/store/session";
import { formatViews } from "@/lib/utils";
import { PILLARS_CONFIG } from "@/lib/data";
import { getTranslation } from "@/lib/i18n/translations";
import { CreditBadge } from "@/components/credits/CreditBadge";
import { parseCreditCost } from "@/lib/credit-cost";
import type { AccessCheckResult } from "@/lib/server/access-control";

export function PostDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [readProgress, setReadProgress] = useState(0);
  const [focusMode, setFocusMode] = useState(false);

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
    setRecommendedPosts([]);
    fetch(`/api/posts/${id}`)
      .then((res) => res.json() as Promise<{
        ok: boolean;
        post?: Post;
        relatedPosts?: Post[];
        access?: AccessCheckResult;
      }>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok && data.post && data.access) {
          setPost(data.post);
          setAccess(data.access);
          setRecommendedPosts(data.relatedPosts ?? []);
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

  // Record a read only when the reader can see the full article body.
  const recordedPostIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!post || !access.allowed) return;
    if (recordedPostIdRef.current === post.id) return;
    recordedPostIdRef.current = post.id;
    recordPostView(post.slug || post.id, post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-record when access or post identity changes
  }, [post?.id, post?.slug, access.allowed, recordPostView]);

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

  useEffect(() => {
    if (!focusMode) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFocusMode(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode]);

  if (!post) {
    if (notFound) {
      return (
        <div>
          <h2>{t.detail.notFoundTitle}</h2>
          <p>
            {t.detail.notFoundDesc}
          </p>
          <Button asChild >
            <Link href="/">{t.detail.backHomeBtn}</Link>
          </Button>
        </div>
      );
    }
    return <div>{t.detail.loadingLabel}</div>;
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
    <div data-focus-active={focusMode ? "true" : "false"}>
      <p aria-hidden="true">Đã đọc {readProgress}%</p>

      {focusMode ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="focus-mode-exit"
            onClick={() => setFocusMode(false)}
          >
            <Eye />
            Exit Focus
          </Button>
        </div>
      ) : null}

      {/* max-w-5xl, not 4xl: the column sizes itself from the template's
          measure, and the two widest templates (Tạp chí, Cô đọng) were being
          clipped back to the same width as the default by a 4xl container —
          which made three different choices in the picker render identically. */}
      <div>
        <ReadingColumn template={post.readingTemplate} size={fontSize}>
          {/* The rail. Everything here is *about* the article — where it sits
              in the library, who wrote it, how long it runs, how often it has
              been looked up — so none of it belongs on the page itself. The
              byline and the metrics used to sit between the standfirst and
              the first heading, which meant a block of small sans-serif UI
              text stood directly in the path of someone who had just started
              reading. */}
          <div data-focus-dimmable="true">
            <div>
              <div>
                <div>
                  <User />
                </div>
                <div>
                  <p>{post.author}</p>
                  <p>{t.detail.authorDeskLabel}</p>
                </div>
              </div>

              <div>
                {post.readingTimeMinutes > 0 && (
                  <span>
                    <Clock /> {post.readingTimeMinutes} {t.detail.minutesReadSuffix}
                  </span>
                )}
                <span>
                  <Eye /> {formatViews(post.views)} {t.detail.viewsSuffix}
                </span>
              </div>
            </div>

            <div>
              <div>
                <span >
                  <PillarIcon />
                  <span>{pillarMeta.titleVi}</span>
                </span>

                <CreditBadge cost={parseCreditCost(post.creditCost, 0)} />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="focus-mode-toggle"
                aria-pressed={focusMode}
                onClick={() => setFocusMode(true)}
              >
                <Eye />
                Focus Mode
              </Button>
            </div>
          </div>

          {/* The formula callout and takeaways box that used to sit here were
              folded into the article body: three stacked panels before a word
              of prose fragmented the page, and neither field could be edited
              from the console — only written by the MCP tools. Their content
              was migrated into full_content rather than dropped. The vector
              schematic box went the same way, except its SVG was not migrated:
              TipTap's schema would strip raw <svg> on the next edit, so the
              column is simply left unread — diagrams belong in the body as
              images now. */}
          <ReadingSheet
            template={post.readingTemplate}
            title={post.title}
            lede={post.summarySnippet || post.shortDescription}

          >
            {hasAccess ? (
              <div dangerouslySetInnerHTML={{ __html: post.fullContent }} />
            ) : (
              <div>
                {/* Title + standfirst render above in ReadingSheet. Server sends
                    only the first ~2 paragraphs here (truncateHtmlTeaser). */}
                <div>
                  <div dangerouslySetInnerHTML={{ __html: post.fullContent }} />
                </div>

                <PaywallCTA
                  reason={access.reason}
                  creditCost={access.creditCost}
                  available={access.available}
                  shortfall={access.shortfall}
                  slug={post.slug || post.id}
                  onUnlocked={() => {
                    void useSession.getState().refreshUserState();
                    fetch(`/api/posts/${id}`)
                      .then((res) => res.json() as Promise<{
                        ok: boolean;
                        post?: Post;
                        access?: AccessCheckResult;
                      }>)
                      .then((data) => {
                        if (data.ok && data.post && data.access) {
                          setPost(data.post);
                          setAccess(data.access);
                          if (data.access.allowed) {
                            void recordPostView(data.post.slug || data.post.id, data.post.id);
                          }
                        }
                      })
                      .catch(() => {});
                  }}
                />
              </div>
            )}
          </ReadingSheet>

          {/* Tags and related reading line up with the sheet's edges but sit
              outside its frame — they are the library talking, not the
              article. */}
          {post.tags && post.tags.length > 0 && hasAccess && (
            <div data-focus-dimmable="true">
              <span>
                {t.detail.tagsLabel}
              </span>
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/explore?q=${encodeURIComponent(tag)}`}
                >
                  <Badge variant="secondary">
                    #{tag}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Editorially curated continuations, in the exact order selected
              in the admin editor. No same-pillar algorithm is mixed in: an
              empty selection deliberately renders no recommendation rail. */}
          {recommendedPosts.length > 0 && (
            <div data-focus-dimmable="true">
              <div>
                <h3>
                  {t.detail.relatedArticles}
                </h3>
                <Link href="/explore">
                  {t.detail.viewAllLink} &rarr;
                </Link>
              </div>
              <div>
                {recommendedPosts.map((r) => (
                  <InteractiveSquareCard key={r.id} post={r} />
                ))}
              </div>
            </div>
          )}
        </ReadingColumn>

        {/* FLOATING MOBILE READER DOCK */}
        <div>
          <button
            type="button"
            onClick={async () => {
              const res = await toggleReaction(post.id, "like");
              if (!res.ok && res.message) toast.error(res.message);
            }}

            title={t.detail.likeTooltip}
          >
            <ThumbsUp />
          </button>

          <button
            type="button"
            onClick={async () => {
              const res = await toggleBookmark(post.id);
              if (!res.ok && res.message) toast.error(res.message);
              else toast.success(isSaved ? t.detail.unsavedToast : t.detail.savedToast);
            }}

            title={isSaved ? t.detail.unsaveTooltip : t.detail.saveTooltip}
          >
            <Bookmark />
          </button>

          {/* Font Size Adjuster */}
          <button
            type="button"
            onClick={() => {
              setFontSize((prev) =>
                prev === "normal" ? "large" : prev === "large" ? "xlarge" : "normal"
              );
            }}
            title={t.detail.fontSizeTooltip}
          >
            <Type />
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
                title={t.detail.shareTooltip}
              >
                <Share2 />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={10}>
              <DropdownMenuItem onClick={copyShareLink}>
                <span>
                  <Link2 />
                </span>
                <span>{t.detail.copyLinkAction}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
              >
                <span>f</span>
                <span>{t.detail.shareFacebookAction}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`)}
              >
                <span>X</span>
                <span>{t.detail.shareXAction}</span>
              </DropdownMenuItem>
              {typeof navigator !== "undefined" && !!navigator.share && (
                <DropdownMenuItem onClick={shareViaDevice}>
                  <span>
                    <Smartphone />
                  </span>
                  <span>{t.detail.shareDeviceAction}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

export const IdeaDetailPage = PostDetailPage;
