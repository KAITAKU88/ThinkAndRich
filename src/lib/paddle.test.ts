import { describe, expect, it } from "vitest";
import {
  isPaddlePaidEvent,
  paddleApiBase,
  timingSafeEqualString,
  verifyPaddleSignature,
} from "./paddle";

describe("paddleApiBase", () => {
  it("points sandbox keys at sandbox-api and live keys at api.paddle.com", () => {
    expect(paddleApiBase(true)).toBe("https://sandbox-api.paddle.com");
    expect(paddleApiBase(false)).toBe("https://api.paddle.com");
  });
});

describe("timingSafeEqualString", () => {
  it("accepts identical strings and rejects mismatches", () => {
    expect(timingSafeEqualString("abc", "abc")).toBe(true);
    expect(timingSafeEqualString("abc", "abd")).toBe(false);
    expect(timingSafeEqualString("abc", "ab")).toBe(false);
  });
});

describe("verifyPaddleSignature", () => {
  const secret = "test-webhook-secret";
  const body = '{"event_type":"transaction.completed"}';

  it("accepts a ts+h1 header that matches HMAC-SHA256 of ts:body", async () => {
    const ts = "1719924195";
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${ts}:${body}`));
    const h1 = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");

    expect(await verifyPaddleSignature(body, `ts=${ts};h1=${h1}`, secret)).toBe(true);
  });

  it("rejects a forged digest, a missing header, and an empty secret", async () => {
    expect(await verifyPaddleSignature(body, "ts=1;h1=deadbeef", secret)).toBe(false);
    expect(await verifyPaddleSignature(body, null, secret)).toBe(false);
    expect(await verifyPaddleSignature(body, "ts=1;h1=ab", "")).toBe(false);
  });
});

describe("isPaddlePaidEvent", () => {
  it("treats completed and paid transactions as money in", () => {
    expect(isPaddlePaidEvent({ event_type: "transaction.completed" })).toBe(true);
    expect(isPaddlePaidEvent({ event_type: "transaction.paid" })).toBe(true);
    expect(isPaddlePaidEvent({ data: { status: "completed" } })).toBe(true);
    expect(isPaddlePaidEvent({ event_type: "transaction.updated", data: { status: "draft" } })).toBe(
      false
    );
  });
});
