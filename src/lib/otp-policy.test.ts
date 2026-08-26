import { describe, it, expect } from "vitest";
import { OTP_TTL_MINUTES, OTP_TTL_SECONDS } from "./otp-policy";
import { TRANSLATIONS } from "./i18n/translations";

describe("OTP lifetime", () => {
  it("is long enough to survive email delivery", () => {
    // Five minutes was not: Cloudflare's send_email call alone took ~5s
    // server-side, and codes were routinely expiring before the message
    // reached an inbox — every attempt failed and resending only produced
    // another code that also expired.
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

// The lifetime is quoted to the user in fourteen languages. It had been
// written out as "5" in every one of them, so raising the TTL would have
// left every translation lying about it.
describe("every translation defers to the constant", () => {
  const languages = Object.keys(TRANSLATIONS) as (keyof typeof TRANSLATIONS)[];

  it("covers every language", () => {
    expect(languages.length).toBeGreaterThanOrEqual(14);
  });

  for (const language of languages) {
    const suffix = TRANSLATIONS[language].auth?.otpSentToastDescSuffix;
    if (suffix === undefined) continue;

    it(`${language} carries the placeholder and no hard-coded number`, () => {
      expect(suffix).toContain("{minutes}");
      expect(suffix.replace("{minutes}", "")).not.toMatch(/\d/);
    });
  }
});
