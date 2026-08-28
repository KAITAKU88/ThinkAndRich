"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  SessionUser,
  CountryCode,
  SupportedLanguage,
} from "@/lib/types";

import { DEFAULT_SETTINGS } from "@/lib/data";

// Shape returned by the real /api/auth/* routes (src/db/schema.ts users
// table via Drizzle) — maps it onto the SessionUser the rest of the app
// already reads.
interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  countryCode?: string | null;
  preferredLang?: string | null;
  paidCreditBalance: number;
  paidCreditExpiresAt: string | null;
  giftCreditBalance: number;
  giftGrantedThisMonth: number;
  totalCredits: number;
}

function mapApiUser(u: ApiUser): SessionUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as SessionUser["role"],
    countryCode: u.countryCode ?? undefined,
    preferredLang: u.preferredLang ?? undefined,
    paidCreditBalance: u.paidCreditBalance,
    paidCreditExpiresAt: u.paidCreditExpiresAt,
    giftCreditBalance: u.giftCreditBalance,
    giftGrantedThisMonth: u.giftGrantedThisMonth,
    totalCredits: u.totalCredits,
  };
}

export type ReadStatusFilter = "ALL" | "UNREAD" | "READ";

interface SessionState {
  user: SessionUser | null;

  // Per-session read-through cache, hydrated from real D1-backed routes on
  // login/restore — NOT the source of truth (the server is). Lets cards
  // show "is this saved/liked/read" without a fetch per card.
  bookmarks: string[];
  userReactions: Record<string, "like" | "dislike">;
  readPostIds: string[];
  unlockedPostIds: string[];

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

  isPostRead: (postId: string) => boolean;
  isPostUnlocked: (postId: string) => boolean;

  // OTP Auth Flow — backed by the real /api/auth/* routes
  requestOtp: (email: string) => Promise<{ ok: boolean; message?: string; devCode?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ ok: boolean; message?: string }>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;

  // Refreshes bookmarks/reactions/read-state from the server — called
  // after login/restore, and after any action that changes them.
  refreshUserState: () => Promise<void>;

  // Post Interactions & Metrics — real D1 writes now (src/app/api/posts/[slug]/*)
  recordPostView: (postId: string) => Promise<void>;
  unlockPost: (slug: string) => Promise<{
    ok: boolean;
    message?: string;
    reason?: string;
    totalCredits?: number;
    shortfall?: number;
  }>;
  toggleReaction: (postId: string, type: "like" | "dislike") => Promise<{ ok: boolean; message?: string }>;
  toggleBookmark: (postId: string) => Promise<{ ok: boolean; message?: string }>;

  updateSettings: (partial: Partial<AppSettings>) => void;
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<T>;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      bookmarks: [],
      userReactions: {},
      readPostIds: [],
      unlockedPostIds: [],
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

      isPostRead: (postId: string) => get().readPostIds.includes(postId),
      isPostUnlocked: (postId: string) => get().unlockedPostIds.includes(postId),

      requestOtp: async (email: string) => {
        try {
          const res = await fetch("/api/auth/request-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim().toLowerCase() }),
            signal: AbortSignal.timeout(12_000),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            message?: string;
            devCode?: string;
          };
          if (!res.ok || !data.ok) {
            return { ok: false, message: data.message || "Không gửi được mã OTP." };
          }
          return { ok: true, devCode: data.devCode };
        } catch {
          return { ok: false, message: "Không gửi được mã OTP. Restart `npm run dev` rồi thử lại." };
        }
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

        set({ user: mapApiUser(data.user), authOpen: false });
        await get().refreshUserState();
        return { ok: true };
      },

