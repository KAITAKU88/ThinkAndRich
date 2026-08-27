import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { posts } from "@/db/schema";
import { rowToPost, type PostRow } from "@/lib/server/post-row";
import { createPost } from "@/lib/server/create-post";
import { deletePostCascade } from "@/lib/server/delete-post";
import { READING_TEMPLATES } from "@/lib/reading-templates";

const PILLAR_VALUES = ["MENTAL_MODEL", "BUSINESS_STRATEGY", "STARTUP_IDEA"] as const;
const DISPLAY_SIZE_VALUES = ["SQUARE_SM", "SQUARE_MD", "SQUARE_LG"] as const;
const ACCESS_LEVEL_VALUES = ["OPEN", "FREE", "MEMBER_PLUS", "MEMBER_PRO"] as const;
const READING_TEMPLATE_VALUES = READING_TEMPLATES.map((t) => t.id) as [string, ...string[]];

type Db = ReturnType<typeof drizzle>;

// "No limit" for list_posts. SQLite accepts OFFSET only beside a LIMIT, and
// drizzle drops SQLite's own -1 ("unlimited") rather than emitting it — so an
// unbounded listing is spelled as a ceiling this table will never reach.
const NO_LIMIT = 1_000_000;

// A post created here has id === slug, but rows seeded elsewhere need not,
// and an AI session naturally quotes whichever of the two it last saw — so
// every id-taking tool accepts either.
async function findPost(db: Db, idOrSlug: string): Promise<PostRow | undefined> {
  return db
    .select()
    .from(posts)
    .where(or(eq(posts.id, idOrSlug), eq(posts.slug, idOrSlug)))
    .get();
}

function textResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], ...(isError ? { isError: true } : {}) };
}

function jsonResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

// The one gate on every write tool: an AI session may shape a draft freely,
// but a post that is already live is read-only to it.
function refuseIfPublished(row: PostRow) {
  return row.status === "DRAFT"
    ? null
    : textResult(
        `Bài viết "${row.slug}" đang ở trạng thái ${row.status} — MCP chỉ đọc được bài đã xuất bản. Muốn sửa hoặc xoá, hãy làm trong /admin.`,
        true
      );
}

