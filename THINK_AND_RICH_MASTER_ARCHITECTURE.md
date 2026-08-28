# 🏛️ THINK & RICH — HỒ SƠ KIẾN TRÚC HỆ THỐNG & ĐẶC TẢ KỸ THUẬT HỢP NHẤT

> **Tài liệu đặc tả toàn diện (Unified Master System Blueprint & Implementation Roadmap)**  
> **Dự án**: Think & Rich (*Academic & Strategic Intelligence Platform*)  
> **Định hướng chuyên môn**: 3 Trụ cột tri thức chuyên sâu (Mô hình tư duy, Chiến lược kinh doanh, Ý tưởng khởi nghiệp)  
> **Ngôn ngữ giao diện**: Academic Minimalist & Dynamic Square Card System (Thẻ vuông kích thước động)  
> **Ngăn xếp công nghệ**: Next.js 15 (App Router) \+ TypeScript \+ Tailwind CSS \+ PostgreSQL \+ Prisma ORM \+ Resend \+ SePay & Lemon Squeezy

---

> ⚠️ **LƯU Ý (2026-08-28) — Mô hình định giá trong tài liệu này đã LỖI THỜI.**
> Toàn bộ phần liên quan đến `SubscriptionTier` (FREE/PLUS/PRO), `ContentAccessLevel`, bảng giá PPP theo tier (mục 6), và quy tắc truy cập/quota theo tier (mục 7) đã bị thay thế bởi **mô hình định giá theo Credit** (mở khóa từng bài, 0-5 credit/bài) — xem **`CREDIT_PRICING_MODEL.md`** ở gốc repo, đó mới là spec định giá hiện hành.
> Ngoài ra: ngăn xếp DB/ORM thực tế đã chuyển từ PostgreSQL+Prisma sang **Cloudflare D1 + Drizzle ORM** từ lâu — schema Prisma ở mục 4 chỉ còn giá trị tham khảo lịch sử, không phản ánh code thật. Cổng thanh toán quốc tế cũng đã đổi từ **Lemon Squeezy sang Paddle** (xem `PAYMENT_ROADMAP.md`). Các phần về 3 trụ cột nội dung, ngôn ngữ thiết kế UI, và hệ thống thẻ vuông vẫn còn giá trị tham khảo.

---

## 1\. TỔNG QUAN ĐỊNH HƯỚNG & 3 TRỤ CỘT TRI THỨC CỐT LÕI

Dự án chuyển đổi toàn diện thành nền tảng xuất bản và tra cứu tri thức học thuật, phục vụ các đối tượng: **Nhà sáng lập (Founders), Nhà hoạch định chiến lược (Corporate Strategists), Nhà đầu tư và Giới nghiên cứu kinh doanh**.

### 1.1. Ba Trụ Cột Nội Dung Cốt Lõi (Content Pillars)

1. **Mô hình tư duy & Mô hình tâm trí (Mental Models & Cognitive Frameworks):**  
   * *Nội dung*: Hệ thống hóa các nguyên lý tư duy nền tảng: Nguyên lý Đệ nhất (*First Principles*), Tư duy Đảo ngược (*Inversion*), Tư duy Bậc hai (*Second-Order Thinking*), Thiên kiến Nhận thức (*Cognitive Biases*), Lý thuyết Trò chơi (*Game Theory*).  
   * *Mục tiêu*: Giúp người đọc tái cấu trúc tư duy, nâng cao chất lượng ra quyết định trong điều kiện bất định.  
2. **Chiến lược kinh doanh (Business Strategy & Corporate Playbooks):**  
   * *Nội dung*: Các khung phân tích và mô hình vận hành kinh điển lẫn hiện đại: Bánh đà Tăng trưởng (*Flywheel Effect*), Hào kinh tế (*7 Powers & Economic Moats*), Đơn vị Kinh tế (*Unit Economics*), Đổi mới Đột phá (*Disruptive Innovation*), Chiến lược Mạng lưới (*Platform Strategies*).  
   * *Mục tiêu*: Giải mã các case study thực tế từ các tập đoàn hàng đầu và kỳ lân công nghệ.  
