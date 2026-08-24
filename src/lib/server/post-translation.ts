import type { postTranslations } from "@/db/schema";
import type { Post, SupportedLanguage } from "@/lib/types";
import type { PostRow } from "@/lib/server/post-row";
import { rowToPost } from "@/lib/server/post-row";

export type PostTranslationRow = typeof postTranslations.$inferSelect;

// The single place that decides what a post looks like for a given
// viewer language: vi always reads straight off `posts` (the canonical
// row); every other language overlays a PUBLISHED post_translations row
// when one exists, and otherwise falls back to the vi content untouched.
// A partially-filled translation (e.g. academicFormula not translated
// yet) falls back field-by-field, not row-by-row.
export function resolvePostForLanguage(
  row: PostRow,
  translation: PostTranslationRow | null | undefined,
  language: SupportedLanguage
): Post {
  const base = rowToPost(row);

  if (language === "vi" || !translation || translation.status !== "PUBLISHED") {
    return { ...base, contentLanguage: "vi", isTranslated: false };
  }

  return {
    ...base,
    title: translation.title,
    summarySnippet: translation.summarySnippet,
    fullContent: translation.fullContent,
    academicFormula: translation.academicFormula ?? base.academicFormula,
    keyTakeaways: translation.keyTakeaways ? (JSON.parse(translation.keyTakeaways) as string[]) : base.keyTakeaways,
    tags: translation.tags ? (JSON.parse(translation.tags) as string[]) : base.tags,
    contentLanguage: language,
    isTranslated: true,
  };
}

// Admin upsert helper — mirrors postToInsertRow's role for `posts`. Not
// wired to a route yet (translation authoring UI is a follow-up), but the
// shape is settled so the schema doesn't need to change when it lands.
export function translationToInsertRow(params: {
  id: string;
  postId: string;
  language: Exclude<SupportedLanguage, "vi">;
  title: string;
  summarySnippet: string;
  fullContent: string;
  academicFormula?: string | null;
  keyTakeaways?: string[] | null;
  tags?: string[] | null;
  status?: "DRAFT" | "PUBLISHED";
  translatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}): typeof postTranslations.$inferInsert {
  return {
    id: params.id,
    postId: params.postId,
    language: params.language,
    title: params.title,
    summarySnippet: params.summarySnippet,
    fullContent: params.fullContent,
    academicFormula: params.academicFormula ?? null,
    keyTakeaways: params.keyTakeaways ? JSON.stringify(params.keyTakeaways) : null,
    tags: params.tags ? JSON.stringify(params.tags) : null,
    status: params.status ?? "DRAFT",
    translatedBy: params.translatedBy ?? null,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}
