# Thanh toán — trạng thái và việc còn lại

*Cập nhật 2026-08-26. Tạm dừng ở đây để ưu tiên responsive + nội dung.*

Chiến lược đã chốt: **SePay cho Việt Nam, Paddle cho quốc tế.** Một quy tắc tính giá dùng chung, hai cách thu tiền.

---

## Đã xong

### Nâng cấp giữa kỳ PLUS → PRO (thị trường VN)

Chạy được trọn vòng, đã kiểm chứng end-to-end.

| Thành phần | Ở đâu |
|---|---|
| Công thức bù trừ (đường cong bậc 2) | `src/lib/upgrade-pricing.ts` |
| Báo giá + tạo đơn | `src/app/api/upgrade/route.ts` |
| Modal hiển thị cho khách | `src/components/upgrade/UpgradeModal.tsx` |
| Cấp tier sau khi tiền về | `src/app/api/webhooks/billing/route.ts` |
| Kỳ hạn gói | `users.plan_started_at` / `plan_expires_at` |

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

### Hai thứ chắn đường

1. **Chưa có tài khoản Paddle / credentials sandbox.** Đây là đường tiền — viết code gọi API thanh toán chỉ dựa trên đọc tài liệu là đúng cách sinh ra loại lỗi thu sai tiền.

2. **Chưa quyết mô hình vòng đời.** Paddle Billing xoay quanh subscription tự gia hạn; sản phẩm hiện bán gói 1 năm mua đứt.

   > **Câu hỏi cần trả lời trước tiên: khách quốc tế có thành subscription tự gia hạn hàng năm không?**
   >
   > Câu trả lời quyết định cả schema lẫn cách webhook xử lý. Đoán sai là làm lại từ đầu.

### Khi bắt đầu, làm theo thứ tự này

1. Mở tài khoản Paddle + sandbox. Cần website có đủ Terms, Privacy, Pricing — repo đã có cả ba.
2. Thêm `"paddle"` vào enum `gateway` trong `src/db/schema.ts`. Cột là `text` thường, **không ràng buộc CHECK ở DB**, nên chỉ là một dòng TypeScript.
3. Bảng mới cho trạng thái subscription Paddle — **không đụng gì tới `users` hay luồng VN**.
4. Nhánh webhook mới, xác thực chữ ký của Paddle.
5. Nâng cấp: `proration_billing_mode: "do_not_bill"` + one-time charge với số tiền tự tính.
6. Gỡ Lemon Squeezy: `src/lib/lemonsqueezy.ts`, nhánh LS trong `checkout/route.ts` và `webhooks/billing/route.ts`, 5 biến `LEMONSQUEEZY_*`.

### ⚠️ Tuyệt đối không dùng proration sẵn có của Paddle

Paddle tính **tuyến tính theo thời gian**. Dùng nó là vứt bỏ đường cong bậc 2 — thứ sinh ra để chặn arbitrage nâng cấp sớm.

Thiệt hại đo được ở giá VN:

| Đã dùng | Paddle tuyến tính | Đường cong | Chênh |
|---|---:|---:|---:|
| 1 tháng | 224.575₫ | 249.239₫ | **+24.664₫** |
| 6 tháng | 349.090₫ | 418.857₫ | **+69.767₫** |
| 11 tháng | 473.605₫ | 494.942₫ | **+21.337₫** |

Mất nhiều nhất ở giữa kỳ — đúng chỗ khách hay nâng cấp nhất.

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

- **Đường cong `M(x)` phải clamp CẢ ĐẦU VÀO về [0, 12]**, không chỉ đầu ra về [0, 1]. Parabol đạt đỉnh ở x≈12,55 rồi đi xuống, âm từ x≈25,6 — chỉ clamp đầu ra thì gói PLUS giữ 2 năm được hoàn 100%.
- **`plan_expires_at` được ghi nhưng CHƯA dùng để chặn truy cập.** Bật enforcement là tính năng riêng (gia hạn, thông báo trước hạn, hội viên hết hạn thấy gì) và bật ngay sẽ cắt quyền của mọi hội viên chưa có dấu thời gian.
- **`orders.amount` là INTEGER đơn vị hiển thị** (49 cho $49, 299000 cho ₫299.000 — *không* phải cent, dù comment trong schema nói vậy). Mọi đồng tiền làm tròn về đơn vị nguyên; xem `CURRENCY_DECIMALS`.
- **Tier chỉ được cấp bởi webhook**, không bao giờ lúc tạo đơn.

---

## Chạy thử ở máy local

```bash
npm run dev                                    # http://localhost:3000/admin
npm run otp -- thankful.to.all.88@gmail.com    # local không gửi được email thật
```
