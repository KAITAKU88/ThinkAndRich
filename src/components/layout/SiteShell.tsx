"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useSession } from "@/store/session";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = useSession((s) => s.settings);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--primary",
      settings.primaryColor
    );
    document.documentElement.style.setProperty("--ring", settings.primaryColor);
  }, [settings.primaryColor]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <AuthDialog />
      <Toaster richColors position="top-center" />
    </div>
  );
}
