#!/usr/bin/env node
/** Step 1: strip decorative Tailwind from public UI files. */
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
  "src/app/login",
  "src/app/faq",
  "src/app/terms",
  "src/app/privacy",
  "src/app/checkout",
  "src/app/mcp",
];

const DECORATIVE =
  /(?:^|\s)(?:rounded[^\s]*|shadow[^\s]*|backdrop-blur[^\s]*|blur[^\s]*|animate[^\s]*|transition[^\s]*|duration-\d+|ease[^\s]*|from[^\s]*|via[^\s]*|to[^\s]*|bg-(?:gradient[^\s]*|rose[^\s]*|amber[^\s]*|emerald[^\s]*|blue[^\s]*|primary[^\s]*|secondary[^\s]*|muted[^\s]*|card[^\s]*|white[^\s]*|black[^\s]*|slate[^\s]*)|text-(?:rose|amber|emerald|blue|primary|slate|muted-foreground|foreground)[^\s]*|border-(?:rose|amber|emerald|blue|primary|border\/\d+|dashed)[^\s]*|opacity-\d+|scale-\d+|rotate-\d+|skew-[^\s]+|translate-[^\s]+|mix-blend[^\s]*|font-display|tracking[^\s]*|antialiased|select-none|line-clamp-\d+|aspect-[^\s]+|tabular-nums|uppercase|underline-offset-\d+|ring[^\s]*|outline-none|overflow-hidden|text-balance|credit-border[^\s]*|gateway-[^\s]*|prose-[^\s]*|reading-[^\s]*|hero-[^\s]*|typeset-[^\s]*|scrollbar-[^\s]*|container|mx-auto|max-w-[^\s]+|pb-16|sm:[^\s]+|md:[^\s]+|lg:[^\s]+|xl:[^\s]+|min-[^\s]+|max-[^\s]+|hover:[^\s]+|group-hover:[^\s]+|active:[^\s]+|dark:[^\s]+|focus-visible:[^\s]+|focus:[^\s]+|placeholder:[^\s]+|data-\[[^\]]+\]:[^\s]+|\[&_[^\]]+\]:[^\s]+)(?=\s|$)/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

function stripClasses(classStr) {
  return classStr.replace(DECORATIVE, " ").replace(/\s+/g, " ").trim();
}

function processFile(path) {
  let src = readFileSync(path, "utf8");
  const before = src;

  src = src.replace(/className="([^"]*)"/g, (_, cls) => {
    const s = stripClasses(cls);
    return s ? `className="${s}"` : "";
  });

  src = src.replace(/className=\{cn\(([^)]*(?:\([^)]*\)[^)]*)*)\)\}/g, (match) => {
    return match.replace(/"([^"]*)"/g, (_, cls) => {
      const s = stripClasses(cls);
      return s ? `"${s}"` : '""';
    });
  });

  // Remove empty className
  src = src.replace(/\s*className=""\s*/g, " ");
  src = src.replace(/className=\{cn\(\s*\)\}/g, "");
  src = src.replace(/className=\{cn\(\s*""\s*,?\s*\)\}/g, "");

  // Strip inline style props used for decoration (transform, boxShadow, borderColor, background)
  src = src.replace(/\sstyle=\{\{[^}]*(?:transform|boxShadow|borderColor|background|perspective|WebkitLineClamp|transition)[^}]*\}\}/g, "");

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
      if (processFile(file)) {
        changed++;
        console.log(relative(ROOT, file));
      }
    }
  } catch {
    /* missing dir */
  }
}
console.log(`Updated ${changed} files.`);
