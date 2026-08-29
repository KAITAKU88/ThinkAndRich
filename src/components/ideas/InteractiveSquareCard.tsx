"use client";

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
import { useSession } from "@/store/session";
import { formatViews, shareContent } from "@/lib/utils";
import { getTranslation } from "@/lib/i18n/translations";
import { CreditBadge } from "@/components/credits/CreditBadge";
import { parseCreditCost } from "@/lib/credit-cost";

interface InteractiveSquareCardProps {
  post: Post;
}

/** Step 1: bare card — no skyline slot, no masonry sizing. */
export function InteractiveSquareCard({ post }: InteractiveSquareCardProps) {
  const toggleReaction = useSession((s) => s.toggleReaction);
  const userReactions = useSession((s) => s.userReactions);
  const isLiked = userReactions[post.id] === "like";
  const bookmarks = useSession((s) => s.bookmarks);
  const toggleBookmark = useSession((s) => s.toggleBookmark);
  const isSaved = bookmarks.includes(post.id);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  const creditCost = parseCreditCost(post.creditCost, 0);
  const isNew =
    post.createdAt && new Date().getTime() - new Date(post.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

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

  return (
    <article>
      <Link
        href={`/post/${post.slug || post.id}`}
        onClick={() => {
          fetch(`/api/posts/${post.slug || post.id}/click`, { method: "POST" }).catch(() => {});
        }}
      >
        <div>
          <div>
            <div
              title={
                post.pillar === "MENTAL_MODEL"
                  ? t.pillars.mentalModel
                  : post.pillar === "BUSINESS_STRATEGY"
                    ? t.pillars.businessStrategy
                    : t.pillars.startupIdea
              }
            >
              {post.pillar === "MENTAL_MODEL" && <Brain />}
              {post.pillar === "BUSINESS_STRATEGY" && <Compass />}
              {post.pillar === "STARTUP_IDEA" && <Lightbulb />}
            </div>
            {isNew && <span>{t.card.newBadge}</span>}
          </div>
          <div>
            <CreditBadge cost={creditCost} />
            <button
              type="button"
              onClick={handleShareClick}
              title={t.detail.shareTooltip}
              aria-label={t.detail.shareTooltip}
            >
              <Share2 />
            </button>
            <button
              type="button"
              onClick={handleBookmarkClick}
              title={isSaved ? t.detail.unsaveTooltip : t.detail.saveTooltip}
              aria-label={isSaved ? t.detail.unsaveTooltip : t.detail.saveTooltip}
            >
              <Bookmark />
            </button>
          </div>
        </div>

        <h3>{post.title}</h3>

        <div>
          <div title={`${post.views} lượt xem`}>
            <Eye />
            <span>{formatViews(post.views || 0)}</span>
          </div>
          {post.readingTimeMinutes ? (
            <div title={`${post.readingTimeMinutes} phút đọc`}>
              <Clock />
              <span>{post.readingTimeMinutes}p</span>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLikeClick}
            title={t.detail.likeTooltip}
          >
            <Heart />
            <span>{post.likes || 0}</span>
          </button>
        </div>
      </Link>
    </article>
  );
}
