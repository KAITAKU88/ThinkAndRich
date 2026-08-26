import { test, expect } from "@playwright/test";
import { readDevVar, wrangler } from "./helpers/otp";
import { signInAsReader } from "./helpers/auth";
import { seedPaymentSettings } from "./helpers/settings";

// Logging in, reading the OTP back out of KV and shelling out to wrangler all
// cost real seconds under `next dev`; this is a money path, so it gets the
// room it needs rather than a tighter budget and a flake.
test.setTimeout(180_000);

// The checkout assertions below read a real VietQR code, which only exists
// once the bank details are configured (see the console's payment tab).
test.beforeAll(() => seedPaymentSettings());

/** A freshly signed-in reader, returning the id these tests need to set up. */
async function signInAsUpgradeCandidate(page: import("@playwright/test").Page): Promise<string> {
  await signInAsReader(page, `e2e-upgrade-${Date.now()}@example.com`);
  const me = (await (await page.request.get("/api/auth/me")).json()) as { user: { id: string } };
  return me.user.id;
}

/** Puts the signed-in account on PLUS, `days` into its term. */
function makePlusMember(userId: string, days: number) {
  const startedAt = new Date(Date.now() - days * 86_400_000).toISOString();
  wrangler([
    "d1", "execute", "thinkandrich-db", "--local", "--command",
    `UPDATE users SET tier='PLUS', plan_started_at='${startedAt}' WHERE id='${userId}';`,
  ]);
}

test.describe("PLUS → PRO mid-term upgrade", () => {
  test("quotes the prorated top-up and shows it in the modal", async ({ page }) => {
    const userId = await signInAsUpgradeCandidate(page);
    makePlusMember(userId, 182);

    // The same figures the unit tests pin down for a six-month-old VND term
    // (src/lib/upgrade-pricing.test.ts) — proving the wiring from the users
    // row through the pricing table to the response loses nothing.
    const quote = await (await page.request.get("/api/upgrade?country=VN")).json();
    expect(quote).toMatchObject({
      ok: true,
      spentValue: 218_857,
      remainingCredit: 80_143,
      topUpAmount: 418_857,
      currency: "VND",
      creditedFromRecordedTerm: true,
    });

    await page.goto("/profile");
    await page.getByTestId("profile-tab-account").click();
    await page.getByRole("button", { name: /Nâng cấp/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("80.143 VND")).toBeVisible();
    await expect(dialog.getByText("418.857 VND")).toBeVisible();
  });

  test("opens a PENDING order for the top-up, and grants nothing until it is paid", async ({ page }) => {
    const userId = await signInAsUpgradeCandidate(page);
    makePlusMember(userId, 182);

    const created = await (await page.request.post("/api/upgrade?country=VN")).json();
    expect(created.ok).toBe(true);
    expect(created.amount).toBe(418_857);

    // The account must still be PLUS: an order is an intent to pay, and the
    // billing webhook is the only thing that moves a tier.
    const me = (await (await page.request.get("/api/auth/me")).json()) as { user: { tier: string } };
    expect(me.user.tier).toBe("PLUS");
  });

  test("refuses to quote for a reader who has nothing to upgrade from", async ({ page }) => {
    await signInAsUpgradeCandidate(page); // still FREE
    const res = await page.request.get("/api/upgrade?country=VN");
    expect(res.status()).toBe(409);
    expect((await res.json()).reason).toBe("NOT_A_MEMBER");
  });

  test("refuses a gateway that cannot charge a prorated amount", async ({ page }) => {
    const userId = await signInAsUpgradeCandidate(page);
    makePlusMember(userId, 182);

    // US routes to Lemon Squeezy, whose checkout bills a fixed variant.
    const res = await page.request.get("/api/upgrade?country=US");
    expect(res.status()).toBe(503);
    expect((await res.json()).reason).toBe("GATEWAY_UNSUPPORTED");
  });
});

// The whole money loop, end to end. Everything above proves a piece of it;
// this proves the pieces are actually joined — which they were not: the
// checkout page ignored the order the upgrade had created and opened its own
// at the list price, so the member was quoted a credit and then charged as
// if they had none.
test("carries the quoted price through checkout and settles it", async ({ page }) => {
  const userId = await signInAsUpgradeCandidate(page);
  makePlusMember(userId, 182);

  await page.goto("/profile");
  await page.getByTestId("profile-tab-account").click();
  await page.getByRole("button", { name: /Nâng cấp/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận nâng cấp" }).click();

  // The confirm hands off to the payment page carrying the order it made.
  await expect(page).toHaveURL(/\/checkout\?plan=PRO&order=ord_/);

  // What is displayed and what the QR asks for must be the same number, and
  // that number must be the prorated one — not 499.000.
  await expect(page.getByText("418.857 VND")).toBeVisible();
  const qrSrc = await page.locator('img[alt="VietQR SePay Transfer"]').getAttribute("src");
  expect(qrSrc).toContain("amount=418857");

  // The memo is the short transfer reference, not the order id — forty
  // characters of underscores and hyphens do not survive a bank's content
  // field. See src/lib/order-reference.ts.
  const reference = new URL(qrSrc!).searchParams.get("addInfo")!;
  expect(reference).toMatch(/^TNR[A-Z0-9]{8}$/);
  await expect(page.getByText(reference)).toBeVisible();

  // Nothing has been granted yet — the account is still PLUS.
  let me = await (await page.request.get("/api/auth/me")).json();
  expect(me.user.tier).toBe("PLUS");

  // Now play the bank: SePay posts the transfer to the webhook.
  const settled = await page.request.post("/api/webhooks/billing?gateway=sepay", {
    headers: { Authorization: `Apikey ${readDevVar("SEPAY_WEBHOOK_SECRET")}` },
    // Sent the way a bank actually renders it: the code wrapped in narration
    // of the bank's own, which is what the reader has to cope with.
    data: {
      transactionContent: `CHUYEN TIEN ${reference} GD 987654321`,
      amountIn: 418_857,
      referenceCode: "e2e-transfer",
    },
  });
  expect(settled.ok()).toBe(true);

  me = await (await page.request.get("/api/auth/me")).json();
  expect(me.user.tier).toBe("PRO");

  // ...and the new term is stamped, so a later upgrade quote has something
  // to measure from.
  const row = wrangler([
    "d1", "execute", "thinkandrich-db", "--local", "--json", "--command",
    `SELECT tier, plan_started_at, plan_expires_at FROM users WHERE id='${userId}';`,
  ]);
  const user = JSON.parse(row)[0].results[0] as {
    tier: string;
    plan_started_at: string;
    plan_expires_at: string;
  };
  expect(user.tier).toBe("PRO");
  const term = Date.parse(user.plan_expires_at) - Date.parse(user.plan_started_at);
  expect(term).toBe(365 * 86_400_000);
});
