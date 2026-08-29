"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Brain,
  Moon,
  Sun,
  UserCircle,
  Sparkles,
  Globe,
  Check,
  Home,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/store/session";
import { SUPPORTED_LANGUAGES_LIST, getTranslation } from "@/lib/i18n/translations";
import { CreditCoin } from "@/components/credits/CreditCoin";
import { SidebarSearch, SidebarSearchTrigger } from "@/components/layout/SidebarSearch";

type AppSidebarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
};

export function AppSidebar({ collapsed, onToggleCollapse, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const settings = useSession((s) => s.settings);
  const language = useSession((s) => s.language);
  const setLanguage = useSession((s) => s.setLanguage);
  const t = getTranslation(language);
  const brand = settings.brandName || "Think & Rich";

  useEffect(() => setMounted(true), []);

  function isActive(path: string) {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  }

  function handleNavClick() {
    onNavigate?.();
  }

  return (
    <>
      <div className="app-sidebar-inner">
        <div className="app-sidebar-header">
          <Button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
            title={collapsed ? "Mở sidebar" : "Thu gọn sidebar"}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </Button>
          <Link href="/" className="app-sidebar-brand" onClick={handleNavClick} aria-label={brand}>
            <Brain aria-hidden="true" />
            <span>{brand}</span>
            <span className="app-sidebar-tagline">{t.common.tagline}</span>
          </Link>
        </div>

        <nav className="app-sidebar-nav" data-testid="desktop-nav" aria-label={t.nav.home}>
          <Link href="/" aria-current={isActive("/") ? "page" : undefined} onClick={handleNavClick}>
            <Home aria-hidden="true" />
            <span className="app-sidebar-label">{t.nav.home}</span>
          </Link>
          <Link href="/explore" aria-current={isActive("/explore") ? "page" : undefined} onClick={handleNavClick}>
            <Compass aria-hidden="true" />
            <span className="app-sidebar-label">{t.nav.explore}</span>
          </Link>
          <Link href="/pricing" aria-current={isActive("/pricing") ? "page" : undefined} onClick={handleNavClick}>
            <Sparkles aria-hidden="true" />
            <span className="app-sidebar-label">{t.nav.pricing}</span>
          </Link>
          {user && (
            <Link href="/profile" aria-current={isActive("/profile") ? "page" : undefined} onClick={handleNavClick}>
              <UserCircle aria-hidden="true" />
              <span className="app-sidebar-label">{t.nav.account}</span>
            </Link>
          )}
        </nav>

        <div className="app-sidebar-tools">
          <SidebarSearchTrigger onClick={() => setSearchOpen(true)} />
          <div className="app-sidebar-tools-row">
            <Button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title={t.nav.themeToggle}
              aria-label={t.nav.themeToggle}
            >
              {mounted && resolvedTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
              <span className="app-sidebar-label">{t.nav.themeToggle}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" title={t.nav.selectLanguage} aria-label={t.nav.selectLanguage}>
                  <Globe aria-hidden="true" />
                  <span className="app-sidebar-label">{t.nav.selectLanguage}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>{t.nav.languageListLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SUPPORTED_LANGUAGES_LIST.map((lang) => (
                  <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)}>
                    <span>{lang.flag}</span>
                    <span>{lang.nativeLabel}</span>
                    <span>{lang.label}</span>
                    {language === lang.code && <Check aria-hidden="true" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {user && (
            <Link href="/profile" onClick={handleNavClick} title="Credit còn lại">
              {user.totalCredits}
              <CreditCoin />
              <span className="app-sidebar-label">Credit</span>
            </Link>
          )}

          {!user && (
            <Button
              type="button"
              data-testid="login-cta"
              aria-label={t.nav.login}
              title={t.nav.login}
              onClick={() => {
                setAuthOpen(true);
                handleNavClick();
              }}
            >
              <span className="app-sidebar-label">{t.nav.login}</span>
            </Button>
          )}
        </div>

        <footer className="app-sidebar-footer">
          <nav aria-label="Footer">
            <Link href="/faq" onClick={handleNavClick}>
              FAQ
            </Link>
            <Link href="/terms" onClick={handleNavClick}>
              {t.footer.terms}
            </Link>
            <Link href="/privacy" onClick={handleNavClick}>
              {t.footer.privacy}
            </Link>
          </nav>
          <p>
            © {new Date().getFullYear()} {brand}
          </p>
        </footer>
      </div>

      <SidebarSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
