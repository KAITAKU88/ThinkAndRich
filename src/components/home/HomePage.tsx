"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Compass,
  Lightbulb,
  Globe,
  Sparkles,
} from "lucide-react";
import { PILLARS_CONFIG } from "@/lib/data";
import { CREDIT_PACKAGES } from "@/lib/credit-packages";
import { getPppPricing } from "@/lib/geo-pricing";
import { useSiteStats } from "@/lib/hooks/use-site-stats";
import { paidTermPricingCardNote } from "@/lib/site-config";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/store/session";
import { usePosts } from "@/lib/hooks/use-posts";
import { getTranslation } from "@/lib/i18n/translations";
import type { CountryCode, MarketPricing, Post, PillarType } from "@/lib/types";

const PILLAR_ORDER: PillarType[] = ["MENTAL_MODEL", "BUSINESS_STRATEGY", "STARTUP_IDEA"];

const PILLAR_ICONS: Record<PillarType, typeof Brain> = {
  MENTAL_MODEL: Brain,
  BUSINESS_STRATEGY: Compass,
  STARTUP_IDEA: Lightbulb,
};

// Pillar showcase cards — Step 1: no accent colours until Step 3.

export function HomePage() {
  const { posts } = usePosts({ pageSize: 200 });
  const { stats } = useSiteStats();
  return (
    <div>
      <HeroSection posts={posts} />
      <PillarsSection stats={stats} />
      <StatsStrip stats={stats} />
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

  return (
    <section className="neo-section">
      <div>
        <div className="neo-section-header">
          <span className="neo-eyebrow">
            <Sparkles aria-hidden="true" /> {t.home.notNewsFeedBadge}
          </span>
          <h1>{t.home.heroTitle}</h1>
          <p>{t.home.heroSubtitle}</p>
          <div className="neo-actions">
            <Button asChild size="lg" className="neo-btn neo-btn--primary">
              <Link href="/explore">
                {t.home.exploreLibraryBtn} <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            {!user && (
              <Button
                variant="outline"
                size="lg"
                className="neo-btn"
                onClick={() => setAuthOpen(true)}
              >
                {t.home.loginFreeBtn}
              </Button>
            )}
          </div>
        </div>

        {heroPosts.length > 0 && (
          <ul className="card-grid card-grid--hero">
            {heroPosts.map((post) => (
              <li key={post.id}>
                <InteractiveSquareCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 3 PILLARS — parallel categories, not a sequence, so no 01/02/03 markers.
// ─────────────────────────────────────────────────────────────────────────
function PillarsSection({ stats }: { stats: ReturnType<typeof useSiteStats>["stats"] }) {
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  const pillarCounts = stats.byPillar;

  return (
    <section className="neo-section">
      <div>
        <div className="neo-section-header">
          <span className="neo-eyebrow">{t.home.pillarsEyebrow}</span>
          <h2>{t.home.pillarsTitle}</h2>
          <p>{t.home.pillarsSubtitle}</p>
        </div>

        <div className="neo-panel-grid">
          {PILLAR_ORDER.map((pillar) => {
            const meta = PILLARS_CONFIG[pillar];
            const Icon = PILLAR_ICONS[pillar];
            return (
              <Link
                key={pillar}
                href={`/explore?pillar=${pillar}`}
                className="neo-panel neo-shadow"
              >
                <div className="neo-panel-icon">
                  <Icon aria-hidden="true" />
                </div>
                <h3>{meta.titleVi}</h3>
                <p>{meta.taglineVi}</p>
                <div className="neo-panel-footer">
                  <span>
                    {pillarCounts[pillar]} {t.home.profileCountSuffix}
                  </span>
                  <span>
                    {t.home.viewPillarBtn} <ArrowRight aria-hidden="true" />
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
function StatsStrip({ stats }: { stats: ReturnType<typeof useSiteStats>["stats"] }) {
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  const statItems = [
    { label: t.home.statsPostsLabel, value: stats.totalPublished },
    { label: t.home.statsPillarsLabel, value: stats.pillarCount },
    { label: t.home.statsLanguagesLabel, value: stats.languageCount },
  ];

  return (
    <section className="neo-section">
      <div className="neo-stats-row">
        {statItems.map((s) => (
          <div key={s.label} className="neo-stat neo-shadow">
            <span className="neo-stat-value">{s.value}</span>
            <span className="neo-stat-label">{s.label}</span>
          </div>
        ))}
        <div className="neo-stat neo-shadow">
          <Globe aria-hidden="true" />
          <span className="neo-stat-label">{t.home.statsPppNote}</span>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PRICING TEASER — three credit packages; full list is on /pricing.
// ─────────────────────────────────────────────────────────────────────────
function PricingTeaserSection() {
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);
  const t = getTranslation(language);
  const [markets, setMarkets] = useState<Record<CountryCode, MarketPricing> | null>(null);

  useEffect(() => {
    fetch("/api/pricing")
      .then((res) => res.json() as Promise<{ ok: boolean; markets?: Record<CountryCode, MarketPricing> }>)
      .then((data) => {
        if (data.ok && data.markets) setMarkets(data.markets);
      })
      .catch(() => {});
  }, []);

  const currentPpp = markets?.[countryCode] ?? getPppPricing(countryCode);
  const termPhrase = paidTermPricingCardNote(language);

  return (
    <section className="neo-section">
      <div>
        <div className="neo-section-header">
          <span className="neo-eyebrow">{t.home.pricingTeaserEyebrow}</span>
          <h2>{t.home.pricingTeaserTitle}</h2>
          <p>{t.home.pricingTeaserSubtitle}</p>
        </div>

        <div className="neo-panel-grid">
          {CREDIT_PACKAGES.map((pack, i) => (
            <div key={pack.id} className="neo-panel neo-shadow">
              <h3>{pack.credits.toLocaleString("vi-VN")} credit</h3>
              <div className="neo-stat-value">{currentPpp.packages[pack.id].formatted}</div>
              <p>{termPhrase}</p>
              <Button asChild variant={i === 1 ? "default" : "outline"} className={`neo-btn neo-btn--sm${i === 1 ? " neo-btn--primary" : ""}`}>
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
    <section className="neo-section">
      <div className="neo-cta-block neo-shadow">
        <h2>{t.home.finalCtaTitle}</h2>
        <p>{t.home.finalCtaSubtitle}</p>
        <div className="neo-actions neo-actions--center">
          <Button asChild size="lg" className="neo-btn neo-btn--primary">
            <Link href="/explore">
              {t.home.exploreLibraryBtn} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          {!user && (
            <Button variant="outline" size="lg" className="neo-btn" onClick={() => setAuthOpen(true)}>
              {t.home.loginFreeBtn}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
