import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { posts, userUnlocks, users } from "@/db/schema";
import type { CreditCost, Post } from "@/lib/types";
import {
  deductCredits,
  refreshWallet,
  totalAvailable,
  walletFromUserRow,
  walletToUserPatch,
} from "@/lib/credits";
import { parseCreditCost } from "@/lib/credit-cost";

export type AccessReason =
  | "AUTH_REQUIRED"
  | "UNLOCK_REQUIRED"
  | "INSUFFICIENT_CREDITS";

export interface AccessCheckResult {
  allowed: boolean;
  reason?: AccessReason;
  creditCost?: CreditCost;
  available?: number;
  shortfall?: number;
}

export interface AccessCheckUser {
  id: string;
  role: string;
}

export async function hasUnlockedPost(
  db: DrizzleD1Database,
  userId: string,
  postId: string
): Promise<boolean> {
  const row = await db
    .select({ userId: userUnlocks.userId })
    .from(userUnlocks)
    .where(and(eq(userUnlocks.userId, userId), eq(userUnlocks.postId, postId)))
    .get();
  return Boolean(row);
}

export async function checkPostAccess(
  db: DrizzleD1Database,
  post: Pick<Post, "id" | "creditCost">,
  sessionUser: AccessCheckUser | null
): Promise<AccessCheckResult> {
  const creditCost = parseCreditCost(post.creditCost, 0);

  // Open articles skip auth and credits entirely.
  if (creditCost === 0) {
    return { allowed: true, creditCost: 0 };
  }

  if (!sessionUser) {
    return { allowed: false, reason: "AUTH_REQUIRED", creditCost };
  }

  const credits = await loadUserCredits(db, sessionUser.id);
  const available = credits?.totalCredits ?? 0;

  if (await hasUnlockedPost(db, sessionUser.id, post.id)) {
    return { allowed: true, creditCost, available };
  }

  if (available < creditCost) {
    return {
      allowed: false,
      reason: "INSUFFICIENT_CREDITS",
      creditCost,
      available,
      shortfall: creditCost - available,
    };
  }

  return { allowed: false, reason: "UNLOCK_REQUIRED", creditCost, available };
}

export interface UnlockResult {
  ok: true;
  giftSpent: number;
  paidSpent: number;
  totalCredits: number;
  giftCreditBalance: number;
  paidCreditBalance: number;
}

export interface UnlockFailure {
  ok: false;
  reason: AccessReason;
  creditCost: CreditCost;
  available?: number;
  shortfall?: number;
}

/**
 * Permanently unlock a post, spending gift credits first then paid.
 * Idempotent: a second call on an already-unlocked post is a no-op success.
 */
export async function unlockPost(
  db: DrizzleD1Database,
  post: Pick<Post, "id" | "creditCost">,
  userId: string,
  now: Date = new Date()
): Promise<UnlockResult | UnlockFailure> {
  const creditCost = parseCreditCost(post.creditCost, 0);
  if (creditCost === 0) {
    return { ok: true, giftSpent: 0, paidSpent: 0, totalCredits: 0, giftCreditBalance: 0, paidCreditBalance: 0 };
  }

  if (await hasUnlockedPost(db, userId, post.id)) {
    const user = await db.select().from(users).where(eq(users.id, userId)).get();
    const wallet = user ? refreshWallet(walletFromUserRow(user), now) : null;
    if (user && wallet) {
      await db.update(users).set(walletToUserPatch(wallet)).where(eq(users.id, userId));
    }
    return {
      ok: true,
      giftSpent: 0,
      paidSpent: 0,
      totalCredits: wallet ? wallet.giftCreditBalance + wallet.paidCreditBalance : 0,
      giftCreditBalance: wallet?.giftCreditBalance ?? 0,
      paidCreditBalance: wallet?.paidCreditBalance ?? 0,
    };
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    return { ok: false, reason: "AUTH_REQUIRED", creditCost };
  }

  const deducted = deductCredits(walletFromUserRow(user), creditCost, now);
  if (!deducted.ok) {
    return {
      ok: false,
      reason: "INSUFFICIENT_CREDITS",
      creditCost,
      available: deducted.available,
      shortfall: deducted.shortfall,
    };
  }

  const nowIso = now.toISOString();
  await db.batch([
    db.update(users).set(walletToUserPatch(deducted.wallet)).where(eq(users.id, userId)),
    db.insert(userUnlocks).values({
      userId,
      postId: post.id,
      unlockedAt: nowIso,
      creditsSpent: creditCost,
      giftSpent: deducted.giftSpent,
      paidSpent: deducted.paidSpent,
    }),
  ]);

  return {
    ok: true,
    giftSpent: deducted.giftSpent,
    paidSpent: deducted.paidSpent,
    totalCredits: deducted.wallet.giftCreditBalance + deducted.wallet.paidCreditBalance,
    giftCreditBalance: deducted.wallet.giftCreditBalance,
    paidCreditBalance: deducted.wallet.paidCreditBalance,
  };
}

