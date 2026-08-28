# 🚀 THINK & RICH — TIẾN ĐỘ THỰC THI (FRONTEND FIRST & MOBILE FIRST ROADMAP)

> **Phương châm cốt lõi**:  
> 1. **Mobile First**: Mọi trải nghiệm, bố cục lưới thẻ vuông, thanh điều hướng và giao diện đọc bài được tối ưu hóa cho màn hình cảm ứng di động trước, sau đó co giãn tự nhiên lên Tablet và Desktop.  
> 2. **Frontend First**: Hoàn thiện toàn bộ hệ thống giao diện, tương tác, component thẻ vuông động, trình đọc học thuật, Paywall Gate và luồng thanh toán trực quan trước khi đấu nối hoàn chỉnh tầng Backend.

---

> ⚠️ **LƯU Ý (2026-08-28):** Đây là nhật ký tiến độ lịch sử — số liệu "HOÀN THÀNH" bên dưới phản ánh đúng những gì đã build tại thời điểm đó, **không sửa lại**. Nhưng phần UI/logic liên quan tier (`Paywall Gate` với `UPGRADE_PLUS`/`UPGRADE_PRO` ở F3, Quota Gauge theo gói Free/Plus/Pro ở F4, bảng giá PPP Free-Plus-Pro ở F5, phân quyền `FREE`/`MEMBER_PLUS`/`MEMBER_PRO` trong Admin CMS ở F6, webhook nâng tier + Lemon Squeezy ở B3) đang chờ làm lại theo **mô hình credit mới** — xem `CREDIT_PRICING_MODEL.md`. Coi các mục này là "đã làm nhưng sẽ bị thay thế", không phải đích đến hiện tại.

---

## 📊 BẢNG THEO DÕI TỔNG QUAN TIẾN ĐỘ

| Sprint | Tên Sprint & Mục tiêu | Trọng tâm Triển khai | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Sprint F0** | **Academic Design System & Data Foundation** | Bảng màu 3 trụ cột, Typography học thuật, Type definitions & Mock Data 12 bài chuyên sâu | 🟢 **HOÀN THÀNH** |
| **Sprint F1** | **Mobile-First Layout Shell & Bottom Navigation** | Header tối giản, Bottom Navigation Bar cảm ứng, Pillar Filter sticky, Search Modal | 🟢 **HOÀN THÀNH** |
| **Sprint F2** | **Lưới Thẻ Vuông Kích Thước Động (Dynamic Square Grid)** | Component `DynamicSquareCard` (1x1, 2x2, 3x3), SVG Schematics, Bento Layout | 🟢 **HOÀN THÀNH** |
| **Sprint F3** | **Trải Nghiệm Đọc Học Thuật & Paywall Gate** | Khối công thức logic, SVG Viewer, Mobile Action Bar, Paywall 3 trạng thái | 🟢 **HOÀN THÀNH** |
| **Sprint F4** | **Tủ Sách Tri Thức (Bookmarks) & Quota Gauge** | Quản lý bài đã lưu theo 3 trụ cột, Đồng hồ đo hạn mức đọc hàng ngày | 🟢 **HOÀN THÀNH** |
| **Sprint F5** | **Giao Diện Thanh Toán PPP & VietQR Modal** | Bảng giá đa quốc gia, Khóa tiền tệ IP, Drawer quét mã VietQR SePay & Card | 🟢 **HOÀN THÀNH** |
| **Sprint F6** | **Admin Dashboard & TipTap Editor Học Thuật** | Soạn thảo công thức, nhúng SVG, chọn kích thước thẻ vuông, Quản lý độc giả | 🟢 **HOÀN THÀNH** |
| **Sprint B1** | **Backend Database Migration (Cloudflare D1)** | D1 + Drizzle ORM Schema thực (posts/users/bookmarks/reactions/read_logs/share_logs/orders), R2 cho attachments, xoá toàn bộ Zustand mock data layer | 🟢 **HOÀN THÀNH** |
| **Sprint B2** | **Xác Thực Email OTP & Server-Side Paywall** | Cloudflare Email Sending API, KV lưu OTP, JWT Http-only Cookies, Cắt 30% nội dung phía Server (`/api/posts/[slug]`) | 🟢 **HOÀN THÀNH** |
| **Sprint B3** | **Webhook Thanh Toán & Production Deployment** | SePay Webhook (Apikey header + đối soát số tiền), Lemon Squeezy Checkout API + Webhook HMAC SHA-256, Admin Orders/Revenue | 🟡 **MỘT PHẦN** — ISR Caching & Cloudflare WAF chưa làm |
| **Sprint C1** | **Data Layer Mô Hình Credit** | Đổi schema: xoá `SubscriptionTier`/tier trên `posts`, thêm giá bài `0-5`, `users.paid_credit_balance/expires_at`, ví tặng ngày/tháng, bảng `user_unlocks` | ⚪ **CHỜ THỰC HIỆN** |
| **Sprint C2** | **Trải Nghiệm Mở Khóa Bài Viết** | Rèm Paywall mới (giá + nút Mở khóa), badge Open/1-5 (icon xu vàng), bypass auth cho bài Open, credit hiển thị header cập nhật realtime | ⚪ **CHỜ THỰC HIỆN** |
| **Sprint C3** | **Mua Credit & Gỡ Bỏ Luồng Nâng Cấp Tier** | Checkout one-time 3 gói credit (SePay + Paddle), webhook cộng credit + đặt lại hạn 365 ngày, xoá `upgrade-pricing.ts`/`UpgradeModal`/proration | ⚪ **CHỜ THỰC HIỆN** |
| **Sprint C4** | **Engine Giá Theo Thị Trường (DB-backed)** | Bảng `market_pricing`/`pricing_refresh_settings`/`pricing_refresh_log`, cron kiểm tra hạn refresh hằng ngày, chế độ Auto (3 tháng, sàn 30 ngày)/Manual (diff duyệt tay) | ⚪ **CHỜ THỰC HIỆN** |
| **Sprint C5** | **Chế Độ Bảo Trì Hệ Thống** | Toggle admin (tay + tự động theo job giá), middleware chặn route công khai, trang thông báo bảo trì song ngữ, tự chữa lành sau 15 phút | ⚪ **CHỜ THỰC HIỆN** |

