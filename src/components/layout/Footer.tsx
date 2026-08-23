"use client";

import Link from "next/link";
import { Brain } from "lucide-react";

import { useSession } from "@/store/session";
import { getPppPricing } from "@/lib/geo-pricing";

export function Footer() {
  const brand = useSession((s) => s.settings.brandName);
  const tagline = useSession((s) => s.settings.brandTagline);
  const countryCode = useSession((s) => s.countryCode);

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
          <Link href="/faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Điều khoản
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Bảo mật
          </Link>
        </div>

        <p className="text-xs text-muted-foreground text-center md:text-right">
          © {new Date().getFullYear()} {brand}. {ppp.flag} {ppp.currency} ({ppp.gateway === "sepay" ? "SePay" : "Lemon Squeezy"})
        </p>
      </div>
    </footer>
  );
}


