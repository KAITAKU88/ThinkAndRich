"use client";

import Link from "next/link";
import { Eye, Heart, Lock, Crown, TrendingUp, Globe } from "lucide-react";
import { toast } from "sonner";
import type { Idea } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/store/session";
import { cn, formatViews, timeAgo } from "@/lib/utils";

export function IdeaCard({ idea }: { idea: Idea }) {
  const favorites = useSession((s) => s.favorites);
  const toggleFavorite = useSession((s) => s.toggleFavorite);
  const saved = favorites.includes(idea.id);
  const locked = idea.isPremiumOnly || idea.requiresPremium;

  return (
    <Card className="h-full overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 group">
      <Link href={`/idea/${idea.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={idea.thumbnailUrl}
            alt={idea.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-3 inset-x-3 flex justify-between items-start gap-2">
            <div className="flex flex-wrap gap-1.5">
              <Badge className="bg-white/95 text-foreground">{idea.category}</Badge>
              {idea.isTrending && (
                <Badge className="bg-white/95 text-foreground">
                  <TrendingUp className="w-3 h-3" /> Trending
                </Badge>
              )}
            </div>
            <div className="flex gap-1.5">
              {idea.isPremiumOnly ? (
                <Badge variant="super">
                  <Crown className="w-3 h-3" /> Super
                </Badge>
              ) : idea.requiresPremium ? (
                <Badge variant="premium">
                  <Lock className="w-3 h-3" /> Premium
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-5 flex-1 flex flex-col">
        <Link href={`/idea/${idea.id}`}>
          <h3 className="font-display font-semibold text-lg leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {idea.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
            {idea.shortDescription}
          </p>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {formatViews(idea.views)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> {idea.location}
          </span>
          <span>{timeAgo(idea.createdAt)}</span>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <Button variant="outline" className="flex-1 rounded-full" asChild>
            <Link href={`/idea/${idea.id}`}>
              {locked ? "Xem trước" : "Đọc thêm"}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn("rounded-full", saved && "text-red-500 border-red-200")}
            onClick={() => {
              const res = toggleFavorite(idea.id);
              if (!res.ok && res.message) toast.error(res.message);
              else if (res.ok) toast.success(saved ? "Đã bỏ lưu" : "Đã lưu ý tưởng");
            }}
            aria-label="Lưu ý tưởng"
          >
            <Heart className={cn("w-4 h-4", saved && "fill-current")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