---

## 🎯 CHI TIẾT CÁC SPRINT ĐÃ HOÀN THIỆN

### 🟢 SPRINT F0: Academic Design System & Data Foundation
- [x] Thiết lập bảng màu học thuật: Off-White (`#F9F9F8`), Deep Obsidian (`#111112`), Fine Stroke borders (`#E4E4E7` / `#27272A`).
- [x] Định hình 3 mã màu nhận diện trụ cột:
  - 🔴 **Mô hình tư duy (`MENTAL_MODEL`)**: Crimson (`#991B1B` / `#F87171`)
  - 🟡 **Chiến lược kinh doanh (`BUSINESS_STRATEGY`)**: Amber / Ochre (`#B45309` / `#FBBF24`)
  - 🟢 **Ý tưởng khởi nghiệp (`STARTUP_IDEA`)**: Forest Jade (`#065F46` / `#34D399`)
- [x] Đồng bộ Type Definitions (`src/lib/types.ts`) với đầy đủ các Enums (`PillarType`, `CardDisplaySize`, `ContentAccessLevel`, `SubscriptionTier`) & Models.
- [x] Xây dựng bộ Mock Data 12 bài viết học thuật chuyên sâu chuẩn hóa kèm: Công thức logic (`academicFormula`), Sơ đồ vector tối giản (`schematicSvg`), Cấp quyền (`accessLevel`) và Kích cỡ thẻ vuông (`displaySize`).

---

### 🟢 SPRINT F1: Mobile-First Layout Shell & Bottom Navigation
- [x] Xây dựng **Mobile Header**: Logo tối giản Think & Rich, Pill Quota đọc bài hôm nay (`📖 3/10` hoặc `💎 PRO`), Nút chuyển Theme và Dropdown Đa ngôn ngữ.
- [x] Xây dựng **Mobile Bottom Navigation Bar** cố định ở cạnh dưới màn hình:
  - 🏠 Trang chủ (Feed thẻ vuông động)
  - 🧭 Khám phá (Bộ lọc 3 Trụ cột tri thức)
  - 🔖 Tủ sách (Bài viết đã lưu)
  - 💎 Gói Hội viên (Nâng cấp Plus/Pro PPP)
  - 👤 Tài khoản / Đăng nhập OTP
- [x] Thanh tìm kiếm tức thì và bộ lọc Trụ cột dạng cuộn ngang (Horizontal Scrollable Pillar Chips) cố định khi lướt.

---

