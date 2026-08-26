import { describe, it, expect } from "vitest";
import {
  extractOrderReference,
  generateOrderReference,
  isOrderReference,
} from "./order-reference";

describe("generateOrderReference", () => {
  it("produces a short, punctuation-free code", () => {
    const reference = generateOrderReference();
    expect(reference).toMatch(/^TNR[A-Z0-9]{8}$/);
    expect(reference).toHaveLength(11);
  });

  // The pairs people mistype when reading a code off a screen. Leaving them
  // out of the alphabet costs a little entropy and removes a whole class of
  // "I transferred but nothing happened" support tickets.
  it("never emits characters that are read as each other", () => {
    const sample = Array.from({ length: 400 }, generateOrderReference).join("");
    for (const ambiguous of ["0", "O", "1", "I", "L"]) {
      expect(sample).not.toContain(ambiguous);
    }
  });

  it("does not repeat itself", () => {
    const references = new Set(Array.from({ length: 2_000 }, generateOrderReference));
    expect(references.size).toBe(2_000);
  });

  it("round-trips through the reader", () => {
    for (let i = 0; i < 50; i++) {
      const reference = generateOrderReference();
      expect(extractOrderReference(reference)).toBe(reference);
      expect(isOrderReference(reference)).toBe(true);
    }
  });
});

describe("extractOrderReference", () => {
  const REFERENCE = "TNR7K2M9XBC";

  it("reads a reference sent back exactly as issued", () => {
    expect(extractOrderReference(REFERENCE)).toBe(REFERENCE);
  });

  // Each of these is a bank rewriting the transfer content on its way
  // through — the failure mode the old `ord_<uuid>` format could not
  // survive, because it depended on an underscore arriving intact.
  it("survives the ways a bank rewrites the content field", () => {
    const rewritten = [
      `CHUYEN TIEN ${REFERENCE}`,
      `${REFERENCE} GD 123456789`,
      `TT ${REFERENCE} TU NGUYEN VAN A`,
      "TNR7K2M9X BC", // a space inserted mid-code
      "tnr7k2m9xbc", // lower-cased by the bank
      "TNR-7K2M9XBC", // punctuation added
      `.:${REFERENCE}:.`,
      `NAP TIEN\n${REFERENCE}`,
    ];
    for (const content of rewritten) {
      expect(extractOrderReference(content)).toBe(REFERENCE);
    }
  });

  it("returns nothing when there is no reference to find", () => {
    expect(extractOrderReference("CHUYEN TIEN AN TRUA")).toBeNull();
    expect(extractOrderReference("")).toBeNull();
    expect(extractOrderReference(null)).toBeNull();
    expect(extractOrderReference(undefined)).toBeNull();
  });

  it("does not accept a truncated code", () => {
    expect(extractOrderReference("TNR7K2M9XB")).toBeNull(); // one short
    expect(extractOrderReference("TNR")).toBeNull();
  });

  it("does not read ambiguous characters as part of a code", () => {
    // A bank that mangled a character produces something that is not this
    // order rather than something that is a different one.
    expect(extractOrderReference("TNR7K2M9XBO")).toBeNull();
    expect(extractOrderReference("TNR0K2M9XBC")).toBeNull();
  });

  it("takes the first reference when a memo somehow carries two", () => {
    expect(extractOrderReference(`${REFERENCE} TNRAAAAAAAA`)).toBe(REFERENCE);
  });
});

describe("isOrderReference", () => {
  it("accepts only a whole, well-formed reference", () => {
    expect(isOrderReference("TNR7K2M9XBC")).toBe(true);
    expect(isOrderReference("TNR7K2M9XBC ")).toBe(false);
    expect(isOrderReference("XTNR7K2M9XBC")).toBe(false);
    expect(isOrderReference("ord_3f7a1b2c-8d9e")).toBe(false);
  });
});
