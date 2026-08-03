"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Heart, Share2, Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import { getIdea } from "@/lib/services/ideas";
import { canAccessIdea, requiredTier } from "@/lib/access";
import type { Idea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaywallCTA } from "@/components/paywall/PaywallCTA";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";

export function IdeaDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useSession((s) => s.user);
  const favorites = useSession((s) => s.favorites);
  const toggleFavorite = useSession((s) => s.toggleFavorite);

  useEffect(() => {
    setLoading(true);
    getIdea(id).then((res) => {
      setIdea(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-muted-foreground">
        Đang mở dossier...
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <p className="mb-4">Không tìm thấy ý tưởng.</p>
        <Button asChild variant="outline">
          <Link href="/">Quay lại khám phá</Link>
        </Button>
      </div>
    );
  }

  const hasAccess = canAccessIdea(idea, user);
  const need = requiredTier(idea);
  const saved = favorites.includes(idea.id);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 pb-28">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
      </Link>

      <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={idea.thumbnailUrl}
          alt={idea.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary">{idea.category}</Badge>
        {idea.isPremiumOnly ? (
          <Badge variant="super">
            <Crown className="w-3 h-3" /> Super
          </Badge>
        ) : idea.requiresPremium ? (
          <Badge variant="premium">
            <Lock className="w-3 h-3" /> Premium
          </Badge>
        ) : (
          <Badge variant="outline">Miễn phí</Badge>
        )}
      </div>

      <h1 className="font-display text-2xl md:text-4xl font-semibold tracking-tight mb-4">
        {idea.title}
      </h1>
      <p className="text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
        {idea.shortDescription}
      </p>

      <div className="relative">
        <div
          className={cn(
            "prose-idea max-w-none",
            !hasAccess && "premium-content max-h-[260px] overflow-hidden"
          )}
          dangerouslySetInnerHTML={{ __html: idea.fullContent }}
          onContextMenu={
            !hasAccess
              ? (e) => {
                  e.preventDefault();
                }
              : undefined
          }
        />
        {!hasAccess && <PaywallCTA required={need} />}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full shadow-lg px-4 py-2.5 flex items-center gap-3 z-40">
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", saved && "text-red-500")}
          onClick={() => {
            const res = toggleFavorite(idea.id);
            if (!res.ok && res.message) toast.error(res.message);
            else toast.success(saved ? "Đã bỏ lưu" : "Đã lưu ý tưởng");
          }}
        >
          <Heart className={cn("w-5 h-5", saved && "fill-current")} />
        </Button>
        <div className="w-px h-6 bg-border" />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Đã sao chép link");
          }}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
