import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { requireAdmin } from "@/lib/api-auth";
import { createPost } from "@/lib/server/create-post";
import { parseBulkPostFile } from "@/lib/server/parse-bulk-post";

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, message: "Payload không hợp lệ." }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ ok: false, message: "Chọn ít nhất một file .md hoặc .txt." }, { status: 400 });
  }

  const db = drizzle(ctx.env.DB);
  const created: { id: string; title: string; slug: string }[] = [];
  const errors: { file: string; message: string }[] = [];

  for (const file of files) {
    if (!/\.(md|txt)$/i.test(file.name)) {
      errors.push({ file: file.name, message: "Chỉ hỗ trợ .md hoặc .txt." });
      continue;
    }
    try {
      const raw = await file.text();
      const parsed = parseBulkPostFile(raw, file.name);
      const post = await createPost(db, {
        title: parsed.title,
        summarySnippet: parsed.summarySnippet,
        fullContent: parsed.fullContent,
        status: "DRAFT",
      });
      created.push({ id: post.id, title: post.title, slug: post.slug });
    } catch (err) {
      errors.push({ file: file.name, message: err instanceof Error ? err.message : "Không thể tạo bài." });
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    errors,
    message: `Đã tạo ${created.length} bài nháp${errors.length ? `, ${errors.length} lỗi` : ""}.`,
  });
}
