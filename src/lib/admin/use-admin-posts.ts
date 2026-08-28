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
  const postsRef = useRef(posts);
  const countsRef = useRef(counts);
  const totalRef = useRef(total);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  useEffect(() => {
    countsRef.current = counts;
  }, [counts]);
  useEffect(() => {
    totalRef.current = total;
  }, [total]);

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

  const updatePost = useCallback(async (id: string, updates: Partial<Post>) => {
    const activeStatus = lastQuery.current.status ?? "ALL";
    const snapshot = {
      posts: postsRef.current,
      counts: countsRef.current,
      total: totalRef.current,
    };
    const previous = snapshot.posts.find((post) => post.id === id);

    setPosts((current) => {
      const row = current.find((post) => post.id === id);
      if (!row) return current;
      const optimistic = { ...row, ...updates };
      if (activeStatus !== "ALL" && optimistic.status !== activeStatus) {
        return current.filter((post) => post.id !== id);
      }
      return current.map((post) => (post.id === id ? optimistic : post));
    });

    if (previous && updates.status !== undefined && previous.status !== updates.status) {
      setCounts((current) => ({
        ALL: current.ALL,
        DRAFT: current.DRAFT + (updates.status === "DRAFT" ? 1 : -1),
        PUBLISHED: current.PUBLISHED + (updates.status === "PUBLISHED" ? 1 : -1),
      }));
      if (activeStatus !== "ALL") setTotal((current) => Math.max(0, current - 1));
    }

    const data = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then((r) => r.json() as Promise<{ ok: boolean; message?: string; post?: Post }>);

    if (!data.ok) {
      setPosts(snapshot.posts);
      setCounts(snapshot.counts);
      setTotal(snapshot.total);
      return data;
    }

    if (data.post) {
      setPosts((current) => {
        if (activeStatus !== "ALL" && data.post!.status !== activeStatus) {
          return current.filter((post) => post.id !== id);
        }
        return current.map((post) =>
          post.id === id ? ({ ...post, ...data.post } as AdminPost) : post
        );
      });
    }

    return data;
  }, []);

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
