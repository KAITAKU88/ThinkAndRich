#!/usr/bin/env node
/** Step 2: strip ALL Tailwind/className from public UI — browser-default shell only. */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const TARGET_DIRS = [
  "src/components/explore",
  "src/components/home",
  "src/components/ideas",
  "src/components/profile",
  "src/components/pricing",
  "src/components/checkout",
  "src/components/auth",
  "src/components/paywall",
  "src/components/legal",
  "src/components/credits",
  "src/components/ui",
  "src/components/reading",
  "src/components/layout",
  "src/app/login",
  "src/app/faq",
  "src/app/terms",
  "src/app/privacy",
  "src/app/checkout",
  "src/app/mcp",
  "src/app/explore",
  "src/app/maintenance",
  "src/app/pricing",
];

const KEEP_CLASSES = new Set(["sr-only"]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) out.push(p);
  }
  return out;
}

function keepClassName(value) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (KEEP_CLASSES.has(trimmed)) return true;
  return false;
}

function removeBalanced(src, startIdx, openChar, closeChar) {
  let depth = 0;
  for (let i = startIdx; i < src.length; i++) {
    if (src[i] === openChar) depth++;
    else if (src[i] === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function stripClassNameExpressions(src) {
  let out = src;
  const needle = "className={";
  let idx = 0;
  while ((idx = out.indexOf(needle, idx)) !== -1) {
    const exprStart = idx + needle.length;
    const exprEnd = removeBalanced(out, exprStart - 1, "{", "}");
    if (exprEnd === -1) break;
    const inner = out.slice(exprStart, exprEnd);
    if (keepClassName(inner.replace(/^cn\(|\)$/g, "").replace(/"/g, "").trim())) {
      idx = exprEnd + 1;
      continue;
    }
    out = out.slice(0, idx) + out.slice(exprEnd + 1);
  }
  return out;
}

function processFile(path) {
  let src = readFileSync(path, "utf8");
  const before = src;

  src = src.replace(/\s*className="([^"]*)"/g, (match, cls) => {
    return keepClassName(cls) ? match : "";
  });

  src = stripClassNameExpressions(src);

  src = src.replace(/\s*style=\{\{[\s\S]*?\}\}/g, "");

  src = src.replace(/[ \t]+\n/g, "\n");
  src = src.replace(/\n{3,}/g, "\n\n");

  if (src !== before) {
    writeFileSync(path, src, "utf8");
    return true;
  }
  return false;
}

let changed = 0;
for (const dir of TARGET_DIRS) {
  const abs = join(ROOT, dir);
  try {
    for (const file of walk(abs)) {
      if (file.includes("/admin/")) continue;
      if (processFile(file)) {
        changed++;
        console.log(relative(ROOT, file));
      }
    }
  } catch {
    /* missing dir */
  }
}

const appPage = join(ROOT, "src/app/page.tsx");
try {
  if (processFile(appPage)) {
    changed++;
    console.log(relative(ROOT, appPage));
  }
} catch {
  /* optional */
}

console.log(`Pass 2 updated ${changed} files.`);
