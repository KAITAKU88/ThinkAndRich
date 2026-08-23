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
  LineChart,
  CheckCircle2,
} from "lucide-react";
import { PILLARS_CONFIG, PRICING_PLANS } from "@/lib/data";
import { InteractiveSquareCard } from "@/components/ideas/InteractiveSquareCard";
import { Button } from "@/components/ui/button";
import { useSession } from "@/store/session";
import { cn, formatFormula } from "@/lib/utils";
import type { Post, PillarType } from "@/lib/types";

const PILLAR_ORDER: PillarType[] = ["MENTAL_MODEL", "BUSINESS_STRATEGY", "STARTUP_IDEA"];

const PILLAR_ICONS: Record<PillarType, typeof Brain> = {
  MENTAL_MODEL: Brain,
  BUSINESS_STRATEGY: Compass,
  STARTUP_IDEA: Lightbulb,
};

// Same theme-reactive CSS vars InteractiveSquareCard borders with, so the
// pillar showcase cards below read as the exact same "object" as the real
// content cards, not a separate marketing-only palette.
const PILLAR_ACCENT_VAR: Record<PillarType, string> = {
  MENTAL_MODEL: "var(--pillar-crimson)",
  BUSINESS_STRATEGY: "var(--pillar-amber)",
  STARTUP_IDEA: "var(--pillar-jade)",
};

