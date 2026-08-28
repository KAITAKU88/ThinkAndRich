# Thanh toán — trạng thái và việc còn lại

*Cập nhật 2026-08-26, ghi chú lại 2026-08-28 sau khi đổi mô hình định giá.*

Chiến lược cổng thanh toán vẫn giữ nguyên: **SePay cho Việt Nam, Paddle cho quốc tế.** Nhưng **cái được bán đã đổi** — xem `CREDIT_PRICING_MODEL.md`: không còn "nâng cấp tier" (FREE→PLUS→PRO), giờ là **mua gói credit** (3 gói bulk-discount, không có khái niệm proration giữa kỳ vì credit chỉ cộng dồn, không "nâng cấp" từ mức này sang mức khác).

---

> ⚠️ **Phần dưới đây mô tả hạ tầng cho mô hình tier cũ — phần lớn đã lỗi thời.** Cơ chế thu tiền (VietQR, HMAC webhook, cấu hình admin) vẫn tái sử dụng được nguyên vẹn cho việc bán gói credit; phần **tính giá theo tier và proration thì không còn áp dụng**. Đánh dấu rõ ở từng mục bên dưới.

## Đã xong (hạ tầng thu tiền — vẫn dùng được)

### ~~Nâng cấp giữa kỳ PLUS → PRO (thị trường VN)~~ — LỖI THỜI, không còn khái niệm "nâng cấp tier"

Chạy được trọn vòng, đã kiểm chứng end-to-end **cho mô hình tier cũ**. Dưới mô hình credit, mua thêm credit chỉ là cộng dồn số dư — không có 2 mức để "bù trừ" giữa chúng, nên toàn bộ đường cong bậc 2 này **không cần port sang** mô hình mới:

| Thành phần | Ở đâu | Số phận dưới mô hình credit |
|---|---|---|
| Công thức bù trừ (đường cong bậc 2) | `src/lib/upgrade-pricing.ts` | Xoá — không còn "nâng cấp" để tính bù trừ |
| Báo giá + tạo đơn | `src/app/api/upgrade/route.ts` | Thay bằng route mua gói credit |
| Modal hiển thị cho khách | `src/components/upgrade/UpgradeModal.tsx` | Thay bằng modal mua credit |
| Cấp tier sau khi tiền về | `src/app/api/webhooks/billing/route.ts` | Đổi logic: cộng credit + đặt lại hạn 365 ngày, thay vì gán tier |
| Kỳ hạn gói | `users.plan_started_at` / `plan_expires_at` | Đổi thành `paid_credit_balance` / `paid_credit_expires_at` |

### Cấu hình thanh toán trong admin

Tab **Cấu hình Thanh toán** — mã ngân hàng, tên hiển thị, số tài khoản, tên chủ tài khoản. Sửa xong dùng ngay, không cần deploy. Thiếu bất kỳ ô nào thì trang thanh toán **không vẽ mã QR**.

### Mã đối soát chuyển khoản

`TNR7K2M9XBC` — 11 ký tự, không dấu câu, không có `0/O` và `1/I/L`. Webhook đọc được cả khi ngân hàng chèn chữ, bỏ dấu câu, hay viết thường.

---

## Việc còn lại — Việt Nam

Không cần viết thêm code. Đây là việc cấu hình và nghiệm thu.

- [ ] **Điền tài khoản ngân hàng thật** trong tab Cấu hình Thanh toán
- [ ] **Chạy migration production** — `npm run deploy` KHÔNG tự chạy migration
      ```
      npx wrangler d1 migrations apply thinkandrich-db --remote
      ```
      Migration `0006` có backfill ghi vào bảng `users` thật. Nên `wrangler d1 export` vào `.backups/` trước.
- [ ] **Đặt `SEPAY_WEBHOOK_SECRET` production** — hiện vẫn là placeholder trong `.dev.vars` và chưa hề set remote
      ```
      npx wrangler secret put SEPAY_WEBHOOK_SECRET
      ```
- [ ] **Trỏ webhook SePay** về `https://thinkandrich.ankiva.cc/api/webhooks/billing?gateway=sepay`
- [ ] **Chuyển thử một khoản nhỏ thật** để nghiệm thu toàn tuyến

---

## Việc còn lại — Quốc tế (Paddle)

**Chưa bắt đầu, có chủ đích.** Thiếu hai thứ, không có chúng thì mọi dòng code đều là phỏng đoán không kiểm chứng được.

### Hai thứ chắn đường (nay chỉ còn 1)

1. **Chưa có tài khoản Paddle / credentials sandbox.** Đây là đường tiền — viết code gọi API thanh toán chỉ dựa trên đọc tài liệu là đúng cách sinh ra loại lỗi thu sai tiền. *(Vẫn còn chắn đường.)*

