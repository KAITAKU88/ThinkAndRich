import { describe, it, expect } from "vitest";
import {
  sessionCookieDomain,
  sessionCookieOptions,
  signSession,
  verifySession,
  type SessionPayload,
} from "./session-token";

const SECRET = "test-secret-at-least-32-bytes-long-for-hs256";
const OTHER_SECRET = "a-completely-different-secret-value-of-similar-length";

const payload: SessionPayload = {
  sub: "user-1",
  email: "reader@example.com",
  role: "USER",
  tier: "FREE",
};

describe("signSession / verifySession", () => {
  it("round-trips a valid token", async () => {
    const token = await signSession(payload, SECRET);
    const result = await verifySession(token, SECRET);
    expect(result).toEqual(payload);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession(payload, SECRET);
    const result = await verifySession(token, OTHER_SECRET);
    expect(result).toBeNull();
  });

  it("rejects garbage input instead of throwing", async () => {
    const result = await verifySession("not-a-real-jwt", SECRET);
    expect(result).toBeNull();
  });

  it("rejects a token with a tampered payload", async () => {
    const token = await signSession(payload, SECRET);
    const [header, , signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, role: "ADMIN" })
    ).toString("base64url");
    const tampered = `${header}.${tamperedPayload}.${signature}`;
    const result = await verifySession(tampered, SECRET);
    expect(result).toBeNull();
  });

  it("preserves the exact tier/role strings passed in", async () => {
    const admin: SessionPayload = { sub: "admin-1", email: "a@b.com", role: "ADMIN", tier: "PRO" };
    const token = await signSession(admin, SECRET);
    const result = await verifySession(token, SECRET);
    expect(result?.role).toBe("ADMIN");
    expect(result?.tier).toBe("PRO");
  });
});

// SESSION_COOKIE_DOMAIN is a plain var in wrangler.jsonc, and those reach
// `next dev` as well as the deployed Worker. Attaching it unconditionally
// scoped every localhost login cookie to a domain the browser was not being
// served from, so the browser dropped it and the session silently never
// existed — /api/auth/me 401'd forever and /admin bounced to its login page.
// The scope has to follow the host that actually sent the response.
describe("sessionCookieDomain", () => {
  const CONFIGURED = ".thinkandrich.ankiva.cc";

  it("widens to the parent domain for the public hostname", () => {
    expect(sessionCookieDomain(CONFIGURED, "thinkandrich.ankiva.cc")).toBe(CONFIGURED);
  });

  it("widens to the parent domain for the console hostname", () => {
    // The whole reason the cookie is widened: /mcp/authorize is served from
    // the public host but has to see a session created on the console host.
    expect(sessionCookieDomain(CONFIGURED, "admin.thinkandrich.ankiva.cc")).toBe(CONFIGURED);
  });

  it("stays host-only on localhost", () => {
    expect(sessionCookieDomain(CONFIGURED, "localhost:3000")).toBeUndefined();
    expect(sessionCookieDomain(CONFIGURED, "127.0.0.1:3000")).toBeUndefined();
  });

  it("stays host-only on the workers.dev address", () => {
    expect(
      sessionCookieDomain(CONFIGURED, "thinkandrich.thankful-to-all-88.workers.dev")
    ).toBeUndefined();
  });

  it("refuses a domain that merely looks like a suffix", () => {
    expect(sessionCookieDomain(CONFIGURED, "notthinkandrich.ankiva.cc")).toBeUndefined();
    expect(sessionCookieDomain(CONFIGURED, "thinkandrich.ankiva.cc.evil.example")).toBeUndefined();
  });

  it("accepts a configured domain written without the leading dot", () => {
    expect(sessionCookieDomain("thinkandrich.ankiva.cc", "admin.thinkandrich.ankiva.cc")).toBe(
      "thinkandrich.ankiva.cc"
    );
  });

  it("returns nothing when either side is missing", () => {
    expect(sessionCookieDomain(undefined, "thinkandrich.ankiva.cc")).toBeUndefined();
    expect(sessionCookieDomain("   ", "thinkandrich.ankiva.cc")).toBeUndefined();
    expect(sessionCookieDomain(CONFIGURED, null)).toBeUndefined();
    expect(sessionCookieDomain(CONFIGURED, undefined)).toBeUndefined();
  });

  it("ignores case on both sides", () => {
    expect(sessionCookieDomain(".ThinkAndRich.Ankiva.CC", "ADMIN.thinkandrich.ankiva.cc")).toBe(
      ".thinkandrich.ankiva.cc"
    );
  });
});

describe("sessionCookieOptions", () => {
  it("omits the domain entirely rather than setting an empty one", () => {
    const options = sessionCookieOptions(".thinkandrich.ankiva.cc", "localhost:3000");
    expect("domain" in options).toBe(false);
  });

  it("carries the domain through when the host is inside it", () => {
    const options = sessionCookieOptions(".thinkandrich.ankiva.cc", "admin.thinkandrich.ankiva.cc");
    expect(options).toMatchObject({ domain: ".thinkandrich.ankiva.cc", path: "/", httpOnly: true });
  });
});
