import { describe, it, expect } from "vitest";
import { signSession, verifySession, type SessionPayload } from "./session-token";

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
