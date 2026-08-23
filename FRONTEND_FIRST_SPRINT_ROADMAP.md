# 🚀 THINK & RICH — TIẾN ĐỘ THỰC THI (FRONTEND FIRST & MOBILE FIRST ROADMAP)

> **Phương châm cốt lõi**:  
> 1. **Mobile First**: Mọi trải nghiệm, bố cục lưới thẻ vuông, thanh điều hướng và giao diện đọc bài được tối ưu hóa cho màn hình cảm ứng di động trước, sau đó co giãn tự nhiên lên Tablet và Desktop.  
> 2. **Frontend First**: Hoàn thiện toàn bộ hệ thống giao diện, tương tác, component thẻ vuông động, trình đọc học thuật, Paywall Gate và luồng thanh toán trực quan trước khi đấu nối hoàn chỉnh tầng Backend.

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
| **Sprint B1** | **Backend Prisma ORM & Database Migration** | PostgreSQL Schema chuẩn, Migration, Prisma Seed 3 trụ cột | 🟡 Sẵn sàng |
| **Sprint B2** | **Xác Thực Email OTP & Server-Side Paywall** | Resend API, JWT Http-only Cookies, Cắt 30% nội dung phía Server | ⚪ Chờ thực hiện |
| **Sprint B3** | **Webhook Thanh Toán & Production Deployment** | SePay Webhook, Lemon Squeezy HMAC SHA-256, ISR Caching, Cloudflare WAF | ⚪ Chờ thực hiện |

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

## 🛠️ KẾ HOẠCH BƯỚC TIẾP THEO: BACKEND INTEGRATION (B1 -> B3)
- **Sprint B1**: Cập nhật PostgreSQL Database qua Prisma ORM, Schema Migration, Prisma Seed 12 bài viết chuẩn 3 trụ cột.
- **Sprint B2**: Xây dựng Resend Email OTP API Route, Session JWT Cookie Http-only & Server-side 30% Content Truncation.
- **Sprint B3**: Xây dựng Webhooks thanh toán SePay (VietQR) / Lemon Squeezy (HMAC SHA-256), ISR Revalidation, Cloudflare WAF.
