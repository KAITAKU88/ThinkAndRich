"use client";

import { useCallback, useEffect, useState } from "react";
import type { Post } from "@/lib/types";

export type AdminPost = Post & { bookmarkCount: number };

// Plain fetch+useState hook, not Zustand — this CRUD surface is only ever
// used from the admin console, so it doesn't need to live in the shared
// session store the whole public site subscribes to.
export function useAdminPosts() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (params?: { q?: string; pillar?: string; sort?: string; dir?: "asc" | "desc" }) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.pillar) qs.set("pillar", params.pillar);
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.dir) qs.set("dir", params.dir);
    const data = await fetch(`/api/admin/posts?${qs.toString()}`).then(
      (r) => r.json() as Promise<{ ok: boolean; posts?: AdminPost[] }>
    );
    if (data.ok && data.posts) setPosts(data.posts);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createPost = useCallback(async (post: Partial<Post>) => {
    const data = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    }).then((r) => r.json() as Promise<{ ok: boolean; message?: string; post?: Post }>);
    if (data.ok) await refresh();
    return data;
  }, [refresh]);

  const updatePost = useCallback(async (id: string, updates: Partial<Post>) => {
    const data = await fetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then((r) => r.json() as Promise<{ ok: boolean; message?: string; post?: Post }>);
    if (data.ok) await refresh();
    return data;
  }, [refresh]);

  const deletePost = useCallback(async (id: string) => {
    const data = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" }).then(
      (r) => r.json() as Promise<{ ok: boolean; message?: string }>
    );
    if (data.ok) await refresh();
    return data;
  }, [refresh]);

  return { posts, loading, refresh, createPost, updatePost, deletePost };
}