3. **Ý tưởng khởi nghiệp (Global Startup Ideas & Venture Opportunities):**  
   * *Nội dung*: Các hồ sơ phân tích sâu (*Deep-dive teardowns*) về khoảng trống thị trường (*Market Gaps*), xu hướng công nghệ mới nổi, tín hiệu thị trường toàn cầu và kế hoạch triển khai mô hình (*Execution Playbooks*).  
   * *Mục tiêu*: Cung cấp nguồn cảm hứng và cơ sở luận chứng cho các dự án kinh doanh mới.

---

## 2\. NGÔN NGỮ THIẾT KẾ UI/UX: ACADEMIC MINIMALISM & DYNAMIC SQUARE CARDS

Loại bỏ hoàn toàn thiết kế thẻ card thông thường (lưới chia đều, ảnh thumbnail màu mè, bố cục rập khuôn). Thay vào đó là ngôn ngữ thiết kế **Học thuật Tối giản (Academic Minimalism)** kết hợp **Lưới thẻ vuông kích thước động (Dynamic Modular Square Grid)**.

\+-------------------------------------------------------------------------------+

| \[Dynamic Modular Square Bento Layout\]                                         |

| \+-------------------------+ \+-------------------------+ \+-------------------+ |

| | Feature Square (2x2)    | | Compact Square (1x1)    | | Compact Square(1x1)| |

| | \[Business Strategy\]     | | \[Mental Model\]          | | \[Startup Idea\]    | |

| | First Principles in     | | Inversion Principle     | | Regulatory Tech   | |

| | Capital Allocation      | |                         | | Micro-SaaS        | |

| |                         | \+-------------------------+ \+-------------------+ |

| | \[Minimalist Vector SVG\] | \+-----------------------------------------------+ |

| |                         | | Medium Square / Wide Bento (2x1 / 2x2)        | |

| | Excerpt & Core Formula  | | \[Business Strategy\]                           | |

| |                         | | Network Effects: Defensibility Matrix         | |

| \+-------------------------+ \+-----------------------------------------------+ |

\+-------------------------------------------------------------------------------+

### 2.1. Quy chuẩn Thẩm mỹ & Thị giác

* **Bảng màu Tối giản & Học thuật (Monochrome with Intellectual Accents):**  
  * *Nền (Background)*: Off-White / Chalk (`#F9F9F8` \- Light) hoặc Deep Obsidian / Ink (`#111112` \- Dark).  
  * *Chữ & Đường nét (Typography & Borders)*: Charcoal (`#222225`), Slate Grey (`#6B7280`), Fine Stroke (`#E5E7EB` / `#27272A`).  
  * *Màu nhận diện 3 trụ cột (Subtle Accents)*:  
    * Mô hình tư duy: Deep Crimson (`#991B1B` / `#F87171`).  
    * Chiến lược kinh doanh: Deep Amber / Ochre (`#B45309` / `#FBBF24`).  
    * Ý tưởng khởi nghiệp: Forest Jade (`#065F46` / `#34D399`).  
* **Hệ thống Font chữ (Typography Hierarchy):**  
  * *Tiêu đề & Công thức*: Serif trang nhã, học thuật (*Newsreader, Merriweather, hoặc Playfair Display*).  
  * *Nội dung, Metadata & Thông số*: Sans-serif trung tính, sắc nét (*Inter, Plus Jakarta Sans, hoặc JetBrains Mono* cho các công thức logic).

### 2.2. Cấu trúc Thẻ Vuông Size Động (Dynamic Square Architecture)

Trọng tâm thẻ là **Tri thức, Sơ đồ Khái niệm (Vector Schematics) và Công thức Cốt lõi**, không dùng ảnh stock đại trà.

* **Compact Square (1x1):** Thẻ vuông nhỏ, cô đọng 1 định lý/nguyên lý, mã ký hiệu logic, thời gian đọc 2-3 phút.  
* **Medium Square (2x2):** Thẻ vuông chuẩn, chứa tiêu đề, sơ đồ khái niệm tối giản dạng SVG/ASCII, 3 luận điểm thực thi chính.  
* **Feature Dossier Square (3x3 hoặc Khối Bento mở rộng):** Hồ sơ nghiên cứu sâu (*Deep-dive dossier*), tích hợp sơ đồ tư duy tương tác và nhãn nội dung thành viên (*Sealed Knowledge*).

