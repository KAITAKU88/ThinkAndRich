"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Wallet,
  LogOut,
  ExternalLink,
  Menu,
  X,
  FileText,
  UserCheck,
  BadgeDollarSign,
  Plug,
  CreditCard,
  Settings,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useAdminPosts, type AdminPost } from "@/lib/admin/use-admin-posts";
import { PostsTable } from "@/components/admin/PostsTable";
import { PostForm } from "@/components/admin/PostForm";
import { UsersTable } from "@/components/admin/UsersTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { McpKeysPanel } from "@/components/admin/McpKeysPanel";
import { PaymentSettingsPanel } from "@/components/admin/PaymentSettingsPanel";
import { PricingRefreshPanel } from "@/components/admin/PricingRefreshPanel";
import { OwnerSettingsPanel } from "@/components/admin/OwnerSettingsPanel";
import { cn, timeAgo } from "@/lib/utils";

const SIDEBAR = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "posts", label: "Quản lý Bài viết", icon: BookOpen },
  { id: "users", label: "Quản lý Người dùng", icon: Users },
  { id: "orders", label: "Đơn hàng & Doanh thu", icon: Wallet },
  { id: "mcp", label: "MCP Connector", icon: Plug },
  { id: "payment", label: "Thanh toán & giá", icon: CreditCard },
  { id: "settings", label: "Cấu hình", icon: Settings },
] as const;

type TabId = (typeof SIDEBAR)[number]["id"];

interface AdminPageProps {
  publicSiteUrl: string;
}

export function AdminPage({ publicSiteUrl }: AdminPageProps) {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);

  const [tab, setTab] = useState<TabId>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | "new" | null>(null);

  const { posts, total, counts, loading, refresh, createPost, updatePost, deletePost } = useAdminPosts();

  // Middleware already gates /admin server-side (src/middleware.ts) — this
  // is just avoiding a flash of the wrong content while restoreSession()
  // (SiteShell's useEffect) is still resolving on first client render.
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-surface flex flex-col transition-transform lg:translate-x-0 lg:static lg:shrink-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <span className="font-display font-bold text-sm">Think & Rich Admin</span>
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu quản trị"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setEditingPost(null);
                setMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                tab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <button onClick={() => logout()} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main content — full width, no public header/footer/bottom nav */}
      <div className="flex-1 min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6">
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu quản trị"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg hidden lg:block">
            {SIDEBAR.find((s) => s.id === tab)?.label}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <a
              href={publicSiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#002FA7] bg-[#002FA7] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#001f6f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002FA7] focus-visible:ring-offset-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trang công khai</span>
            </a>
            <span className="text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-6">
          {tab === "overview" && <OverviewTab />}

          {tab === "posts" &&
            (editingPost ? (
              <PostForm
                editingPost={editingPost === "new" ? null : editingPost}
                availablePosts={posts}
                onCreate={createPost}
                onUpdate={updatePost}
                onDone={() => setEditingPost(null)}
              />
            ) : (
              <PostsTable
                posts={posts}
                total={total}
                counts={counts}
                loading={loading}
                onQuery={refresh}
                onEdit={(p) => setEditingPost(p)}
                onDelete={deletePost}
                onCreateNew={() => setEditingPost("new")}
              />
            ))}

          {tab === "users" && <UsersTable />}
          {tab === "orders" && <OrdersTable />}
          {tab === "mcp" && <McpKeysPanel publicSiteUrl={publicSiteUrl} />}

          {tab === "payment" && (
            <div className="space-y-6">
              <PaymentSettingsPanel />
              <PricingRefreshPanel />
            </div>
          )}

          {tab === "settings" && <OwnerSettingsPanel />}
        </main>
      </div>
    </div>
  );
}

interface RecentActivity {
  id: string;
  userName: string;
  postTitle: string;
  readAt: string;
}

function OverviewTab() {
  const [postsCount, setPostsCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [revenueVnd, setRevenueVnd] = useState<number | null>(null);
  const [recent, setRecent] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetch("/api/admin/posts?page=1&pageSize=50")
      .then((r) => r.json() as Promise<{ ok: boolean; counts?: { ALL: number } }>)
      .then((d) => d.ok && d.counts && setPostsCount(d.counts.ALL));
    fetch("/api/admin/users")
      .then((r) => r.json() as Promise<{ ok: boolean; users?: unknown[] }>)
      .then((d) => d.ok && d.users && setUserCount(d.users.length));
    fetch("/api/admin/orders/stats")
      .then((r) => r.json() as Promise<{ ok: boolean; revenueByCurrency?: { currency: string; total: number }[] }>)
      .then((d) => {
        const vnd = d.revenueByCurrency?.find((r) => r.currency === "VND");
        setRevenueVnd(vnd?.total ?? 0);
      });
    fetch("/api/admin/read-logs")
      .then((r) => r.json() as Promise<{ ok: boolean; readLogs?: RecentActivity[] }>)
      .then((d) => d.ok && d.readLogs && setRecent(d.readLogs.slice(0, 8)));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={<FileText className="w-4 h-4" />} label="Bài viết" value={postsCount === null ? "…" : String(postsCount)} />
        <StatCard icon={<UserCheck className="w-4 h-4" />} label="Người dùng" value={userCount === null ? "…" : String(userCount)} />
        <StatCard icon={<BadgeDollarSign className="w-4 h-4" />} label="Doanh thu (VND)" value={revenueVnd === null ? "…" : revenueVnd.toLocaleString("vi-VN")} />
      </div>

      <div className="rounded-xl border border-border">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Hoạt động gần đây</h3>
        </div>
        <div className="divide-y divide-border/60">
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Chưa có hoạt động nào.</p>
          ) : (
            recent.map((r) => (
              <div key={r.id} className="px-4 py-2.5 text-sm flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-1 min-[420px]:gap-3">
                <span className="text-foreground truncate">
                  <span className="font-medium">{r.userName}</span> đã đọc <span className="text-muted-foreground">{r.postTitle}</span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0 self-end min-[420px]:self-auto">{timeAgo(r.readAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase font-semibold">{label}</p>
        <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      </div>
    </div>
  );
}
