import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { posts } from "@/db/schema";
import { postToInsertRow } from "@/lib/server/post-row";
import { slugify } from "@/lib/utils";
import { parseCreditCost } from "@/lib/credit-cost";
import type { Post } from "@/lib/types";

export interface CreatePostInput {
  title: string;
  pillar?: Post["pillar"];
  category?: string;
  displaySize?: Post["displaySize"];
  academicFormula?: string;
  summarySnippet: string;
  fullContent?: string;
  schematicSvg?: string;
  keyTakeaways?: string[];
  creditCost?: Post["creditCost"];
  readingTimeMinutes?: number;
  readingTemplate?: string | null;
  status?: Post["status"];
  author?: string;
  tags?: string[];
}

export async function createPost(db: ReturnType<typeof drizzle>, input: CreatePostInput): Promise<Post> {
  const now = new Date().toISOString();
  const baseSlug = slugify(input.title) || `bai-viet-${Date.now()}`;

  let slug = baseSlug;
  let suffix = 1;
  while (await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).get()) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const newPost: Post = {
    id: slug,
    slug,
    title: input.title,
    pillar: input.pillar || "MENTAL_MODEL",
    category: input.category || "Mô hình Tư duy",
    displaySize: input.displaySize || "SQUARE_SM",
    academicFormula: input.academicFormula,
    summarySnippet: input.summarySnippet,
    fullContent: input.fullContent || "<p></p>",
    schematicSvg: input.schematicSvg,
    keyTakeaways: input.keyTakeaways,
    creditCost: parseCreditCost(input.creditCost, 1),
    readingTimeMinutes: input.readingTimeMinutes ?? 3,
    readingTemplate: input.readingTemplate ?? null,
    status: input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    views: 0,
    clicks: 0,
    shares: 0,
    likes: 0,
    dislikes: 0,
    author: input.author || "Think & Rich",
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(posts).values(postToInsertRow(newPost));
  return newPost;
}
