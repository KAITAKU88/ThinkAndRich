"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  PlusCircle,
  Settings,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Video,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Menu,
  X,
  UserCheck,
  TrendingUp,
  Crown,
  Globe2,
  QrCode,
  CreditCard,
} from "lucide-react";



import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import TiptapYoutube from "@tiptap/extension-youtube";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Post, PillarType, CardDisplaySize, ContentAccessLevel, PostStatus, UserRecord } from "@/lib/types";
import { PILLARS_CONFIG } from "@/lib/data";

import { CATEGORIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/store/session";
import { cn, formatViews, timeAgo } from "@/lib/utils";

const SIDEBAR = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "posts", label: "Quản lý Bài viết", icon: BookOpen },
  { id: "create", label: "Tạo bài viết mới", icon: PlusCircle },
  { id: "users", label: "Quản lý Người dùng", icon: Users },
  { id: "settings", label: "Cài đặt nền tảng", icon: Settings },
] as const;

export function AdminPage() {
  const user = useSession((s) => s.user);
  const users = useSession((s) => s.users);
  const posts = useSession((s) => s.posts);
  const readLogs = useSession((s) => s.readLogs);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const quickAdminLogin = useSession((s) => s.quickAdminLogin);
  const createPost = useSession((s) => s.createPost);
  const updatePost = useSession((s) => s.updatePost);
  const deletePost = useSession((s) => s.deletePost);
  const settings = useSession((s) => s.settings);
  const updateSettings = useSession((s) => s.updateSettings);

  const [tab, setTab] = useState<(typeof SIDEBAR)[number]["id"]>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filters
  const [postSearch, setPostSearch] = useState("");
  const [postCatFilter, setPostCatFilter] = useState("Tất cả");
  const [userSearch, setUserSearch] = useState("");

  // Post Editing State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<PillarType>("MENTAL_MODEL");
  const [category, setCategory] = useState<string>("Mô hình Tư duy");
  const [displaySize, setDisplaySize] = useState<CardDisplaySize>("SQUARE_SM");
  const [academicFormula, setAcademicFormula] = useState("");
  const [schematicSvg, setSchematicSvg] = useState("");
  const [keyTakeawaysInput, setKeyTakeawaysInput] = useState("");
  const [summarySnippet, setSummarySnippet] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [author, setAuthor] = useState("Think & Rich");
  const [readingTimeMinutes, setReadingTimeMinutes] = useState(5);
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<PostStatus>("PUBLISHED");
  const [accessLevel, setAccessLevel] = useState<ContentAccessLevel>("FREE");

  // User History Modal State
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<UserRecord | null>(null);

  // Post Readers Modal State
  const [selectedPostForReaders, setSelectedPostForReaders] = useState<Post | null>(null);

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      TiptapYoutube.configure({ width: 640, height: 360 }),
    ],
    content: "<p>Bắt đầu viết nội dung mô hình tư duy / chiến lược kinh doanh...</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-idea min-h-[280px] focus:outline-none p-4 text-sm md:text-base leading-relaxed bg-background/50 rounded-b-xl border-t border-border",
      },
    },
  });

  // Load post into form for editing
  function handleSelectEditPost(p: Post) {
    setEditingPost(p);
    setTitle(p.title);
    setPillar(p.pillar || "MENTAL_MODEL");
    setCategory(p.category);
    setDisplaySize(p.displaySize || "SQUARE_SM");
    setAcademicFormula(p.academicFormula || "");
    setSchematicSvg(p.schematicSvg || "");
    setKeyTakeawaysInput(p.keyTakeaways ? p.keyTakeaways.join("\n") : "");
    setSummarySnippet(p.summarySnippet || p.shortDescription || "");
    setThumbnailUrl(p.thumbnailUrl || "");
    setVideoUrl(p.videoUrl || "");
    setAuthor(p.author || "Think & Rich");
    setReadingTimeMinutes(p.readingTimeMinutes || 5);
    setTagsInput(p.tags ? p.tags.join(", ") : "");
    setStatus(p.status || "PUBLISHED");
    setAccessLevel(p.accessLevel || (p.isPro ? "MEMBER_PLUS" : "FREE"));
    if (editor) {
      editor.commands.setContent(p.fullContent || "<p></p>");
    }
    setTab("create");
  }

  function handleResetForm() {
    setEditingPost(null);
    setTitle("");
    setPillar("MENTAL_MODEL");
    setCategory("Mô hình Tư duy");
    setDisplaySize("SQUARE_SM");
    setAcademicFormula("");
    setSchematicSvg("");
    setKeyTakeawaysInput("");
    setSummarySnippet("");
    setThumbnailUrl("");
    setVideoUrl("");
    setAuthor("Think & Rich");
    setReadingTimeMinutes(5);
    setTagsInput("Tư duy, Chiến lược");
    setStatus("PUBLISHED");
    setAccessLevel("FREE");
    if (editor) {
      editor.commands.setContent("<p>Nhập nội dung chi tiết bài viết...</p>");
    }
  }

  function handleSavePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !summarySnippet.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và tóm tắt ngắn.");
      return;
    }

    const html = editor?.getHTML() || "<p></p>";
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const keyTakeaways = keyTakeawaysInput
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingPost) {
      updatePost(editingPost.id, {
        title,
        pillar,
        category,
        displaySize,
        academicFormula: academicFormula.trim() || undefined,
        schematicSvg: schematicSvg.trim() || undefined,
        keyTakeaways,
        summarySnippet,
        shortDescription: summarySnippet,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        author,
        readingTimeMinutes,
        tags,
        status,
        accessLevel,
        isPro: accessLevel === "MEMBER_PLUS" || accessLevel === "MEMBER_PRO",
        fullContent: html,
      });
      toast.success("Đã cập nhật bài viết thành công!");
    } else {
      createPost({
        title,
        pillar,
        category,
        displaySize,
        academicFormula: academicFormula.trim() || undefined,
        schematicSvg: schematicSvg.trim() || undefined,
        keyTakeaways,
        summarySnippet,
        shortDescription: summarySnippet,
        thumbnailUrl:
          thumbnailUrl.trim() ||
          "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop",
        videoUrl: videoUrl.trim() || undefined,
        author,
        readingTimeMinutes,
        tags,
        status,
        accessLevel,
        isPro: accessLevel === "MEMBER_PLUS" || accessLevel === "MEMBER_PRO",
        fullContent: html,
      });
      toast.success("Đã tạo và xuất bản bài viết mới thành công!");
    }

    handleResetForm();
    setTab("posts");
  }

  // Helper insertion into editor
  function insertImagePrompt() {
    const url = window.prompt(
      "Nhập URL hình ảnh (ví dụ: https://images.unsplash.com/...):"
    );
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  function insertYoutubePrompt() {
    const url = window.prompt(
      "Nhập liên kết YouTube (ví dụ: https://www.youtube.com/watch?v=...):"
    );
    if (url && editor) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  }

  function insertQuoteTemplate() {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<blockquote>"Trích dẫn tư duy cốt lõi..."<br/>— <em>Tác giả / Nhà tư tưởng</em></blockquote>`
        )
        .run();
    }
  }

  function insertCalloutTemplate() {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<div class="p-4 my-6 rounded-xl border border-primary/20 bg-primary/5"><h3 class="font-semibold text-primary mb-2">💡 Bài học thực chiến cho Founder</h3><p class="text-sm mb-0">Nội dung bài học đúc kết ứng dụng ngay...</p></div>`
        )
        .run();
    }
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <UserCheck className="w-7 h-7" />
        </div>
        <h1 className="font-display text-2xl font-bold">Khu vực Quản trị (Admin)</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bạn cần đăng nhập với tài khoản có quyền Quản trị (Admin) để xem báo cáo, quản lý độc giả và biên tập bài viết Think & Rich.
        </p>
        <div className="space-y-2 pt-2">
          <Button
            className="w-full rounded-full"
            onClick={() => {
              quickAdminLogin();
              toast.success("Đã đăng nhập với tư cách Quản trị viên (Admin)!");
            }}
          >
            ⚡ Đăng nhập nhanh Admin (admin@thinkandrich.com)
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={() => setAuthOpen(true)}
          >
            Đăng nhập bằng Email OTP
          </Button>
        </div>
      </div>
    );
  }

  // Compute analytics
  const totalViews = posts.reduce((acc, p) => acc + p.views, 0);
  const totalLikes = posts.reduce((acc, p) => acc + p.likes, 0);
  const totalDislikes = posts.reduce((acc, p) => acc + p.dislikes, 0);

  // Top posts by views
  const topPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      (p.summarySnippet || p.shortDescription || '').toLowerCase().includes(postSearch.toLowerCase());
    const matchesCat =
      postCatFilter === "Tất cả" || p.category === postCatFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered users
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Category distribution for chart
  const categoryStats = CATEGORIES.filter((c) => c !== "Tất cả").map((cat) => ({
    name: cat.length > 12 ? cat.slice(0, 12) + "..." : cat,
    fullName: cat,
    count: posts.filter((p) => p.category === cat).length,
    views: posts
      .filter((p) => p.category === cat)
      .reduce((s, p) => s + p.views, 0),
  }));

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Mobile Toggle */}
      <div className="flex md:hidden items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl">Quản trị Think & Rich</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileMenuOpen((v) => !v)}
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          Menu
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside
          className={cn(
            "w-full md:w-60 shrink-0",
            !mobileMenuOpen && "hidden md:block"
          )}
        >
          <div className="sticky top-24 space-y-2 bg-card border border-border rounded-2xl p-3 shadow-sm">
            <div className="px-3 py-2 border-b border-border/60 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bảng điều khiển
              </p>
              <p className="text-sm font-bold truncate text-primary">
                {user.name} ({user.role})
              </p>
            </div>

            {SIDEBAR.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start rounded-xl font-medium",
                    !active && "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => {
                    setTab(item.id);
                    setMobileMenuOpen(false);
                    if (item.id === "create" && editingPost) {
                      handleResetForm();
                    }
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </aside>

        {/* Content Tabs */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight">
                    Tổng quan Nền tảng
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thống kê bài viết, độc giả, lượt xem và tương tác thời gian thực.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    handleResetForm();
                    setTab("create");
                  }}
                  className="rounded-full gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Viết bài mới
                </Button>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/80">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Tổng bài viết
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-foreground">
                      {posts.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" /> Mô hình tư duy & chiến lược
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/80">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Tổng lượt xem
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-primary">
                      {formatViews(totalViews)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-primary" /> Lượt xem trên toàn site
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/80">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Tổng Độc giả
                    </p>
                    <p className="text-2xl md:text-3xl font-bold mt-1 text-foreground">
                      {users.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-primary" /> Đã xác thực OTP
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/80">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Tương tác Độc giả
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xl md:text-2xl font-bold text-emerald-600">
                        👍 {totalLikes}
                      </span>
                      <span className="text-sm text-muted-foreground">/</span>
                      <span className="text-xl md:text-2xl font-bold text-rose-600">
                        👎 {totalDislikes}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Lượt thích & không thích</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts & Top Posts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Phân bổ Mô hình theo Chuyên mục
                    </CardTitle>
                    <CardDescription>Số lượng bài viết trong từng danh mục</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis width={24} tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Số bài viết" fill="var(--primary)" radius={6} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-primary" /> Top Mô hình Đọc nhiều
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {topPosts.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs pb-2 border-b border-border/50 last:border-none"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="font-bold text-muted-foreground w-4 text-center">
                            {idx + 1}
                          </span>
                          <span className="font-medium truncate text-foreground hover:text-primary cursor-pointer" onClick={() => handleSelectEditPost(p)}>
                            {p.title}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-primary shrink-0">
                          {formatViews(p.views)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Reading Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Hoạt động đọc gần đây của độc giả
                  </CardTitle>
                  <CardDescription>
                    Nhật ký thời gian thực người dùng truy cập và đọc các mô hình trên hệ thống
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-y border-border">
                      <tr>
                        <th className="px-4 py-3">Độc giả</th>
                        <th className="px-4 py-3">Bài viết đã đọc</th>
                        <th className="px-4 py-3">Chuyên mục</th>
                        <th className="px-4 py-3">Thời gian</th>
                        <th className="px-4 py-3 text-right">Đánh giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {readLogs.slice(0, 8).map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">
                            <div>{log.userName}</div>
                            <div className="text-xs text-muted-foreground">{log.userEmail}</div>
                          </td>
                          <td className="px-4 py-3 max-w-[260px] truncate font-medium">
                            {log.postTitle}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[11px]">
                              {log.postCategory}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {timeAgo(log.readAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {log.reaction === "like" ? (
                              <span className="text-emerald-600 font-semibold text-xs">👍 Thích</span>
                            ) : log.reaction === "dislike" ? (
                              <span className="text-rose-600 font-semibold text-xs">👎 Không thích</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">Đã xem</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 2: POSTS MANAGEMENT */}
          {tab === "posts" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight">
                    Quản lý Bài viết & Độc giả
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Xem danh sách các bài viết, lượt xem, lượt thích/không thích và tra cứu độc giả đã đọc từng bài.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    handleResetForm();
                    setTab("create");
                  }}
                  className="rounded-full gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Viết bài mới
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tiêu đề hoặc mô tả..."
                    className="pl-9 rounded-full"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={postCatFilter === cat ? "default" : "outline"}
                      className="rounded-full shrink-0 text-xs"
                      onClick={() => setPostCatFilter(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Posts Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3.5">Tiêu đề bài viết</th>
                        <th className="px-4 py-3.5">Chuyên mục</th>
                        <th className="px-4 py-3.5 text-center">Lượt xem</th>
                        <th className="px-4 py-3.5 text-center">Tương tác</th>
                        <th className="px-4 py-3.5 text-center">Độc giả</th>
                        <th className="px-4 py-3.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredPosts.map((p) => {
                        const readersForPost = readLogs.filter(
                          (log) => log.postId === p.id
                        );
                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3.5 font-medium max-w-[280px]">
                              <div className="truncate font-semibold text-foreground">
                                {p.title}
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-0.5">
                                {p.shortDescription}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge variant="secondary" className="text-xs">
                                {p.category}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono text-xs">
                              <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                <Eye className="w-3.5 h-3.5 text-primary" /> {formatViews(p.views)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center text-xs">
                              <span className="text-emerald-600 font-medium">👍 {p.likes}</span>
                              <span className="mx-1 text-muted-foreground">/</span>
                              <span className="text-rose-600 font-medium">👎 {p.dislikes}</span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs rounded-full gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => setSelectedPostForReaders(p)}
                              >
                                <Users className="w-3 h-3" />
                                {readersForPost.length} độc giả
                              </Button>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full"
                                  title="Xem trước bài viết"
                                  asChild
                                >
                                  <Link href={`/post/${p.id}`} target="_blank">
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-blue-600 hover:text-blue-700"
                                  title="Chỉnh sửa bài viết"
                                  onClick={() => handleSelectEditPost(p)}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
                                  title="Xóa bài viết"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Bạn có chắc chắn muốn xóa bài viết "${p.title}"?`
                                      )
                                    ) {
                                      deletePost(p.id);
                                      toast.success("Đã xóa bài viết.");
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREATE / EDIT POST WITH RICH EDITOR */}
          {tab === "create" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight">
                    {editingPost ? "Chỉnh sửa Bài viết" : "Tạo Bài viết Mới"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Soạn thảo phong phú với Tiptap: chèn hình ảnh, nhúng video YouTube, trích dẫn và định dạng đa dạng.
                  </p>
                </div>
                {editingPost && (
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={handleResetForm}
                  >
                    Hủy sửa & Tạo mới
                  </Button>
                )}
              </div>

              <form onSubmit={handleSavePost} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Main Column: Title, Short Desc, Tiptap Editor */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="p-5 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="post-title" className="font-semibold text-sm">
                          Tiêu đề Mô hình / Bài viết <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="post-title"
                          required
                          placeholder="Ví dụ: Mô hình Tư duy Nguyên lý Đầu tiên (First Principles Thinking)"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="font-medium text-base h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="post-summary" className="font-semibold text-sm">
                          Tóm tắt ngắn gọn (Summary Snippet) <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="post-summary"
                          required
                          rows={2}
                          placeholder="Tóm lược 2-3 câu giá trị cốt lõi của mô hình để hiển thị trên thẻ card và phần mở đầu..."
                          value={summarySnippet}
                          onChange={(e) => setSummarySnippet(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label className="font-semibold text-sm">
                            Tiên đề học thuật / Công thức logic
                          </Label>
                          <Input
                            placeholder="Ví dụ: F(x) = ∑ BaseTruth_i ⟹ Reconstruct(S)"
                            value={academicFormula}
                            onChange={(e) => setAcademicFormula(e.target.value)}
                            className="font-mono text-xs"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold text-sm">
                            3 Luận điểm chiến lược (mỗi dòng 1 điểm)
                          </Label>
                          <Textarea
                            rows={2}
                            placeholder="Điểm 1&#10;Điểm 2&#10;Điểm 3"
                            value={keyTakeawaysInput}
                            onChange={(e) => setKeyTakeawaysInput(e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label className="font-semibold text-sm">
                          Mã sơ đồ Vector SVG tối giản (Schematic SVG Code)
                        </Label>
                        <Textarea
                          rows={3}
                          placeholder="<svg viewBox='0 0 160 100'>...</svg>"
                          value={schematicSvg}
                          onChange={(e) => setSchematicSvg(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </Card>

                    {/* Rich Content Editor */}
                    <Card className="overflow-hidden">
                      <div className="p-3 bg-muted/60 border-b border-border flex flex-wrap items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                          title="In đậm (Bold)"
                        >
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                          title="In nghiêng (Italic)"
                        >
                          <Italic className="w-4 h-4" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold"
                          onClick={() =>
                            editor?.chain().focus().toggleHeading({ level: 2 }).run()
                          }
                          title="Tiêu đề H2"
                        >
                          H2
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold"
                          onClick={() =>
                            editor?.chain().focus().toggleHeading({ level: 3 }).run()
                          }
                          title="Tiêu đề H3"
                        >
                          H3
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            editor?.chain().focus().toggleBulletList().run()
                          }
                          title="Danh sách dấu chấm"
                        >
                          <List className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            editor?.chain().focus().toggleOrderedList().run()
                          }
                          title="Danh sách số"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            editor?.chain().focus().toggleBlockquote().run()
                          }
                          title="Trích dẫn (Blockquote)"
                        >
                          <Quote className="w-4 h-4" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs rounded-full gap-1"
                          onClick={insertImagePrompt}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-primary" /> Chèn Ảnh
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs rounded-full gap-1"
                          onClick={insertYoutubePrompt}
                        >
                          <Video className="w-3.5 h-3.5 text-rose-500" /> Nhúng Video
                        </Button>

                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={insertQuoteTemplate}
                          >
                            + Trích dẫn
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-primary"
                            onClick={insertCalloutTemplate}
                          >
                            + Khung Bài học
                          </Button>
                        </div>

                      </div>

                      <EditorContent editor={editor} />
                    </Card>
                  </div>

                  {/* Right Sidebar Column: Metadata & Settings */}
                  <div className="space-y-6">
                    <Card className="p-5 space-y-4">
                      <h3 className="font-semibold text-base border-b border-border/60 pb-2">
                        Thông tin Xuất bản
                      </h3>

                      <div className="space-y-2">
                        <Label>Trụ cột Tri thức</Label>
                        <select
                          className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                          value={pillar}
                          onChange={(e) => setPillar(e.target.value as PillarType)}
                        >
                          <option value="MENTAL_MODEL">🔴 Mô hình Tư duy</option>
                          <option value="BUSINESS_STRATEGY">🟡 Chiến lược Kinh doanh</option>
                          <option value="STARTUP_IDEA">🟢 Ý tưởng Khởi nghiệp</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Khổ thẻ hiển thị</Label>
                        <select
                          className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                          value={displaySize}
                          onChange={(e) => setDisplaySize(e.target.value as CardDisplaySize)}
                        >
                          <option value="SQUARE_SM">Thẻ vuông nhỏ 1x1 (Compact)</option>
                          <option value="SQUARE_MD">Thẻ vuông vừa 2x2 (Medium)</option>
                          <option value="SQUARE_LG">Thẻ hồ sơ lớn 3x3 (Feature Dossier)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quyền truy cập</Label>
                        <select
                          className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                          value={accessLevel}
                          onChange={(e) => setAccessLevel(e.target.value as ContentAccessLevel)}
                        >
                          <option value="OPEN">Đọc tự do (OPEN - không cần đăng nhập)</option>
                          <option value="FREE">Miễn phí (FREE - 10 bài/ngày, cần đăng nhập)</option>
                          <option value="MEMBER_PLUS">Hội viên PLUS (25 bài/ngày)</option>
                          <option value="MEMBER_PRO">Hội viên PRO (Không giới hạn)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Chuyên mục phụ</Label>
                        <Input
                          placeholder="Ví dụ: Deep-dive Teardown, Hào kinh tế..."
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Thời gian đọc (phút)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          value={readingTimeMinutes}
                          onChange={(e) => setReadingTimeMinutes(parseInt(e.target.value) || 5)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tác giả</Label>
                        <Input
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ảnh bìa / Thumbnail URL</Label>
                        <Input
                          placeholder="https://images.unsplash.com/..."
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                        />
                        {thumbnailUrl && (
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted mt-2 border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumbnailUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Video URL (YouTube Embed trực tiếp)</Label>
                        <Input
                          placeholder="https://www.youtube.com/embed/..."
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Nếu có, video sẽ được hiển thị trên đầu bài đọc full-page.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Thẻ Tags (cách nhau bởi dấu phẩy)</Label>
                        <Input
                          placeholder="Tư duy, Elon Musk, Đổi mới, Chiến lược"
                          value={tagsInput}
                          onChange={(e) => setTagsInput(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Trạng thái</Label>
                        <select
                          className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm"
                          value={status}
                          onChange={(e) =>
                            setStatus(e.target.value as PostStatus)
                          }
                        >
                          <option value="PUBLISHED">Đã xuất bản (PUBLISHED)</option>
                          <option value="DRAFT">Bản nháp (DRAFT)</option>
                        </select>
                      </div>





                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full h-11 rounded-full font-semibold shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {editingPost ? "Lưu & Cập nhật" : "Xuất bản bài viết"}
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {tab === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Quản lý Người dùng & Lịch sử Đọc
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Xem danh sách toàn bộ độc giả đã xác thực OTP và tra cứu chi tiết những bài viết mà từng người dùng đã đọc.
                </p>
              </div>

              {/* User search */}
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo email hoặc tên độc giả..."
                  className="pl-9 rounded-full"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              {/* Users Table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[650px]">
                    <thead className="text-xs uppercase bg-muted/60 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3.5">Độc giả</th>
                        <th className="px-4 py-3.5">Vai trò</th>
                        <th className="px-4 py-3.5">Ngày tham gia</th>
                        <th className="px-4 py-3.5 text-center">Số bài đã đọc</th>
                        <th className="px-4 py-3.5 text-center">Lượt thích</th>
                        <th className="px-4 py-3.5 text-right">Lịch sử đọc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredUsers.map((u) => {
                        const historyForThisUser = readLogs.filter(
                          (log) => log.userId === u.id || log.userEmail === u.email
                        );
                        return (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3.5 font-medium">
                              <div className="font-semibold text-foreground">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant={u.role === "ADMIN" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {u.role}
                                </Badge>
                                {u.tier === "PRO" ? (
                                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-1.5 py-0 border-none">
                                    Pro
                                  </Badge>
                                ) : u.tier === "PLUS" ? (
                                  <Badge className="bg-blue-600/20 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0 border-none">
                                    Plus
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    Free
                                  </Badge>
                                )}
                              </div>
                            </td>


                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {timeAgo(u.createdAt)}
                            </td>
                            <td className="px-4 py-3.5 text-center font-mono font-semibold text-primary">
                              {u.readPosts?.length || historyForThisUser.length}
                            </td>
                            <td className="px-4 py-3.5 text-center text-xs font-semibold text-emerald-600">
                              👍 {u.likedPosts?.length || 0}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => setSelectedUserForHistory(u)}
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                Xem các bài đã đọc ({historyForThisUser.length})
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {tab === "settings" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  Cài đặt Nền tảng
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Tuỳ chỉnh tên thương hiệu, khẩu hiệu và màu sắc chủ đạo của Think & Rich.
                </p>
              </div>

              <Card className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Tên thương hiệu</Label>
                  <Input
                    value={settings.brandName}
                    onChange={(e) => updateSettings({ brandName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Khẩu hiệu (Tagline)</Label>
                  <Input
                    value={settings.brandTagline}
                    onChange={(e) => updateSettings({ brandTagline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Màu sắc chủ đạo (Primary Color)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) =>
                        updateSettings({ primaryColor: e.target.value })
                      }
                      className="w-12 h-10 p-1 rounded-lg border border-border cursor-pointer"
                    />
                    <span className="font-mono text-sm">{settings.primaryColor}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => toast.success("Đã lưu cấu hình nền tảng thành công!")}
                    className="rounded-full"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </Card>

              {/* PAYMENT GATEWAY & PPP CONFIGURATION (PRD MODULE) */}
              <Card className="p-6 space-y-6">
                <div>
                  <h3 className="font-display text-lg font-bold flex items-center gap-2">
                    <Globe2 className="w-5 h-5 text-primary" />
                    Cấu hình Cổng Thanh Toán & Định Tuyến IP (PPP)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hệ thống tự động định tuyến khách hàng Việt Nam qua SePay (VietQR) và khách hàng Quốc tế qua Lemon Squeezy (MoR).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SePay Config */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <QrCode className="w-4 h-4 text-emerald-500" />
                        <span>SePay (Việt Nam - VNĐ)</span>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">SePay API Token</Label>
                        <Input
                          type="password"
                          defaultValue="sp_live_987654321_secret"
                          className="h-8 text-xs font-mono mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">SePay Webhook Secret</Label>
                        <Input
                          type="password"
                          defaultValue="whsec_sepay_thinkandrich_2026"
                          className="h-8 text-xs font-mono mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Số tài khoản nhận tiền</Label>
                        <Input
                          defaultValue="0987654321 (MBBank)"
                          className="h-8 text-xs font-mono mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lemon Squeezy Config */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <CreditCard className="w-4 h-4 text-blue-500" />
                        <span>Lemon Squeezy (Quốc tế)</span>
                      </div>
                      <Badge className="bg-blue-600 text-white text-[10px]">Active</Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Lemon Squeezy API Key</Label>
                        <Input
                          type="password"
                          defaultValue="lms_api_live_123456789_key"
                          className="h-8 text-xs font-mono mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Store ID</Label>
                        <Input
                          defaultValue="store_thinkandrich_global"
                          className="h-8 text-xs font-mono mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground">Webhook Signing Secret</Label>
                        <Input
                          type="password"
                          defaultValue="whsec_lms_thinkandrich_2026"
                          className="h-8 text-xs font-mono mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => toast.success("Đã cập nhật cấu hình SePay & Lemon Squeezy thành công!")}
                    className="rounded-full"
                  >
                    Lưu cấu hình Cổng thanh toán
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>


      {/* DIALOG 1: "NGƯỜI DÙNG NÀY ĐÃ ĐỌC NHỮNG BÀI NÀO" */}
      <Dialog
        open={Boolean(selectedUserForHistory)}
        onOpenChange={(open) => !open && setSelectedUserForHistory(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Lịch sử đọc của độc giả: {selectedUserForHistory?.name}
            </DialogTitle>
            <DialogDescription>
              Email: {selectedUserForHistory?.email} • Vai trò: {selectedUserForHistory?.role}
            </DialogDescription>
          </DialogHeader>

          {selectedUserForHistory && (() => {
            const history = readLogs.filter(
              (log) =>
                log.userId === selectedUserForHistory.id ||
                log.userEmail === selectedUserForHistory.email
            );

            if (history.length === 0) {
              return (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Độc giả này chưa mở đọc bài viết nào trên hệ thống.
                </div>
              );
            }

            return (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Danh sách bài viết đã đọc ({history.length} lượt đọc):
                </p>
                <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <Badge variant="outline" className="text-[10px] mb-1">
                          {item.postCategory}
                        </Badge>
                        <h4 className="font-semibold text-foreground truncate">
                          {item.postTitle}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Đã đọc lúc: {timeAgo(item.readAt)} ({new Date(item.readAt).toLocaleString("vi-VN")})
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {item.reaction === "like" ? (
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                            👍 Yêu thích
                          </span>
                        ) : item.reaction === "dislike" ? (
                          <span className="text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                            👎 Không thích
                          </span>
                        ) : null}

                        <Button size="sm" variant="ghost" className="h-8 rounded-full" asChild>
                          <Link href={`/post/${item.postId}`} target="_blank">
                            Xem bài <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: "BÀI NÀY ĐÃ ĐƯỢC ĐỌC BỞI NHỮNG NGƯỜI NÀO" */}
      <Dialog
        open={Boolean(selectedPostForReaders)}
        onOpenChange={(open) => !open && setSelectedPostForReaders(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Độc giả đã đọc bài: {selectedPostForReaders?.title}
            </DialogTitle>
            <DialogDescription>
              Chuyên mục: {selectedPostForReaders?.category} • Lượt xem: {formatViews(selectedPostForReaders?.views || 0)}
            </DialogDescription>
          </DialogHeader>

          {selectedPostForReaders && (() => {
            const readers = readLogs.filter(
              (log) => log.postId === selectedPostForReaders.id
            );

            if (readers.length === 0) {
              return (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Chưa có thông tin định danh độc giả đã đăng nhập đọc bài viết này.
                </div>
              );
            }

            return (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Danh sách {readers.length} độc giả đã đăng nhập và đọc bài:
                </p>
                <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
                  {readers.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground">{r.userName}</div>
                        <div className="text-xs text-muted-foreground">{r.userEmail}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Thời gian đọc: {timeAgo(r.readAt)} ({new Date(r.readAt).toLocaleString("vi-VN")})
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {r.reaction === "like" ? (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Đã thích
                          </span>
                        ) : r.reaction === "dislike" ? (
                          <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> Không thích
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Đã đọc
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

