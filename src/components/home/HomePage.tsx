"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Compass,
  Lightbulb,
  Globe,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { PILLARS_CONFIG } from "@/lib/data";
import { CREDIT_PACKAGES, SEEDED_PACKAGE_PRICES } from "@/lib/credit-packages";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/store/session";
import { usePosts } from "@/lib/hooks/use-posts";
import { cn } from "@/lib/utils";
import { getTranslation } from "@/lib/i18n/translations";
import type { Post, PillarType } from "@/lib/types";

const PILLAR_ORDER: PillarType[] = ["MENTAL_MODEL", "BUSINESS_STRATEGY", "STARTUP_IDEA"];

const PILLAR_ICONS: Record<PillarType, typeof Brain> = {
  MENTAL_MODEL: Brain,
  BUSINESS_STRATEGY: Compass,
  STARTUP_IDEA: Lightbulb,
};

// Pillar showcase cards keep the shelf-colour of each trụ cột. Article
// cards (InteractiveSquareCard) edge by credit cost, not pillar.
const PILLAR_ACCENT_VAR: Record<PillarType, string> = {
  MENTAL_MODEL: "var(--pillar-crimson)",
  BUSINESS_STRATEGY: "var(--pillar-amber)",
  STARTUP_IDEA: "var(--pillar-jade)",
};

