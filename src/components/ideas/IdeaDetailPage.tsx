"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  PlayCircle,
  Clock,
  User,
  BookOpen,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PaywallCTA } from "@/components/paywall/PaywallCTA";
import { useSession } from "@/store/session";
import { cn, formatViews, timeAgo } from "@/lib/utils";


export function PostDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const posts = useSession((s) => s.posts);
  const bookmarks = useSession((s) => s.bookmarks);
  const userReactions = useSession((s) => s.userReactions);
  const toggleBookmark = useSession((s) => s.toggleBookmark);
  const toggleReaction = useSession((s) => s.toggleReaction);
  const recordPostView = useSession((s) => s.recordPostView);
  const canAccessPost = useSession((s) => s.canAccessPost);


  useEffect(() => {
    setLoading(true);
    const found = posts.find((p) => p.id === id || p.slug === id);
    if (found) {
      setPost(found);
      recordPostView(found.id);
    }
    setLoading(false);
  }, [id, posts, recordPostView]);


  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Đang tải toàn bộ mô hình...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold">Không tìm thấy bài viết</h2>
        <p className="text-muted-foreground">
          Mô hình tư duy hoặc chiến lược này có thể đã được cập nhật hoặc chuyển địa chỉ.
        </p>
        <Button asChild className="rounded-full">
          <Link href="/">Quay lại trang chủ Think & Rich</Link>
        </Button>
      </div>
    );
  }

  const isSaved = bookmarks.includes(post.id);
  const userReaction = userReactions[post.id];
  const access = canAccessPost(post);
  const hasAccess = access.allowed;

  // Related posts
  const relatedPosts = posts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 2);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pb-32">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/explore"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Về Thư viện Khám phá
        </Link>
        <div className="flex items-center gap-1.5">
          {(post.isMemberOnly || post.isPro) && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs">
              <Crown className="w-3 h-3 mr-1" /> MEMBER
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {post.category}
          </Badge>
        </div>
      </div>

      {/* Article Header */}
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            {post.category}
          </Badge>
          {(post.isMemberOnly || post.isPro) && (
            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
              Bài viết Member
            </Badge>
          )}
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {post.readTime}
          </span>

          <span className="text-border">•</span>
          <span>Xuất bản: {timeAgo(post.createdAt)}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
          {post.title}
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-normal">
          {post.shortDescription}
        </p>

        {/* Author and Engagement Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/80">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold leading-none">{post.author}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Think & Rich Editorial</p>
            </div>
          </div>

          {/* Metrics: Views, Likes, Dislikes */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-medium text-muted-foreground">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>{formatViews(post.views)} lượt xem</span>
            </div>

            <button
              type="button"
              onClick={() => {
                const res = toggleReaction(post.id, "like");
                if (!res.ok && res.message) toast.error(res.message);
              }}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                userReaction === "like"
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border/60 hover:bg-muted text-muted-foreground"
              )}
            >
              <ThumbsUp className={cn("w-3.5 h-3.5", userReaction === "like" && "fill-primary")} />
              <span>{post.likes}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const res = toggleReaction(post.id, "dislike");
                if (!res.ok && res.message) toast.error(res.message);
              }}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                userReaction === "dislike"
                  ? "border-destructive bg-destructive/10 text-destructive font-semibold"
                  : "border-border/60 hover:bg-muted text-muted-foreground"
              )}
            >
              <ThumbsDown className={cn("w-3.5 h-3.5", userReaction === "dislike" && "fill-destructive")} />
              <span>{post.dislikes}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Featured Media (Video or Thumbnail) */}
      <div className="mb-10 rounded-3xl overflow-hidden border border-border shadow-lg bg-card">
        {post.videoUrl && hasAccess ? (
          <div className="aspect-video w-full">
            <iframe
              src={post.videoUrl}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            {post.videoUrl && !hasAccess && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                <PlayCircle className="w-14 h-14 text-white/90 mb-2 animate-pulse" />
                <p className="font-semibold text-lg">Video phân tích đi kèm mô hình</p>
                <p className="text-xs text-white/80">Xác thực tài khoản để xem video trực tiếp</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area / Access Gatekeeper */}
      <article className="relative min-h-[300px]">
        {hasAccess ? (
          <div
            className="prose-idea max-w-none text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.fullContent }}
          />
        ) : (
          <div className="relative">
            {/* Blurred Teaser Preview */}
            <div
              className="prose-idea max-w-none opacity-25 select-none pointer-events-none max-h-[220px] overflow-hidden filter blur-[4px]"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: post.fullContent }}
            />

            <PaywallCTA
              reason={access.reason}
              limit={access.limit}
              currentReads={access.currentReads}
            />
          </div>
        )}
      </article>

      {/* Tags section */}
      {post.tags && post.tags.length > 0 && hasAccess && (
        <div className="flex flex-wrap items-center gap-2 pt-10 mt-10 border-t border-border">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Chủ đề liên quan:
          </span>
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-border">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl font-bold">Mô hình cùng chuyên mục</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((r) => (
              <Card key={r.id} className="overflow-hidden hover:shadow-md transition-all">
                <Link href={`/post/${r.id}`} className="block p-5">
                  <Badge variant="outline" className="text-xs mb-2">{r.category}</Badge>
                  <h4 className="font-display font-semibold text-base line-clamp-1 mb-1 group-hover:text-primary">
                    {r.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {r.shortDescription}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-primary" /> {formatViews(r.views)}
                    </span>
                    <span className="text-primary font-medium">Đọc bài &rarr;</span>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sticky floating bottom action dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border rounded-full shadow-2xl px-5 py-2.5 flex items-center gap-3 z-40">
        <Button
          variant={userReaction === "like" ? "default" : "ghost"}
          size="sm"
          className="rounded-full gap-1.5 h-9"
          onClick={() => {
            const res = toggleReaction(post.id, "like");
            if (!res.ok && res.message) toast.error(res.message);
          }}
          title="Yêu thích bài viết"
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-semibold">{post.likes}</span>
        </Button>

        <Button
          variant={userReaction === "dislike" ? "destructive" : "ghost"}
          size="sm"
          className="rounded-full gap-1.5 h-9"
          onClick={() => {
            const res = toggleReaction(post.id, "dislike");
            if (!res.ok && res.message) toast.error(res.message);
          }}
          title="Không thích bài viết"
        >
          <ThumbsDown className="w-4 h-4" />
          <span className="text-xs font-semibold">{post.dislikes}</span>
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full h-9 w-9", isSaved && "text-primary bg-primary/10")}
          onClick={() => {
            const res = toggleBookmark(post.id);
            if (!res.ok && res.message) toast.error(res.message);
            else toast.success(isSaved ? "Đã bỏ lưu" : "Đã lưu vào danh sách đọc");
          }}
          title="Lưu bài viết"
        >
          <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Đã sao chép liên kết bài viết vào clipboard!");
          }}
          title="Chia sẻ liên kết"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Backward compatibility alias
export const IdeaDetailPage = PostDetailPage;

