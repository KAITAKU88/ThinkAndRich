"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Bookmark,
  CreditCard,
  Settings,
  Heart,
  Menu,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_DATA } from "@/lib/data";
import { getIdea } from "@/lib/services/ideas";
import type { Idea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";

const SIDEBAR = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "saved", label: "Ý tưởng đã lưu", icon: Bookmark },
  { id: "plan", label: "Quản lý gói", icon: CreditCard },
  { id: "settings", label: "Cài đặt", icon: Settings },
] as const;

export function ProfilePage() {
  const [tab, setTab] = useState<(typeof SIDEBAR)[number]["id"]>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const user = useSession((s) => s.user);
  const favorites = useSession((s) => s.favorites);
  const setAuthOpen = useSession((s) => s.setAuthOpen);

  useEffect(() => {
    Promise.all(favorites.map((id) => getIdea(id))).then((list) =>
      setSavedIdeas(list.filter(Boolean) as Idea[])
    );
  }, [favorites]);

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-semibold">Trang cá nhân</h1>
        <p className="text-muted-foreground">
          Đăng nhập để xem thống kê, ý tưởng đã lưu và quản lý gói.
        </p>
        <Button onClick={() => setAuthOpen(true)}>Đăng nhập</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex md:hidden mb-4">
        <Button variant="outline" size="sm" onClick={() => setSidebarOpen((v) => !v)}>
          <Menu className="w-4 h-4" /> Menu cá nhân
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className={cn("w-full md:w-56 shrink-0", !sidebarOpen && "hidden md:block")}>
          <nav className="space-y-1 bg-card border border-border rounded-xl p-2">
            {SIDEBAR.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start font-medium rounded-lg",
                    tab === item.id && "bg-accent text-accent-foreground hover:bg-accent"
                  )}
                  onClick={() => {
                    setTab(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Xin chào, {user.name}
            </h1>
            <Badge variant="secondary">{user.subscriptionTier}</Badge>
          </div>

          {(tab === "overview" || tab === "saved") && (
            <>
              {tab === "overview" && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {[
                      { label: "Ý tưởng đã lưu", value: String(favorites.length) },
                      { label: "Gói hiện tại", value: user.subscriptionTier },
                      { label: "Vai trò", value: user.role },
                      { label: "Email", value: user.email.split("@")[0] },
                    ].map((s) => (
                      <Card key={s.label}>
                        <CardContent className="p-4 md:p-5">
                          <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                          <p className="text-xl md:text-2xl font-bold truncate">{s.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="overflow-hidden">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base">
                        Hoạt động theo tháng (demo)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={CHART_DATA}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} width={30} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}

              <div>
                <div className="flex items-center gap-2 mb-4 font-semibold text-lg">
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Ý tưởng đã lưu
                </div>
                {savedIdeas.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-10 text-center text-muted-foreground text-sm">
                      Chưa có ý tưởng nào. Bấm icon trái tim trên thẻ để lưu.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedIdeas.map((idea) => (
                      <IdeaCard key={idea.id} idea={idea} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "plan" && (
            <Card>
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Gói đăng ký</h3>
                  <p className="text-sm text-muted-foreground">
                    Hiện tại: <strong>{user.subscriptionTier}</strong>
                  </p>
                </div>
                <Button asChild>
                  <Link href="/pricing">
                    {user.subscriptionTier === "FREE" ? "Nâng cấp gói" : "Đổi gói"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {tab === "settings" && (
            <Card>
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold text-lg">Cài đặt tài khoản</h3>
                <p className="text-sm text-muted-foreground">
                  Email: {user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tuỳ chọn thông báo sẽ kết nối Resend ở phase backend.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