export function HomePage() {
  const { posts } = usePosts({ pageSize: 200 });
  return (
    <div>
      <HeroSection posts={posts} />
      <PillarsSection posts={posts} />
      <StatsStrip posts={posts} />
      <PricingTeaserSection />
      <FinalCtaSection />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HERO — the thesis: an actual fanned catalog of real index cards, pulled
// straight from the store (one top post per pillar), not a mockup graphic.
// ─────────────────────────────────────────────────────────────────────────
function HeroSection({ posts }: { posts: Post[] }) {
  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  const heroPosts = useMemo(() => {
    return PILLAR_ORDER.map((pillar) =>
      posts.filter((p) => p.pillar === pillar).sort((a, b) => b.views - a.views)[0]
    ).filter((p): p is Post => Boolean(p));
  }, [posts]);

  const rotations = ["-7deg", "4deg", "10deg"];
  const lifts = ["0px", "-18px", "8px"];

  return (
    <section className="border-b border-border/70">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-10 items-center">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5" /> {t.home.notNewsFeedBadge}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            {t.home.heroTitle}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t.home.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6 font-semibold">
              <Link href="/explore">
                {t.home.exploreLibraryBtn} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            {!user && (
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 font-semibold"
                onClick={() => setAuthOpen(true)}
              >
                {t.home.loginFreeBtn}
              </Button>
            )}
          </div>
        </div>

        {heroPosts.length > 0 && (
          <div className="relative h-[280px] sm:h-[340px] lg:h-[380px]">
            <div className="absolute inset-0 flex items-center justify-center">
              {heroPosts.map((post, i) => (
                <div
                  key={post.id}
                  className="hero-card-float w-28 min-[375px]:w-36 sm:w-44 lg:w-48 shrink-0 [--fan-overlap:-2.5rem] min-[375px]:[--fan-overlap:-2.75rem]"
                  style={{
                    marginLeft: i === 0 ? 0 : "var(--fan-overlap)",
                    marginTop: lifts[i % lifts.length],
                    rotate: rotations[i % rotations.length],
                    zIndex: i,
                    animationDelay: `${i * 0.7}s`,
                  }}
                >
                  <InteractiveSquareCard post={post} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3 PILLARS — parallel categories, not a sequence, so no 01/02/03 markers.
// ─────────────────────────────────────────────────────────────────────────
function PillarsSection({ posts }: { posts: Post[] }) {
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  const pillarCounts = useMemo(() => {
    return {
      MENTAL_MODEL: posts.filter((p) => p.pillar === "MENTAL_MODEL").length,
      BUSINESS_STRATEGY: posts.filter((p) => p.pillar === "BUSINESS_STRATEGY").length,
      STARTUP_IDEA: posts.filter((p) => p.pillar === "STARTUP_IDEA").length,
    } as Record<PillarType, number>;
  }, [posts]);

  return (
    <section className="border-b border-border/70 bg-secondary/30">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-xl mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {t.home.pillarsEyebrow}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t.home.pillarsTitle}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {t.home.pillarsSubtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {PILLAR_ORDER.map((pillar) => {
            const meta = PILLARS_CONFIG[pillar];
            const Icon = PILLAR_ICONS[pillar];
            return (
              <Link
                key={pillar}
                href={`/explore?pillar=${pillar}`}
                className="group relative rounded-3xl border-[1.5px] bg-card p-6 sm:p-7 transition-all hover:shadow-xl flex flex-col"
                style={{
                  borderColor: `color-mix(in oklab, ${PILLAR_ACCENT_VAR[pillar]} 35%, var(--border))`,
                }}
              >
                <div className={cn("flex items-center justify-center w-11 h-11 rounded-2xl mb-5 border", meta.badgeBg)}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-1.5">{meta.titleVi}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{meta.taglineVi}</p>
                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="font-mono tabular-nums">{pillarCounts[pillar]} {t.home.profileCountSuffix}</span>
                  <span className="inline-flex items-center gap-1 text-primary group-hover:gap-1.5 transition-all">
                    {t.home.viewPillarBtn} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATS — quiet, mono-set numbers pulled live from the store. No oversized
// gradient hero-stat treatment.
// ─────────────────────────────────────────────────────────────────────────
function StatsStrip({ posts }: { posts: Post[] }) {
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  const publishedCount = posts.length;

  const stats = [
    { label: t.home.statsPostsLabel, value: publishedCount },
    { label: t.home.statsPillarsLabel, value: 3 },
    { label: t.home.statsLanguagesLabel, value: 14 },
  ];

  return (
    <section className="border-b border-border/70">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-8 gap-y-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                  {s.value}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Globe className="w-4 h-4 text-primary" />
            <span>{t.home.statsPppNote}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PRICING TEASER — three credit packages; full PPP detail stays on /pricing.
// ─────────────────────────────────────────────────────────────────────────
function PricingTeaserSection() {
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  return (
    <section className="border-b border-border/70 bg-secondary/30">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-xl mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {t.home.pricingTeaserEyebrow}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            {t.home.pricingTeaserTitle}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {t.home.pricingTeaserSubtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {CREDIT_PACKAGES.map((pack, i) => (
            <div
              key={pack.id}
              className={cn(
                "rounded-3xl border bg-card p-6 flex flex-col",
                i === 1 ? "border-primary shadow-lg" : "border-border"
              )}
            >
              <h3 className="font-display text-lg font-bold text-foreground">
                {pack.credits.toLocaleString("vi-VN")} credit
              </h3>
              <div className="font-display text-2xl font-extrabold text-foreground mt-4 mb-1">
                {SEEDED_PACKAGE_PRICES.VN[pack.id].formatted}
              </div>
              <p className="text-[11px] text-muted-foreground mb-5">Hạn 365 ngày từ lần mua gần nhất</p>
              <Button asChild variant={i === 1 ? "default" : "outline"} className="rounded-full font-semibold mt-auto">
                <Link href="/pricing">{t.home.viewDetailsBtn}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FINAL CTA
// ─────────────────────────────────────────────────────────────────────────
function FinalCtaSection() {
  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  return (
    <section>
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
          {t.home.finalCtaTitle}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md mx-auto">
          {t.home.finalCtaSubtitle}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-7 font-semibold">
            <Link href="/explore">
              {t.home.exploreLibraryBtn} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          {!user && (
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-7 font-semibold"
              onClick={() => setAuthOpen(true)}
            >
              {t.home.loginFreeBtn}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
