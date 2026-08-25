import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
import { posts } from "@/db/schema";
import { rowToPost } from "@/lib/server/post-row";
import { createPost } from "@/lib/server/create-post";

const PILLAR_VALUES = ["MENTAL_MODEL", "BUSINESS_STRATEGY", "STARTUP_IDEA"] as const;
const DISPLAY_SIZE_VALUES = ["SQUARE_SM", "SQUARE_MD", "SQUARE_LG"] as const;
const ACCESS_LEVEL_VALUES = ["OPEN", "FREE", "MEMBER_PLUS", "MEMBER_PRO"] as const;

// Content-authoring MCP server: lets an AI chat (Claude.ai / ChatGPT
// connected as a remote MCP client — see src/app/api/mcp/route.ts) draft
// Think & Rich articles directly into D1 instead of a human retyping them
// into the admin TipTap editor. Every write tool here only ever
// produces/edits a DRAFT row — there is deliberately no "publish" or
// "delete" tool, so an AI session can never take a post live or destroy
// one; that stays a manual action in the admin console.
export function buildMcpServer(env: CloudflareEnv): McpServer {
  const db = drizzle(env.DB);
  const server = new McpServer({ name: "think-and-rich-content", version: "1.0.0" });

  server.registerTool(
    "list_pillars_and_categories",
    {
      title: "List pillars and categories",
      description:
        "Reference tool — call this first. Returns the valid pillar/displaySize/accessLevel enum values and the article categories already in use, so a new draft's taxonomy matches the rest of the site instead of inventing new category names.",
      inputSchema: z.object({}),
    },
    async () => {
      const rows = await db.selectDistinct({ category: posts.category }).from(posts).all();
      const existingCategories = [...new Set(rows.map((r) => r.category))].sort();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                pillars: PILLAR_VALUES,
                displaySizes: DISPLAY_SIZE_VALUES,
                accessLevels: ACCESS_LEVEL_VALUES,
                existingCategories,
              },
              null,
              2
            ),
          },
        ],
      };
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
    "list_draft_posts",
    {
      title: "List draft posts",
      description: "List posts currently in DRAFT status, most recent first — use this to check what's already queued before creating a duplicate.",
      inputSchema: z.object({
        limit: z.number().int().positive().max(50).optional().describe("Defaults to 20."),
      }),
    },
    async ({ limit }) => {
      const rows = await db
        .select()
        .from(posts)
        .where(eq(posts.status, "DRAFT"))
        .orderBy(desc(posts.createdAt))
        .limit(limit ?? 20)
        .all();
      const list = rows.map((row) => {
        const post = rowToPost(row);
        return { id: post.id, title: post.title, pillar: post.pillar, category: post.category, createdAt: post.createdAt };
      });
      return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
    }
  );

  server.registerTool(
    "update_draft_post",
    {
      title: "Update draft post",
      description:
        "Edit an existing DRAFT post's content (e.g. after review feedback). Refuses to touch a post that's already PUBLISHED — that must be edited from the admin console.",
      inputSchema: z.object({
        id: z.string().describe("The post id/slug, from create_draft_post or list_draft_posts."),
        title: z.string().min(3).optional(),
        summarySnippet: z.string().min(10).optional(),
        fullContent: z.string().min(20).optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        pillar: z.enum(PILLAR_VALUES).optional(),
      }),
    },
    async ({ id, ...patch }) => {
      const row = await db.select().from(posts).where(eq(posts.id, id)).get();
      if (!row) {
        return { content: [{ type: "text", text: `Không tìm thấy bài viết "${id}".` }], isError: true };
      }
      if (row.status !== "DRAFT") {
        return {
          content: [{ type: "text", text: `Bài viết "${id}" đã ở trạng thái PUBLISHED — không thể sửa qua MCP, hãy sửa trong /admin.` }],
          isError: true,
        };
      }

      const updates: Partial<typeof posts.$inferInsert> = { updatedAt: new Date().toISOString() };
      if (patch.title !== undefined) updates.title = patch.title;
      if (patch.summarySnippet !== undefined) updates.summarySnippet = patch.summarySnippet;
      if (patch.fullContent !== undefined) updates.fullContent = patch.fullContent;
      if (patch.tags !== undefined) updates.tags = JSON.stringify(patch.tags);
      if (patch.category !== undefined) updates.category = patch.category;
      if (patch.pillar !== undefined) updates.pillar = patch.pillar;

      await db.update(posts).set(updates).where(eq(posts.id, id));
      return { content: [{ type: "text", text: `Đã cập nhật bài viết "${id}".` }] };
    }
  );

  return server;
}