2. ~~Chưa quyết mô hình vòng đời.~~ **Đã tự giải quyết nhờ mô hình credit (2026-08-28).** Câu hỏi cũ "khách quốc tế có thành subscription tự gia hạn hàng năm không?" không còn ý nghĩa: mua credit luôn là **giao dịch một lần** (mua đứt N credit), không có khái niệm gia hạn subscription tự động. Paddle chỉ cần dùng ở chế độ **one-time checkout** cho từng gói credit — không cần Paddle Billing/subscription object nào cả, đơn giản hơn nhiều so với lo ngại ban đầu.

### Khi bắt đầu, làm theo thứ tự này

1. Mở tài khoản Paddle + sandbox. Cần website có đủ Terms, Privacy, Pricing — repo đã có cả ba.
2. Thêm `"paddle"` vào enum `gateway` trong `src/db/schema.ts`. Cột là `text` thường, **không ràng buộc CHECK ở DB**, nên chỉ là một dòng TypeScript.
3. Checkout one-time cho từng gói credit (không cần bảng subscription riêng — không có gì để theo dõi vòng đời ngoài `paid_credit_balance`/`paid_credit_expires_at` đã có trên `users`).
4. Nhánh webhook mới, xác thực chữ ký của Paddle — khi thanh toán xong: cộng credit vào `paid_credit_balance`, đặt lại `paid_credit_expires_at = now + 365 ngày`.
5. Gỡ Lemon Squeezy: `src/lib/lemonsqueezy.ts`, nhánh LS trong `checkout/route.ts` và `webhooks/billing/route.ts`, 5 biến `LEMONSQUEEZY_*`.

### ~~⚠️ Tuyệt đối không dùng proration sẵn có của Paddle~~ — không còn áp dụng

Toàn bộ mục này (đường cong bậc 2, bảng thiệt hại đo được ở giá VN) chỉ có ý nghĩa khi còn khái niệm "nâng cấp giữa kỳ từ PLUS lên PRO". Mô hình credit không có tier để nâng cấp — mua thêm credit chỉ là cộng dồn số dư — nên **không có gì cần proration nữa**, ở cả SePay lẫn Paddle. Giữ lại đoạn này trong lịch sử file để nhớ lý do quyết định "không dùng proration của Paddle" từng được đưa ra, dù bản thân vấn đề đã biến mất.

---

## Các phương án đã cân nhắc và loại — đừng bàn lại

**Lemon Squeezy** — checkout tính tiền theo variant giá cố định, không thu được số tiền bù trừ. Hai cách lách:
- `custom_price` trên variant "pay what you want": **loại**, vì PWYW để ô giá cho khách **tự sửa được**, đặt sàn 0 là ai cũng lấy PRO miễn phí.
- Mã giảm giá động dùng một lần: khả thi, nhưng LS đã bị Stripe mua (4/2024) và tháng 1/2026 nhà sáng lập xác nhận đang xây đường di trú sang Stripe Managed Payments — công sức bỏ vào LS có hạn sử dụng.

**Đưa cả thị trường VN qua Paddle** (để Paddle lo VAT Việt Nam) — **loại**, ba lý do:
- Paddle hỗ trợ VND nhưng **không có VietQR, không có MoMo**, trong khi QR chiếm **hơn một nửa** giao dịch tại VN.
- Phí `5% + $0,50` ở mức giá VN thành **~10–12%**, trước khi cộng tầng VAT 10%. VietQR gần như **miễn phí**.
- Dùng merchant-of-record nước ngoài cho giao dịch nội địa là **một cấu trúc thuế khác** (doanh thu xuất khẩu dịch vụ), không phải đơn giản hoá. Việc này phải hỏi kế toán thuế Việt Nam.

---

## Lưu ý kỹ thuật dễ quên

- ~~Đường cong `M(x)` phải clamp CẢ ĐẦU VÀO về [0, 12]...~~ — hết áp dụng cùng với việc xoá proration (xem trên).
- **`plan_expires_at` → `paid_credit_expires_at` sẽ kế thừa đúng cái bẫy tương tự**: phải thật sự dùng để chặn/reset số dư khi hết hạn (mô hình credit coi việc reset về 0 khi hết hạn là chủ đích, khác với tier cũ vốn ghi nhận nhưng chưa từng enforce) — xem mục 5 trong `CREDIT_PRICING_MODEL.md`.
- **`orders.amount` là INTEGER đơn vị hiển thị** (49 cho $49, 299000 cho ₫299.000 — *không* phải cent, dù comment trong schema nói vậy). Mọi đồng tiền làm tròn về đơn vị nguyên; xem `CURRENCY_DECIMALS`. Vẫn đúng nguyên vẹn cho đơn hàng mua gói credit.
- ~~Tier chỉ được cấp bởi webhook, không bao giờ lúc tạo đơn.~~ — đổi thành: **credit chỉ được cộng bởi webhook**, không bao giờ lúc tạo đơn (nguyên tắc giữ nguyên, chỉ đổi cái được cấp).

---

## Chạy thử ở máy local

```bash
npm run dev                                    # http://localhost:3000/admin
npm run otp -- thankful.to.all.88@gmail.com    # local không gửi được email thật
```
