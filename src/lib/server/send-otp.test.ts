import { describe, it, expect } from "vitest";
import { shouldSkipOtpEmail } from "./send-otp";

describe("shouldSkipOtpEmail", () => {
  it("skips the Cloudflare send_email binding under next dev", () => {
    expect(shouldSkipOtpEmail({ nodeEnv: "development" })).toBe(true);
  });

  it("skips mail on loopback even if NODE_ENV looks like production", () => {
    expect(shouldSkipOtpEmail({ nodeEnv: "production", hostname: "localhost" })).toBe(true);
    expect(shouldSkipOtpEmail({ nodeEnv: "production", hostname: "127.0.0.1:3000" })).toBe(true);
  });

  it("emails on a real production hostname", () => {
    expect(shouldSkipOtpEmail({ nodeEnv: "production", hostname: "thinkandrich.ankiva.cc" })).toBe(
      false
    );
    expect(
      shouldSkipOtpEmail({ nodeEnv: "production", hostname: "admin.thinkandrich.ankiva.cc" })
    ).toBe(false);
  });
});
