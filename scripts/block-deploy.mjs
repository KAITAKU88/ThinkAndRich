#!/usr/bin/env node
/**
 * Deploy to Cloudflare is disabled for this archived repo.
 * Production moves to thinkrich + thinkrich-api + thinkrich-admin.
 */
console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  DEPLOY BLOCKED — ThinkAndRich repo is archived (reference only) ║
╠══════════════════════════════════════════════════════════════════╣
║  Active development:                                             ║
║    /home/kaitaku/projects/thinkrich        (UI)                  ║
║    /home/kaitaku/projects/thinkrich-api    (public API worker)   ║
║    /home/kaitaku/projects/thinkrich-admin  (admin worker)        ║
║                                                                  ║
║  See thinkrich/GREENFIELD_REBUILD.md for the migration plan.     ║
║                                                                  ║
║  Local dev still OK:  npm run dev | npm run preview              ║
╚══════════════════════════════════════════════════════════════════╝
`);
process.exit(1);