export function HomePage() {
  return (
    <div>
      <HeroSection />
      <PillarsSection />
      <FormatShowcaseSection />
      <StatsStrip />
      <PricingTeaserSection />
      <FinalCtaSection />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HERO — the thesis: an actual fanned catalog of real index cards, pulled
// straight from the store (one top post per pillar), not a mockup graphic.
// ─────────────────────────────────────────────────────────────────────────
function HeroSection() {
  const posts = useSession((s) => s.posts);
  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);

  const heroPosts = useMemo(() => {
    const published = posts.filter((p) => p.status === "PUBLISHED");
    return PILLAR_ORDER.map((pillar) =>
      published.filter((p) => p.pillar === pillar).sort((a, b) => b.views - a.views)[0]
    ).filter((p): p is Post => Boolean(p));
  }, [posts]);

  const rotations = ["-7deg", "4deg", "10deg"];
  const lifts = ["0px", "-18px", "8px"];

  return (
    <section className="border-b border-border/70">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-10 items-center">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Không phải một feed tin tức
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.08]">
            Một thư viện thẻ tri thức — để tra cứu, không phải để lướt.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Think &amp; Rich đóng gói tư duy chiến lược thành từng hồ sơ tra cứu: công thức học
            thuật, sơ đồ vector, luận điểm cốt lõi — xếp theo 3 trụ cột, như một tủ thẻ mục lục
            thư viện.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full px-6 font-semibold">
              <Link href="/explore">
                Khám phá thư viện <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            {!user && (
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-6 font-semibold"
                onClick={() => setAuthOpen(true)}
              >
                Đăng nhập miễn phí
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
                  className="hero-card-float w-36 sm:w-44 lg:w-48 shrink-0"
                  style={{
                    marginLeft: i === 0 ? 0 : "-2.75rem",
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
function PillarsSection() {
  const posts = useSession((s) => s.posts);

  const pillarCounts = useMemo(() => {
    const published = posts.filter((p) => p.status === "PUBLISHED");
    return {
      MENTAL_MODEL: published.filter((p) => p.pillar === "MENTAL_MODEL").length,
      BUSINESS_STRATEGY: published.filter((p) => p.pillar === "BUSINESS_STRATEGY").length,
      STARTUP_IDEA: published.filter((p) => p.pillar === "STARTUP_IDEA").length,
    } as Record<PillarType, number>;
  }, [posts]);

  return (
    <section className="border-b border-border/70 bg-secondary/30">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-xl mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            3 trụ cột tri thức
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            Ba ngăn tủ, một hệ quy chiếu chiến lược
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Mỗi hồ sơ thuộc đúng một trụ cột — không có mục &quot;khác&quot;, không có nội dung lạc chủ đề.
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
                  <span className="font-mono tabular-nums">{pillarCounts[pillar]} hồ sơ</span>
                  <span className="inline-flex items-center gap-1 text-primary group-hover:gap-1.5 transition-all">
                    Xem trụ cột <ArrowRight className="w-3.5 h-3.5" />
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
// FORMAT SHOWCASE — what a "hồ sơ" actually contains, mocked up with one
// real post instead of described in the abstract.
// ─────────────────────────────────────────────────────────────────────────
function FormatShowcaseSection() {
  const posts = useSession((s) => s.posts);

  const post = useMemo(() => {
    const published = posts.filter((p) => p.status === "PUBLISHED");
    return (
      published.find((p) => p.academicFormula && p.keyTakeaways && p.keyTakeaways.length > 0) ||
      published[0]
    );
  }, [posts]);

  if (!post) return null;

  return (
    <section className="border-b border-border/70">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="order-2 lg:order-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Định dạng hồ sơ
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2 mb-5">
            Không phải một bài blog dài — mà là một hồ sơ tra cứu
          </h2>
          <ul className="space-y-4 text-sm sm:text-base text-foreground/90">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3 h-3" />
              </span>
              <span>
                <strong className="font-semibold">Công thức học thuật</strong> — mô hình rút gọn
                thành một biểu thức logic, không diễn giải dài dòng.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <LineChart className="w-3 h-3" />
              </span>
              <span>
                <strong className="font-semibold">Sơ đồ vector</strong> — minh hoạ trực quan cấu
                trúc mô hình, không phải ảnh chụp màn hình.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </span>
              <span>
                <strong className="font-semibold">3 luận điểm cốt lõi</strong> — thứ áp dụng được
                ngay, đặt lên đầu thay vì chôn ở cuối bài.
              </span>
            </li>
          </ul>
        </div>

        <div className="order-1 lg:order-2 rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            {PILLARS_CONFIG[post.pillar]?.titleVi}
          </p>
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-3 leading-snug">
            {post.title}
          </h3>
          {post.academicFormula && (
            <div className="p-3.5 rounded-2xl bg-secondary/80 border border-border mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Công thức
              </span>
              <div className="font-mono text-sm text-foreground font-semibold academic-formula">
                {formatFormula(post.academicFormula)}
              </div>
            </div>
          )}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <ul className="space-y-1.5 text-xs sm:text-sm text-foreground/90">
              {post.keyTakeaways.slice(0, 3).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATS — quiet, mono-set numbers pulled live from the store. No oversized
// gradient hero-stat treatment.
// ─────────────────────────────────────────────────────────────────────────
function StatsStrip() {
  const posts = useSession((s) => s.posts);
  const publishedCount = useMemo(() => posts.filter((p) => p.status === "PUBLISHED").length, [posts]);

  const stats = [
    { label: "hồ sơ tri thức", value: publishedCount },
    { label: "trụ cột nội dung", value: 3 },
    { label: "ngôn ngữ giao diện", value: 14 },
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
            <span>Giá quy đổi PPP theo khu vực · SePay &amp; Lemon Squeezy</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PRICING TEASER — real plan copy from data.ts, condensed; full detail
// stays on /pricing.
// ─────────────────────────────────────────────────────────────────────────
function PricingTeaserSection() {
  return (
    <section className="border-b border-border/70 bg-secondary/30">
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-xl mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Gói thành viên
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
            Đọc theo tốc độ bạn cần
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Giá hiển thị theo VND — tự động quy đổi PPP nếu bạn ở khu vực khác.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "rounded-3xl border bg-card p-6 flex flex-col",
                plan.isPopular ? "border-primary shadow-lg" : "border-border"
              )}
            >
              {plan.badge && (
                <span
                  className={cn(
                    "self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-4",
                    plan.isPopular ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {plan.badge}
                </span>
              )}
              <h3 className="font-display text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{plan.tagline}</p>
              <div className="font-display text-2xl font-extrabold text-foreground mb-1">
                {plan.priceFormatted}
              </div>
              <p className="text-[11px] text-muted-foreground mb-5">{plan.dailyLimitText}</p>
              <ul className="space-y-2 text-xs text-foreground/90 mb-6 flex-1">
                {plan.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.isPopular ? "default" : "outline"} className="rounded-full font-semibold">
                <Link href="/pricing">Xem chi tiết</Link>
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

  return (
    <section>
      <div className="container mx-auto max-w-[1400px] px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
          Bắt đầu tra cứu — không cần đọc lướt.
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-3 max-w-md mx-auto">
          10 hồ sơ miễn phí mỗi ngày, không cần thẻ thanh toán.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-7 font-semibold">
            <Link href="/explore">
              Khám phá thư viện <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
          {!user && (
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-7 font-semibold"
              onClick={() => setAuthOpen(true)}
            >
              Đăng nhập miễn phí
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
