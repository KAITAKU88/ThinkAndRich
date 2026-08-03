# HỒ SƠ KIẾN TRÚC HỆ THỐNG (SYSTEM BLUEPRINT)
**Dự án:** Nền tảng Ý tưởng Khởi nghiệp Toàn cầu (Global Startup Ideas Platform)
**Mục đích tài liệu:** Cung cấp context, cấu trúc và yêu cầu kỹ thuật chi tiết cho các AI Agent (Frontend & Backend) để tự động hóa quá trình lập trình.

---

## 1. NGĂN XẾP CÔNG NGHỆ (TECH STACK)
Yêu cầu AI Agent sử dụng chính xác các công nghệ sau trong quá trình khởi tạo dự án:
- **Core Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript (Strict mode).
- **Styling:** Tailwind CSS + CSS Variables (để phục vụ cấu hình màu sắc động).
- **UI Components:** Shadcn UI (ưu tiên) hoặc Radix UI (chỉ cài các component cần thiết).
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth, Storage).
- **ORM:** Prisma.
- **Thanh toán:** Stripe (Global) & Sepay API (Việt Nam).
- **Hạ tầng & Mạng:** Vercel (Deployment) + Cloudflare (DNS, CDN, WAF, Bot Protection).
- **Thư viện phụ trợ:**
  - `tiptap/react`: Rich text editor cho Admin.
  - `papaparse`: Xử lý import CSV phía client.
  - `recharts`: Vẽ biểu đồ cho Admin Dashboard và User Profile.
  - `resend`: Gửi Transactional Email.
  - `zustand`: Quản lý Global State (nếu cần).

---

## 2. CẤU TRÚC CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
*AI Agent (Backend/DB) hãy sử dụng cấu trúc Prisma schema dưới đây để khởi tạo cơ sở dữ liệu.*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum SubscriptionTier {
  FREE
  PREMIUM
  SUPER
}

model User {
  id               String           @id @default(uuid())
  email            String           @unique
  name             String?
  role             Role             @default(USER)
  subscriptionTier SubscriptionTier @default(FREE)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  favorites        Favorite[]
  transactions     Transaction[]
  subscriptions    Subscription?
}

model Idea {
  id               String      @id @default(uuid())
  title            String
  shortDescription String
  fullContent      String      // HTML content từ Tiptap
  thumbnailUrl     String?
  category         String
  status           String      @default("PUBLISHED") // DRAFT, PUBLISHED
  isPremiumOnly    Boolean     @default(true) // Ý tưởng cho Super member
  
  // SEO Metadata
  seoTitle         String?
  seoDescription   String?
  seoImage         String?

  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  
  favorites        Favorite[]
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String
  ideaId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  idea      Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)

  @@unique([userId, ideaId])
}

model Subscription {
  id        String           @id @default(uuid())
  userId    String           @unique
  tier      SubscriptionTier
  startDate DateTime         @default(now())
  endDate   DateTime?
  isActive  Boolean          @default(true)

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Transaction {
  id            String   @id @default(uuid())
  userId        String
  amount        Float
  currency      String   // USD, VND
  gateway       String   // STRIPE, SEPAY
  transactionId String   @unique // ID từ cổng thanh toán
  status        String   // SUCCESS, PENDING, FAILED
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id])
}

