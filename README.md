# Think & Rich — Backend API (ARCHIVED)

> **Repo này không còn deploy production (cutover 2026-08-29).**  
> Production hiện tại:
> - UI: `thinkrich-ui` → https://thinkandrich.ankiva.cc
> - API: `thinkrich-api` → `thinkandrich.ankiva.cc/api/*`
> - Admin: `thinkrich-admin` → https://admin.thinkandrich.ankiva.cc  
> Phát triển mới: `thinkrich`, `thinkrich-api`, `thinkrich-admin` — xem `/home/kaitaku/projects/thinkrich/GREENFIELD_REBUILD.md`.

`npm run deploy` và `npx wrangler deploy` từ repo này **bị chặn** (`scripts/block-deploy.mjs`). Config production cũ lưu tại `wrangler.production.reference.jsonc`. Domain + cron + D1 binding đã gỡ khỏi `wrangler.jsonc`.

Repo **backend-only** (tham khảo thuật toán): D1 schema, REST API, MCP, server libs.

## Chạy local

```bash
npm install
npm run dev          # http://localhost:3000 — GET / trả JSON service index
npm run test:unit
npm run preview      # Workers build (cần bindings Cloudflare)
```

## Cấu trúc chính

| Lớp | Đường dẫn |
|-----|-----------|
| **Schema & migration** | `src/db/schema.ts`, `drizzle/`, `drizzle.config.ts` |
| **REST API** | `src/app/api/**/route.ts` |
| **Domain / DB logic** | `src/lib/server/*.ts` |
| **MCP tools** | `src/lib/mcp/server.ts` |
| **MCP OAuth** | `src/app/api/mcp/**`, `src/lib/server/mcp-oauth.ts` |
| **Auth session** | `src/lib/session-token.ts`, `src/lib/api-auth.ts` |
| **Types** | `src/lib/types.ts` |
| **Deploy** | `wrangler.jsonc`, `open-next.config.ts`, `scripts/inject-scheduled.mjs` |

## API (tóm tắt)

- **Public:** `/api/posts`, `/api/auth/*`, `/api/bookmarks`, `/api/pricing`, `/api/checkout`, `/api/stats`, …
- **Admin** (cookie ADMIN): `/api/admin/posts`, `/api/admin/users`, `/api/admin/mcp-keys`, …
- **MCP:** `POST /api/mcp` (Bearer token)
- **MCP OAuth:** `/.well-known/oauth-authorization-server`, consent `GET /api/mcp/oauth/authorize`
- **Cron / webhook:** `/api/cron/pricing-refresh`, `/api/webhooks/billing`

## MCP OAuth (không UI admin)

1. `POST /api/auth/request-otp` + `POST /api/auth/verify-otp` — lấy session ADMIN (cookie)
2. Mở `GET /api/mcp/oauth/authorize?...` — HTML consent tối giản
3. `POST /api/mcp/oauth/token` — đổi code lấy access token

## Database

```bash
npx wrangler d1 migrations apply thinkandrich-db --local   # dev
npm run db:seed                                           # nếu có script seed
```

Bindings: xem `wrangler.jsonc` (`DB`, `OTP_KV`, `ATTACHMENTS`, `EMAIL`).
