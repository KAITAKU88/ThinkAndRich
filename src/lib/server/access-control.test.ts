import { describe, expect, it } from "vitest";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { ContentAccessLevel, MembershipTier } from "@/lib/types";
import { checkPostAccess } from "@/lib/server/access-control";

// These access-level branches return before touching D1. A throwing stand-in
// makes that contract explicit: deciding that login or a higher tier is
// required must not depend on quota storage being available.
const unusedDb = new Proxy(
  {},
  {
    get() {
      throw new Error("This access branch must not query D1.");
    },
  }
) as DrizzleD1Database;

function post(accessLevel: ContentAccessLevel) {
  return { id: `post-${accessLevel.toLowerCase()}`, accessLevel };
}

function reader(tier: MembershipTier) {
  return { id: `reader-${tier.toLowerCase()}`, role: "USER", tier };
}

describe("checkPostAccess tier prompts", () => {
  it.each(["FREE", "MEMBER_PLUS", "MEMBER_PRO"] as const)(
    "requires login for a logged-out reader opening %s content",
    async (accessLevel) => {
      await expect(checkPostAccess(unusedDb, post(accessLevel), null)).resolves.toEqual({
        allowed: false,
        reason: "AUTH_REQUIRED",
      });
    }
  );

  it("allows OPEN content without login", async () => {
    await expect(checkPostAccess(unusedDb, post("OPEN"), null)).resolves.toEqual({ allowed: true });
  });

  it("tells a FREE reader that a PLUS article requires PLUS", async () => {
    await expect(checkPostAccess(unusedDb, post("MEMBER_PLUS"), reader("FREE"))).resolves.toEqual({
      allowed: false,
      reason: "PLUS_REQUIRED",
      tier: "FREE",
    });
  });

  it("tells FREE and PLUS readers that a PRO article requires PRO", async () => {
    await expect(checkPostAccess(unusedDb, post("MEMBER_PRO"), reader("FREE"))).resolves.toEqual({
      allowed: false,
      reason: "PRO_REQUIRED",
      tier: "FREE",
    });
    await expect(checkPostAccess(unusedDb, post("MEMBER_PRO"), reader("PLUS"))).resolves.toEqual({
      allowed: false,
      reason: "PRO_REQUIRED",
      tier: "PLUS",
    });
  });

  it("allows PRO and ADMIN readers through without a quota lookup", async () => {
    await expect(checkPostAccess(unusedDb, post("MEMBER_PRO"), reader("PRO"))).resolves.toEqual({ allowed: true });
    await expect(
      checkPostAccess(unusedDb, post("MEMBER_PRO"), { ...reader("FREE"), role: "ADMIN" })
    ).resolves.toEqual({ allowed: true });
  });
});
