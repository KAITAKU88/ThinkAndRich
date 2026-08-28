"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import TiptapYoutube from "@tiptap/extension-youtube";
import { Bold, Italic, List, ListOrdered, Quote, Image as ImageIcon, Video, ArrowLeft, Eye, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ReadingColumn, ReadingSheet } from "@/components/reading/ReadingSheet";
import { TagInput } from "@/components/admin/TagInput";
import { RelatedPostPicker } from "@/components/admin/RelatedPostPicker";
import { READING_TEMPLATES, normalizeTemplate, type ReadingTemplateId } from "@/lib/reading-templates";
import type { AdminPost } from "@/lib/admin/use-admin-posts";
import type { CardDisplaySize, CreditCost, Post, PillarType } from "@/lib/types";

const AVG_READING_WPM = 200;

interface PostFormProps {
  editingPost: AdminPost | null;
  availablePosts: AdminPost[];
  onCreate: (post: Partial<Post>) => Promise<{ ok: boolean; message?: string; post?: Post }>;
  onUpdate: (id: string, updates: Partial<Post>) => Promise<{ ok: boolean; message?: string; post?: Post }>;
  onDone: () => void;
}

interface ArticleMentionState {
  query: string;
  from: number;
  to: number;
  left: number;
  top: number;
}