export async function loadUserCredits(
  db: DrizzleD1Database,
  userId: string,
  now: Date = new Date()
) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return null;
  const wallet = refreshWallet(walletFromUserRow(user), now);
  const patch = walletToUserPatch(wallet);
  if (
    patch.paidCreditBalance !== user.paidCreditBalance ||
    patch.giftCreditBalance !== user.giftCreditBalance ||
    patch.giftCreditDate !== user.giftCreditDate ||
    patch.giftGrantedThisMonth !== user.giftGrantedThisMonth ||
    patch.giftMonth !== user.giftMonth
  ) {
    await db.update(users).set(patch).where(eq(users.id, userId));
  }
  return {
    ...wallet,
    totalCredits: totalAvailable(wallet, now),
  };
}

/** Plain-text budget for the body preview sent when the reader lacks access. */
export const ARTICLE_BODY_TEASER_MAX_CHARS = 520;
/** At most this many <p> blocks are included in the teaser. */
export const ARTICLE_BODY_TEASER_MAX_PARAGRAPHS = 2;

/**
 * Teaser for locked articles: first few paragraphs only, never the whole body.
 * Title and standfirst (summarySnippet) are always sent separately on the post.
 */
export function truncateHtmlTeaser(html: string): string {
  const paragraphs: string[] = [];
  const pRe = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  let plainLen = 0;
  let match: RegExpExecArray | null;
  while ((match = pRe.exec(html)) && paragraphs.length < ARTICLE_BODY_TEASER_MAX_PARAGRAPHS) {
    const block = match[0];
    const plain = block.replace(/<[^>]+>/g, "").length;
    if (plainLen > 0 && plainLen + plain > ARTICLE_BODY_TEASER_MAX_CHARS) break;
    paragraphs.push(block);
    plainLen += plain;
  }

  if (paragraphs.length > 0) {
    const firstPIndex = html.search(/<p\b/i);
    if (firstPIndex > 0) {
      const prefix = html.slice(0, firstPIndex).trim();
      if (/^<h[23]\b/i.test(prefix)) {
        return `${prefix}\n${paragraphs.join("\n")}`;
      }
    }
    return paragraphs.join("\n");
  }

  return truncateHtmlContent(html, 0.08);
}

// Truncates HTML content to roughly the first `ratio` of its plain-text
// length, cut at the nearest closing-tag boundary so we never emit an
// unclosed tag. Used as the teaser behind the unlock curtain.
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
      cutIndex = match.index;
      break;
    }
    plainSoFar += textChunk.length;
    lastIndex = tagRe.lastIndex;
  }
  if (cutIndex === html.length && plainTextLength > targetLength) {
    cutIndex = targetLength;
  }

  return html.slice(0, cutIndex).trim();
}

export { parseCreditCost };
