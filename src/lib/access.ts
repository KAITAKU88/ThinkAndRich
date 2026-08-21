import type { Post, SessionUser } from "./types";

/**
 * Access policy for Think & Rich:
 * Reading full content requires authentication via Email OTP.
 */
export function canAccessPost(
  _post: Post,
  user: SessionUser | null
): boolean {
  return Boolean(user);
}

// Backward compatibility alias
export const canAccessIdea = canAccessPost;

export function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

