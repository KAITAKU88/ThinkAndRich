"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useSession } from "@/store/session";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = useSession((s) => s.settings);

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
