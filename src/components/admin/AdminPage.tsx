"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Lightbulb,
  Users,
  Settings,
  Upload,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Menu,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_DATA } from "@/lib/data";
import {
  importIdeasCsv,
  listIdeas,
  upsertIdea,
} from "@/lib/services/ideas";
import type { Idea } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/store/session";
import { cn, formatViews } from "@/lib/utils";

const SIDEBAR = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { id: "ideas", label: "Ý tưởng", icon: Lightbulb },
  { id: "users", label: "Người dùng", icon: Users },
  { id: "settings", label: "Cài đặt", icon: Settings },
] as const;

function statusBadge(idea: Idea) {
  if (idea.isPremiumOnly)
    return { label: "Super", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" };
  if (idea.requiresPremium)
    return { label: "Premium", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" };
  return { label: "Miễn phí", className: "bg-muted text-muted-foreground" };
}

export function AdminPage() {
  const user = useSession((s) => s.user);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const settings = useSession((s) => s.settings);
  const updateSettings = useSession((s) => s.updateSettings);

  const [tab, setTab] = useState<(typeof SIDEBAR)[number]["id"]>("ideas");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selected, setSelected] = useState<Idea | null>(null);
  const [title, setTitle] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoImage, setSeoImage] = useState("");
  const [tags, setTags] = useState("AI, B2B, SaaS");
  const [brandName, setBrandName] = useState(settings.brandName);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);

  const refresh = useCallback(async () => {
    const res = await listIdeas({ status: "ALL", pageSize: 50, sort: "newest" });
    setIdeas(res.items);
    if (!selected && res.items[0]) {
      loadIdea(res.items[0]);
    }
  }, [selected]);

  function loadIdea(idea: Idea) {
    setSelected(idea);
    setTitle(idea.title);
    setSeoTitle(idea.seoTitle ?? "");
    setSeoDescription(idea.seoDescription ?? "");
    setSeoImage(idea.seoImage ?? "");
    setTags(idea.category);
  }

  const editor = useEditor({
    extensions: [StarterKit, TiptapLink],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-idea min-h-[220px] focus:outline-none px-1 py-2 text-sm",
      },
    },
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected && editor) {
      editor.commands.setContent(selected.fullContent || "<p></p>");
    }
  }, [selected, editor]);

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-semibold">Quản trị</h1>
        <p className="text-muted-foreground">
          Đăng nhập bằng email chứa &quot;admin&quot; để vào khu vực quản trị.
        </p>
        <Button onClick={() => setAuthOpen(true)}>Đăng nhập</Button>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-semibold">Không có quyền</h1>
        <p className="text-muted-foreground">
          Tài khoản hiện tại không phải ADMIN.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Về trang chủ</Link>
        </Button>
      </div>
    );
  }

  async function handleSave() {
    if (!selected) return;
    const html = editor?.getHTML() ?? selected.fullContent;
    const updated = await upsertIdea({
      ...selected,
      title,
      fullContent: html,
      seoTitle,
      seoDescription,
      seoImage,
      status: "PUBLISHED",
    });
    toast.success("Đã lưu & xuất bản");
    setSelected(updated);
    refresh();
  }

  function handleCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { imported, errors } = await importIdeasCsv(results.data);
        toast.success(`Import ${imported} ý tưởng`);
        if (errors.length) toast.error(errors[0]);
        refresh();
      },
    });
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="flex md:hidden mb-4">
        <Button variant="outline" size="sm" onClick={() => setSidebarOpen((v) => !v)}>
          <Menu className="w-4 h-4" /> Menu quản trị
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <aside className={cn("w-full md:w-56 shrink-0", !sidebarOpen && "hidden md:block")}>
          <nav className="space-y-1 bg-card border border-border rounded-xl p-2">
            {SIDEBAR.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start rounded-lg",
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

        <div className="flex-1 min-w-0 space-y-8">
          {tab === "overview" && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-semibold">Tổng quan</h1>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">User & giao dịch (demo)</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CHART_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis width={30} />
                      <Tooltip />
                      <Bar dataKey="users" fill="var(--primary)" radius={4} />
                      <Bar dataKey="revenue" fill="var(--super)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === "ideas" && (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="font-display text-2xl font-semibold">
                  Quản trị nội dung
                </h1>
                <Button
                  type="button"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".csv";
                    input.onchange = () => {
                      const f = input.files?.[0];
                      if (f) handleCsv(f);
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-4 h-4" /> Import CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[640px]">
                  <thead className="text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-3 py-3 font-medium">Tên ý tưởng</th>
                      <th className="px-3 py-3 font-medium">Phân loại</th>
                      <th className="px-3 py-3 font-medium">Trạng thái</th>
                      <th className="px-3 py-3 font-medium text-right">Lượt xem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ideas.map((idea) => {
                      const st = statusBadge(idea);
                      return (
                        <tr
                          key={idea.id}
                          className={cn(
                            "hover:bg-muted/40 cursor-pointer",
                            selected?.id === idea.id && "bg-accent/50"
                          )}
                          onClick={() => loadIdea(idea)}
                        >
                          <td className="px-3 py-3 font-medium max-w-[280px] truncate">
                            {idea.title}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {idea.category}
                          </td>
                          <td className="px-3 py-3">
                            <Badge className={cn("border-none", st.className)}>
                              {st.label}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-muted-foreground">
                            {formatViews(idea.views)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selected && (
                <div className="flex flex-col lg:flex-row gap-6 pt-4 border-t border-border">
                  <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden min-h-[420px] flex flex-col">
                    <div className="border-b border-border p-2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          editor?.chain().focus().toggleBulletList().run()
                        }
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const url = window.prompt("URL");
                          if (url)
                            editor
                              ?.chain()
                              .focus()
                              .setLink({ href: url })
                              .run();
                        }}
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      <span className="ml-auto text-xs text-muted-foreground mr-2">
                        Tiptap
                      </span>
                    </div>
                    <div className="p-4 space-y-3 flex-1">
                      <Input
                        className="font-semibold text-lg"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <EditorContent editor={editor} />
                    </div>
                  </div>

                  <div className="w-full lg:w-80">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">SEO Metadata</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Meta title</Label>
                          <Input
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Meta description</Label>
                          <Textarea
                            value={seoDescription}
                            onChange={(e) => setSeoDescription(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>OG image URL</Label>
                          <Input
                            placeholder="https://..."
                            value={seoImage}
                            onChange={(e) => setSeoImage(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tags & danh mục</Label>
                          <Input
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                          />
                        </div>
                        <Button className="w-full" onClick={handleSave}>
                          Lưu & xuất bản
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "users" && (
            <div>
              <h1 className="font-display text-2xl font-semibold mb-2">Người dùng</h1>
              <p className="text-muted-foreground text-sm">
                Sẽ kết nối Supabase Auth ở phase tiếp theo. Hiện có session mock.
              </p>
            </div>
          )}

          {tab === "settings" && (
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle className="font-display text-xl">AppSetting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand name</Label>
                  <Input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary color</Label>
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-24 p-1"
                  />
                </div>
                <Button
                  onClick={() => {
                    updateSettings({ brandName, primaryColor });
                    toast.success("Đã cập nhật cấu hình toàn cục");
                  }}
                >
                  Lưu cấu hình
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
