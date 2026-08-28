import { describe, it, expect } from "vitest";
import {
  generateRecoveryCode,
  hashRecoveryCode,
  isAdminSessionStale,
  ownerEmailFromEnv,
  recoveryCodesMatch,
} from "./owner-recovery";

describe("ownerEmailFromEnv", () => {
  it("prefers the frozen OWNER_EMAIL over the allowlist", () => {
    expect(
      ownerEmailFromEnv({ OWNER_EMAIL: "owner@site.test", ADMIN_EMAILS: "other@site.test" })
    ).toBe("owner@site.test");
  });

  it("falls back to the first ADMIN_EMAILS entry", () => {
    expect(ownerEmailFromEnv({ ADMIN_EMAILS: " A@Site.TEST , b@site.test" })).toBe("a@site.test");
  });

  it("returns empty when nothing is configured", () => {
    expect(ownerEmailFromEnv({})).toBe("");
  });
});

describe("isAdminSessionStale", () => {
  it("keeps tokens issued at or after the epoch", () => {
    expect(isAdminSessionStale(100, 100)).toBe(false);
    expect(isAdminSessionStale(101, 100)).toBe(false);
  });

  it("rejects tokens issued before the epoch", () => {
    expect(isAdminSessionStale(99, 100)).toBe(true);
    expect(isAdminSessionStale(undefined, 100)).toBe(true);
  });

  it("does nothing when no epoch has been set", () => {
    expect(isAdminSessionStale(1, 0)).toBe(false);
    expect(isAdminSessionStale(undefined, 0)).toBe(false);
  });
});

describe("recovery code hashing", () => {
  it("hashes the same code to the same digest, case-insensitively", async () => {
    const a = await hashRecoveryCode("AbCdEf");
    const b = await hashRecoveryCode("abcdef");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("rejects a different code", async () => {
    const stored = await hashRecoveryCode("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const guess = await hashRecoveryCode("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    expect(recoveryCodesMatch(stored, guess)).toBe(false);
  });

  it("accepts a matching hash", async () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[0-9a-f]{32}$/);
    const hash = await hashRecoveryCode(code);
    expect(recoveryCodesMatch(hash, await hashRecoveryCode(code))).toBe(true);
  });
});