// Content-authoring MCP server: lets an AI chat (Claude.ai / ChatGPT
// connected as a remote MCP client — see src/app/api/mcp/route.ts) draft
// Think & Rich articles directly into D1 instead of a human retyping them
// into the admin TipTap editor.
//
// The permission split is deliberate and runs through every tool below:
// DRAFT rows are full CRUD, PUBLISHED rows are readable but untouchable.
// There is still no "publish" tool, so taking a post live — the one step
// readers can see — remains a manual action in the admin console.
export function buildMcpServer(env: CloudflareEnv): McpServer {
  const db = drizzle(env.DB);
  const server = new McpServer({ name: "think-and-rich-content", version: "1.1.0" });

  server.registerTool(
    "list_pillars_and_categories",
    {
      title: "List pillars and categories",
      description:
        "Reference tool — call this first. Returns the valid pillar/displaySize/accessLevel/readingTemplate enum values and the article categories already in use, so a new draft's taxonomy matches the rest of the site instead of inventing new category names.",
      inputSchema: z.object({}),
    },
    async () => {
      const rows = await db.selectDistinct({ category: posts.category }).from(posts).all();
      const existingCategories = [...new Set(rows.map((r) => r.category))].sort();
      return jsonResult({
        pillars: PILLAR_VALUES,
        displaySizes: DISPLAY_SIZE_VALUES,
        accessLevels: ACCESS_LEVEL_VALUES,
        readingTemplates: READING_TEMPLATE_VALUES,
        existingCategories,
      });
    }
  );

  server.registerTool(
    "create_draft_post",
    {
      title: "Create draft post",
      description:
        "Create a new Think & Rich article as a DRAFT. It is never published automatically — a human reviews and publishes it from the admin console. fullContent must be HTML (the reader renders it directly).",
      inputSchema: z.object({
        title: z.string().min(3),
        pillar: z.enum(PILLAR_VALUES),
        category: z.string().min(1).describe("Call list_pillars_and_categories first to reuse an existing category name where it fits."),
        summarySnippet: z.string().min(10).describe("Short teaser shown on the card/feed, 1-2 sentences."),
        fullContent: z
          .string()
          .min(20)
          .describe(
            "Full article body as HTML. Everything belongs here — the reading page is a single column of prose, with no separate boxes for a formula or a takeaways list."
          ),
        tags: z.array(z.string()).optional(),
        displaySize: z.enum(DISPLAY_SIZE_VALUES).optional(),
        accessLevel: z.enum(ACCESS_LEVEL_VALUES).optional().describe("Defaults to FREE when omitted."),
        readingTimeMinutes: z.number().int().positive().optional(),
        readingTemplate: z.enum(READING_TEMPLATE_VALUES).optional().describe("Reading layout; defaults to academic."),
        author: z.string().optional(),
      }),
    },
    async (input) => {
      const post = await createPost(db, { ...input, status: "DRAFT" });
      return {
        content: [
          {
            type: "text",
            text: `Đã tạo bài viết DRAFT "${post.title}" (id: ${post.id}, trụ cột: ${post.pillar}). Vào /admin để xem lại và xuất bản.`,
          },
        ],
        structuredContent: { id: post.id, slug: post.slug, status: post.status },
      };
    }
  );

  server.registerTool(
    "list_posts",
    {
      title: "List posts",
      description:
        "List articles — DRAFT, PUBLISHED or both — newest first, without their body text. Use it to see what already exists before writing something adjacent, and to get the id of a post to read or edit. Returns the whole matching set by default; pass limit/offset only to page through a large one.",
      inputSchema: z.object({
        status: z
          .enum(["DRAFT", "PUBLISHED", "ALL"])
          .optional()
          .describe("Defaults to ALL. PUBLISHED rows are listed and readable but cannot be edited through MCP."),
        pillar: z.enum(PILLAR_VALUES).optional(),
        category: z.string().optional(),
        search: z.string().optional().describe("Substring match on the title."),
        limit: z.number().int().positive().optional().describe("Omit for no limit — the full matching set is returned."),
        offset: z.number().int().min(0).optional(),
      }),
    },
    async ({ status, pillar, category, search, limit, offset }) => {
      const filters = [
        status && status !== "ALL" ? eq(posts.status, status) : undefined,
        pillar ? eq(posts.pillar, pillar) : undefined,
        category ? eq(posts.category, category) : undefined,
        // SQLite's LOWER() only folds ASCII, so a Vietnamese capital such as
        // "Đ" only matches itself — close enough for a title filter.
        search ? like(sql`lower(${posts.title})`, `%${search.toLowerCase()}%`) : undefined,
      ].filter((f) => f !== undefined);
      const where = filters.length > 0 ? and(...filters) : undefined;

      const total = await db
        .select({ value: sql<number>`count(*)` })
        .from(posts)
        .where(where)
        .get();

      const rows = await db
        .select()
        .from(posts)
        .where(where)
        .orderBy(desc(posts.createdAt))
        .limit(limit ?? NO_LIMIT)
        .offset(offset ?? 0)
        .all();

      const list = rows.map((row) => {
        const post = rowToPost(row);
        return {
          id: post.id,
          slug: post.slug,
          title: post.title,
          status: post.status,
          pillar: post.pillar,
          category: post.category,
          accessLevel: post.accessLevel,
          readingTimeMinutes: post.readingTimeMinutes,
          tags: post.tags,
          editable: post.status === "DRAFT",
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      });

      return jsonResult({
        total: total?.value ?? list.length,
        returned: list.length,
        offset: offset ?? 0,
        posts: list,
      });
    }
  );

  server.registerTool(
    "get_post",
    {
      title: "Get post",
      description:
        "Read one article in full, body HTML included, by id or slug. Works for DRAFT and PUBLISHED alike — reading a published article is how you match an existing piece's voice or check what it already covers; editing one still has to happen in the admin console.",
      inputSchema: z.object({
        id: z.string().describe("The post id or slug, from list_posts or create_draft_post."),
      }),
    },
    async ({ id }) => {
      const row = await findPost(db, id);
      if (!row) return textResult(`Không tìm thấy bài viết "${id}".`, true);

      const post = rowToPost(row);
      return jsonResult({ ...post, editable: post.status === "DRAFT" });
    }
  );

  server.registerTool(
    "update_draft_post",
    {
      title: "Update draft post",
      description:
        "Edit an existing DRAFT post (e.g. after review feedback). Only the fields you pass change. Refuses to touch a post that's already PUBLISHED — that must be edited from the admin console.",
      inputSchema: z.object({
        id: z.string().describe("The post id or slug, from create_draft_post or list_posts."),
        title: z.string().min(3).optional(),
        summarySnippet: z.string().min(10).optional(),
        fullContent: z.string().min(20).optional().describe("Full replacement body as HTML — read the current one with get_post first if you mean to revise rather than rewrite."),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        pillar: z.enum(PILLAR_VALUES).optional(),
        displaySize: z.enum(DISPLAY_SIZE_VALUES).optional(),
        accessLevel: z.enum(ACCESS_LEVEL_VALUES).optional(),
        readingTimeMinutes: z.number().int().positive().optional(),
        readingTemplate: z.enum(READING_TEMPLATE_VALUES).optional(),
        author: z.string().optional(),
      }),
    },
    async ({ id, ...patch }) => {
      const row = await findPost(db, id);
      if (!row) return textResult(`Không tìm thấy bài viết "${id}".`, true);
      const refusal = refuseIfPublished(row);
      if (refusal) return refusal;

      const updates: Partial<typeof posts.$inferInsert> = { updatedAt: new Date().toISOString() };
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.summarySnippet !== undefined) updates.summarySnippet = patch.summarySnippet;
      if (patch.fullContent !== undefined) updates.fullContent = patch.fullContent;
      if (patch.tags !== undefined) updates.tags = JSON.stringify(patch.tags);
      if (patch.category !== undefined) updates.category = patch.category;
      if (patch.pillar !== undefined) updates.pillar = patch.pillar;
      if (patch.displaySize !== undefined) updates.displaySize = patch.displaySize;
      if (patch.accessLevel !== undefined) updates.accessLevel = patch.accessLevel;
      if (patch.readingTimeMinutes !== undefined) updates.readingTimeMinutes = patch.readingTimeMinutes;
      if (patch.readingTemplate !== undefined) updates.readingTemplate = patch.readingTemplate;
      if (patch.author !== undefined) updates.author = patch.author;

      // A new title does not re-slug the post — the slug is its URL, and the
      // admin editor leaves it alone on rename too.
      await db.update(posts).set(updates).where(eq(posts.id, row.id));

      const changed = Object.keys(updates).filter((k) => k !== "updatedAt");
      return textResult(
        changed.length > 0
          ? `Đã cập nhật bài viết "${row.slug}" (các trường: ${changed.join(", ")}).`
          : `Không có trường nào được truyền — bài viết "${row.slug}" giữ nguyên.`
      );
    }
  );

  server.registerTool(
    "delete_draft_post",
    {
      title: "Delete draft post",
      description:
        "Permanently delete a DRAFT post — for a duplicate or an abandoned draft. Irreversible, so it only runs with confirm: true, and it refuses any post that is already PUBLISHED.",
      inputSchema: z.object({
        id: z.string().describe("The post id or slug."),
        confirm: z
          .literal(true)
          .describe("Must be true. Read the draft with get_post and have the human agree before deleting."),
      }),
    },
    async ({ id }) => {
      const row = await findPost(db, id);
      if (!row) return textResult(`Không tìm thấy bài viết "${id}".`, true);
      const refusal = refuseIfPublished(row);
      if (refusal) return refusal;

      await deletePostCascade(db, row.id);
      return textResult(`Đã xoá vĩnh viễn bài viết DRAFT "${row.title}" (id: ${row.id}).`);
    }
  );

  return server;
}