---

## 3\. NGĂN XẾP CÔNG NGHỆ (TECH STACK)

* **Core Framework:** Next.js 15 (App Router, React Server Components, Server Actions).  
* **Ngôn ngữ:** TypeScript (Strict mode).  
* **Styling & Components:** Tailwind CSS (kèm CSS Variables động) \+ Radix UI / Shadcn UI.  
* **Cơ sở dữ liệu & ORM:** PostgreSQL (Supabase / Neon) \+ Prisma ORM.  
* **Xác thực (Authentication):** Passwordless Email OTP qua Resend API \+ HTTP-only Cookie JWT Session.  
* **Cổng thanh toán:**  
  * Nội địa Việt Nam: **SePay** (Quét mã VietQR tự động khớp giao dịch).  
  * Quốc tế: **Lemon Squeezy** (Thẻ tín dụng quốc tế, Apple Pay, tích hợp tính thuế toàn cầu).  
* **CMS & Xử lý nội dung:** TipTap Editor (Hỗ trợ công thức, SVG schematics, blockquotes học thuật) \+ PapaParse (Batch CSV import).  
* **Hạ tầng & Bảo mật:** Vercel \+ Cloudflare (WAF, Bot Fight Mode, Rate Limiting chống cào dữ liệu).

---

## 4\. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN HÓA (PRISMA SCHEMA)

datasource db {

  provider \= "postgresql"

  url      \= env("DATABASE\_URL")

}

generator client {

  provider \= "prisma-client-js"

}

// \----------------------------------------------------

// ENUMS

// \----------------------------------------------------

enum Role {

  USER

  ADMIN

}

enum SubscriptionTier {

  FREE

  PLUS

  PRO

}

enum PillarType {

  MENTAL\_MODEL       // Trụ cột 1: Mô hình tư duy, tâm trí

  BUSINESS\_STRATEGY  // Trụ cột 2: Chiến lược kinh doanh

  STARTUP\_IDEA       // Trụ cột 3: Ý tưởng khởi nghiệp

}

enum CardDisplaySize {

  SQUARE\_SM          // Thẻ vuông nhỏ 1x1

  SQUARE\_MD          // Thẻ vuông vừa 2x2

  SQUARE\_LG          // Thẻ vuông lớn / Feature Dossier 3x3

}

enum ContentAccessLevel {

  FREE

  MEMBER\_PLUS

  MEMBER\_PRO

}

enum GatewayType {

  SEPAY

  LEMON\_SQUEEZY

  STRIPE

}

enum TransactionStatus {

  PENDING

  COMPLETED

  FAILED

  REFUNDED

}

// \----------------------------------------------------

// MODELS

// \----------------------------------------------------

model User {

  id               String           @id @default(uuid())

  email            String           @unique

  name             String?

  role             Role             @default(USER)

  subscriptionTier SubscriptionTier @default(FREE)

  tierExpiresAt    DateTime?

  countryCode      String?          // Lưu quốc gia nhận diện qua GeoIP

  preferredLang    String           @default("vi") // vi, en, zh, ja, ko

  createdAt        DateTime         @default(now())

  updatedAt        DateTime         @updatedAt

  bookmarks        Bookmark\[\]

  readingLogs      ReadingLog\[\]

  subscriptions    Subscription\[\]

  transactions     PaymentTransaction\[\]

  postsWritten     Post\[\]

}

model OtpCode {

  id        String   @id @default(uuid())

  email     String

  codeHash  String

  expiresAt DateTime

  used      Boolean  @default(false)

  createdAt DateTime @default(now())

  @@index(\[email\])

}

model Category {

  id          String     @id @default(uuid())

  name        String

  slug        String     @unique

  pillar      PillarType

  description String?

  createdAt   DateTime   @default(now())

  posts       Post\[\]

}

