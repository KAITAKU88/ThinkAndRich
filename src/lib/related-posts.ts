export const MAX_RELATED_POSTS = 3;

export type RelatedPostValidationCode =
  | "INVALID_RELATED_POSTS"
  | "TOO_MANY_RELATED_POSTS"
  | "DUPLICATE_RELATED_POST"
  | "SELF_RELATED_POST";

export type RelatedPostValidation =
  | { ok: true; ids: string[] }
  | { ok: false; code: RelatedPostValidationCode; message: string };

/**
 * Validate the ordered relationship payload before it reaches D1.
 *
 * This is intentionally strict instead of silently trimming or de-duping:
 * when an admin saves three deliberate continuations, changing that order or
 * dropping one behind their back would be worse than returning a useful 400.
 */
export function validateRelatedPostIds(value: unknown, sourcePostId?: string): RelatedPostValidation {
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string" || id.trim() === "")) {
    return {
      ok: false,
      code: "INVALID_RELATED_POSTS",
      message: "Danh sách bài viết liên quan không hợp lệ.",
    };
  }

  if (value.length > MAX_RELATED_POSTS) {
    return {
      ok: false,
      code: "TOO_MANY_RELATED_POSTS",
      message: `Chỉ được chọn tối đa ${MAX_RELATED_POSTS} bài viết liên quan.`,
    };
  }

  const ids = value.map((id) => id.trim());
  if (new Set(ids).size !== ids.length) {
    return {
      ok: false,
      code: "DUPLICATE_RELATED_POST",
      message: "Mỗi bài viết liên quan chỉ được chọn một lần.",
    };
  }

  if (sourcePostId && ids.includes(sourcePostId)) {
    return {
      ok: false,
      code: "SELF_RELATED_POST",
      message: "Không thể liên kết một bài viết với chính nó.",
    };
  }

  return { ok: true, ids };
}
