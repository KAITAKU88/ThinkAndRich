import { describe, it, expect } from "vitest";
import { normalizeOtpCode, otpIsLive, otpKey } from "./otp";

describe("normalizeOtpCode", () => {
  it("strips spaces and punctuation copied from an email", () => {
    expect(normalizeOtpCode(" 12 34 56 ")).toBe("123456");
    expect(normalizeOtpCode("123-456")).toBe("123456");
  });

  it("keeps a clean 6-digit code", () => {
    expect(normalizeOtpCode("847291")).toBe("847291");
  });
});

describe("otpIsLive", () => {
  it("accepts a code whose expiry is still in the future", () => {
    expect(otpIsLive(new Date(Date.now() + 60_000).toISOString(), Date.now())).toBe(true);
  });

  it("rejects an expired code", () => {
    expect(otpIsLive(new Date(Date.now() - 1_000).toISOString(), Date.now())).toBe(false);
  });
});

describe("otpKey", () => {
  it("keeps the historical KV shape for leftover local tooling", () => {
    expect(otpKey("a@b.com", "123456")).toBe("otp:a@b.com:123456");
  });
});