model Tag {

  id        String      @id @default(uuid())

  name      String      @unique

  slug      String      @unique

  posts     TagOnPost\[\]

}

model Post {

  id                 String             @id @default(uuid())

  title              String

  slug               String             @unique

  pillar             PillarType         // 1 trong 3 trụ cột

  categoryId         String

  displaySize        CardDisplaySize    @default(SQUARE\_SM) // Kích thước thẻ vuông

  

  academicFormula    String?            // Công thức / Tiên đề học thuật cốt lõi

  summarySnippet     String             // Tóm tắt ngắn gọn

  fullContent        String             // Nội dung HTML/Markdown chi tiết từ TipTap

  schematicSvg       String?            // Sơ đồ vector tối giản (mã SVG)

  

  accessLevel        ContentAccessLevel @default(FREE)

  readingTimeMinutes Int                @default(5)

  isPublished        Boolean            @default(true)

  viewsCount         Int                @default(0)

  likesCount         Int                @default(0)

  

  authorId           String

  seoTitle           String?

  seoDescription     String?

  createdAt          DateTime           @default(now())

  updatedAt          DateTime           @updatedAt

  category           Category           @relation(fields: \[categoryId\], references: \[id\])

  author             User               @relation(fields: \[authorId\], references: \[id\])

  tags               TagOnPost\[\]

  bookmarks          Bookmark\[\]

  readingLogs        ReadingLog\[\]

  @@index(\[pillar, accessLevel\])

}

model TagOnPost {

  postId String

  tagId  String

  post   Post   @relation(fields: \[postId\], references: \[id\], onDelete: Cascade)

  tag    Tag    @relation(fields: \[tagId\], references: \[id\], onDelete: Cascade)

  @@id(\[postId, tagId\])

}

model Bookmark {

  id        String   @id @default(uuid())

  userId    String

  postId    String

  createdAt DateTime @default(now())

  user      User     @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

  post      Post     @relation(fields: \[postId\], references: \[id\], onDelete: Cascade)

  @@unique(\[userId, postId\])

}

model ReadingLog {

  id        String   @id @default(uuid())

  userId    String

  postId    String

  readDate  DateTime @default(now()) // Phục vụ tính Daily Quota

  user      User     @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

  post      Post     @relation(fields: \[postId\], references: \[id\], onDelete: Cascade)

  @@index(\[userId, readDate\])

}

model Subscription {

  id             String           @id @default(uuid())

  userId         String

  tier           SubscriptionTier

  gateway        GatewayType

  startDate      DateTime         @default(now())

  endDate        DateTime

  isActive       Boolean          @default(true)

  subscriptionId String?

  user           User             @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

}

model PaymentTransaction {

  id            String            @id @default(uuid())

  userId        String

  amount        Float

  currency      String            // VND, USD, EUR, JPY, KRW, TWD, CNY

  gateway       GatewayType

  transactionId String            @unique // SePay Memo hoặc Lemon Squeezy Order ID

  status        TransactionStatus @default(PENDING)

  payloadJson   String?

  createdAt     DateTime          @default(now())

  user          User              @relation(fields: \[userId\], references: \[id\])

}

model PlatformSetting {

  id           String   @id @default(uuid())

  settingKey   String   @unique

  settingValue String   // JSON chuỗi cấu hình động

  updatedAt    DateTime @updatedAt

}

---

## 5\. ĐA NGÔN NGỮ, ĐA TIỀN TỆ & ĐỊNH TUYẾN THANH TOÁN (PPP LOCALIZATION)

### 5.1. Cơ chế Khóa Tiền tệ theo IP (Currency Lock)

