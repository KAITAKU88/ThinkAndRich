"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import "./app-shell.css";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="app-shell" data-sidebar-collapsed={collapsed ? "true" : "false"}>
      <aside
        className="app-sidebar"
        data-mobile-open={mobileOpen ? "true" : "false"}
        aria-label="Điều hướng chính"
      >
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="app-main">
        <button
          type="button"
          className="sidebar-mobile-toggle"
          data-testid="mobile-nav"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>{mobileOpen ? "Đóng" : "Menu"}</span>
        </button>
        {children}
      </div>
    </div>
  );
}