export function PostForm({ editingPost, availablePosts, onCreate, onUpdate, onDone }: PostFormProps) {
  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [summarySnippet, setSummarySnippet] = useState(editingPost?.summarySnippet ?? "");
  const [pillar, setPillar] = useState<PillarType>(editingPost?.pillar ?? "MENTAL_MODEL");
  const [displaySize, setDisplaySize] = useState<CardDisplaySize>(editingPost?.displaySize ?? "SQUARE_SM");
  const [creditCost, setCreditCost] = useState<CreditCost>(editingPost?.creditCost ?? 1);
  const [status, setStatus] = useState<Post["status"]>(editingPost?.status ?? "DRAFT");
  const [previewing, setPreviewing] = useState(false);
  const [readingTemplate, setReadingTemplate] = useState<ReadingTemplateId>(
    normalizeTemplate(editingPost?.readingTemplate)
  );

  const [tags, setTags] = useState<string[]>(editingPost?.tags ?? []);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [relatedPostIds, setRelatedPostIds] = useState<string[]>(editingPost?.relatedPostIds ?? []);
  const [articleMention, setArticleMention] = useState<ArticleMentionState | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const editorShellRef = useRef<HTMLDivElement>(null);

  const [postId, setPostId] = useState<string | null>(editingPost?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);

  function syncArticleMention(activeEditor: Editor) {
    const { selection } = activeEditor.state;
    if (!selection.empty) {
      setArticleMention(null);
      return;
    }

    const { $from } = selection;
    const textBeforeCursor = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
    const match = /(?:^|\s)@([^@\n]*)$/.exec(textBeforeCursor);
    if (!match) {
      setArticleMention(null);
      return;
    }

    const shell = editorShellRef.current;
    if (!shell) return;
    const cursor = activeEditor.view.coordsAtPos(selection.from);
    const shellRect = shell.getBoundingClientRect();
    const width = Math.min(320, Math.max(220, shellRect.width - 16));
    setArticleMention({
      query: match[1],
      from: selection.from - match[1].length - 1,
      to: selection.from,
      left: Math.min(Math.max(8, cursor.left - shellRect.left), Math.max(8, shellRect.width - width - 8)),
      top: cursor.bottom - shellRect.top + 6,
    });
    setMentionIndex(0);
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage.configure({ inline: false, allowBase64: true }),
      TiptapYoutube.configure({ width: 640, height: 360 }),
    ],
    content: editingPost?.fullContent || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-idea min-h-[280px] focus:outline-none p-4 text-sm leading-relaxed bg-background/50 rounded-b-xl border-t border-border",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      setDirty(true);
      syncArticleMention(activeEditor);
    },
    onSelectionUpdate: ({ editor: activeEditor }) => syncArticleMention(activeEditor),
  });

  const mentionCandidates = useMemo(() => {
    const query = articleMention?.query.trim().toLocaleLowerCase("vi") ?? "";
    return availablePosts
      .filter(
        (post) =>
          post.status === "PUBLISHED" &&
          post.id !== postId &&
          (!query || post.title.toLocaleLowerCase("vi").includes(query))
      )
      .slice(0, 6);
  }, [articleMention?.query, availablePosts, postId]);

  const readingTimeMinutes = useMemo(() => {
    const text = editor?.getText() ?? "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / AVG_READING_WPM));
  }, [editor, dirty]); // eslint-disable-line react-hooks/exhaustive-deps

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setDirty(true);
    };
  }

  async function save(nextStatus?: Post["status"]) {
    if (!title.trim() || !summarySnippet.trim()) {
      toast.error("Vui lòng nhập tiêu đề và tóm tắt.");
      return;
    }
    setSaving(true);
    const payload: Partial<Post> = {
      title,
      summarySnippet,
      pillar,
      displaySize,
      creditCost,
      fullContent: editor?.getHTML() ?? "<p></p>",
      readingTimeMinutes,
      readingTemplate,
      category: pillar === "MENTAL_MODEL" ? "Mô hình Tư duy" : pillar === "BUSINESS_STRATEGY" ? "Chiến lược Kinh doanh" : "Ý tưởng Khởi nghiệp",
      author: "Think & Rich",
      tags,
      relatedPostIds,
      ...(nextStatus ? { status: nextStatus } : {}),
    };

    const result = postId ? await onUpdate(postId, payload) : await onCreate(payload);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.message || "Không lưu được bài viết.");
      return;
    }
    if (!postId && result.post) setPostId(result.post.id);
    if (nextStatus) {
      setStatus(nextStatus);
      toast.success(
        nextStatus === "PUBLISHED" ? "Đã xuất bản bài viết." : "Đã chuyển về bản nháp — bài không còn hiển thị công khai."
      );
    }
    setDirty(false);
    setLastSavedAt(new Date());
  }

  // The tag vocabulary already in use across the library. Fetched once:
  // it only changes when a post is saved, and a stale entry costs nothing —
  // the suggestion is a shortcut, not a constraint.
  useEffect(() => {
    fetch("/api/admin/tags")
      .then((res) => res.json() as Promise<{ ok: boolean; tags?: string[] }>)
      .then((data) => {
        if (data.ok && data.tags) setKnownTags(data.tags);
      })
      .catch(() => setKnownTags([]));
  }, []);

  // Autosave every 5 minutes while the form has unsaved changes — never
  // changes status, so a draft stays a draft and a published post stays
  // published until the explicit Publish/status action.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) save();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function insertImage() {
    const url = window.prompt("Nhập URL hình ảnh:");
    if (url) editor?.chain().focus().setImage({ src: url }).run();
  }
  function insertYoutube() {
    const url = window.prompt("Nhập URL video YouTube:");
    if (url) editor?.commands.setYoutubeVideo({ src: url });
  }

  function insertArticleLink(post: AdminPost) {
    if (!editor || !articleMention) return;
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: articleMention.from, to: articleMention.to },
        [
          {
            type: "text",
            text: post.title,
            marks: [{ type: "link", attrs: { href: `/post/${post.slug || post.id}` } }],
          },
          { type: "text", text: " " },
        ]
      )
      .run();
    setArticleMention(null);
    setDirty(true);
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!articleMention || event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setArticleMention(null);
      return;
    }
    if (event.key === "ArrowDown" && mentionCandidates.length > 0) {
      event.preventDefault();
      setMentionIndex((index) => (index + 1) % mentionCandidates.length);
      return;
    }
    if (event.key === "ArrowUp" && mentionCandidates.length > 0) {
      event.preventDefault();
      setMentionIndex((index) => (index - 1 + mentionCandidates.length) % mentionCandidates.length);
      return;
    }
    if (event.key === "Enter" && mentionCandidates[mentionIndex]) {
      event.preventDefault();
      insertArticleLink(mentionCandidates[mentionIndex]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 -ml-2" onClick={onDone}>
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách
        </Button>
        <div className="flex items-center gap-2 min-[480px]:gap-3 self-end min-[480px]:self-auto">
          {lastSavedAt && (
            <span className="text-[11px] text-muted-foreground">
              Đã lưu tự động lúc {lastSavedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-muted-foreground">
            {status === "DRAFT" ? "Nháp" : "Đã xuất bản"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="post-title">Tiêu đề</Label>
            <Input id="post-title" value={title} onChange={(e) => markDirty(setTitle)(e.target.value)} placeholder="Tiêu đề bài viết" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="post-summary">Tóm tắt ngắn</Label>
            <Textarea id="post-summary" value={summarySnippet} onChange={(e) => markDirty(setSummarySnippet)(e.target.value)} placeholder="2-3 câu tóm tắt giá trị cốt lõi..." rows={2} />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Nội dung</Label>
              {/* Preview reads the editor's current document, so it works on
                  unsaved changes — the point is to check the writing before
                  committing it, not after. */}
              <div className="flex items-center rounded-lg border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewing(false)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    !previewing ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Soạn thảo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewing(true)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                    previewing ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" /> Xem trước
                </button>
              </div>
            </div>

            {previewing ? (
              <div className="space-y-3">
                {/* Layouts are compared on the writer's own words, so the
                    choice is made against the real article rather than a
                    sample. Selecting one only stages it; it is stored with the
                    post on the next save. */}
                <div className="rounded-xl border border-border bg-secondary/30 p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 mb-2">
                    <span className="text-xs font-semibold">Kiểu dàn trang</span>
                    <span className="text-[11px] text-muted-foreground">
                      {READING_TEMPLATES.find((tpl) => tpl.id === readingTemplate)?.description}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {READING_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => markDirty(setReadingTemplate)(tpl.id)}
                        className={cn(
                          "px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                          readingTemplate === tpl.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-secondary"
                        )}
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* The same two components the reading page is built from,
                    not a copy of them: the preview is only worth trusting if
                    it cannot drift from the page it claims to predict. */}
                <div className="py-4">
                  <ReadingColumn template={readingTemplate}>
                    <ReadingSheet
                      template={readingTemplate}
                      title={title.trim() || "Tiêu đề bài viết"}
                      lede={summarySnippet.trim() || null}
                    >
                      <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }} />
                    </ReadingSheet>
                    <p className="reading-ui mt-6 text-center text-[11px] text-muted-foreground">
                      Bản xem trước dùng đúng kiểu chữ và dàn trang của trang đọc. Phần khung trang — điều hướng, tên
                      tác giả, nút chia sẻ, tường phí — không hiển thị ở đây.
                    </p>
                  </ReadingColumn>
                </div>
              </div>
            ) : (
              <>
              <div ref={editorShellRef} className="relative border border-border rounded-xl">
                <div className="flex items-center gap-0.5 p-1.5 border-b border-border bg-secondary/40 overflow-x-auto scrollbar-hide">
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => editor?.chain().focus().toggleBold().run()}><Bold className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={insertImage}><ImageIcon className="w-3.5 h-3.5" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={insertYoutube}><Video className="w-3.5 h-3.5" /></Button>
                </div>
                <EditorContent editor={editor} onKeyDown={handleEditorKeyDown} onKeyUp={() => setDirty(true)} />
                {articleMention && (
                  <div
                    data-testid="article-mention-menu"
                    className="absolute z-40 w-[min(20rem,calc(100%-1rem))] overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
                    style={{ left: articleMention.left, top: articleMention.top }}
                  >
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate">
                        {articleMention.query ? `Tìm “${articleMention.query}”` : "Chèn liên kết bài viết"}
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {mentionCandidates.length > 0 ? (
                        mentionCandidates.map((post, index) => (
                          <button
                            key={post.id}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => insertArticleLink(post)}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left",
                              index === mentionIndex ? "bg-secondary" : "hover:bg-secondary"
                            )}
                          >
                            <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-medium">{post.title}</span>
                              <span className="block text-[10px] text-muted-foreground">{post.category}</span>
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                          Không tìm thấy bài đã xuất bản phù hợp.
                        </p>
                      )}
                    </div>
                    <div className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
                      Enter để chèn · Esc để đóng
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Gõ @ trong nội dung để tìm và chèn tiêu đề bài viết dưới dạng liên kết.
              </p>
              </>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thông tin xuất bản</h3>

            <div className="space-y-1.5">
              <Label className="text-xs">Trụ cột Tri thức</Label>
              <select value={pillar} onChange={(e) => markDirty(setPillar)(e.target.value as PillarType)} className="w-full h-9 text-sm bg-background border border-border rounded-lg px-2">
                <option value="MENTAL_MODEL">Mô hình Tư duy</option>
                <option value="BUSINESS_STRATEGY">Chiến lược Kinh doanh</option>
                <option value="STARTUP_IDEA">Ý tưởng Khởi nghiệp</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Khổ thẻ hiển thị</Label>
              <select value={displaySize} onChange={(e) => markDirty(setDisplaySize)(e.target.value as CardDisplaySize)} className="w-full h-9 text-sm bg-background border border-border rounded-lg px-2">
                <option value="SQUARE_SM">Nhỏ (1x1)</option>
                <option value="SQUARE_MD">Vừa (2x2)</option>
                <option value="SQUARE_LG">Lớn (3x3)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Giá credit</Label>
              <select value={creditCost} onChange={(e) => markDirty(setCreditCost)(Number(e.target.value) as CreditCost)} className="w-full h-9 text-sm bg-background border border-border rounded-lg px-2">
                <option value={0}>Open — đọc tự do, không cần đăng nhập</option>
                <option value={1}>1 credit</option>
                <option value={2}>2 credit</option>
                <option value={3}>3 credit</option>
                <option value={4}>4 credit</option>
                <option value={5}>5 credit</option>
              </select>
            </div>

            <TagInput
              tags={tags}
              onChange={markDirty(setTags)}
              knownTags={knownTags}
            />

            <div className="border-t border-border/60 pt-4">
              <RelatedPostPicker
                posts={availablePosts}
                currentPostId={postId}
                selectedIds={relatedPostIds}
                onChange={markDirty(setRelatedPostIds)}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
              <span className="text-muted-foreground">Thời gian đọc (tự động tính)</span>
              <span className="font-mono font-semibold text-foreground">{readingTimeMinutes} phút</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full h-10" variant="outline" disabled={saving} onClick={() => save()}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
            <Button className="w-full h-10" disabled={saving} onClick={() => save("PUBLISHED")}>
              {status === "PUBLISHED" ? "Cập nhật bài đã xuất bản" : "Xuất bản"}
            </Button>
            {/* Editing a published post was always possible — every save kept
                it live. What was missing was a way to pull it off the public
                site while it is being reworked. */}
            {status === "PUBLISHED" && (
              <Button
                className="w-full h-10 text-destructive hover:text-destructive"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  if (confirm("Chuyển bài này về bản nháp? Bài sẽ bị gỡ khỏi trang công khai cho đến khi bạn xuất bản lại.")) {
                    void save("DRAFT");
                  }
                }}
              >
                Chuyển về bản nháp
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
