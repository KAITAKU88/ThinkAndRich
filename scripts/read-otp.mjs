#!/usr/bin/env node
/**
 * Print the login code for an address, read out of local D1 (`auth_otps`).
 *
 * Local development cannot deliver a real email — Cloudflare's send_email
 * binding has no local sender, so /api/auth/request-otp writes the code to
 * D1 and returns it as `devCode` on the login form. This script is the
 * fallback when you need the code from a terminal.
 *
 *   npm run otp -- you@example.com
 */
import { execFileSync } from "node:child_process";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: npm run otp -- <email>");
  process.exit(1);
}

const safe = email.replace(/'/g, "''");
const out = execFileSync(
  "npx",
  [
    "wrangler",
    "d1",
    "execute",
    "thinkandrich-db",
    "--local",
    "--json",
    "--command",
    `SELECT code, expires_at FROM auth_otps WHERE email = '${safe}' ORDER BY expires_at DESC LIMIT 1`,
  ],
  { encoding: "utf8", env: { ...process.env, CI: "true" } }
);

const parsed = JSON.parse(out);
const rows = Array.isArray(parsed) ? parsed[0]?.results : parsed.results;
const row = rows?.[0];
const code = row?.code ?? "";
if (!/^\d{6}$/.test(code)) {
  console.error(`No code outstanding for ${email}.`);
  console.error("Request one on the login screen first — codes last 15 minutes.");
  process.exit(1);
}

const secondsLeft = Math.max(0, Math.round((Date.parse(row.expires_at) - Date.now()) / 1000));
console.log(`\n  ${code}   (còn ${secondsLeft}s)\n`);
