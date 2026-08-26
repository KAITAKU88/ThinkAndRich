#!/usr/bin/env node
/**
 * Print the login code for an address, read out of the local KV simulator.
 *
 * Local development cannot deliver a real email — Cloudflare's send_email
 * binding has no local sender, so /api/auth/request-otp writes the code to
 * KV and that is the end of it. Without this you can request a code and then
 * have no way to get it, which makes the admin console unreachable on your
 * own machine.
 *
 *   npm run otp -- you@example.com
 *
 * The code is part of the key (see src/lib/server/otp.ts), so listing keys
 * by prefix is the whole lookup.
 */
import { execFileSync } from "node:child_process";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: npm run otp -- <email>");
  process.exit(1);
}

const prefix = `otp:${email}:`;
const out = execFileSync(
  "npx",
  ["wrangler", "kv", "key", "list", "--binding=OTP_KV", `--prefix=${prefix}`, "--local"],
  { encoding: "utf8", env: { ...process.env, CI: "true" } }
);

const keys = JSON.parse(out);
if (keys.length === 0) {
  console.error(`No code outstanding for ${email}.`);
  console.error("Request one on the login screen first — codes last five minutes.");
  process.exit(1);
}

// Several can be live at once if "resend" was used; the newest expiry wins.
const newest = keys.sort((a, b) => (b.expiration ?? 0) - (a.expiration ?? 0))[0];
const code = newest.name.slice(prefix.length);
const secondsLeft = Math.max(0, Math.round((newest.expiration ?? 0) - Date.now() / 1000));

console.log(`\n  ${code}   (còn ${secondsLeft}s)\n`);
