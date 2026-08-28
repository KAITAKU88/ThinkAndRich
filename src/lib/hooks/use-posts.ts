"use client";

import { useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/types";
import { EXPLORE_BACKGROUND_PAGE_SIZE } from "@/lib/server/public-posts";

export interface UsePostsFilters {
  pillar?: string;
  q?: string;
  sort?: string;
  pageSize?: number;
}

function mergePosts(existing: Post[], incoming: Post[]): Post[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((p) => p.id));
  const merged = [...existing];
  for (const post of incoming) {
    if (!seen.has(post.id)) {
      seen.add(post.id);
      merged.push(post);
    }
  }
  return merged;
}

// Fetches the real, D1-backed public post list (always PUBLISHED-only,
// never includes fullContent — see src/app/api/posts/route.ts). Replaces
// reading `useSession(s => s.posts)` against the old mock array. Callers
// that need client-side pillar/access/tag/search/sort filtering (Explore's
// skyline layout) still do that in-memory over the fetched array, same as
// before — only the source of the array changed.
export function usePosts(filters: UsePostsFilters = {}, initialPosts?: Post[]) {
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [loading, setLoading] = useState(initialPosts === undefined);
  const initialPostsHandled = useRef(false);
  const backgroundDone = useRef(false);

  const { pillar, q, sort, pageSize } = filters;

  useEffect(() => {
    if (!q && initialPosts !== undefined) {
      initialPostsHandled.current = true;
      setPosts(initialPosts);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (pillar) params.set("pillar", pillar);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    params.set("pageSize", String(pageSize ?? EXPLORE_BACKGROUND_PAGE_SIZE));

    fetch(`/api/posts?${params.toString()}`)
      .then((res) => res.json() as Promise<{ ok: boolean; posts?: Post[] }>)
      .then((data) => {
        if (!cancelled && data.ok && data.posts) setPosts(data.posts);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialPosts, pillar, q, sort, pageSize]);

  // After the first SSR slice, load the rest of the library in the background
  // so Explore opens immediately but filters still cover the full catalog.
  useEffect(() => {
    if (q || !initialPosts?.length || backgroundDone.current) return;

    let cancelled = false;
    backgroundDone.current = true;

    async function loadRemaining() {
      let page = 2;
      while (!cancelled) {
        const params = new URLSearchParams();
        if (pillar) params.set("pillar", pillar);
        if (sort) params.set("sort", sort ?? "DATE_DESC");
        params.set("page", String(page));
        params.set("pageSize", String(EXPLORE_BACKGROUND_PAGE_SIZE));

        const data = await fetch(`/api/posts?${params.toString()}`)
          .then((r) => r.json() as Promise<{ ok: boolean; posts?: Post[] }>)
          .catch(() => ({ ok: false as const }));

        if (!data.ok || !("posts" in data) || !data.posts?.length) break;

        const batch = data.posts;
        setPosts((prev) => mergePosts(prev, batch));
        if (batch.length < EXPLORE_BACKGROUND_PAGE_SIZE) break;
        page += 1;
      }
    }

    let idleId: ReturnType<typeof setTimeout> | null = null;
    let idleCallbackId: number | null = null;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(() => void loadRemaining(), { timeout: 1200 });
    } else if (typeof globalThis !== "undefined") {
      idleId = globalThis.setTimeout(() => void loadRemaining(), 200);
    }

    return () => {
      cancelled = true;
      if (idleId != null) clearTimeout(idleId);
      if (idleCallbackId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [initialPosts, pillar, q, sort]);

  return { posts, loading };
}