* **Nguyên tắc**: Ngôn ngữ giao diện (UI Localization) có thể tùy chọn độc lập qua Header Dropdown, nhưng **Đồng tiền thanh toán (Billing Currency) bị khóa cứng theo địa chỉ IP của Client tại thời điểm Request**.  
* **Định tuyến cổng thanh toán (Payment Routing)**:  
  * IP Việt Nam (`country_code == 'VN'`): Định tuyến qua **SePay**, thanh toán bằng **VNĐ** qua quét mã VietQR.  
  * IP Quốc tế (`country_code != 'VN'`): Định tuyến qua **Lemon Squeezy**, tự động áp dụng giá theo đồng tiền khu vực (USD, EUR, JPY, KRW, TWD, CNY).

                                  \[Client Request\]

                                         │

                                         ▼

                            \[Server Edge Middleware\]

                                         │

                           Trích xuất IP & GeoIP Lookup

                                         │

                 ┌───────────────────────┴───────────────────────┐

                 │                                               │

           \[IP Việt Nam (VN)\]                          \[IP Quốc Tế (Non-VN)\]

                 │                                               │

                 ▼                                               ▼

         • Tiền tệ: VND                                  • Tiền tệ: USD / EUR / JPY / ...

         • Bảng giá: Chuẩn Base                          • Bảng giá: PPP Index điều chỉnh

         • Cổng: SePay (VietQR)                          • Cổng: Lemon Squeezy (Cards, Apple Pay)

### 5.2. Bảng Định Giá Đa Quốc Gia Chuẩn Hóa Theo Sức Mua (PPP)

| Thị trường (IP) | Cổng Thanh Toán | Gói Free | Gói Plus (1 Năm) | Gói Pro (1 Năm) | Ghi chú Sức mua (PPP) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Việt Nam (`VN`)** | **SePay (VietQR)** | 0 VNĐ | **299.000 VNĐ** | **499.000 VNĐ** | *Thị trường cơ sở (Base)* |
| **Mỹ (`US`)** | Lemon Squeezy | $0 | **$49** | **$89** | Sức mua cao nhất (\~ x4 lần VN) |
| **Châu Âu (`EU`)** | Lemon Squeezy | 0 € | **39 €** | **75 €** | Sức mua cao (\~ x3.5 lần VN) |
| **Nhật Bản (`JP`)** | Lemon Squeezy | 0 ¥ | **4.980 ¥** | **8.980 ¥** | Sức mua cao (\~ x2.5 lần VN) |
| **Hàn Quốc (`KR`)** | Lemon Squeezy | 0 ₩ | **45.000 ₩** | **79.000 ₩** | Sức mua cao (\~ x2.5 lần VN) |
| **Đài Loan (`TW`)** | Lemon Squeezy | 0 NT$ | **899 NT$** | **1.599 NT$** | Sức mua trung bình cao (\~ x2 lần VN) |
| **Trung Quốc (`CN`)** | Lemon Squeezy | 0 ¥ | **149 ¥** | **259 ¥** | Sức mua trung bình (\~ x1.5 lần VN) |
| **Quốc tế khác (`DEFAULT`)** | Lemon Squeezy | $0 | **$39** | **$69** | Mức giá tiêu chuẩn toàn cầu |

---

## 6\. KIỂM SOÁT HẠN MỨC ĐỌC & SERVER-SIDE PAYWALL

### 6.1. Hạn mức Truy cập Phân cấp

1. **Khách vãng lai (Chưa đăng nhập):**  
   * Được xem danh sách toàn bộ các thẻ vuông ở trang chủ để tối ưu SEO.  
   * Khi vào trang chi tiết: Server chỉ trả về `academicFormula`, `summarySnippet` và 30% nội dung đầu của `fullContent`. Phần còn lại bị cắt tại Server và trả về Component `<PaywallGate state="AUTH_REQUIRED" />`.  
2. **Người dùng gói FREE (Đã đăng nhập):**  
   * Đọc tối đa **10 bài Free/ngày** (Tính theo số bản ghi trong bảng `ReadingLog` 24 giờ gần nhất).  
   * Khi mở bài thuộc cấp độ `MEMBER_PLUS` hoặc `MEMBER_PRO` $\\rightarrow$ Trả về `<PaywallGate state="UPGRADE_REQUIRED" />`.  
3. **Người dùng gói PLUS:**  
   * Truy cập toàn bộ bài `FREE` và `MEMBER_PLUS`.  
   * Hạn mức: Tối đa **25 bài/ngày**.  
4. **Người dùng gói PRO:**  
   * Toàn quyền truy cập không giới hạn toàn bộ kho tri thức chuyên sâu của cả 3 trụ cột.

