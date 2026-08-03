"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Lightbulb,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  UserCircle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";

const NAV = [
  { name: "Khám phá", path: "/" },
  { name: "Bảng giá", path: "/pricing" },
  { name: "Cá nhân", path: "/profile" },
  { name: "Quản trị", path: "/admin", adminOnly: true },
];

export function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useSession((s) => s.user);
  const settings = useSession((s) => s.settings);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const logout = useSession((s) => s.logout);

  useEffect(() => setMounted(true), []);

  const links = NAV.filter(
    (l) => !l.adminOnly || user?.role === "ADMIN"
  );

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/85 backdrop-blur-md">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight shrink-0"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Lightbulb className="h-4 w-4" />
          </span>
          <span className="font-display">{settings.brandName}</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm ý tưởng, ngành, mô hình..."
            className="pl-9 rounded-full bg-muted border-transparent"
          />
        </div>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium shrink-0">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                "px-3 py-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground",
                isActive(link.path) && "bg-accent text-accent-foreground font-semibold"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 ml-auto lg:ml-0 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Đổi giao diện"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {user ? (
            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild className="rounded-full">
                <Link href="/profile">
                  <UserCircle className="w-4 h-4" />
                  {user.name}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={logout}
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="hidden sm:inline-flex rounded-full px-5"
              onClick={() => setAuthOpen(true)}
            >
              Đăng nhập
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm ý tưởng..."
            className="pl-9 rounded-full bg-muted border-transparent"
          />
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2.5 rounded-xl text-sm font-medium",
                isActive(link.path)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {link.name}
            </Link>
          ))}
          {user ? (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
            >
              Đăng xuất
            </Button>
          ) : (
            <Button
              className="w-full mt-2"
              onClick={() => {
                setMobileOpen(false);
                setAuthOpen(true);
              }}
            >
              Đăng nhập
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
