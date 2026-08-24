"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  MembershipTier,
  Post,
  ReadLog,
  SessionUser,
  UserRecord,
  CountryCode,
  SupportedLanguage,
} from "@/lib/types";

import {
  DEFAULT_SETTINGS,
  SEED_POSTS,
  SEED_USERS,
  SEED_READ_LOGS,
} from "@/lib/data";

// Shape returned by the real /api/auth/* routes (src/db/schema.ts users
// table via Drizzle) — maps it onto the SessionUser the rest of the app
// already reads.
interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  countryCode: string | null;
  preferredLang: string | null;
  dailyReadsDate: string | null;
  dailyReadsCount: number;
}

function mapApiUser(u: ApiUser): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as SessionUser["role"],
    tier: u.tier as SessionUser["tier"],
    countryCode: u.countryCode ?? undefined,
    preferredLang: u.preferredLang ?? undefined,
    dailyReads: u.dailyReadsDate ? { date: u.dailyReadsDate, count: u.dailyReadsCount } : undefined,
  };
}

export type ReadStatusFilter = "ALL" | "UNREAD" | "READ";

export interface AccessCheckResult {
  allowed: boolean;
  reason?: "AUTH_REQUIRED" | "PRO_REQUIRED" | "DAILY_LIMIT_REACHED";
  limit?: number;
  currentReads?: number;
  tier?: MembershipTier;
}

interface SessionState {
  user: SessionUser | null;
  users: UserRecord[];
  posts: Post[];
  readLogs: ReadLog[];
  bookmarks: string[];
  userReactions: Record<string, "like" | "dislike">; // postId -> reaction
  settings: AppSettings;
  authOpen: boolean;

  // Localization & Multi-currency (PPP)
  language: SupportedLanguage;
  countryCode: CountryCode;
  setLanguage: (lang: SupportedLanguage) => void;
  setCountryCode: (country: CountryCode) => void;
  detectGeo: () => Promise<void>;

  // View preferences & Filters
  hideSavedPosts: boolean;
  setHideSavedPosts: (hide: boolean) => void;

  // UI state
  setAuthOpen: (open: boolean) => void;


  // Tier & Access Control
  upgradeTier: (tier: MembershipTier) => void;
  canAccessPost: (post: Post) => AccessCheckResult;
  getTodayReadCount: () => number;
  getDailyLimit: () => number; // 10 for FREE, 15 for PLUS, Infinity for MEMBER

  // OTP Auth Flow — backed by the real /api/auth/* routes
  requestOtp: (email: string) => Promise<{ ok: boolean; message?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ ok: boolean; message?: string }>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Post Interactions & Metrics
  recordPostView: (postId: string) => void;
  toggleReaction: (postId: string, type: "like" | "dislike") => { ok: boolean; message?: string };
  toggleBookmark: (postId: string) => { ok: boolean; message?: string };

  // Admin Operations
  createPost: (
    post: Omit<
      Post,
      "id" | "slug" | "createdAt" | "updatedAt" | "views" | "likes" | "dislikes"
    >
  ) => Post;
  updatePost: (id: string, updates: Partial<Post>) => Post | null;
  deletePost: (id: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Reader / Analytics Queries
  getPostReaders: (postId: string) => ReadLog[];
  getUserReadHistory: (userId: string) => ReadLog[];
  isPostRead: (postId: string) => boolean;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}


function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      users: SEED_USERS,
      posts: SEED_POSTS,
      readLogs: SEED_READ_LOGS,
      bookmarks: [],
      userReactions: {},
      settings: DEFAULT_SETTINGS,
      authOpen: false,
      hideSavedPosts: true,

      // Localization & Multi-currency (PPP)
      language: "vi",
      countryCode: "VN",
      setLanguage: (lang) => {
        set({ language: lang });
        if (typeof window !== "undefined") {
          localStorage.setItem("preferred_lang", lang);
        }
      },
      setCountryCode: (country) => set({ countryCode: country }),
      detectGeo: async () => {
        try {
          const res = await fetch("/api/geo");
          if (res.ok) {
            const data = (await res.json()) as {
              country_code?: CountryCode;
              suggested_lang?: SupportedLanguage;
            };
            if (data.country_code) {
              set({ countryCode: data.country_code });
              // If user hasn't manually set language, apply suggested lang
              const savedLang = typeof window !== "undefined" ? localStorage.getItem("preferred_lang") : null;
              if (!savedLang && data.suggested_lang) {
                set({ language: data.suggested_lang as SupportedLanguage });
              }
            }
          }
        } catch {
          // Fallback to defaults
        }
      },

      setHideSavedPosts: (hide) => set({ hideSavedPosts: hide }),
      setAuthOpen: (open) => set({ authOpen: open }),


