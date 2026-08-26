"use client";

import { useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/types";

export interface UsePostsFilters {
  pillar?: string;
  q?: string;
  sort?: string;
  pageSize?: number;
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

  const { pillar, q, sort, pageSize } = filters;

  useEffect(() => {
    if (!initialPostsHandled.current && initialPosts !== undefined) {
      initialPostsHandled.current = true;
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (pillar) params.set("pillar", pillar);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    params.set("pageSize", String(pageSize ?? 200));

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

  return { posts, loading };
}
