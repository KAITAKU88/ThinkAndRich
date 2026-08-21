import { SEED_POSTS } from "@/lib/data";
import { delay } from "@/lib/access";
import type { Post, PostCategory, PostStatus } from "@/lib/types";

let postsDb: Post[] = structuredClone(SEED_POSTS);

export type PostListParams = {
  category?: string;
  sort?: "newest" | "views" | "likes";
  page?: number;
  pageSize?: number;
  q?: string;
  status?: PostStatus | "ALL";
};

export async function listPosts(params: PostListParams = {}) {
  await delay(100);
  const {
    category = "Tất cả",
    sort = "newest",
    page = 1,
    pageSize = 9,
    q = "",
    status = "PUBLISHED",
  } = params;

  let list = postsDb.filter((i) =>
    status === "ALL" ? true : i.status === status
  );

  if (category && category !== "Tất cả") {
    list = list.filter((i) => i.category === category);
  }
  if (q.trim()) {
    const needle = q.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(needle) ||
        i.shortDescription.toLowerCase().includes(needle) ||
        i.tags.some((t) => t.toLowerCase().includes(needle))
    );
  }

  if (sort === "views") {
    list = [...list].sort((a, b) => b.views - a.views);
  } else if (sort === "likes") {
    list = [...list].sort((a, b) => b.likes - a.likes);
  } else {
    list = [...list].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = list.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { items, total, page: safePage, totalPages, pageSize };
}

export async function getPost(id: string) {
  await delay(80);
  return postsDb.find((i) => i.id === id || i.slug === id) ?? null;
}

export async function upsertPost(
  input: Partial<Post> & { title: string; shortDescription: string }
) {
  await delay(100);
  if (input.id) {
    postsDb = postsDb.map((i) =>
      i.id === input.id
        ? ({ ...i, ...input, updatedAt: new Date().toISOString() } as Post)
        : i
    );
    return postsDb.find((i) => i.id === input.id)!;
  }
  const id = input.slug || `post-${Date.now()}`;
  const now = new Date().toISOString();
  const post: Post = {
    id,
    slug: id,
    title: input.title,
    shortDescription: input.shortDescription,
    fullContent: input.fullContent ?? "<p></p>",
    thumbnailUrl:
      input.thumbnailUrl ??
      "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop",
    videoUrl: input.videoUrl,
    category: (input.category as PostCategory) ?? "Mô hình Tư duy",
    status: input.status ?? "PUBLISHED",
    author: input.author ?? "Think & Rich",
    readTime: input.readTime ?? "5 phút đọc",
    views: input.views ?? 0,
    likes: input.likes ?? 0,
    dislikes: input.dislikes ?? 0,
    featured: input.featured ?? false,
    tags: input.tags ?? ["Tư duy", "Chiến lược"],
    createdAt: now,
    updatedAt: now,
  };
  postsDb = [post, ...postsDb];
  return post;
}

// Backward compatibility aliases
export const listIdeas = listPosts;
export const getIdea = getPost;
export const upsertIdea = upsertPost;

export function resetPostsDb() {
  postsDb = structuredClone(SEED_POSTS);
}

