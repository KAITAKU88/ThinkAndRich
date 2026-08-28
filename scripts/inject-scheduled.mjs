/**
 * OpenNext's generated Worker only exports `fetch`. Cloudflare Cron Triggers
 * call `scheduled`. After `opennextjs-cloudflare build`, this patches the
 * default export so the daily 03:00 UTC due-check hits /api/cron/pricing-refresh.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const workerPath = ".open-next/worker.js";
const MARKER = "__thinkandrichPricingCron";

const helper = `
async function ${MARKER}(_event, env) {
  const host = env && env.PUBLIC_HOST;
  const secret = env && env.CRON_SECRET;
  if (!host || !secret) return;
  await fetch("https://" + host + "/api/cron/pricing-refresh", {
    method: "POST",
    headers: { Authorization: "Bearer " + secret },
  });
}
`;

if (!existsSync(workerPath)) {
  console.error("inject-scheduled: missing .open-next/worker.js (run the OpenNext build first)");
  process.exit(1);
}

let src = readFileSync(workerPath, "utf8");
if (src.includes(MARKER)) {
  console.log("inject-scheduled: already patched");
  process.exit(0);
}

if (!/export\s+default\s*\{/.test(src)) {
  console.error("inject-scheduled: worker.js has no `export default {` to patch");
  process.exit(1);
}

src = helper + "\n" + src.replace(/export\s+default\s*\{/, `export default {\n  scheduled: ${MARKER},`);
writeFileSync(workerPath, src);
console.log("inject-scheduled: added scheduled() due-check on the OpenNext worker");
