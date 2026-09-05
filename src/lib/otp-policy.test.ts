import { describe, it, expect } from "vitest";
import { OTP_TTL_MINUTES, OTP_TTL_SECONDS } from "./otp-policy";

describe("OTP lifetime", () => {
  it("is long enough to survive email delivery", () => {
    expect(OTP_TTL_SECONDS).toBeGreaterThanOrEqual(10 * 60);
  });

  it("is short enough to stay a one-sitting code", () => {
    expect(OTP_TTL_SECONDS).toBeLessThanOrEqual(30 * 60);
  });

  it("states the same number in minutes", () => {
    expect(OTP_TTL_MINUTES).toBe(OTP_TTL_SECONDS / 60);
    expect(Number.isInteger(OTP_TTL_MINUTES)).toBe(true);
  });
});
