import { describe, expect, it } from "vitest";
import { publicSiteUrl } from "./public-site-url";

describe("publicSiteUrl", () => {
  it("creates an HTTPS URL from the configured public host", () => {
    expect(publicSiteUrl("thinkandrich.ankiva.cc")).toBe("https://thinkandrich.ankiva.cc/");
  });

  it("does not turn missing or malformed configuration into an external URL", () => {
    expect(publicSiteUrl(undefined)).toBe("/");
    expect(publicSiteUrl("admin.example.com/path")).toBe("/");
    expect(publicSiteUrl("admin@example.com")).toBe("/");
  });
});