      restoreSession: async () => {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          set({ user: null, bookmarks: [], userReactions: {}, readPostIds: [], unlockedPostIds: [] });
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; user?: ApiUser };
        if (data.ok && data.user) {
          set({ user: mapApiUser(data.user) });
          await get().refreshUserState();
        } else {
          set({ user: null, bookmarks: [], userReactions: {}, readPostIds: [], unlockedPostIds: [] });
        }
      },

      logout: async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        set({ user: null, bookmarks: [], userReactions: {}, readPostIds: [], unlockedPostIds: [] });
      },

      refreshUserState: async () => {
        const user = get().user;
        if (!user) return;

        const [bookmarksRes, reactionsRes, readLogsRes, meRes] = await Promise.allSettled([
          fetch("/api/bookmarks").then((r) => r.json() as Promise<{ ok: boolean; posts?: { id: string }[] }>),
          fetch("/api/reactions/me").then(
            (r) => r.json() as Promise<{ ok: boolean; reactions?: Record<string, "like" | "dislike"> }>
          ),
          fetch("/api/read-logs/me").then(
            (r) => r.json() as Promise<{ ok: boolean; readLogs?: { postId: string }[] }>
          ),
          fetch("/api/auth/me").then((r) => r.json() as Promise<{ ok: boolean; user?: ApiUser }>),
        ]);

        if (bookmarksRes.status === "fulfilled" && bookmarksRes.value.ok && bookmarksRes.value.posts) {
          set({ bookmarks: bookmarksRes.value.posts.map((p) => p.id) });
        }
        if (reactionsRes.status === "fulfilled" && reactionsRes.value.ok && reactionsRes.value.reactions) {
          set({ userReactions: reactionsRes.value.reactions });
        }
        if (readLogsRes.status === "fulfilled" && readLogsRes.value.ok && readLogsRes.value.readLogs) {
          set({
            readPostIds: Array.from(new Set(readLogsRes.value.readLogs.map((l) => l.postId))),
          });
        }
        if (meRes.status === "fulfilled" && meRes.value.ok && meRes.value.user) {
          set({ user: mapApiUser(meRes.value.user) });
        }
      },

      recordPostView: async (postId: string) => {
        const res = await fetch(`/api/posts/${postId}/view`, { method: "POST" }).then(
          (r) => r.json() as Promise<{ ok: boolean }>
        ).catch(() => ({ ok: false }));
        if (res.ok && get().user) {
          set((state) => ({
            readPostIds: state.readPostIds.includes(postId) ? state.readPostIds : [...state.readPostIds, postId],
          }));
        }
      },

      unlockPost: async (slug: string) => {
        if (!get().user) {
          set({ authOpen: true });
          return { ok: false, reason: "AUTH_REQUIRED", message: "Vui lòng đăng nhập để mở khóa bài viết." };
        }
        const res = await fetch(`/api/posts/${slug}/unlock`, { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          message?: string;
          reason?: string;
          totalCredits?: number;
          giftCreditBalance?: number;
          paidCreditBalance?: number;
          shortfall?: number;
          post?: { id: string };
        };
        if (!data.ok) {
          if (data.reason === "INSUFFICIENT_CREDITS") {
            await get().refreshUserState();
          }
          return {
            ok: false,
            message: data.message,
            reason: data.reason,
            shortfall: data.shortfall,
          };
        }
        set((state) => ({
          unlockedPostIds: data.post?.id
            ? state.unlockedPostIds.includes(data.post.id)
              ? state.unlockedPostIds
              : [...state.unlockedPostIds, data.post.id]
            : state.unlockedPostIds,
          user: state.user
            ? {
                ...state.user,
                totalCredits:
                  typeof data.totalCredits === "number" ? data.totalCredits : state.user.totalCredits,
                giftCreditBalance:
                  typeof data.giftCreditBalance === "number"
                    ? data.giftCreditBalance
                    : state.user.giftCreditBalance,
                paidCreditBalance:
                  typeof data.paidCreditBalance === "number"
                    ? data.paidCreditBalance
                    : state.user.paidCreditBalance,
              }
            : state.user,
        }));
        await get().refreshUserState();
        return { ok: true, totalCredits: data.totalCredits };
      },

      toggleReaction: async (postId: string, type: "like" | "dislike") => {
        if (!get().user) {
          set({ authOpen: true });
          return { ok: false, message: "Vui lòng xác thực Email OTP để đánh giá bài viết." };
        }
        const data = await postJson<{ ok: boolean; message?: string; reaction?: "like" | "dislike" | null }>(
          `/api/posts/${postId}/react`,
          { type }
        );
        if (!data.ok) return { ok: false, message: data.message };

        set((state) => {
          const next = { ...state.userReactions };
          if (data.reaction) next[postId] = data.reaction;
          else delete next[postId];
          return { userReactions: next };
        });
        return { ok: true };
      },

      toggleBookmark: async (postId: string) => {
        if (!get().user) {
          set({ authOpen: true });
          return { ok: false, message: "Vui lòng xác thực Email OTP để lưu bài viết." };
        }
        const data = await postJson<{ ok: boolean; message?: string; bookmarked?: boolean }>(
          `/api/posts/${postId}/bookmark`
        );
        if (!data.ok) return { ok: false, message: data.message };

        set((state) => ({
          bookmarks: data.bookmarked
            ? [...state.bookmarks, postId]
            : state.bookmarks.filter((id) => id !== postId),
        }));
        return { ok: true };
      },

      updateSettings: (partial) => {
        set({ settings: { ...get().settings, ...partial } });
      },
    }),
    {
      name: "think-and-rich-storage-v4",
      version: 4,
      // Server-render and the client's first render both need to see the
      // same (default, non-persisted) state — persist would otherwise
      // read localStorage synchronously while the client store is being
      // created, before hydration even starts. SiteShell triggers the
      // real rehydration from localStorage right after mount instead.
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        bookmarks: state.bookmarks,
        userReactions: state.userReactions,
        readPostIds: state.readPostIds,
        unlockedPostIds: state.unlockedPostIds,
        settings: state.settings,
        hideSavedPosts: state.hideSavedPosts,
      }),
    }
  )
);
