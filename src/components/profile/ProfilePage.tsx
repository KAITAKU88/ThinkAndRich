"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  User,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Brain,
  Compass,
  Lightbulb,
  Heart,
  MonitorSmartphone,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicSquareCard } from "@/components/ideas/DynamicSquareCard";
import { useSession } from "@/store/session";
import { timeAgo, cn } from "@/lib/utils";
import type { PillarType, Post, ReadLog } from "@/lib/types";
import { PILLARS_CONFIG } from "@/lib/data";
import { getTranslation } from "@/lib/i18n/translations";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";

type ProfileTab = "saved" | "history" | "favorites" | "account";

export function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>("saved");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [savedPillar, setSavedPillar] = useState<"ALL" | PillarType>("ALL");
  const [favPillar, setFavPillar] = useState<"ALL" | PillarType>("ALL");

  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const userReactions = useSession((s) => s.userReactions);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const logout = useSession((s) => s.logout);
  const todayReads = useSession((s) => s.getTodayReadCount)();
  const dailyLimit = useSession((s) => s.getDailyLimit)();
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  // Real per-user data — fetched from D1-backed routes instead of read out
  // of a mock array. bookmarks/userReactions (store cache, ids only) still
  // drive the tab-header counts so those numbers update instantly on
  // toggle without waiting on a refetch.
  const [allSavedPosts, setAllSavedPosts] = useState<Post[]>([]);
  const [allFavoritePosts, setAllFavoritePosts] = useState<Post[]>([]);
  const [userHistory, setUserHistory] = useState<ReadLog[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/bookmarks")
      .then((res) => res.json() as Promise<{ ok: boolean; posts?: Post[] }>)
      .then((data) => {
        if (data.ok && data.posts) setAllSavedPosts(data.posts);
      })
      .catch(() => {});
    fetch("/api/reactions/me?expand=post&type=like")
      .then((res) => res.json() as Promise<{ ok: boolean; posts?: Post[] }>)
      .then((data) => {
        if (data.ok && data.posts) setAllFavoritePosts(data.posts);
      })
      .catch(() => {});
    fetch("/api/read-logs/me")
      .then((res) => res.json() as Promise<{ ok: boolean; readLogs?: ReadLog[] }>)
      .then((data) => {
        if (data.ok && data.readLogs) setUserHistory(data.readLogs);
      })
      .catch(() => {});
  }, [user, bookmarks.length, userReactions]);

  const savedPosts = useMemo(() => {
    if (savedPillar === "ALL") return allSavedPosts;
    return allSavedPosts.filter((p) => p.pillar === savedPillar);
  }, [allSavedPosts, savedPillar]);

  const favoritePosts = useMemo(() => {
    if (favPillar === "ALL") return allFavoritePosts;
    return allFavoritePosts.filter((p) => p.pillar === favPillar);
  }, [allFavoritePosts, favPillar]);

  // MOCK DEVICES
  const devices = [
    { id: 1, name: "Chrome trên Windows", isCurrent: true, lastActive: "Đang hoạt động" },
    { id: 2, name: "Safari trên iPhone 15", isCurrent: false, lastActive: "2 giờ trước" }
  ];

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <User className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">{t.profile.guestTitle}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.profile.guestDesc}
        </p>
        <Button
          className="rounded-full px-8 font-semibold"
          onClick={() => setAuthOpen(true)}
        >
          <Sparkles className="w-4 h-4 mr-2" /> {t.profile.guestLoginBtn}
        </Button>
      </div>
    );
  }

  const quotaPercent = dailyLimit === Infinity ? 100 : Math.min(100, (todayReads / dailyLimit) * 100);

  return (
    <div className="container mx-auto max-w-7xl px-3 sm:px-4 py-6 md:py-8">
      {/* Profile Header Card */}
      <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-card border border-border shadow-sm mb-6 sm:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-bold border border-primary/20 shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                {user.name}
              </h1>
              <Badge
                className={cn(
                  "rounded-full text-xs font-bold",
                  user.tier === "PRO"
                    ? "bg-amber-500 text-white border-none"
                    : user.tier === "PLUS"
                    ? "bg-blue-600 text-white border-none"
                    : "bg-secondary text-foreground"
                )}
              >
                {user.tier === "PRO" ? t.profile.tierProLabel : user.tier === "PLUS" ? t.profile.tierPlusLabel : t.profile.tierFreeLabel}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-all">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-3 mb-6 overflow-x-auto scrollbar-hide">
        <Button
          variant={tab === "history" ? "default" : "ghost"}
          className="rounded-full text-xs sm:text-sm font-semibold gap-1.5 shrink-0"
          onClick={() => setTab("history")}
        >
          <Clock className="w-4 h-4" /> {t.profile.tabHistory} ({userHistory.length})
        </Button>
        <Button
          variant={tab === "saved" ? "default" : "ghost"}
          className="rounded-full text-xs sm:text-sm font-semibold gap-1.5 shrink-0"
          onClick={() => setTab("saved")}
        >
          <Bookmark className="w-4 h-4" /> {t.profile.tabSaved} ({bookmarks.length})
        </Button>
        <Button
          variant={tab === "favorites" ? "default" : "ghost"}
          className="rounded-full text-xs sm:text-sm font-semibold gap-1.5 shrink-0"
          onClick={() => setTab("favorites")}
        >
          <Heart className="w-4 h-4" /> {t.profile.tabFavorites} ({Object.values(userReactions).filter(r => r === "like").length})
        </Button>
        <Button
          variant={tab === "account" ? "default" : "ghost"}
          data-testid="profile-tab-account"
          className="rounded-full text-xs sm:text-sm font-semibold gap-1.5 shrink-0"
          onClick={() => setTab("account")}
        >
          <User className="w-4 h-4" /> {t.profile.tabAccount}
        </Button>
      </div>

      {/* TAB: LỊCH SỬ ĐỌC */}
      {tab === "history" && (
        <Card className="overflow-hidden rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              {t.profile.historyTableTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {userHistory.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {t.profile.historyEmpty}
              </div>
            ) : (
              <table className="w-full min-w-[680px] text-xs sm:text-sm text-left">
                <thead className="text-[11px] uppercase bg-secondary/60 text-muted-foreground border-y border-border">
                  <tr>
                    <th className="px-4 py-3">{t.profile.colTitle}</th>
                    <th className="px-4 py-3">{t.profile.colPillar}</th>
                    <th className="px-4 py-3">{t.profile.colTime}</th>
                    <th className="px-4 py-3 text-center">{t.profile.colRating}</th>
                    <th className="px-4 py-3 text-right">{t.profile.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {userHistory.map((h) => {
                    const pillarMeta = (h.pillar && PILLARS_CONFIG[h.pillar]) || PILLARS_CONFIG.MENTAL_MODEL;
                    return (
                      <tr key={h.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-3.5 font-medium max-w-[240px] truncate">
                          {h.postTitle}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge className={cn("text-[10px] border", pillarMeta?.badgeBg)}>
                            {pillarMeta?.titleVi || "Tri thức"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {timeAgo(h.readAt)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {h.reaction === "like" ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">{t.profile.ratingLiked}</span>
                          ) : h.reaction === "dislike" ? (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs">{t.profile.ratingDisliked}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">{t.profile.ratingRead}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button size="sm" variant="ghost" className="rounded-full text-xs" asChild>
                            <Link href={`/post/${h.postId}`}>
                              {t.profile.rereadBtn} <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB: ĐỌC SAU (SAVED) */}
      {tab === "saved" && (
        <div className="space-y-6">
          {bookmarks.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              <button
                type="button"
                onClick={() => setSavedPillar("ALL")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0",
                  savedPillar === "ALL" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                {t.explore.allLabel} ({bookmarks.length})
              </button>
              <button
                type="button"
                onClick={() => setSavedPillar("MENTAL_MODEL")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1",
                  savedPillar === "MENTAL_MODEL" ? "bg-rose-600 text-white" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                )}
              >
                <Brain className="w-3 h-3" /> {t.pillars.mentalModel}
              </button>
              <button
                type="button"
                onClick={() => setSavedPillar("BUSINESS_STRATEGY")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1",
                  savedPillar === "BUSINESS_STRATEGY" ? "bg-amber-600 text-white" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                <Compass className="w-3 h-3" /> {t.pillars.businessStrategy}
              </button>
              <button
                type="button"
                onClick={() => setSavedPillar("STARTUP_IDEA")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1",
                  savedPillar === "STARTUP_IDEA" ? "bg-emerald-600 text-white" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}
              >
                <Lightbulb className="w-3 h-3" /> {t.pillars.startupIdea}
              </button>
            </div>
          )}

          {savedPosts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border p-8">
              <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-lg mb-1">
                {t.profile.savedEmptyTitle}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {t.profile.savedEmptyDesc}
              </p>
              <Button asChild className="rounded-full">
                <Link href="/">{t.profile.exploreNowBtn}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {savedPosts.map((post) => (
                <DynamicSquareCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: YÊU THÍCH (FAVORITES) */}
      {tab === "favorites" && (
        <div className="space-y-6">
          {favoritePosts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              <button
                type="button"
                onClick={() => setFavPillar("ALL")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0",
                  favPillar === "ALL" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                {t.explore.allLabel} ({favoritePosts.length})
              </button>
              <button
                type="button"
                onClick={() => setFavPillar("MENTAL_MODEL")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1",
                  favPillar === "MENTAL_MODEL" ? "bg-rose-600 text-white" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                )}
              >
                <Brain className="w-3 h-3" /> {t.pillars.mentalModel}
              </button>
              <button
                type="button"
                onClick={() => setFavPillar("BUSINESS_STRATEGY")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1",
                  favPillar === "BUSINESS_STRATEGY" ? "bg-amber-600 text-white" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                )}
              >
                <Compass className="w-3 h-3" /> {t.pillars.businessStrategy}
              </button>
              <button
                type="button"
                onClick={() => setFavPillar("STARTUP_IDEA")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1",
                  favPillar === "STARTUP_IDEA" ? "bg-emerald-600 text-white" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                )}
              >
                <Lightbulb className="w-3 h-3" /> {t.pillars.startupIdea}
              </button>
            </div>
          )}

          {favoritePosts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border p-8">
              <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-lg mb-1">
                {t.profile.favEmptyTitle}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {t.profile.favEmptyDesc}
              </p>
              <Button asChild className="rounded-full">
                <Link href="/">{t.profile.exploreNowBtn}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {favoritePosts.map((post) => (
                <DynamicSquareCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: TÀI KHOẢN (ACCOUNT) */}
      {tab === "account" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thông tin tài khoản */}
          <Card className="rounded-3xl p-6 border-border">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-semibold">{t.profile.accountGeneralTitle}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">{t.profile.fullNameLabel}</p>
                <p className="font-semibold text-foreground">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">{t.profile.emailAddrLabel}</p>
                <p className="font-semibold text-foreground">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">{t.profile.securityLabel}</p>
                <p className="text-xs text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {t.profile.securityValue}
                </p>
              </div>
              <div className="pt-4 border-t border-border flex items-center gap-3">
                <Button variant="destructive" data-testid="logout-btn" className="rounded-full text-xs" onClick={logout}>
                  {t.profile.logoutBtn}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Usage */}
          <Card className="rounded-3xl p-6 border-border">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">{t.profile.billingTitle}</CardTitle>
              <Badge
                className={cn(
                  "rounded-full text-xs font-bold",
                  user.tier === "PRO"
                    ? "bg-amber-500 text-white border-none"
                    : user.tier === "PLUS"
                    ? "bg-blue-600 text-white border-none"
                    : "bg-secondary text-foreground"
                )}
              >
                {user.tier === "PRO" ? t.profile.tierProLabel : user.tier === "PLUS" ? t.profile.tierPlusLabel : t.profile.tierFreeLabel}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{t.profile.readTodayLabel}</span>
                  <span className="font-bold">
                    {dailyLimit === Infinity ? t.profile.unlimitedLabel : `${todayReads} / ${dailyLimit}`}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.tier === "PRO"
                    ? t.profile.quotaProNote
                    : user.tier === "PLUS"
                    ? t.profile.quotaPlusNote
                    : t.profile.quotaFreeNote}
                </p>
              </div>

              {user.tier !== "PRO" && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-amber-600 dark:text-amber-500 text-sm">{t.profile.upgradeTitle}</h4>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                      {t.profile.upgradeDesc}
                    </p>
                  </div>
                  {/* A PLUS member is mid-term, so the price is not the list
                      price — it is the PRO price less what their PLUS year is
                      still worth, which only the server can quote. A FREE
                      reader has nothing to credit and goes to the plans. */}
                  {user.tier === "PLUS" ? (
                    <Button
                      size="sm"
                      className="rounded-full shrink-0 shadow-sm self-end min-[420px]:self-auto"
                      onClick={() => setUpgradeOpen(true)}
                    >
                      {t.profile.upgradeBtn}
                    </Button>
                  ) : (
                    <Button size="sm" className="rounded-full shrink-0 shadow-sm self-end min-[420px]:self-auto" asChild>
                      <Link href="/pricing">{t.profile.upgradeBtn}</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thiết bị truy cập */}
          <Card className="rounded-3xl p-6 border-border lg:col-span-2">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">{t.profile.devicesTitle}</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <MonitorSmartphone className="w-3.5 h-3.5" />
                <span>{devices.length} / 3 {t.profile.devicesMaxSuffix}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden">
                {devices.map((device) => (
                  <div key={device.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 bg-card hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <MonitorSmartphone className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {device.name}
                          {device.isCurrent && (
                            <Badge variant="outline" className="text-[9px] h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              {t.profile.currentBadge}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {t.profile.lastActiveLabel} {device.lastActive}
                        </p>
                      </div>
                    </div>
                    {!device.isCurrent && (
                      <Button variant="outline" size="sm" className="rounded-full text-xs">
                        {t.profile.logoutDeviceBtn}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 flex items-start gap-1.5">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                {t.profile.deviceLimitNote}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