### 🟢 SPRINT F2: Hệ Thống Lưới Thẻ Vuông Kích Thước Động (Dynamic Square Bento Grid)
- [x] Xây dựng Component `DynamicSquareCard`:
  - **Compact Square (1x1)**: Tỷ lệ 1:1, thẻ vuông gọn gàng, hiển thị công thức/tiên đề, thời gian đọc 2-3 phút, nhãn trụ cột.
  - **Medium Square (2x2)**: Tỷ lệ vuông/chữ nhật mở rộng, tích hợp sơ đồ khái niệm SVG tối giản, 3 luận điểm cốt lõi.
  - **Feature Dossier (3x3 / Wide Bento)**: Thẻ hồ sơ chuyên sâu, sơ đồ tương tác, nhãn Sealed Knowledge (`MEMBER_PLUS` / `MEMBER_PRO`).
- [x] Tối ưu hóa lưới hiển thị: 1-col / 2-col so le trên Mobile, mở rộng thành Bento Masonry Grid trên Desktop.
- [x] Hiệu ứng tương tác mượt mà, hiển thị nhanh công thức và trích dẫn cốt lõi.

---

### 🟢 SPRINT F3: Trải Nghiệm Đọc Học Thuật & Server Paywall Gate UI
- [x] Thanh tiến trình đọc (Reading Progress Bar) mảnh mai ở đỉnh màn hình theo scroll.
- [x] Khối hiển thị Công thức Học thuật Cốt lõi (Academic Formula Callout Banner) với typography Serif & Mono trang nhã.
- [x] Khung hiển thị Sơ đồ Vector SVG Tối giản (Vector Schematic Box) với độ tương phản sắc nét trên cả Light & Dark mode.
- [x] Component `<PaywallGate />` với 3 trạng thái trực quan:
  - `AUTH_REQUIRED`: Yêu cầu đăng nhập để đọc tiếp (sau 30% nội dung cắt tỉa).
  - `UPGRADE_PLUS`: Dành cho bài viết cấp Plus, hiển thị nút nâng cấp 1 chạm.
  - `UPGRADE_PRO`: Dành cho hồ sơ chuyên sâu Pro, kèm quyền lợi đặc quyền.
- [x] Thanh công cụ nổi cạnh dưới (Floating Bottom Reader Bar): Lưu vào tủ sách, Thích/Không thích, Điều chỉnh cỡ chữ (A-/A+), Chia sẻ.

---

### 🟢 SPRINT F4: Tủ Sách Cá Nhân (Bookmarks) & Quota Tracker
- [x] Trang Tủ sách cá nhân (`/profile`) phân loại theo 3 trụ cột (Tất cả / Tư duy / Chiến lược / Khởi nghiệp).
- [x] Đồng hồ đo hạn mức đọc (Daily Quota Gauge) trực quan (Hiển thị số bài đã đọc / hạn mức ngày theo gói Free, Plus, Pro).
- [x] Bảng nhật ký tra cứu tri thức gần đây và ghi chú điểm cốt lõi.

---

### 🟢 SPRINT F5: Giao Diện Bảng Giá PPP & Thanh Toán VietQR SePay
- [x] Bảng so sánh 3 gói Free - Plus - Pro tối ưu cho thao tác vuốt trên Mobile.
- [x] Tự động nhận diện GeoIP và khóa đồng tiền thanh toán (VNĐ với SePay, USD/EUR/JPY... với Lemon Squeezy).
- [x] Modal / Drawer thanh toán **VietQR (SePay)** trên Mobile với mã QR chuyển khoản và thông tin đối soát tự động.

---

### 🟢 SPRINT F6: Admin CMS Soạn Thảo TipTap & Quản Trị
- [x] Trình soạn thảo TipTap hỗ trợ chọn Trụ cột, Khổ thẻ (`SQUARE_SM`, `SQUARE_MD`, `SQUARE_LG`), Phân quyền (`FREE`, `MEMBER_PLUS`, `MEMBER_PRO`).
- [x] Nhập công thức học thuật, mã SVG sơ đồ và các luận điểm thực thi cốt lõi.
- [x] Bảng quản trị bài viết & quản lý độc giả đã xác thực.

---

## 🎯 CHI TIẾT SPRINT BACKEND ĐÃ TRIỂN KHAI (B1 → B3)

### 🟢 SPRINT B1: Backend Database Migration (Cloudflare D1)
- [x] Schema thực qua Drizzle ORM (`src/db/schema.ts`): `posts`, `users`, `bookmarks`, `reactions`, `read_logs`, `share_logs`, `orders`.
- [x] Toàn bộ site đọc/ghi qua các route `/api/*` chạm D1 thật — không còn dữ liệu mock trong `src/lib/data.ts` phục vụ runtime.
- [x] R2 bucket `ATTACHMENTS` cho ảnh/tệp đính kèm bài viết.
- [x] Dựng lại Admin Console (đơn hàng thật, doanh thu thật, quản lý bài viết/độc giả trên D1).

