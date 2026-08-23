"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/store/session";
import { getTranslation } from "@/lib/i18n/translations";

export function BottomNav() {
  const pathname = usePathname();
  const user = useSession((s) => s.user);
  const bookmarks = useSession((s) => s.bookmarks);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const language = useSession((s) => s.language);
  const t = getTranslation(language);

  // Hide bottom nav in admin dashboard or specialized views if desired, but keep globally for app
  const isPostPage = pathname.startsWith("/post/");

  const navItems = [
    {
      id: "home",
      label: "Trang chủ",
      path: "/",
      icon: Home,
      exact: true,
    },
    {
      id: "explore",
      label: t.nav.explore || "Khám phá",
      path: "/explore",
      icon: Compass,
      exact: false,
    },
    {
      id: "bookmarks",
      label: "Tủ sách",
      path: "/profile",
      icon: Bookmark,
      badge: bookmarks.length > 0 ? bookmarks.length : undefined,
      exact: false,
    },
    {
      id: "pricing",
      label: "Gói Hội viên",
      path: "/pricing",
      icon: Sparkles,
      highlight: true,
      exact: false,
    },
    {
      id: "profile",
      label: user ? user.name.split(" ")[0] : "Đăng nhập",
      path: user ? "/profile" : "#login",
      icon: User,
      action: !user ? () => setAuthOpen(true) : undefined,
      exact: false,
    },
  ];

  return (
    <nav className={cn(
      "sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-2 py-1 transition-transform duration-200",
      isPostPage ? "translate-y-0" : ""
    )}>
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.path
            : pathname.startsWith(item.path) && item.path !== "/";

          if (item.action) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors text-muted-foreground hover:text-foreground active:scale-95"
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium mt-0.5 max-w-[60px] truncate">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative active:scale-95",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
                item.highlight && !isActive && "text-amber-600 dark:text-amber-400"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 max-w-[64px] truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
