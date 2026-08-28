import { describe, expect, it } from "vitest";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { checkPostAccess } from "@/lib/server/access-control";
import type { CreditCost } from "@/lib/types";

const unusedDb = new Proxy(
  {},
  {
    get() {
      throw new Error("This access branch must not query D1.");
    },
  }
) as DrizzleD1Database;

function post(creditCost: CreditCost) {
  return { id: `post-${creditCost}`, creditCost };
}

function noUnlockDb() {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          get: async () => undefined,
        }),
      }),
    }),
  } as unknown as DrizzleD1Database;
}

describe("checkPostAccess", () => {
  it("allows Open articles without login", async () => {
    await expect(checkPostAccess(unusedDb, post(0), null)).resolves.toEqual({
      allowed: true,
      creditCost: 0,
    });
  });

  it.each([1, 2, 3, 4, 5] as const)(
    "requires login for a logged-out reader opening a %sC article",
    async (cost) => {
      await expect(checkPostAccess(unusedDb, post(cost), null)).resolves.toEqual({
        allowed: false,
        reason: "AUTH_REQUIRED",
        creditCost: cost,
      });
    }
  );

  it("does not grant an admin free public reads", async () => {
    await expect(
      checkPostAccess(noUnlockDb(), post(5), { id: "admin-1", role: "ADMIN" })
    ).resolves.toEqual({ allowed: false, reason: "UNLOCK_REQUIRED", creditCost: 5 });
  });
});
