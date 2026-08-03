import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatViews(n: number): string {
  return n.toLocaleString("vi-VN");
}

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Hôm nay";
  if (days === 1) return "1 ngày trước";
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 tuần trước" : `${weeks} tuần trước`;
}
