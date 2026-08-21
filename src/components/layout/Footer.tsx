"use client";

import Link from "next/link";
import { Brain } from "lucide-react";

import { useSession } from "@/store/session";

import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { getTranslation } from "@/lib/i18n/translations";
import { getPppPricing } from "@/lib/geo-pricing";

export function Footer() {
  const brand = useSession((s) => s.settings.brandName);
  const tagline = useSession((s) => s.settings.brandTagline);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const user = useSession((s) => s.user);
  const language = useSession((s) => s.language);
  const countryCode = useSession((s) => s.countryCode);

  const t = getTranslation(language);
  const ppp = getPppPricing(countryCode);

  return (
    <footer className="border-t border-border bg-card/60 mt-auto py-8">
      <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Brain className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-foreground">{brand}</p>
            <p className="text-xs text-muted-foreground">{tagline}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
          <Link href="/explore" className="hover:text-foreground transition-colors">
            {t.nav.explore}
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            {t.nav.pricing}
          </Link>
          <Link href="/profile" className="hover:text-foreground transition-colors">
            {t.nav.library}
          </Link>
          <Link href="/admin" className="text-primary font-semibold hover:underline">
            {t.nav.admin}
          </Link>
          {!user && (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="text-primary font-medium hover:underline"
            >
              {t.nav.login}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <LanguageSelector />
          <p className="text-xs text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} {brand}. {ppp.flag} {ppp.currency} ({ppp.gateway === "sepay" ? "SePay" : "Lemon Squeezy"})
          </p>
        </div>
      </div>
    </footer>
  );
}


