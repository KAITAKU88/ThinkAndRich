import { describe, it, expect } from "vitest";
import {
  EMPTY_PAYMENT_SETTINGS,
  isPaymentConfigured,
  validatePaymentSettings,
  type PaymentSettings,
} from "./payment-settings";

const VALID: PaymentSettings = {
  bankCode: "MB",
  bankName: "MBBank (Ngân hàng Quân Đội)",
  bankAccountNumber: "0123456789",
  bankAccountHolder: "THINK AND RICH CO LTD",
};

describe("isPaymentConfigured", () => {
  it("accepts a fully filled configuration", () => {
    expect(isPaymentConfigured(VALID)).toBe(true);
  });

  it("rejects a blank configuration", () => {
    expect(isPaymentConfigured(EMPTY_PAYMENT_SETTINGS)).toBe(false);
  });

  // Every field builds part of the QR or the screen the customer checks
  // before confirming a transfer, so a partial configuration is not a
  // partially working checkout — it is a QR pointing somewhere wrong.
  it("rejects a configuration missing any single field", () => {
    for (const field of Object.keys(VALID) as (keyof PaymentSettings)[]) {
      expect(isPaymentConfigured({ ...VALID, [field]: "" })).toBe(false);
      expect(isPaymentConfigured({ ...VALID, [field]: "   " })).toBe(false);
    }
  });
});

describe("validatePaymentSettings", () => {
  it("accepts a valid configuration", () => {
    expect(validatePaymentSettings(VALID)).toBeNull();
  });

  it("accepts the real bank codes in use", () => {
    for (const bankCode of ["MB", "VCB", "TCB", "ACB", "BIDV", "VPBank"]) {
      expect(validatePaymentSettings({ bankCode })).toBeNull();
    }
  });

  it("rejects a bank code that is a name or carries punctuation", () => {
    expect(validatePaymentSettings({ bankCode: "MB Bank" })).not.toBeNull();
    expect(validatePaymentSettings({ bankCode: "MB-1" })).not.toBeNull();
    expect(validatePaymentSettings({ bankCode: "M" })).not.toBeNull();
  });

  it("rejects an account number that is not digits", () => {
    expect(validatePaymentSettings({ bankAccountNumber: "0123 4567" })).not.toBeNull();
    expect(validatePaymentSettings({ bankAccountNumber: "ABC123456" })).not.toBeNull();
    expect(validatePaymentSettings({ bankAccountNumber: "12345" })).not.toBeNull();
  });

  // The holder's name is rendered by the bank in unaccented uppercase Latin;
  // Vietnamese diacritics come out mangled on the transfer screen, which is
  // exactly the moment a customer decides whether to trust the transfer.
  it("rejects an accented account holder name", () => {
    expect(validatePaymentSettings({ bankAccountHolder: "NGUYỄN VĂN A" })).not.toBeNull();
    expect(validatePaymentSettings({ bankAccountHolder: "NGUYEN VAN A" })).toBeNull();
  });

  it("treats an omitted field as nothing to validate", () => {
    expect(validatePaymentSettings({})).toBeNull();
    expect(validatePaymentSettings({ bankName: "bất kỳ tên nào cũng được" })).toBeNull();
  });

  it("lets a field be cleared", () => {
    // Blanking a field is how an operator takes the site off sale; that is a
    // configuration state, not a validation error.
    expect(validatePaymentSettings({ bankCode: "", bankAccountNumber: "" })).toBeNull();
  });
});
