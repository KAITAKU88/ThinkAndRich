"use client";

import Link from "next/link";
import { Eye, ThumbsUp, ThumbsDown, Bookmark, Clock, Sparkles, Crown, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Post } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/store/session";
import { cn, formatViews, timeAgo } from "@/lib/utils";

export function PostCard({ post }: { post: Post }) {
  const bookmarks = useSession((s) => s.bookmarks);
  const toggleBookmark = useSession((s) => s.toggleBookmark);
  const toggleReaction = useSession((s) => s.toggleReaction);
  const userReactions = useSession((s) => s.userReactions);
  const isPostRead = useSession((s) => s.isPostRead);
  const user = useSession((s) => s.user);

  const isSaved = bookmarks.includes(post.id);
  const isRead = isPostRead(post.id);
  const userReaction = userReactions[post.id];

  return (
    <Card className="h-full overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border-border/80 bg-card">
      <Link href={`/post/${post.id}`} className="block relative">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <div className="absolute top-3 inset-x-3 flex justify-between items-start gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="bg-background/90 backdrop-blur-md text-foreground font-medium shadow-sm border border-border/50 text-[11px]">
                {post.category}
              </Badge>
              {(post.isMemberOnly || post.isPro) && (
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-sm border-none flex items-center gap-1 text-[10px] px-2">
                  <Crown className="w-3 h-3" /> MEMBER
                </Badge>
              )}
            </div>


            <div className="flex items-center gap-1">
              {isRead && (
                <Badge className="bg-emerald-600/90 text-white text-[10px] font-medium border-none flex items-center gap-1 backdrop-blur-md">
                  <CheckCircle2 className="w-3 h-3" /> Đã đọc
                </Badge>
              )}
              {post.featured && (
                <Badge className="bg-primary/90 text-primary-foreground font-medium shadow-sm border-none flex items-center gap-1 text-[10px]">
                  <Sparkles className="w-3 h-3" /> Nổi bật
                </Badge>
              )}
            </div>
          </div>


          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white/90">
            <span className="inline-flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Clock className="w-3 h-3" /> {post.readTime}
            </span>
            <span className="text-white/80">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </Link>

      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/post/${post.id}`} className="block">
            <h3 className="font-display font-semibold text-lg md:text-xl leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
              {post.shortDescription}
            </p>
          </Link>
        </div>

        <div>
          {/* Metrics bar: Views (eye), Likes (thumbs up), Dislikes (thumbs down) */}
          <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-muted/50 border border-border/40 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1 font-medium text-foreground" title="Lượt xem bài viết">
              <Eye className="w-4 h-4 text-primary" />
              <span>{formatViews(post.views)}</span>
              <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">lượt xem</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const res = toggleReaction(post.id, "like");
                  if (!res.ok && res.message) toast.error(res.message);
                }}
                className={cn(
                  "inline-flex items-center gap-1 transition-colors hover:text-primary",
                  userReaction === "like" && "text-primary font-semibold"
                )}
                title="Bấm Yêu thích"
              >
                <ThumbsUp className={cn("w-3.5 h-3.5", userReaction === "like" && "fill-primary")} />
                <span>{post.likes}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const res = toggleReaction(post.id, "dislike");
                  if (!res.ok && res.message) toast.error(res.message);
                }}
                className={cn(
                  "inline-flex items-center gap-1 transition-colors hover:text-destructive",
                  userReaction === "dislike" && "text-destructive font-semibold"
                )}
                title="Bấm Không thích"
              >
                <ThumbsDown className={cn("w-3.5 h-3.5", userReaction === "dislike" && "fill-destructive")} />
                <span>{post.dislikes}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="flex-1 rounded-full text-sm font-medium shadow-sm"
              asChild
            >
              <Link href={`/post/${post.id}`}>
                {user ? "Đọc mô hình" : "Đọc trọn vẹn"}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full shrink-0 transition-colors",
                isSaved && "text-primary border-primary bg-primary/10"
              )}
              onClick={() => {
                const res = toggleBookmark(post.id);
                if (!res.ok && res.message) toast.error(res.message);
                else if (res.ok)
                  toast.success(isSaved ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết vào tủ sách cá nhân");
              }}
              aria-label="Lưu bài viết"
            >
              <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Backward compatibility alias
export const IdeaCard = ({ idea }: { idea: Post }) => <PostCard post={idea} />;


