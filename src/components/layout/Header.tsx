"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Moon,
  Sun,
  UserCircle,
  Sparkles,
  Search,
  X,
  Compass,
  Home,
  ArrowRight,
  Globe,
  Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { PILLARS_CONFIG } from "@/lib/data";
import { SUPPORTED_LANGUAGES_LIST, getTranslation } from "@/lib/i18n/translations";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Search state & Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const settings = useSession((s) => s.settings);
  const language = useSession((s) => s.language);
  const setLanguage = useSession((s) => s.setLanguage);
  const t = getTranslation(language);

  useEffect(() => {
    setMounted(true);

    // Keyboard shortcut (Ctrl+K or Cmd+K) to open search
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [searchOpen]);

  // Live search popup, against the real D1-backed listing API — debounced
  // so we're not firing a request on every keystroke.
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/posts?q=${encodeURIComponent(q)}&pageSize=6`)
        .then((res) => res.json() as Promise<{ ok: boolean; posts?: Post[] }>)
        .then((data) => {
          if (data.ok && data.posts) setSearchResults(data.posts);
        })
        .catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setSearchOpen(false);
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-colors">
        <div className="container mx-auto max-w-[1600px] px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* 1. LEFT: LOGO, BRAND NAME, SLOGAN */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight leading-none text-foreground">
                {settings.brandName || "Think & Rich"}
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium hidden sm:inline leading-tight mt-0.5">
                {t.common.tagline}
              </span>
            </div>
          </Link>

          {/* 2. CENTER: MENU (HOME, KHÁM PHÁ, BẢNG GIÁ, CÁ NHÂN) ĐẸP NẰM GIỮA HEADER */}
          <nav className="flex items-center gap-1 bg-secondary/70 p-1 rounded-full border border-border/60 shadow-xs">
            <Link
              href="/"
              className={cn(
                "px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 select-none",
                isActive("/")
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.nav.home}</span>
            </Link>
            <Link
              href="/explore"
              className={cn(
                "px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 select-none",
                isActive("/explore")
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t.nav.explore}</span>
            </Link>
            <Link
              href="/pricing"
              className={cn(
                "px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 select-none",
                isActive("/pricing")
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.nav.pricing}</span>
            </Link>
            {user && (
              <Link
                href="/profile"
                className={cn(
                  "px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 select-none",
                  isActive("/profile")
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span>{t.nav.account}</span>
              </Link>
            )}
          </nav>

          {/* 3. RIGHT: [NÚT SEARCH] [NÚT THEME] [NÚT NGÔN NGỮ] [NÚT LOGIN/ACCOUNT] */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Nút Search đặt ngay bên trái của Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => setSearchOpen(true)}
              title={t.nav.searchTooltip}
              aria-label={t.nav.searchTooltip}
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Nút đổi Dark / Light Theme */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title={t.nav.themeToggle}
              aria-label={t.nav.themeToggle}
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </Button>

            {/* Nút Ngôn ngữ — trigger luôn chỉ hiện biểu tượng quả cầu (nhất
                quán mọi nơi trên site), danh sách bên trong dùng chung bộ
                14 ngôn ngữ với Footer. */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  title={t.nav.selectLanguage}
                  aria-label={t.nav.selectLanguage}
                >
                  <Globe className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-2xl border-border/80">
                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-semibold px-2 py-1">
                  {t.nav.languageListLabel}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-72 overflow-y-auto space-y-0.5 pr-1">
                  {SUPPORTED_LANGUAGES_LIST.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{lang.flag}</span>
                        <div>
                          <span className="font-medium text-foreground block leading-tight">{lang.nativeLabel}</span>
                          <span className="text-[10px] text-muted-foreground leading-none">{lang.label}</span>
                        </div>
                      </div>
                      {language === lang.code && (
                        <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Nút Đăng nhập — khi đã đăng nhập, mọi thứ về tài khoản (hồ sơ,
                gói cước, đăng xuất) đã nằm trong "Khu vực cá nhân" ở menu
                giữa header, nên không lặp lại ở đây nữa. */}
            {!user && (
              <Button
                size="sm"
                className="rounded-full px-3.5 sm:px-4 h-8 sm:h-9 font-semibold text-xs shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setAuthOpen(true)}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>{t.nav.login}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* QUICK SEARCH DIALOG / MODAL (TRIGGERED BY SEARCH BUTTON OR CTRL+K) */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border border-border shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{t.search.dialogTitle}</DialogTitle>
          </DialogHeader>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-border/70 px-4 py-3 bg-card">
            <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
            <Input
              ref={inputRef}
              type="search"
              placeholder={t.search.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm md:text-base px-0 h-9"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                <span>ESC</span>
              </div>
            )}
          </form>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query.trim().length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <p>{t.search.emptyPrompt}</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-medium">🔴 {t.pillars.mentalModel}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">🟡 {t.pillars.businessStrategy}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">🟢 {t.pillars.startupIdea}</span>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((item) => {
                  const pillarMeta = PILLARS_CONFIG[item.pillar];
                  return (
                    <Link
                      key={item.id}
                      href={`/post/${item.slug || item.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary transition-all group"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn("text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border", pillarMeta?.badgeBg, pillarMeta?.badgeText)}>
                            {pillarMeta?.titleVi}
                          </span>
                          {item.accessLevel !== "FREE" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                              {item.accessLevel === "MEMBER_PRO" ? "PRO" : "PLUS"}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                {t.search.noResultsPrefix} &quot;{query}&quot;.
              </div>
            )}
          </div>

          {/* Footer of modal */}
          {query.trim().length > 0 && searchResults.length > 0 && (
            <div className="p-2.5 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{t.search.resultsFoundPrefix} {searchResults.length} {t.search.resultsFoundSuffix}</span>
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="text-primary hover:underline font-medium flex items-center gap-1 text-xs"
              >
                {t.search.viewAllInExplore} &rarr;
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
