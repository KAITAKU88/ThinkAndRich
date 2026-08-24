import { and, eq, like } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { readLogs } from "@/db/schema";
import type { MembershipTier, Post } from "@/lib/types";
import { dailyReadLimit } from "@/lib/utils";

// Server-side port of the tier/access-level/daily-quota logic that used to
// live only in src/store/session.ts (canAccessPost/getDailyLimit/
// getTodayReadCount), now backed by real D1 read_logs instead of an
// in-memory array. This is what makes the paywall real: callers must never
// send `post.fullContent` to the client before calling this.
export interface AccessCheckResult {
  allowed: boolean;
  reason?: "AUTH_REQUIRED" | "PRO_REQUIRED" | "DAILY_LIMIT_REACHED";
  limit?: number;
  currentReads?: number;
  tier?: MembershipTier;
}

export interface AccessCheckUser {
  id: string;
  role: string;
  tier: MembershipTier;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export const getDailyLimit = dailyReadLimit;

// Distinct posts read today by this user (matches the store's original
// distinct-post-per-day semantics, not a raw read_logs row count).
export async function getTodayReadCount(
  db: DrizzleD1Database,
  userId: string
): Promise<number> {
  const today = getTodayString();
  const rows = await db
    .select({ postId: readLogs.postId })
    .from(readLogs)
    .where(and(eq(readLogs.userId, userId), like(readLogs.readAt, `${today}%`)));
  return new Set(rows.map((r) => r.postId)).size;
}

async function hasReadPostToday(
  db: DrizzleD1Database,
  userId: string,
  postId: string
): Promise<boolean> {
  const today = getTodayString();
  const row = await db
    .select({ id: readLogs.id })
    .from(readLogs)
    .where(
      and(eq(readLogs.userId, userId), eq(readLogs.postId, postId), like(readLogs.readAt, `${today}%`))
    )
    .get();
  return Boolean(row);
}

export async function checkPostAccess(
  db: DrizzleD1Database,
  post: Pick<Post, "id" | "accessLevel">,
  sessionUser: AccessCheckUser | null
): Promise<AccessCheckResult> {
  // Open-tier content is readable by anyone, logged in or not — it exists
  // specifically so it's indexable and so anonymous readers only hit a
  // login wall on a Free/Plus/Pro piece, not on the entry article itself.
  if (post.accessLevel === "OPEN") {
    return { allowed: true };
  }

  if (!sessionUser) {
    return { allowed: false, reason: "AUTH_REQUIRED" };
  }

  if (sessionUser.role === "ADMIN" || sessionUser.tier === "PRO") {
    return { allowed: true };
  }

  const tier = sessionUser.tier || "FREE";
  const level = post.accessLevel;

  if (tier === "FREE") {
    if (level === "MEMBER_PLUS" || level === "MEMBER_PRO") {
      return { allowed: false, reason: "PRO_REQUIRED", tier: "FREE" };
    }
    const todayReads = await getTodayReadCount(db, sessionUser.id);
    if (todayReads >= 10 && !(await hasReadPostToday(db, sessionUser.id, post.id))) {
      return { allowed: false, reason: "DAILY_LIMIT_REACHED", limit: 10, currentReads: todayReads, tier: "FREE" };
    }
    return { allowed: true };
  }

  if (tier === "PLUS") {
    if (level === "MEMBER_PRO") {
      return { allowed: false, reason: "PRO_REQUIRED", tier: "PLUS" };
    }
    const todayReads = await getTodayReadCount(db, sessionUser.id);
    if (todayReads >= 25 && !(await hasReadPostToday(db, sessionUser.id, post.id))) {
      return { allowed: false, reason: "DAILY_LIMIT_REACHED", limit: 25, currentReads: todayReads, tier: "PLUS" };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

// Truncates HTML content to roughly the first `ratio` of its plain-text
// length, cut at the nearest closing-tag boundary so we never emit an
// unclosed tag. Good enough for the "first 30%" teaser — not a full HTML
// parser, but the content here is simple Tiptap-generated markup.
export function truncateHtmlContent(html: string, ratio = 0.3): string {
  const plainTextLength = html.replace(/<[^>]+>/g, "").length;
  const targetLength = Math.max(80, Math.floor(plainTextLength * ratio));

  let plainSoFar = 0;
  let cutIndex = html.length;
  const tagRe = /<[^>]+>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    const textChunk = html.slice(lastIndex, match.index);
    if (plainSoFar + textChunk.length >= targetLength) {
      cutIndex = match.index; // stop right before this tag
      break;
    }
    plainSoFar += textChunk.length;
    lastIndex = tagRe.lastIndex;
  }
  if (cutIndex === html.length && plainTextLength > targetLength) {
    // No tag boundary found after crossing the target (e.g. content is one
    // long run of text) — cut at the raw character offset instead.
    cutIndex = targetLength;
  }

  return html.slice(0, cutIndex).trim();
}