model AppSetting {
  id          String   @id @default(uuid())
  settingKey  String   @unique
  settingValue String  // Lưu dưới dạng JSON chuỗi (ví dụ: {"primaryColor": "#ff0000", "brandName": "Startup Ideas"})
  updatedAt   DateTime @updatedAt
}
```

---

## 3. LUỒNG XỬ LÝ (CORE WORKFLOWS) CẦN AI AGENT LẬP TRÌNH

### 3.1. Authentication Flow (Passwordless)
- Sử dụng **Supabase Magic Link**.
- **Yêu cầu UI:** Trang đăng nhập chỉ có 1 ô nhập Email và nút "Gửi mã đăng nhập", kèm nút "Login with Google/Facebook".
- **Luồng:** Nhập Email -> Supabase gửi link/OTP qua Email -> Click link -> Đăng nhập thành công, tạo session lưu vào Cookie.

### 3.2. Paywall & SEO Strategy (Rất quan trọng)
- **Trang danh sách (Home/Explore):**
  - Fetch dữ liệu bằng React Server Components (RSC) để Google Bot index.
  - Hiển thị Grid/List cards: Hình ảnh, Tiêu đề, Short Description.
  - Có phân trang bình thường (Pagination), KHÔNG khóa các trang sau. Mọi user và Bot đều xem được toàn bộ danh sách card.
- **Trang chi tiết (Detail Page):**
  - Check Authentication và `subscriptionTier` trên Server.
  - Nếu là khách (Chưa đăng nhập) hoặc `FREE`: Render Tiêu đề, Short Description, và một component `<PaywallCTA />` che phần `fullContent`.
  - Nếu là `PREMIUM/SUPER`: Render toàn bộ `fullContent`.
  - *Lưu ý cho AI:* Trả về HTTP status 200 cho cả Free và Premium để SEO không bị gãy, Bot vẫn đọc được Title và Meta Data.

### 3.3. Payment & Webhooks
- **Stripe (Khách Quốc tế):**
  - Call Stripe API tạo Checkout Session.
  - Setup `/api/webhooks/stripe` để lắng nghe sự kiện `checkout.session.completed`.
  - Cập nhật tier cho bảng `Subscription` và ghi log vào `Transaction`.
- **Sepay (Khách Việt Nam):**
  - Hiển thị ảnh QR Code chuyển khoản theo format Sepay.
  - Setup `/api/webhooks/sepay` lắng nghe thông báo số dư.
  - Map cú pháp chuyển khoản với `userId` để cập nhật `Subscription`.
- **Hậu thanh toán:** Kích hoạt trigger gửi email chào mừng qua Resend.

### 3.4. Dynamic Global Settings (Không Hardcode)
- Các biến như `Brand Name`, `Primary Color`, `SEO Default Title` được lấy từ bảng `AppSetting`.
- **Lưu ý hiệu năng:** Cache query lấy AppSetting tại layout root (dùng Next.js `unstable_cache` hoặc `fetch` với `{ next: { revalidate: 3600 } }`).
- Cấu hình màu sắc trên UI bằng cách bind inline CSS variables vào thẻ `<body>`: `style={{ "--primary": settings.primaryColor }}` để Tailwind (`bg-primary`) nhận diện động.

### 3.5. Admin Dashboard & Quản lý nội dung
- **Import CSV:** Sử dụng component chứa `<input type="file" />`. Đọc qua thư viện `papaparse`. Validate số lượng cột, sau đó gọi `POST /api/admin/ideas/batch` đẩy dữ liệu vào Database.
- **Tiptap Editor:** Tích hợp bộ công cụ (Bold, Italic, Link, Image, Text Color). Data xuất ra HTML string, lưu vào cột `fullContent`.
- **Thống kê:** Viết các query group by theo ngày tháng để lấy dữ liệu (số user đăng ký mới, số giao dịch). Truyền vào `<LineChart>` và `<BarChart>` của Recharts.

---

## 4. TỐI ƯU VÀ BẢO MẬT VỚI CLOUDFLARE
*Các thiết lập này thực hiện ngoài code, nhưng AI Agent cần đảm bảo Header phản hồi chuẩn.*
- Bật **Bot Fight Mode** trong Cloudflare dashboard.
- **Rate Limiting:** Setup Rule giới hạn IP gọi quá 20 requests / 10 giây vào route `/api/ideas` để chống cào dữ liệu (Anti-scraping).
- **Bảo vệ UI cơ bản:** Trong file `globals.css`, áp dụng class chặn copy/bôi đen cho khu vực nội dung premium: 
  `.premium-content { user-select: none; -webkit-user-select: none; }`
- Chặn Context Menu chuột phải bằng event `onContextMenu={(e) => e.preventDefault()}` (Chỉ áp dụng lớp cơ bản, không lạm dụng gây trải nghiệm xấu).

---

## 5. HƯỚNG DẪN PROMPT CHO AI AGENTS TRONG QUÁ TRÌNH LẬP TRÌNH
Để làm việc hiệu quả với các AI coding (Cursor, GitHub Copilot, ChatGPT), hãy copy/paste nội dung bên dưới khi bắt đầu:

> *"Tôi muốn khởi tạo dự án Next.js bám sát theo tài liệu Blueprint. Vui lòng thiết lập Next.js 14 App router, Tailwind CSS. Sau đó khởi tạo file schema.prisma theo đúng cấu trúc cung cấp. Tiếp theo, tạo layout root lấy cấu hình động từ database. Mỗi lần chỉ làm 1 bước, xong chờ tôi phản hồi."*
