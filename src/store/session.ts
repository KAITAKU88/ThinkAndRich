"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, SessionUser, SubscriptionTier } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/data";
import { favoriteLimit } from "@/lib/access";

interface SessionState {
  user: SessionUser | null;
  favorites: string[];
  settings: AppSettings;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  login: (email: string, opts?: { asAdmin?: boolean }) => void;
  logout: () => void;
  setTier: (tier: SubscriptionTier) => void;
  toggleFavorite: (ideaId: string) => { ok: boolean; message?: string };
  updateSettings: (partial: Partial<AppSettings>) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      favorites: [],
      settings: DEFAULT_SETTINGS,
      authOpen: false,
      setAuthOpen: (open) => set({ authOpen: open }),
      login: (email, opts) => {
        const name = email.split("@")[0] || "Founder";
        set({
          user: {
            id: opts?.asAdmin ? "admin-1" : `user-${email}`,
            email,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            role: opts?.asAdmin ? "ADMIN" : "USER",
            subscriptionTier: "FREE",
          },
          authOpen: false,
        });
      },
      logout: () => set({ user: null, favorites: [] }),
      setTier: (tier) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, subscriptionTier: tier } });
      },
      toggleFavorite: (ideaId) => {
        const { user, favorites } = get();
        if (!user) {
          set({ authOpen: true });
          return { ok: false, message: "Đăng nhập để lưu ý tưởng." };
        }
        if (favorites.includes(ideaId)) {
          set({ favorites: favorites.filter((id) => id !== ideaId) });
          return { ok: true };
        }
        const limit = favoriteLimit(user.subscriptionTier);
        if (favorites.length >= limit) {
          return {
            ok: false,
            message: `Gói Free chỉ lưu tối đa ${limit} ý tưởng. Nâng cấp để lưu không giới hạn.`,
          };
        }
        set({ favorites: [...favorites, ideaId] });
        return { ok: true };
      },
      updateSettings: (partial) =>
        set({ settings: { ...get().settings, ...partial } }),
    }),
    {
      name: "ideavault-session",
      partialize: (s) => ({
        user: s.user,
        favorites: s.favorites,
        settings: s.settings,
      }),
    }
  )
);
