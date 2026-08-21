"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Brain,
  Moon,
  Sun,
  Menu,
  X,
  UserCircle,
  LogOut,
  Sparkles,
  Search,
  ArrowRight,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSession } from "@/store/session";
import { cn, formatViews } from "@/lib/utils";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { getTranslation } from "@/lib/i18n/translations";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const user = useSession((s) => s.user);
  const posts = useSession((s) => s.posts);
  const settings = useSession((s) => s.settings);
  const bookmarks = useSession((s) => s.bookmarks);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const logout = useSession((s) => s.logout);
  const language = useSession((s) => s.language);
  const detectGeo = useSession((s) => s.detectGeo);

  const t = getTranslation(language);

  const navLinks = [
    { name: t.nav.explore, path: "/explore" },
    { name: t.nav.pricing, path: "/pricing" },
    { name: t.nav.library, path: "/profile" },
    { name: t.nav.admin, path: "/admin" },
  ];

  useEffect(() => {
    setMounted(true);
    detectGeo();
  }, [detectGeo]);


  // Filter posts for instant search popup
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return posts
      .filter(
        (p) =>
          p.status === "PUBLISHED" &&
          (p.title.toLowerCase().includes(q) ||
            p.shortDescription.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.tags?.some((t) => t.toLowerCase().includes(q)))
      )
      .slice(0, 5);
  }, [query, posts]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setSearchFocused(false);
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  }


  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/95 backdrop-blur-md transition-colors">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-3 md:gap-4">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-lg tracking-tight shrink-0 group"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Brain className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg leading-none tracking-tight">
              {settings.brandName}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium hidden lg:inline leading-tight mt-0.5">
              Mental Models & Strategies
            </span>
          </div>
        </Link>

        {/* ALWAYS VISIBLE SEARCH BAR (DESKTOP & TABLET) */}
        <div
          ref={searchContainerRef}
          className="hidden sm:block flex-1 max-w-md relative mx-2"
        >
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Tìm mô hình tư duy, chiến lược..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="pl-10 pr-8 h-10 rounded-full bg-muted/60 hover:bg-muted/90 focus:bg-background border-border/80 text-xs md:text-sm transition-all focus-visible:ring-primary shadow-sm"

            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Instant Live Search Results Dropdown */}
          {searchFocused && query.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-border/60 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="p-2.5 bg-muted/40 flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Kết quả tìm kiếm ({searchResults.length})</span>
                <span className="text-[11px]">Nhấn Enter để tìm</span>
              </div>

              {searchResults.length > 0 ? (
                <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
                  {searchResults.map((item) => (
                    <Link
                      key={item.id}
                      href={`/post/${item.id}`}
                      onClick={() => {
                        setSearchFocused(false);
                        setQuery("");
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/70 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase text-primary">
                            {item.category}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" /> {formatViews(item.views)}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchFocused(false);
                        router.push(`/?q=${encodeURIComponent(query.trim())}`);
                      }}
                      className="w-full py-1.5 text-xs text-primary font-medium hover:underline flex items-center justify-center gap-1"
                    >
                      Xem tất cả kết quả cho &quot;{query}&quot; &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Không tìm thấy mô hình nào phù hợp với &quot;{query}&quot;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={cn(
                "px-3.5 py-1.5 rounded-full transition-all text-xs font-semibold text-muted-foreground hover:text-foreground",
                isActive(link.path) &&
                  "bg-accent text-accent-foreground shadow-sm"
              )}
            >
              {link.name}
              {link.path === "/profile" && bookmarks.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                  {bookmarks.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Selector */}
          <LanguageSelector />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Đổi giao diện"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>

          {/* User Section */}
          {user ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/50 text-xs font-medium transition-colors"
              >
                <UserCircle className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[100px] truncate">{user.name}</span>
                {user.role === "ADMIN" ? (
                  <Badge className="bg-primary/20 text-primary text-[9px] px-1 py-0 border-none">
                    Admin
                  </Badge>
                ) : user.tier === "PRO" ? (
                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] px-1 py-0 border-none">
                    Pro
                  </Badge>
                ) : user.tier === "PLUS" ? (
                  <Badge className="bg-blue-600/20 text-blue-600 dark:text-blue-400 text-[9px] px-1 py-0 border-none">
                    Plus
                  </Badge>
                ) : null}

              </Link>


              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={logout}
                title={t.nav.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="hidden sm:inline-flex rounded-full px-4 h-9 font-semibold text-xs shadow-sm"
              onClick={() => setAuthOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> {t.nav.login}
            </Button>
          )}

          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full h-9 w-9"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* MOBILE SEARCH BAR - ALWAYS VISIBLE DIRECTLY UNDER HEADER ON MOBILE */}
      <div className="sm:hidden px-4 pb-2.5 pt-0.5">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder={t.nav.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8 h-9 rounded-full bg-muted/60 focus:bg-background border-border/80 text-xs shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </form>
      </div>


      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium",
                isActive(link.path)
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <span>{link.name}</span>
              {link.path === "/profile" && bookmarks.length > 0 && (
                <Badge variant="secondary">{bookmarks.length}</Badge>
              )}
            </Link>
          ))}


          <div className="pt-2 border-t border-border">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-muted/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {user.role === "ADMIN" && <Badge>Admin</Badge>}
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                </Button>
              </div>
            ) : (
              <Button
                className="w-full rounded-xl font-medium"
                onClick={() => {
                  setMobileOpen(false);
                  setAuthOpen(true);
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" /> Đăng nhập bằng Email OTP
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