      upgradeTier: (tier: MembershipTier) => {
        const { user, users } = get();
        if (!user) return;
        const updatedUser: SessionUser = { ...user, tier };
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, tier } : u
        );
        set({ user: updatedUser, users: updatedUsers });
      },

      getDailyLimit: () => {
        const { user } = get();
        if (!user || user.role === "ADMIN" || user.tier === "PRO") return Infinity;
        if (user.tier === "PLUS") return 25;
        return 10;
      },

      getTodayReadCount: () => {
        const { user, readLogs } = get();
        if (!user) return 0;
        const todayStr = getTodayString();
        // Count distinct posts read today by this user
        const todayPosts = new Set(
          readLogs
            .filter(
              (log) =>
                log.userId === user.id &&
                log.readAt.slice(0, 10) === todayStr
            )
            .map((l) => l.postId)
        );
        return todayPosts.size;
      },

      canAccessPost: (post: Post): AccessCheckResult => {
        // Open-tier content is readable by anyone, logged in or not — it
        // exists specifically so Google can index it and so anonymous
        // readers hit a login wall only when they click through to a
        // cross-linked Free/Plus/Pro piece, not on the entry article itself.
        if (post.accessLevel === "OPEN") {
          return { allowed: true };
        }

        const { user } = get();
        if (!user) {
          return { allowed: false, reason: "AUTH_REQUIRED" };
        }

        if (user.role === "ADMIN" || user.tier === "PRO") {
          return { allowed: true };
        }

        const tier = user.tier || "FREE";
        const todayReads = get().getTodayReadCount();
        const level = post.accessLevel || (post.isPro || post.isMemberOnly ? "MEMBER_PLUS" : "FREE");

        if (tier === "FREE") {
          if (level === "MEMBER_PLUS" || level === "MEMBER_PRO") {
            return {
              allowed: false,
              reason: "PRO_REQUIRED",
              tier: "FREE",
            };
          }
          if (todayReads >= 10 && !get().isPostRead(post.id)) {
            return {
              allowed: false,
              reason: "DAILY_LIMIT_REACHED",
              limit: 10,
              currentReads: todayReads,
              tier: "FREE",
            };
          }
          return { allowed: true };
        }

        if (tier === "PLUS") {
          if (level === "MEMBER_PRO") {
            return {
              allowed: false,
              reason: "PRO_REQUIRED",
              tier: "PLUS",
            };
          }
          if (todayReads >= 25 && !get().isPostRead(post.id)) {
            return {
              allowed: false,
              reason: "DAILY_LIMIT_REACHED",
              limit: 25,
              currentReads: todayReads,
              tier: "PLUS",
            };
          }
          return { allowed: true };
        }

        return { allowed: true };
      },

      requestOtp: async (email: string) => {
        const res = await fetch("/api/auth/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
        if (!res.ok || !data.ok) {
          return { ok: false, message: data.message || "Không gửi được mã OTP." };
        }
        return { ok: true };
      },

      verifyOtp: async (email: string, code: string) => {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
          user?: ApiUser;
        };
        if (!res.ok || !data.ok || !data.user) {
          return { ok: false, message: data.message || "Mã OTP không chính xác hoặc đã hết hạn." };
        }

        set({
          user: mapApiUser(data.user),
          authOpen: false,
          // No per-account bookmark/reaction backend yet — never carry
          // over whatever the previous identity on this browser had.
          bookmarks: [],
          userReactions: {},
        });

        return { ok: true };
      },

      restoreSession: async () => {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          set({ user: null });
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; user?: ApiUser };
        set({ user: data.ok && data.user ? mapApiUser(data.user) : null });
      },

      // bookmarks/userReactions are a per-user overlay on top of shared
      // session state (not scoped by user id), so they must be cleared on
      // logout — otherwise an anonymous viewer (or the next account on this
      // browser) would see the previous account's saved/liked posts.
      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        set({ user: null, bookmarks: [], userReactions: {} });
      },

      recordPostView: (postId: string) => {
        const { posts, user, users, readLogs } = get();
        const targetPost = posts.find((p) => p.id === postId);
        if (!targetPost) return;

        // Increment post views
        const updatedPosts = posts.map((p) =>
          p.id === postId ? { ...p, views: p.views + 1 } : p
        );

        // If user is logged in, record read event
        if (user) {
          const now = new Date().toISOString();
          const today = getTodayString();
          const newLog: ReadLog = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            postId: targetPost.id,
            postTitle: targetPost.title,
            pillar: targetPost.pillar,
            postCategory: targetPost.category,
            readAt: now,
            reaction: get().userReactions[postId] || "none",
          };

          const updatedUsers = users.map((u) => {
            if (u.id === user.id) {
              const reads = u.readPosts.includes(postId)
                ? u.readPosts
                : [...u.readPosts, postId];
              const dailyCount =
                u.dailyReads?.date === today
                  ? u.dailyReads.count + 1
                  : 1;
              return {
                ...u,
                readPosts: reads,
                dailyReads: { date: today, count: dailyCount },
              };
            }
            return u;
          });

          set({
            posts: updatedPosts,
            users: updatedUsers,
            readLogs: [newLog, ...readLogs],
          });
        } else {
          set({ posts: updatedPosts });
        }
      },

      toggleReaction: (postId: string, type: "like" | "dislike") => {
        const { user, posts, userReactions, users } = get();
        if (!user) {
          set({ authOpen: true });
          return {
            ok: false,
            message: "Vui lòng xác thực Email OTP để đánh giá bài viết.",
          };
        }

        const currentReaction = userReactions[postId];
        let newLikeDelta = 0;
        let newDislikeDelta = 0;
        let nextReaction: "like" | "dislike" | undefined;

        if (currentReaction === type) {
          // Cancel reaction
          if (type === "like") newLikeDelta = -1;
          if (type === "dislike") newDislikeDelta = -1;
          nextReaction = undefined;
        } else if (currentReaction) {
          // Switch reaction
          if (type === "like") {
            newLikeDelta = 1;
            newDislikeDelta = -1;
          } else {
            newLikeDelta = -1;
            newDislikeDelta = 1;
          }
          nextReaction = type;
        } else {
          // New reaction
          if (type === "like") newLikeDelta = 1;
          if (type === "dislike") newDislikeDelta = 1;
          nextReaction = type;
        }

        const nextReactions = { ...userReactions };
        if (nextReaction) {
          nextReactions[postId] = nextReaction;
        } else {
          delete nextReactions[postId];
        }

        const updatedPosts = posts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likes: Math.max(0, p.likes + newLikeDelta),
              dislikes: Math.max(0, p.dislikes + newDislikeDelta),
            };
          }
          return p;
        });

        // Update user's likedPosts / dislikedPosts
        const updatedUsers = users.map((u) => {
          if (u.id === user.id) {
            const liked = u.likedPosts.filter((id) => id !== postId);
            const disliked = u.dislikedPosts.filter((id) => id !== postId);
            if (nextReaction === "like") liked.push(postId);
            if (nextReaction === "dislike") disliked.push(postId);
            return { ...u, likedPosts: liked, dislikedPosts: disliked };
          }
          return u;
        });


        set({
          posts: updatedPosts,
          userReactions: nextReactions,
          users: updatedUsers,
        });

        return { ok: true };
      },

      toggleBookmark: (postId: string) => {
        const { user, bookmarks, users } = get();
        if (!user) {
          set({ authOpen: true });
          return {
            ok: false,
            message: "Vui lòng xác thực Email OTP để lưu bài viết.",
          };
        }

        const isSaved = bookmarks.includes(postId);
        const nextBookmarks = isSaved
          ? bookmarks.filter((id) => id !== postId)
          : [...bookmarks, postId];

        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, bookmarkedPosts: nextBookmarks } : u
        );

        set({ bookmarks: nextBookmarks, users: updatedUsers });
        return { ok: true };
      },

      createPost: (newPostData) => {
        const { posts } = get();
        const id =
          slugify(newPostData.title) || `post-${Date.now().toString()}`;
        const now = new Date().toISOString();

        const newPost: Post = {
          ...newPostData,
          id,
          slug: id,
          views: 0,
          likes: 0,
          dislikes: 0,
          createdAt: now,
          updatedAt: now,
        };

        set({ posts: [newPost, ...posts] });
        return newPost;
      },

      updatePost: (id: string, updates: Partial<Post>) => {
        const { posts } = get();
        let updatedItem: Post | null = null;

        const updatedPosts = posts.map((p) => {
          if (p.id === id) {
            updatedItem = {
              ...p,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            return updatedItem;
          }
          return p;
        });

        set({ posts: updatedPosts });
        return updatedItem;
      },

      deletePost: (id: string) => {
        const { posts } = get();
        set({ posts: posts.filter((p) => p.id !== id) });
      },

      updateSettings: (partial) => {
        set({ settings: { ...get().settings, ...partial } });
      },

      getPostReaders: (postId: string) => {
        const { readLogs } = get();
        return readLogs.filter((log) => log.postId === postId);
      },

      getUserReadHistory: (userId: string) => {
        const { readLogs } = get();
        return readLogs.filter((log) => log.userId === userId);
      },

      isPostRead: (postId: string) => {
        const { user, readLogs, users } = get();
        if (!user) return false;
        const userRec = users.find((u) => u.id === user.id);
        if (userRec && userRec.readPosts.includes(postId)) return true;
        return readLogs.some((l) => l.userId === user.id && l.postId === postId);
      },
    }),
    {
      name: "think-and-rich-storage-v2",
      version: 2,
      // Server-render and the client's first render both need to see the
      // same (default, non-persisted) state — persist would otherwise
      // read localStorage synchronously while the client store is being
      // created, before hydration even starts. SiteShell triggers the
      // real rehydration from localStorage right after mount instead.
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        users: state.users,
        posts: state.posts,
        readLogs: state.readLogs,
        bookmarks: state.bookmarks,
        userReactions: state.userReactions,
        settings: state.settings,
        hideSavedPosts: state.hideSavedPosts,
      }),
    }
  )
);
