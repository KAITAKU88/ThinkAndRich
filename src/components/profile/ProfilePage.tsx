"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  User,
  LogOut,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/ideas/IdeaCard";
import { useSession } from "@/store/session";
import { timeAgo } from "@/lib/utils";


type ProfileTab = "saved" | "history" | "account";

export function ProfilePage() {
  const [tab, setTab] = useState<ProfileTab>("saved");
  const user = useSession((s) => s.user);
  const posts = useSession((s) => s.posts);
  const bookmarks = useSession((s) => s.bookmarks);
  const readLogs = useSession((s) => s.readLogs);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const logout = useSession((s) => s.logout);

  // Filter bookmarked posts
  const savedPosts = useMemo(
    () => posts.filter((p) => bookmarks.includes(p.id)),
    [posts, bookmarks]
  );

  // Filter user's reading history
  const userHistory = useMemo(() => {
    if (!user) return [];
    return readLogs.filter(
      (log) => log.userId === user.id || log.userEmail === user.email
    );
  }, [readLogs, user]);

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-20 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <Bookmark className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Tủ sách Cá nhân</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Đăng nhập bằng Email OTP để truy cập tủ sách lưu trữ, lịch sử đọc bài và đồng bộ các mô hình tư duy yêu thích của bạn.
        </p>
        <Button
          className="rounded-full px-8 font-semibold"
          onClick={() => setAuthOpen(true)}
        >
          <Sparkles className="w-4 h-4 mr-2" /> Đăng nhập nhận mã OTP
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Profile Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-border/80 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-display text-2xl font-bold border border-primary/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  {user.name}
                </h1>
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                  className="rounded-full text-xs"
                >
                  {user.role === "ADMIN" ? "Quản trị viên" : "Độc giả"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.role === "ADMIN" && (
              <Button variant="outline" className="rounded-full text-xs" asChild>
                <Link href="/admin">Khu vực Quản trị &rarr;</Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-destructive hover:bg-destructive/10 text-xs"
              onClick={logout}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Đăng xuất
            </Button>
          </div>
        </div>

        {/* 3 Overview Stat Counters */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 pt-6 border-t border-border/60">
          <div className="p-3.5 rounded-2xl bg-muted/40 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Đã lưu
            </p>
            <p className="text-xl md:text-2xl font-bold text-foreground mt-0.5">
              {bookmarks.length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/40 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Đã đọc
            </p>
            <p className="text-xl md:text-2xl font-bold text-primary mt-0.5">
              {userHistory.length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/40 text-center">
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Yêu thích
            </p>
            <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-0.5">
              {userHistory.filter((h) => h.reaction === "like").length}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-8">
        <Button
          variant={tab === "saved" ? "default" : "ghost"}
          className="rounded-full text-xs sm:text-sm font-medium gap-1.5"
          onClick={() => setTab("saved")}
        >
          <Bookmark className="w-4 h-4" /> Tủ sách đã lưu ({savedPosts.length})
        </Button>
        <Button
          variant={tab === "history" ? "default" : "ghost"}
          className="rounded-full text-xs sm:text-sm font-medium gap-1.5"
          onClick={() => setTab("history")}
        >
          <Clock className="w-4 h-4" /> Lịch sử đọc ({userHistory.length})
        </Button>
        <Button
          variant={tab === "account" ? "default" : "ghost"}
          className="rounded-full text-xs sm:text-sm font-medium gap-1.5"
          onClick={() => setTab("account")}
        >
          <User className="w-4 h-4" /> Tài khoản
        </Button>
      </div>

      {/* Tab Content 1: Saved Posts */}
      {tab === "saved" && (
        <div>
          {savedPosts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border p-8">
              <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-display font-semibold text-lg mb-1">
                Tủ sách đang trống
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                Bấm icon bookmark trên thẻ bất kỳ để lưu lại mô hình tư duy bạn muốn đọc lại sau.
              </p>
              <Button asChild className="rounded-full">
                <Link href="/">Khám phá mô hình ngay</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Reading History */}
      {tab === "history" && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Nhật ký đọc bài của bạn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {userHistory.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Bạn chưa đọc bài viết nào. Hãy mở một bài viết trên trang chủ để bắt đầu!
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-y border-border">
                  <tr>
                    <th className="px-4 py-3">Tên mô hình / Bài viết</th>
                    <th className="px-4 py-3">Chuyên mục</th>
                    <th className="px-4 py-3">Thời gian đọc</th>
                    <th className="px-4 py-3 text-center">Tương tác</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {userHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3.5 font-medium max-w-[280px] truncate">
                        {h.postTitle}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="text-xs">
                          {h.postCategory}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {timeAgo(h.readAt)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {h.reaction === "like" ? (
                          <span className="text-emerald-600 font-semibold text-xs">👍 Yêu thích</span>
                        ) : h.reaction === "dislike" ? (
                          <span className="text-rose-600 font-semibold text-xs">👎 Không thích</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Đã đọc</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button size="sm" variant="ghost" className="rounded-full text-xs" asChild>
                          <Link href={`/post/${h.postId}`}>
                            Đọc lại <ExternalLink className="w-3 h-3 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Content 3: Account */}
      {tab === "account" && (
        <div className="max-w-2xl space-y-6">
          {/* Membership Tier Card */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-primary">Gói Thành Viên</span>
                <h3 className="font-display text-2xl font-bold text-foreground mt-0.5">
                  {user.tier === "PRO"
                    ? "Gói Pro (499k/năm)"
                    : user.tier === "PLUS"
                    ? "Gói Plus (299k/năm)"
                    : "Gói Free (Miễn phí)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.tier === "PRO"
                    ? "Đọc KHÔNG GIỚI HẠN toàn bộ bài viết, kể cả bài viết Member và sơ đồ tư duy."
                    : user.tier === "PLUS"
                    ? "Đọc 15 bài viết/ngày, mở khóa toàn bộ bài viết Member."
                    : "Đọc tối đa 10 bài viết tiêu chuẩn mỗi ngày."}
                </p>
              </div>

              {user.tier !== "PRO" && (
                <Button className="rounded-full shadow-md shrink-0" asChild>
                  <Link href="/pricing">
                    Nâng cấp Gói Pro &rarr;
                  </Link>
                </Button>
              )}
            </div>
          </Card>


          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">Họ và tên</p>
                <p className="font-semibold text-foreground">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">Địa chỉ Email</p>
                <p className="font-semibold text-foreground">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-medium">Phương thức bảo mật</p>
                <p className="text-sm text-foreground flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Xác thực Email OTP không cần mật khẩu
                </p>
              </div>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <Button variant="destructive" className="rounded-full" onClick={logout}>
                  Đăng xuất khỏi thiết bị này
                </Button>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href="/pricing">Bảng giá gói Hội viên</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


