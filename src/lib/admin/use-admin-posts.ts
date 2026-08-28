"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/types";

export type AdminPost = Post & { bookmarkCount: number };

export type AdminPostCounts = { ALL: number; DRAFT: number; PUBLISHED: number };

export interface AdminPostsQuery {
  q?: string;
  pillar?: string;
  status?: "ALL" | "DRAFT" | "PUBLISHED";
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: 50 | 100;
}

const EMPTY_COUNTS: AdminPostCounts = { ALL: 0, DRAFT: 0, PUBLISHED: 0 };

// Plain fetch+useState hook, not Zustand — this CRUD surface is only ever
// used from the admin console, so it doesn't need to live in the shared
// session store the whole public site subscribes to.
export function useAdminPosts() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<AdminPostCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const lastQuery = useRef<AdminPostsQuery>({ page: 1, pageSize: 50, sort: "updatedAt", dir: "desc" });

  const refresh = useCallback(async (params?: AdminPostsQuery) => {
    if (params) lastQuery.current = { ...lastQuery.current, ...params };
    const query = lastQuery.current;
    setLoading(true);
    const qs = new URLSearchParams();
    if (query.q) qs.set("q", query.q);
    if (query.pillar) qs.set("pillar", query.pillar);
    if (query.status && query.status !== "ALL") qs.set("status", query.status);
    if (query.sort) qs.set("sort", query.sort);
    if (query.dir) qs.set("dir", query.dir);
    qs.set("page", String(query.page ?? 1));
    qs.set("pageSize", String(query.pageSize ?? 50));
    const data = await fetch(`/api/admin/posts?${qs.toString()}`).then(
      (r) =>
        r.json() as Promise<{
          ok: boolean;
          posts?: AdminPost[];
          total?: number;
          counts?: AdminPostCounts;
        }>
    );
    if (data.ok && data.posts) {
      setPosts(data.posts);
      setTotal(data.total ?? data.posts.length);
      if (data.counts) setCounts(data.counts);
    }
    setLoading(false);
  }, []);

  const createPost = useCallback(
    async (post: Partial<Post>) => {
      const data = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      }).then((r) => r.json() as Promise<{ ok: boolean; message?: string; post?: Post }>);
      if (data.ok) await refresh();
      return data;
    },
    [refresh]
  );

  const updatePost = useCallback(
    async (id: string, updates: Partial<Post>) => {
      const data = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((r) => r.json() as Promise<{ ok: boolean; message?: string; post?: Post }>);
      if (data.ok) await refresh();
      return data;
    },
    [refresh]
  );

  const deletePost = useCallback(
    async (id: string) => {
      const data = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" }).then(
        (r) => r.json() as Promise<{ ok: boolean; message?: string }>
      );
      if (data.ok) await refresh();
      return data;
    },
    [refresh]
  );

  return { posts, total, counts, loading, refresh, createPost, updatePost, deletePost };
}
