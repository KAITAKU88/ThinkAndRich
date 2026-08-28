"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Compass, Bookmark, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";

export function BottomNav() {
  const pathname = usePathname();
  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const authOpen = useSession((s) => s.authOpen);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  // Hide bottom nav in admin dashboard or specialized views if desired, but keep globally for app
  const isPostPage = pathname.startsWith("/post/");

  const navItems = [
    {
      id: "home",
      label: t.nav.home,
      path: "/",
      icon: Home,
      exact: true,
    },
    {
      id: "explore",
      label: t.nav.explore,
      path: "/explore",
      icon: Compass,
      exact: false,
    },
    {
      id: "bookmarks",
      label: t.nav.bookmarksShort,
      path: "/profile#saved",
      icon: Bookmark,
      badge: bookmarks.length > 0 ? bookmarks.length : undefined,
      exact: false,
    },
    {
      id: "pricing",
      label: t.nav.pricing,
      path: "/pricing",
      icon: Sparkles,
      exact: false,
    },
    {
      id: "profile",
      label: user ? user.name.split(" ")[0] : t.nav.login,
      path: user ? "/profile#account" : "#login",
      icon: User,
      action: !user ? () => setAuthOpen(true) : undefined,
      exact: false,
    },
  ];

  return (
    <nav data-focus-shell="chrome" className={cn(
      "sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-1 min-[375px]:px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))] transition-transform duration-200",
      isPostPage ? "translate-y-0" : ""
    )}>
      <div className="flex items-center justify-around pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]" data-testid="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const itemPath = item.path.split("#")[0];
          const itemHash = item.path.includes("#") ? `#${item.path.split("#")[1]}` : "";
          const isActive = item.action
            ? authOpen
            : item.id === "bookmarks"
              ? pathname === "/profile" && hash !== "#account"
              : item.id === "profile"
                ? pathname === "/profile" && hash === "#account"
                : item.exact
                  ? pathname === itemPath
                  : pathname.startsWith(itemPath) && itemPath !== "/" && (!itemHash || hash === itemHash);

          const itemContent = (
            <>
              <div className="relative shrink-0">
                <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive && "scale-110")} />
                {item.badge !== undefined && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </div>
              {isActive && (
                <span className="min-w-0 truncate font-mono text-[10px] font-semibold tracking-[-0.03em]">
                  {item.label}
                </span>
              )}
            </>
          );

          const itemClassName = cn(
            "relative flex h-11 items-center justify-center gap-2 border transition-[color,background-color,border-color,transform,flex] duration-200 active:scale-95",
            isActive
              ? "min-w-0 flex-1 border-border bg-secondary text-foreground"
              : "w-12 flex-none border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          );

          if (item.action) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                aria-pressed={isActive}
                aria-label={item.label}
                data-testid={`mobile-nav-item-${item.id}`}
                className={itemClassName}
              >
                {itemContent}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.path}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              data-testid={`mobile-nav-item-${item.id}`}
              className={itemClassName}
            >
              {itemContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