### 🟢 SPRINT B2: Xác Thực Email OTP & Server-Side Paywall
- [x] `/api/auth/request-otp`, `/api/auth/verify-otp`, `/api/auth/me`, `/api/auth/logout` — OTP lưu ở KV (`OTP_KV`), gửi qua Cloudflare `send_email` binding.
- [x] Session JWT (thư viện `jose`) ký bằng `JWT_SECRET`, cookie `tr_session` httpOnly/secure/sameSite=lax.
- [x] Cắt nội dung 30% phía server tại `src/app/api/posts/[slug]/route.ts` (`checkPostAccess` + `truncateHtmlContent`) — client không bao giờ nhận full content nếu chưa đủ quyền.

### 🟡 SPRINT B3: Webhook Thanh Toán & Production Deployment — một phần
- [x] `/api/checkout` tạo đơn hàng `PENDING` thật trong D1, giá tính phía server theo PPP (không tin giá client gửi lên).
- [x] SePay: `/api/webhooks/billing?gateway=sepay` xác thực header `Authorization: Apikey ...`, đối soát `transactionContent` chứa mã đơn hàng và số tiền, cập nhật `orders` + nâng tier `users`.
- [x] Lemon Squeezy: `/api/checkout` gọi REST API tạo hosted checkout session thật (`src/lib/lemonsqueezy.ts`); `/api/webhooks/billing?gateway=lemonsqueezy` xác thực chữ ký HMAC-SHA256 header `X-Signature`, xử lý sự kiện `order_created` status `paid`.
  - ⚠️ Cần cấu hình thật trước khi hoạt động: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_PLUS`, `LEMONSQUEEZY_VARIANT_PRO`, `LEMONSQUEEZY_WEBHOOK_SECRET` (xem chú thích trong `.dev.vars`, và `wrangler secret put` cho production). Thiếu cấu hình → API trả 503 thay vì giả vờ thành công.
- [ ] **ISR Caching**: chưa cấu hình `revalidate`/`s-maxage` cho các route công khai (trang chủ, khám phá, bài viết) — hiện mọi request đều chạy động qua Worker.
- [ ] **Cloudflare WAF**: cấu hình ở Cloudflare Dashboard (ngoài phạm vi repo), chưa thực hiện.
- [ ] **Production Deployment**: `npm run deploy` chưa được chạy lên môi trường thật — mới test qua `npm run preview` cục bộ.

---

## 🎯 CHI TIẾT SPRINT MÔ HÌNH CREDIT (C1 → C5) — CHỜ THỰC HIỆN

Spec đầy đủ: `CREDIT_PRICING_MODEL.md`. Thay thế hoàn toàn phần tier ở F3/F4/F5/F6/B3 phía trên, không phải mở rộng thêm. Thứ tự C1→C5 là thứ tự phụ thuộc — C4/C5 cần data layer C1 tồn tại trước (cả 2 đều ghi/đọc DB do C1 dựng lên).

### ⚪ SPRINT C1: Data Layer Mô Hình Credit
- [ ] Xoá `SubscriptionTier` (`OPEN/FREE/PLUS/PRO`) khỏi `users` và mọi enum liên quan trong `src/db/schema.ts`.
- [ ] Thêm giá bài viết trên `posts`: số nguyên `0-5` (0 = Open, không cần login) thay cho `accessLevel` cũ.
- [ ] Thêm `users.paid_credit_balance` (int) + `users.paid_credit_expires_at` (timestamp) — không cần bảng lô riêng (mục 5, `CREDIT_PRICING_MODEL.md`).
- [ ] Thêm ví tặng: counter theo ngày (5C, reset 00:00) + counter theo tháng (trần 30C).
- [ ] Bảng `user_unlocks(user_id, post_id, unlocked_at)` — mở khóa vĩnh viễn, tách biệt vòng đời credit (mục 4).
- [ ] Migration D1 + cập nhật `rowToPost`/`checkPostAccess` để đọc giá mới thay vì tier.

### ⚪ SPRINT C2: Trải Nghiệm Mở Khóa Bài Viết
- [ ] `<PaywallGate />` kiểu mới: hiện tiêu đề/mô tả/lượt đọc/like, rèm che phần còn lại kèm giá + nút "Mở khóa" (mục 3).
- [ ] Badge Open (viền trắng, nhãn "Open") và badge 1-5 (số + icon xu vàng, viền xanh lá/xanh dương/tím/vàng/đỏ theo mục 2) — thay `TierBadge` cũ.
- [ ] Bài Open bỏ qua toàn bộ auth + trừ credit — route công khai thật sự, không chỉ ẩn UI.
- [ ] Trừ credit ưu tiên ví tặng trước, ví mua sau (mục 6); cập nhật số credit trên header ngay khi trừ, không chờ reload.
- [ ] Trang Usage: tổng credit mua hiện có, credit tặng còn lại hôm nay (+ tiến độ trần tháng), tổng đã dùng trong kỳ, đếm ngược ngày hết hạn (mục 7) — thay Quota Gauge Free/Plus/Pro cũ.

### ⚪ SPRINT C3: Mua Credit & Gỡ Bỏ Luồng Nâng Cấp Tier
- [ ] Checkout one-time cho 3 gói credit, cả SePay (VN) lẫn Paddle (quốc tế) — không cần subscription object nào (mục "Đã tự giải quyết" trong `PAYMENT_ROADMAP.md`).
- [ ] Webhook thanh toán: cộng `paid_credit_balance`, đặt lại `paid_credit_expires_at = now + 365 ngày`, ghi `orders`.
- [ ] Xoá `src/lib/upgrade-pricing.ts`, `src/app/api/upgrade/route.ts`, `src/components/upgrade/UpgradeModal.tsx` — không còn khái niệm nâng cấp giữa tier để tính bù trừ.
- [ ] Gỡ Lemon Squeezy khỏi luồng thanh toán quốc tế, thay bằng Paddle (đã quyết ở `PAYMENT_ROADMAP.md`, độc lập với việc đổi mô hình giá nhưng làm cùng lúc cho gọn).

### ⚪ SPRINT C4: Engine Giá Theo Thị Trường (DB-backed)
- [ ] Bảng `market_pricing` / `pricing_refresh_settings` / `pricing_refresh_log` (mục 9, `CREDIT_PRICING_MODEL.md`) — thay bảng tĩnh hardcode trong `src/lib/geo-pricing.ts`.
- [ ] Cron Cloudflare Trigger cố định hằng ngày (giờ thấp điểm) chỉ để kiểm tra `next_run_at` — **không** đổi lịch cron theo cấu hình admin (Cloudflare không hỗ trợ đổi lịch runtime), tần suất admin chọn chỉ quyết định `next_run_at` được tính lại thế nào.
- [ ] Chế độ Auto: tự áp dụng giá mới sau khi tính; Manual: hiển thị bảng diff giá cũ→mới, chờ admin xác nhận mới ghi đè.
- [ ] Timeout an toàn 10 phút cho quy trình refresh — quá hạn thì huỷ, giữ giá cũ, ghi log lỗi, không ghi đè dở dang.
- [ ] Nguyên tắc bất biến: giá mới chỉ áp dụng cho lần mua tiếp theo, không tính lại credit đã mua.
- [ ] **Trước khi code**: chọn nhà cung cấp API tỷ giá và nguồn tham chiếu PPP cụ thể (mục 11, còn mở trong `CREDIT_PRICING_MODEL.md`).

### ⚪ SPRINT C5: Chế Độ Bảo Trì Hệ Thống
- [ ] State `maintenance_mode` (D1 hoặc KV) — `enabled`, `enabled_at`, `enabled_by`, `reason`, `message_vi`, `message_en`.
- [ ] Gắn tự động vào quy trình refresh giá ở C4: bật trước bước tính giá, tắt ngay sau khi ghi xong (hoặc khi timeout).
- [ ] Tự chữa lành: `src/middleware.ts` coi bảo trì hết hạn nếu `now - enabled_at > 15 phút`, phục vụ site bình thường dù cờ DB chưa kịp tắt — không cần cron/watcher riêng.
- [ ] Toggle thủ công trong Admin Console — mục "Bảo trì hệ thống", bật/tắt tay + soạn thông báo song ngữ cho tình huống ngoài lịch refresh giá.
- [ ] Trang bảo trì công khai (song ngữ, dùng `src/lib/i18n/translations.ts`) cho mọi route trừ `/admin/*` và `/api/admin/*` — admin phải vào được console để tắt bảo trì.
