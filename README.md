# IdeaVault

Thư viện ý tưởng khởi nghiệp — UI product theo Blueprint (mock services).

## Chạy

```bash
npm install
npm run dev
```

http://localhost:3000

## Luồng chính

- `/` — Khám phá + filter/sort/pagination
- `/idea/[id]` — Chi tiết + paywall (sealed dossier)
- `/pricing` — So sánh gói (không form thanh toán)
- `/checkout?plan=premium|super` — Stripe / Sepay mock
- `/checkout/success` — Kích hoạt tier
- `/login` — Magic link mock
- `/profile` — Favorites + quản lý gói
- `/admin` — Guard ADMIN (email chứa `admin`), Tiptap, CSV, AppSetting

## Demo tips

- Đăng nhập email có chữ `admin` → quyền Quản trị
- Free lưu tối đa 5 ý tưởng; Premium/Super không giới hạn
- Super-only ideas chỉ mở với tier SUPER

Backend thật (Supabase/Prisma/Stripe) — xem `Global_Startup_Ideas_Blueprint.md` và `prisma/schema.prisma`.
