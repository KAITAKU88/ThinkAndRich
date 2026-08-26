import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readOtpFromLocalKv, resetOtpThrottle } from "./helpers/otp";

// Logging in, reading the OTP back out of KV and shelling out to wrangler all
// cost real seconds under `next dev`; this is a money path, so it gets the
// room it needs rather than a tighter budget and a flake.
test.setTimeout(180_000);

/** Puts the signed-in account on PLUS, `days` into its term. */
function makePlusMember(userId: string, days: number) {
  const startedAt = new Date(Date.now() - days * 86_400_000).toISOString();
  execFileSync(
    "npx",
    [
      "wrangler", "d1", "execute", "thinkandrich-db", "--local", "--command",
      `UPDATE users SET tier='PLUS', plan_started_at='${startedAt}' WHERE id='${userId}';`,
    ],
    { encoding: "utf8", env: { ...process.env, CI: "true" } }
  );
}

async function signIn(page: import("@playwright/test").Page): Promise<string> {
  const email = `e2e-upgrade-${Date.now()}@example.com`;
  resetOtpThrottle(email);

  await page.goto("/");
  await page.getByTestId("login-cta").click();
  await page.locator("#auth-email").fill(email);
  await page.getByTestId("auth-send-otp").click();
  await expect(page.locator("#auth-otp")).toBeVisible();
  await page.locator("#auth-otp").fill(readOtpFromLocalKv(email));
  await page.getByTestId("auth-verify-otp").click();
  await expect(page.getByTestId("login-cta")).toBeHidden();

  const me = (await (await page.request.get("/api/auth/me")).json()) as { user: { id: string } };
  return me.user.id;
}

test.describe("PLUS → PRO mid-term upgrade", () => {
  test("quotes the prorated top-up and shows it in the modal", async ({ page }) => {
    const userId = await signIn(page);
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
    const userId = await signIn(page);
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
    await signIn(page); // still FREE
    const res = await page.request.get("/api/upgrade?country=VN");
    expect(res.status()).toBe(409);
    expect((await res.json()).reason).toBe("NOT_A_MEMBER");
  });

  test("refuses a gateway that cannot charge a prorated amount", async ({ page }) => {
    const userId = await signIn(page);
    makePlusMember(userId, 182);

    // US routes to Lemon Squeezy, whose checkout bills a fixed variant.
    const res = await page.request.get("/api/upgrade?country=US");
    expect(res.status()).toBe(503);
    expect((await res.json()).reason).toBe("GATEWAY_UNSUPPORTED");
  });
});
