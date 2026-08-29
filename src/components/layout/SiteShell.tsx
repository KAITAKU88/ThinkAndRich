"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AppShell } from "@/components/layout/AppShell";
import { useSession } from "@/store/session";

/** Public chrome: sidebar + scrollable main. Admin routes stay bare. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    const unsub = useSession.persist.onFinishHydration(() => {
      const { user, bookmarks, userReactions } = useSession.getState();
      if (!user && (bookmarks.length > 0 || Object.keys(userReactions).length > 0)) {
        useSession.setState({ bookmarks: [], userReactions: {} });
      }
      void useSession.getState().restoreSession();
    });
    void useSession.persist.rehydrate();
    return unsub;
  }, []);

  if (isAdmin) {
    return (
      <>
        {children}
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <AuthDialog />
      <Toaster position="top-center" />
    </>
  );
}
