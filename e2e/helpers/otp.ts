import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Real email delivery only works once actually deployed (Cloudflare's
// send_email "remote": true local-dev proxy hangs in this sandbox — see
// memory). For e2e runs against `next dev`, read the code straight back
// from the local KV simulator instead of an inbox.
export function readOtpFromLocalKv(email: string): string {
  const prefix = `otp:${email}:`;
  const out = execFileSync(
    "npx",
    ["wrangler", "kv", "key", "list", "--binding=OTP_KV", `--prefix=${prefix}`, "--local"],
    { cwd: process.cwd(), env: { ...process.env, CI: "true" }, encoding: "utf8" }
  );
  const keys = JSON.parse(out) as Array<{ name: string; expiration?: number }>;
  const newest = keys.sort((a, b) => (b.expiration ?? 0) - (a.expiration ?? 0))[0];
  const code = newest?.name.slice(prefix.length) ?? "";
  if (!/^\d{6}$/.test(code)) {
    throw new Error(`Expected a 6-digit OTP key in local KV for ${email}, got: ${JSON.stringify(keys)}`);
  }
  return code;
}

export function readConfiguredAdminEmail(): string {
  let configured: string | undefined = process.env.ADMIN_EMAILS;
  if (!configured) {
    const envFile = readFileSync(join(process.cwd(), ".dev.vars"), "utf8");
    configured = envFile.match(/^ADMIN_EMAILS=(.*)$/m)?.[1]?.trim();
  }

  const email = configured?.replace(/^['"]|['"]$/g, "").split(",")[0]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("ADMIN_EMAILS must contain at least one email for admin E2E tests.");
  }
  return email;
}

/**
 * Drop the OTP throttling counters that a local test run trips, in the local
 * KV simulator.
 *
 * /api/auth/request-otp has two real limits worth keeping exactly as they
 * are: 4 codes per address per 15 minutes, and 15 per client IP per hour.
 * Neither survives contact with a test suite. Every admin test authenticates
 * as the single allowlisted address, so retries spend the per-address budget
 * in one run — and the per-IP counter is worse, because locally there is no
 * cf-connecting-ip header, so every request from every test in every run of
 * the past hour is counted against the one identifier "unknown". A few runs
 * in and the whole suite 429s before it tests anything.
 *
 * Clearing the counters is test setup, in the same spirit as reading the code
 * back out of KV instead of out of an inbox.
 */
export function resetOtpThrottle(email: string): void {
  const prefixes = [
    `rl:otp-email:${email}:`,
    `rl:otp-verify:${email}:`,
    // Local requests carry no cf-connecting-ip, so they all share this one.
    "rl:otp-ip:",
  ];

  const keys: string[] = [];
  for (const prefix of prefixes) {
    const out = wrangler(["kv", "key", "list", "--binding=OTP_KV", `--prefix=${prefix}`, "--local"]);
    keys.push(...(JSON.parse(out) as Array<{ name: string }>).map((k) => k.name));
  }
  if (keys.length === 0) return;

  // One `bulk delete` rather than a `key delete` per key: each wrangler
  // invocation costs seconds of process startup, and enough of them in a row
  // pushed these tests past their timeout before they had done any testing.
  const file = join(tmpdir(), `tr-otp-throttle-${process.pid}-${Date.now()}.json`);
  writeFileSync(file, JSON.stringify(keys), "utf8");
  try {
    wrangler(["kv", "bulk", "delete", file, "--binding=OTP_KV", "--local", "--force"]);
  } finally {
    rmSync(file, { force: true });
  }
}

function wrangler(args: string[]): string {
  return execFileSync("npx", ["wrangler", ...args], {
    cwd: process.cwd(),
    env: { ...process.env, CI: "true" },
    encoding: "utf8",
  });
}
