import { execFileSync } from "node:child_process";

// Real email delivery only works once actually deployed (Cloudflare's
// send_email "remote": true local-dev proxy hangs in this sandbox — see
// memory). For e2e runs against `next dev`, read the code straight back
// from the local KV simulator instead of an inbox.
export function readOtpFromLocalKv(email: string): string {
  const out = execFileSync(
    "npx",
    ["wrangler", "kv", "key", "get", "--binding=OTP_KV", email, "--local"],
    { cwd: process.cwd(), env: { ...process.env, CI: "true" }, encoding: "utf8" }
  );
  const code = out.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error(`Expected a 6-digit OTP code in local KV for ${email}, got: ${JSON.stringify(code)}`);
  }
  return code;
}
