import { describe, it, expect } from "vitest";
import {
  EMPTY_PAYMENT_SETTINGS,
  billingWebhookUrls,
  isPaymentConfigured,
  isPaddleConfigured,
  isSepayBankConfigured,
  isSepayWebhookConfigured,
  paddlePriceIdForPackage,
  toPublicPaymentSettings,
  validatePaymentSettings,
  type PaymentSettings,
} from "./payment-settings";

const BANK: Pick<
  PaymentSettings,
  "bankCode" | "bankName" | "bankAccountNumber" | "bankAccountHolder"
> = {
  bankCode: "MB",
  bankName: "MBBank (Ngân hàng Quân Đội)",
  bankAccountNumber: "0123456789",
  bankAccountHolder: "THINK AND RICH CO LTD",
};

const VALID: PaymentSettings = {
  ...EMPTY_PAYMENT_SETTINGS,
  ...BANK,
  sepayWebhookSecret: "sepay-test-secret",
  paddleApiKey: "pdl_sdbx_apikey_testkey",
  paddleWebhookSecret: "pdl_ntfset_secret",
  paddleSandbox: true,
  paddlePricePack1: "pri_01pack1exampleid",
  paddlePricePack2: "pri_01pack2exampleid",
  paddlePricePack3: "pri_01pack3exampleid",
};

describe("isSepayBankConfigured / isPaymentConfigured", () => {
  it("accepts a fully filled bank configuration even when Paddle is empty", () => {
    expect(isSepayBankConfigured({ ...EMPTY_PAYMENT_SETTINGS, ...BANK })).toBe(true);
    expect(isPaymentConfigured({ ...EMPTY_PAYMENT_SETTINGS, ...BANK })).toBe(true);
  });

  it("rejects a blank configuration", () => {
    expect(isSepayBankConfigured(EMPTY_PAYMENT_SETTINGS)).toBe(false);
  });

  it("rejects a configuration missing any single bank field", () => {
    for (const field of Object.keys(BANK) as (keyof typeof BANK)[]) {
      expect(isSepayBankConfigured({ ...BANK, [field]: "" })).toBe(false);
      expect(isSepayBankConfigured({ ...BANK, [field]: "   " })).toBe(false);
    }
  });

  it("does not require the SePay webhook secret to draw a QR", () => {
    expect(isSepayBankConfigured({ ...BANK, sepayWebhookSecret: "" } as PaymentSettings)).toBe(true);
  });
});

describe("isSepayWebhookConfigured", () => {
  it("is true only when a secret is stored", () => {
    expect(isSepayWebhookConfigured({ sepayWebhookSecret: "" })).toBe(false);
    expect(isSepayWebhookConfigured({ sepayWebhookSecret: "  " })).toBe(false);
    expect(isSepayWebhookConfigured({ sepayWebhookSecret: "apikey" })).toBe(true);
  });
});

describe("isPaddleConfigured", () => {
  it("accepts a complete Paddle block", () => {
    expect(isPaddleConfigured(VALID)).toBe(true);
  });

  it("rejects when any Paddle credential or price id is missing", () => {
    expect(isPaddleConfigured({ ...VALID, paddleApiKey: "" })).toBe(false);
    expect(isPaddleConfigured({ ...VALID, paddleWebhookSecret: "" })).toBe(false);
    expect(isPaddleConfigured({ ...VALID, paddlePricePack1: "" })).toBe(false);
    expect(isPaddleConfigured({ ...VALID, paddlePricePack2: "" })).toBe(false);
    expect(isPaddleConfigured({ ...VALID, paddlePricePack3: "" })).toBe(false);
  });

  it("does not require bank details — Paddle is the international gateway", () => {
    expect(isPaddleConfigured({ ...EMPTY_PAYMENT_SETTINGS, ...VALID, ...{ bankCode: "", bankName: "", bankAccountNumber: "", bankAccountHolder: "" } })).toBe(
      true
    );
  });
});

describe("paddlePriceIdForPackage", () => {
  it("maps the three credit packs onto the stored price ids", () => {
    expect(paddlePriceIdForPackage(VALID, "pack_1")).toBe("pri_01pack1exampleid");
    expect(paddlePriceIdForPackage(VALID, "pack_2")).toBe("pri_01pack2exampleid");
    expect(paddlePriceIdForPackage(VALID, "pack_3")).toBe("pri_01pack3exampleid");
  });
});

describe("billingWebhookUrls", () => {
  it("points each gateway at the billing webhook with a query flag", () => {
    expect(billingWebhookUrls("https://thinkandrich.ankiva.cc")).toEqual({
      sepay: "https://thinkandrich.ankiva.cc/api/webhooks/billing?gateway=sepay",
      paddle: "https://thinkandrich.ankiva.cc/api/webhooks/billing?gateway=paddle",
    });
  });
});

describe("toPublicPaymentSettings", () => {
  it("strips every gateway secret", () => {
    const published = toPublicPaymentSettings(VALID);
    expect(published).toEqual(BANK);
    expect(published).not.toHaveProperty("sepayWebhookSecret");
    expect(published).not.toHaveProperty("paddleApiKey");
    expect(published).not.toHaveProperty("paddleWebhookSecret");
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

  it("rejects an accented account holder name", () => {
    expect(validatePaymentSettings({ bankAccountHolder: "NGUYỄN VĂN A" })).not.toBeNull();
    expect(validatePaymentSettings({ bankAccountHolder: "NGUYEN VAN A" })).toBeNull();
  });

  it("rejects a Paddle price id that is not pri_…", () => {
    expect(validatePaymentSettings({ paddlePricePack1: "var_123" })).not.toBeNull();
    expect(validatePaymentSettings({ paddlePricePack1: "pri_01gsz8x8sawmvhz1pv30nge1ke" })).toBeNull();
  });

  it("rejects a too-short Paddle API key", () => {
    expect(validatePaymentSettings({ paddleApiKey: "short" })).not.toBeNull();
    expect(validatePaymentSettings({ paddleApiKey: "pdl_sdbx_apikey_x" })).toBeNull();
  });

  it("treats an omitted field as nothing to validate", () => {
    expect(validatePaymentSettings({})).toBeNull();
    expect(validatePaymentSettings({ bankName: "bất kỳ tên nào cũng được" })).toBeNull();
  });

  it("lets a field be cleared so an operator can take a gateway off sale", () => {
    expect(validatePaymentSettings({ bankCode: "", paddleApiKey: "", paddlePricePack1: "" })).toBeNull();
  });
});
