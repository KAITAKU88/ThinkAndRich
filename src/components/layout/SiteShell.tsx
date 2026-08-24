"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useSession } from "@/store/session";

export function SiteShell({ children }: { children: React.ReactNode }) {
  // The store persists to localStorage, which the server can't see —
  // useSession is configured with skipHydration so both the server and
  // the client's first render use the same untouched default state, then
  // this pulls the persisted data in right after mount. Rehydrating
  // eagerly (no skipHydration) would make the client's first render
  // already differ from what the server sent, which React reports as a
  // hydration mismatch and recovers from by discarding and re-rendering
  // the affected subtree — visible as a flash/jump on load.
  useEffect(() => {
    useSession.persist.rehydrate();
    // Self-heal browsers that persisted bookmarks/reactions from before
    // logout was fixed to clear them — without this, an anonymous visitor
    // on this browser would keep seeing whatever the last logged-out
    // session had saved/liked.
    const { user, bookmarks, userReactions } = useSession.getState();
    if (!user && (bookmarks.length > 0 || Object.keys(userReactions).length > 0)) {
      useSession.setState({ bookmarks: [], userReactions: {} });
    }
    // The real session cookie (Sprint B2 /api/auth/*) is authoritative —
    // repopulates `user` on reload, or clears a stale localStorage one.
    useSession.getState().restoreSession();
  }, []);

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BottomNav />
      <AuthDialog />
      <Toaster richColors position="top-center" />
    </div>
  );
}
