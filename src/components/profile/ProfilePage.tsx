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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicSquareCard } from "@/components/ideas/DynamicSquareCard";
import { useSession } from "@/store/session";
import { timeAgo } from "@/lib/utils";
import type { PillarType, Post, ReadLog } from "@/lib/types";
import { PILLARS_CONFIG } from "@/lib/data";
import { getTranslation } from "@/lib/i18n/translations";
import { CreditCoin } from "@/components/credits/CreditCoin";
import { GIFT_MONTHLY_CAP } from "@/lib/credits";
import { paidTermStackPhrase, paidTermUsagePeriodLabel } from "@/lib/site-config";
import type { UsageSnapshot } from "@/lib/types";

type ProfileTab = "saved" | "history" | "favorites" | "account";

export function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>("saved");
  const [savedPillar, setSavedPillar] = useState<"ALL" | PillarType>("ALL");
  const [favPillar, setFavPillar] = useState<"ALL" | PillarType>("ALL");

  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const userReactions = useSession((s) => s.userReactions);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const logout = useSession((s) => s.logout);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  useEffect(() => {
    const syncTabFromHash = () => {
      if (window.location.hash === "#account") setTab("account");
      if (window.location.hash === "#saved") setTab("saved");
    };
    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  // Real per-user data — fetched from D1-backed routes instead of read out
  // of a mock array. bookmarks/userReactions (store cache, ids only) still
  // drive the tab-header counts so those numbers update instantly on
  // toggle without waiting on a refetch.
  const [allSavedPosts, setAllSavedPosts] = useState<Post[]>([]);
  const [allFavoritePosts, setAllFavoritePosts] = useState<Post[]>([]);
  const [userHistory, setUserHistory] = useState<ReadLog[]>([]);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

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
    fetch("/api/usage")
      .then((res) => res.json() as Promise<{ ok: boolean; usage?: UsageSnapshot }>)
      .then((data) => {
        if (data.ok && data.usage) setUsage(data.usage);
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

  if (!user) {
    return (
      <div>
        <div>
          <User />
        </div>
        <h1>{t.profile.guestTitle}</h1>
        <p>
          {t.profile.guestDesc}
        </p>
        <Button
          onClick={() => setAuthOpen(true)}
        >
          <Sparkles /> {t.profile.guestLoginBtn}
        </Button>
      </div>
    );
  }

  const giftCap = usage?.giftMonthlyCap ?? GIFT_MONTHLY_CAP;
  const giftGranted = usage?.giftGrantedThisMonth ?? user.giftGrantedThisMonth ?? 0;
  const giftPercent = Math.min(100, (giftGranted / giftCap) * 100);

  return (
    <div>
      {/* Profile Header Card */}
      <div>
        <div>
          <div>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div >
            <div>
              <h1>
                {user.name}
              </h1>
              <Badge>
                {user.totalCredits}
                <CreditCoin />
              </Badge>
            </div>
            <p>{user.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div>
        <Button
          variant={tab === "history" ? "default" : "ghost"}
          onClick={() => setTab("history")}
        >
          <Clock /> {t.profile.tabHistory} ({userHistory.length})
        </Button>
        <Button
          variant={tab === "saved" ? "default" : "ghost"}
          onClick={() => setTab("saved")}
        >
          <Bookmark /> {t.profile.tabSaved} ({bookmarks.length})
        </Button>
        <Button
          variant={tab === "favorites" ? "default" : "ghost"}
          data-testid="profile-tab-favorites"
          onClick={() => setTab("favorites")}
        >
          <Heart /> {t.profile.tabFavorites} ({Object.values(userReactions).filter(r => r === "like").length})
        </Button>
        <Button
          variant={tab === "account" ? "default" : "ghost"}
          data-testid="profile-tab-account"
          onClick={() => setTab("account")}
        >
          <User /> {t.profile.tabAccount}
        </Button>
      </div>

      {/* TAB: LỊCH SỬ ĐỌC */}
      {tab === "history" && (
        <Card >
          <CardHeader>
            <CardTitle>
              {t.profile.historyTableTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userHistory.length === 0 ? (
              <div>
                {t.profile.historyEmpty}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t.profile.colTitle}</th>
                    <th>{t.profile.colPillar}</th>
                    <th>{t.profile.colTime}</th>
                    <th>{t.profile.colRating}</th>
                    <th>{t.profile.colAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {userHistory.map((h) => {
                    const pillarMeta = (h.pillar && PILLARS_CONFIG[h.pillar]) || PILLARS_CONFIG.MENTAL_MODEL;
                    return (
                      <tr key={h.id} >
                        <td>
                          {h.postTitle}
                        </td>
                        <td>
                          <Badge >
                            {pillarMeta?.titleVi || "Tri thức"}
                          </Badge>
                        </td>
                        <td>
                          {timeAgo(h.readAt)}
                        </td>
                        <td>
                          {h.reaction === "like" ? (
                            <span>{t.profile.ratingLiked}</span>
                          ) : h.reaction === "dislike" ? (
                            <span>{t.profile.ratingDisliked}</span>
                          ) : (
                            <span>{t.profile.ratingRead}</span>
                          )}
                        </td>
                        <td>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/post/${h.postId}`}>
                              {t.profile.rereadBtn} <ExternalLink />
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
        <div>
          {allSavedPosts.length > 0 && (
            <div>
              <button
                type="button"
                data-testid="profile-saved-filter-ALL"
                onClick={() => setSavedPillar("ALL")}

              >
                {t.explore.allLabel} ({allSavedPosts.length})
              </button>
              <button
                type="button"
                data-testid="profile-saved-filter-MENTAL_MODEL"
                onClick={() => setSavedPillar("MENTAL_MODEL")}

              >
                <Brain /> {t.pillars.mentalModel}
              </button>
              <button
                type="button"
                data-testid="profile-saved-filter-BUSINESS_STRATEGY"
                onClick={() => setSavedPillar("BUSINESS_STRATEGY")}

              >
                <Compass /> {t.pillars.businessStrategy}
              </button>
              <button
                type="button"
                data-testid="profile-saved-filter-STARTUP_IDEA"
                onClick={() => setSavedPillar("STARTUP_IDEA")}

              >
                <Lightbulb /> {t.pillars.startupIdea}
              </button>
            </div>
          )}

          {savedPosts.length === 0 ? (
            <div>
              <Bookmark />
              <h3>
                {t.profile.savedEmptyTitle}
              </h3>
              <p>
                {t.profile.savedEmptyDesc}
              </p>
              <Button asChild >
                <Link href="/">{t.profile.exploreNowBtn}</Link>
              </Button>
            </div>
          ) : (
            <div>
              {savedPosts.map((post) => (
                <DynamicSquareCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: YÊU THÍCH (FAVORITES) */}
      {tab === "favorites" && (
        <div>
          {allFavoritePosts.length > 0 && (
            <div>
              <button
                type="button"
                data-testid="profile-favorites-filter-ALL"
                onClick={() => setFavPillar("ALL")}

              >
                {t.explore.allLabel} ({allFavoritePosts.length})
              </button>
              <button
                type="button"
                data-testid="profile-favorites-filter-MENTAL_MODEL"
                onClick={() => setFavPillar("MENTAL_MODEL")}

              >
                <Brain /> {t.pillars.mentalModel}
              </button>
              <button
                type="button"
                data-testid="profile-favorites-filter-BUSINESS_STRATEGY"
                onClick={() => setFavPillar("BUSINESS_STRATEGY")}

              >
                <Compass /> {t.pillars.businessStrategy}
              </button>
              <button
                type="button"
                data-testid="profile-favorites-filter-STARTUP_IDEA"
                onClick={() => setFavPillar("STARTUP_IDEA")}

              >
                <Lightbulb /> {t.pillars.startupIdea}
              </button>
            </div>
          )}

          {favoritePosts.length === 0 ? (
            <div>
              <Heart />
              <h3>
                {t.profile.favEmptyTitle}
              </h3>
              <p>
                {t.profile.favEmptyDesc}
              </p>
              <Button asChild >
                <Link href="/">{t.profile.exploreNowBtn}</Link>
              </Button>
            </div>
          ) : (
            <div>
              {favoritePosts.map((post) => (
                <DynamicSquareCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: TÀI KHOẢN (ACCOUNT) */}
      {tab === "account" && (
        <div>
          {/* Thông tin tài khoản */}
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.accountGeneralTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <p>{t.profile.fullNameLabel}</p>
                <p>{user.name}</p>
              </div>
              <div>
                <p>{t.profile.emailAddrLabel}</p>
                <p>{user.email}</p>
              </div>
              <div>
                <p>{t.profile.securityLabel}</p>
                <p>
                  <ShieldCheck />
                  {t.profile.securityValue}
                </p>
              </div>
              <div>
                <Button variant="destructive" data-testid="logout-btn" onClick={logout}>
                  {t.profile.logoutBtn}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing & Usage */}
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.billingTitle}</CardTitle>
              <Badge>
                {user.totalCredits}
                <CreditCoin />
              </Badge>
            </CardHeader>
            <CardContent>
              <div>
                <div>
                  <span>Credit mua (kỳ hiện tại)</span>
                  <span>{usage?.paidBalance ?? user.paidCreditBalance}</span>
                </div>
                <div>
                  <span>Credit tặng còn lại hôm nay</span>
                  <span>{usage?.giftRemainingToday ?? user.giftCreditBalance}</span>
                </div>
                <div>
                  <span>{paidTermUsagePeriodLabel(language)}</span>
                  <span>{usage?.creditsSpentThisTerm ?? 0}</span>
                </div>
                <div>
                  <span>Ngày còn lại tới hạn credit mua</span>
                  <span>
                    {usage?.daysRemaining != null ? `${usage.daysRemaining} ngày` : "Chưa có kỳ hạn"}
                  </span>
                </div>
                <p>Đã cấp {giftGranted}/{giftCap} credit tặng trong tháng này ({giftPercent}%).</p>
              </div>

              <div>
                <div >
                  <h4>Mua thêm credit</h4>
                  <p>
                    {paidTermStackPhrase(language)}
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link href="/pricing">Mua credit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