### 6.2. Bảo Vệ Dữ Liệu & Chống Scraping

* Bảo vệ giao diện: Chặn bôi đen sao chép hàng loạt bằng CSS `user-select: none;` trên các khối nội dung phân tích chuyên sâu.  
* Bảo vệ API: Rate Limiting qua Cloudflare / Redis (Tối đa 30 requests / 10 giây đối với các endpoint đọc nội dung).

---

## 7\. QUẢN TRỊ CMS & VẬN HÀNH HỆ THỐNG

1. **TipTap Editor Chuyên Sâu:**  
   * Thiết kế giao diện soạn thảo tùy biến hỗ trợ: Khối công thức toán học/logic, trích dẫn học thuật (Blockquote chuẩn APA), khối nhúng mã sơ đồ SVG và tùy chọn kích thước thẻ vuông (`displaySize`).  
2. **Batch Import CSV (PapaParse):**  
   * Cho phép Admin tải lên hàng loạt bài viết / mô hình tư duy từ file CSV.  
   * Xác thực dữ liệu chặt chẽ qua Zod Schema trước khi thực hiện ghi hàng loạt qua `POST /api/admin/posts/batch`.  
3. **Cấu Hình Toàn Cục Động (`PlatformSetting`):**  
   * Lưu trữ các thiết lập: Tên thương hiệu, mã màu đại diện 3 trụ cột, cấu hình tích hợp API.  
   * Áp dụng cơ chế cache `unstable_cache` tại layout root với thời gian revalidation 3600 giây.

---

## 8\. KẾ HOẠCH TRIỂN KHAI THEO SPRINT (SPRINT ROADMAP 0 $\\rightarrow$ 5\)

| Sprint | Tên Sprint & Mục Tiêu | Trọng Tâm Kỹ Thuật | Trạng Thái |
| :---: | :---- | :---- | :---: |
| **Sprint 0** | **Kiến trúc CSDL & Prisma ORM** | PostgreSQL, Prisma Schema, Migration, Seed Data 3 trụ cột | 🟡 **SẴN SÀNG** |
| **Sprint 1** | **Xác thực Đăng nhập Email OTP** | Resend API, JWT/Session, HTTP-only Cookie, RBAC Middleware | ⚪ Chờ thực hiện |
| **Sprint 2** | **CMS Bài viết & Lưới Thẻ Vuông Động** | CRUD Post API, TipTap HTML Sanitize, Dynamic Modular Grid | ⚪ Chờ thực hiện |
| **Sprint 3** | **Server Paywall, Quota & Tủ Sách** | Server-side Content Truncation, Daily ReadingLog, Bookmarks | ⚪ Chờ thực hiện |
| **Sprint 4** | **Cổng Thanh Toán PPP Đa Quốc Gia** | GeoIP Middleware, Webhook HMAC Security, VietQR SePay | ⚪ Chờ thực hiện |
| **Sprint 5** | **Tối Ưu Hiệu Năng & Production** | Redis ISR Cache, Zod Validation, Rate Limit, Vercel Deploy | ⚪ Chờ thực hiện |

---

### Danh Mục Nhiệm Vụ Kỹ Thuật Chi Tiết

#### 🟡 SPRINT 0: Kiến Trúc CSDL & Khởi Tạo Prisma ORM

- [ ] Cài đặt `@prisma/client` và `prisma` (devDependencies).  
- [ ] Thiết lập `prisma/schema.prisma` theo đúng cấu trúc tại Mục 4\.  
- [ ] Khởi tạo singleton client `src/lib/prisma.ts`.  
- [ ] Thực hiện Migration: `npx prisma migrate dev --name init_think_and_rich`.  
- [ ] Xây dựng script `prisma/seed.ts` nạp sẵn 12 bài viết mẫu đại diện cho 3 trụ cột:  
      * 4 bài Mô hình tư duy (First Principles, Inversion, Second-Order Thinking, Hanlon's Razor).  
      * 4 bài Chiến lược kinh doanh (Flywheel Effect, 7 Powers, Blitzscaling, Platform Defensibility).  
      * 4 bài Ý tưởng khởi nghiệp (Regulatory Tech SaaS, AI Compliance Engine, Vertical ERP, Cross-border Logistics).

#### ⚪ SPRINT 1: Xác Thực Người Dùng Thật (Email OTP Engine)

- [ ] Cấu hình `resend` SDK gửi email mã OTP 6 số theo mẫu thương hiệu Think & Rich.  
- [ ] Xây dựng API Route `POST /api/auth/send-otp` (tạo mã hết hạn trong 10 phút, lưu mã hóa vào DB).  
- [ ] Xây dựng API Route `POST /api/auth/verify-otp` (xác thực OTP, tạo User, cấp JWT lưu vào `HTTP-only Cookie`).  
- [ ] Xây dựng API Route `POST /api/auth/logout` và `GET /api/auth/me`.  
- [ ] Viết `src/middleware.ts` bảo vệ các route `/admin` (RBAC) và `/profile`.

#### ⚪ SPRINT 2: Quản Lý Nội Dung & Hệ Thống Thẻ Vuông Size Động

- [ ] Xây dựng API `GET /api/posts` (hỗ trợ lọc 3 `pillar`, tìm kiếm, phân trang, lấy thẻ theo `displaySize`).  
- [ ] Xây dựng TipTap Editor phía Admin hỗ trợ nhập công thức, mã SVG sơ đồ và gắn nhãn thẻ vuông (`SQUARE_SM`, `SQUARE_MD`, `SQUARE_LG`).  
- [ ] Xây dựng giao diện Frontend theo cấu trúc **Dynamic Modular Square Bento Grid**.  
- [ ] Tích hợp `dompurify` / `sanitize-html` phía server để làm sạch nội dung bài viết.

#### ⚪ SPRINT 3: Kiểm Soát Hạn Mức Đọc & Tủ Sách Cá Nhân

- [ ] Xây dựng Server Action kiểm tra quyền đọc bài viết:  
      * Khách chưa đăng nhập: Cắt ngắn còn 30% nội dung \+ trả về `AUTH_REQUIRED`.  
      * Khách Free: Kiểm tra quota đọc trong ngày qua `ReadingLog` ($\\le 10$ bài/ngày).  
      * Khách Plus: Cho phép đọc bài `MEMBER_PLUS` ($\\le 25$ bài/ngày).  
      * Khách Pro: Đọc toàn bộ không giới hạn.  
- [ ] Xây dựng API Tủ sách: `POST /api/library/bookmark` và `GET /api/library/bookmarks`.  
- [ ] Ghi nhận nhật ký đọc vào `ReadingLog` khi mở bài chi tiết.

#### ⚪ SPRINT 4: Cổng Thanh Toán PPP (SePay & Lemon Squeezy)

- [ ] Xây dựng middleware nhận diện quốc gia từ IP (`x-user-country`).  
- [ ] Tích hợp **SePay** cho IP Việt Nam: Sinh mã thanh toán VietQR với memo `TR<USER_ID>_<TIMESTAMP>`, lắng nghe Webhook `POST /api/webhooks/billing?gateway=sepay`.  
- [ ] Tích hợp **Lemon Squeezy** cho IP Quốc tế: Khởi tạo Checkout URL với mức giá PPP tương ứng, xác thực chữ ký Webhook HMAC SHA-256 (`x-signature`).  
- [ ] Tự động cập nhật `subscriptionTier` và gia hạn 365 ngày khi thanh toán thành công.

#### ⚪ SPRINT 5: Tối Ưu Hóa, Bảo Mật & Đóng Gói Triển Khai

- [ ] Thiết lập Next.js Incremental Static Regeneration (ISR) với `revalidate = 1800` cho các bài viết.  
- [ ] Áp dụng Zod Schema để validate toàn bộ request parameters.  
- [ ] Cấu hình Cloudflare WAF, Bot Fight Mode và Rate Limiting.  
- [ ] Cấu hình biến môi trường và triển khai ứng dụng lên Production (Vercel \+ Supabase/Neon PostgreSQL).

