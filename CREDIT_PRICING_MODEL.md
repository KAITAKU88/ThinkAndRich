# Mô Hình Định Giá Theo Credit

Thay thế hoàn toàn mô hình tier (Open/Free/Plus/Pro) hiện tại. Thống nhất qua thảo luận 2026-08-28, ghi đè `new_model.txt`.

## 1. Vì sao đổi

Mô hình tier cố định (4 mức) không phản ánh đúng giá trị từng bài viết — một bài ngắn và một bài chuyên sâu bị tính phí như nhau nếu cùng tier. Chuyển sang định giá theo credit cho từng bài, người dùng trả đúng theo mức họ chọn mở khóa.

Hệ thống hiện chưa có người dùng thật, nên **không cần kế hoạch migrate** tier cũ sang credit — toàn bộ tier/proration/checkout theo tier bị thay thế trực tiếp.

## 2. Định giá bài viết

Admin đặt giá mỗi bài trong khoảng **Open – 5C** khi tạo bài:

| Mức | Nhãn hiển thị | Ý nghĩa | Màu viền thẻ |
|---|---|---|---|
| 0 | **Open** (không ghi "0C") | Đọc tự do, **không cần đăng nhập** | Trắng |
| 1 | 1🟡 | | Xanh lá |
| 2 | 2🟡 | | Xanh dương |
| 3 | 3🟡 | | Tím |
| 4 | 4🟡 | | Vàng |
| 5 | 5🟡 | | Đỏ |

Từ mức 1 trở lên, chữ "C" được thay bằng **biểu tượng đồng tiền vàng chóe** (icon xu, không phải chữ cái) — số + icon, ví dụ "3 [xu vàng]" thay vì "3C". Riêng mức 0 không dùng số/icon, luôn hiển thị chữ **"Open"**.

Bài Open là ngoại lệ duy nhất bỏ qua toàn bộ luồng auth + trừ credit — mọi mức 1-5 đều bắt buộc đăng nhập.

## 3. Trải nghiệm mở khóa bài viết

Khi mở một bài ≥1C, người dùng luôn thấy: tiêu đề, mô tả, lượt đọc, lượt thích. Phần nội dung bên dưới bị che bởi rèm, trên rèm hiển thị số credit sẽ bị trừ và nút "Mở khóa".

- Đủ credit → trừ ngay, rèm được kéo xuống, số credit trên header cập nhật ngay lập tức.
- Không đủ credit → thông báo thiếu credit, mời mua thêm.

## 4. Quyền truy cập sau khi mở khóa

**Mở khóa = xem vĩnh viễn.** Hoàn toàn tách biệt khỏi vòng đời của credit — bài đã mở không bị thu hồi quyền đọc dù credit dùng để mở nó sau này hết hạn. Về data: một bảng nối kiểu `user_unlocks(user_id, post_id, unlocked_at)`, không phụ thuộc số dư hay ngày hết hạn credit.

## 5. Hai loại credit

### Credit mua (paid)

Ba gói, chênh lệch **chỉ ở giá mỗi credit** (chiết khấu theo số lượng) — không còn khác nhau về thời hạn:

| Gói | Credit | Giá (VNĐ, mốc tham chiếu) | Giá/credit |
|---|---|---|---|
| 1 | 1.500 | 150.000₫ | 100₫ |
| 2 | 4.500 | 300.000₫ | 66,7₫ |
| 3 | 10.000 | 500.000₫ | 50₫ |

### Bảng quy đổi theo sức mua tương đương (PPP)

Tái sử dụng đúng hệ số PPP đã dùng cho giá PLUS/PRO trong `src/lib/geo-pricing.ts` (base = VN), áp cùng một hệ số cho cả 3 gói thay vì tính riêng theo từng gói — vì hệ số phản ánh sức mua của *thị trường*, không phải của gói:

| Thị trường | Hệ số PPP (so với VN) | Gói 1 (1.500C) | Gói 2 (4.500C) | Gói 3 (10.000C) |
|---|---|---|---|---|
| 🇻🇳 Việt Nam (base) | x1 | 150.000₫ | 300.000₫ | 500.000₫ |
| 🇺🇸 US (USD) | x4,1 | $25 | $49 | $79 |
| 🇪🇺 EU (EUR) | x3,55 | €19 | €39 | €65 |
| 🇯🇵 Japan (JPY) | x2,78 | ¥2.480 | ¥4.980 | ¥8.480 |
| 🇰🇷 South Korea (KRW) | x2,79 | ₩23.000 | ₩45.000 | ₩75.000 |
| 🇹🇼 Taiwan (TWD) | x2,38 | NT$449 | NT$899 | NT$1.499 |
| 🇨🇳 China (CNY) | x1,73 | ¥75 | ¥149 | ¥249 |
| 🌐 Còn lại (DEFAULT, USD) | x3,26 | $19 | $39 | $65 |

Cách tính: giá VNĐ → quy đổi ra ngoại tệ theo tỷ giá tham chiếu (1 USD≈25.000₫, 1 EUR≈27.200₫, 1 JPY≈167₫, 1 KRW≈18,5₫, 1 TWD≈794₫, 1 CNY≈3.472₫) → nhân hệ số PPP của thị trường → làm tròn về mức giá "đẹp" theo thói quen địa phương (USD/EUR/CNY/TWD tận cùng bằng 9, JPY/KRW tận cùng bằng số tròn trăm/nghìn). Hệ số PPP suy ra từ chính tỷ lệ giữa giá PLUS 299.000₫ và giá PLUS đã niêm yết ở từng thị trường trong `geo-pricing.ts` — nên **Gói 2 (300.000₫, gần bằng giá PLUS 299.000₫) quy đổi ra gần khớp với giá PLUS hiện có ở mọi thị trường** ($49, €39, ¥4.980, ₩45.000, NT$899, ¥149, $39) — một phép kiểm tra chéo cho thấy hệ số hợp lý.

Tỷ giá tham chiếu cần cập nhật định kỳ (không phải giá trị cố định vĩnh viễn) — đây là mốc tại thời điểm viết tài liệu, không phải tỷ giá live.

**Quy tắc kỳ hạn:**
- Mỗi lần mua thêm (bất kỳ gói nào), credit **cộng dồn** vào số dư hiện có.
- Kỳ hạn của **toàn bộ số dư** luôn được đặt lại thành **365 ngày kể từ lần mua gần nhất** — không phân biệt gói nhỏ hay lớn, không so sánh kỳ hạn cũ/mới.
- Hết 365 ngày mà không mua thêm → toàn bộ số dư **reset về 0**. Đây là chủ đích: tương tự gói Plus/Pro trả phí không dùng hết trong kỳ hạn cũng mất, không phải lỗi nền tảng.
- Hệ quả chấp nhận được: một số dư lớn có thể được gia hạn bằng một giao dịch nhỏ (mua gói 1) ngay trước hạn. Coi đây là "giao dịch tối thiểu hàng năm bắt buộc" — doanh thu phát sinh đều đặn với chi phí biên gần như bằng 0, không phải lỗ hổng cần vá.

**Data model** (khái niệm, không cần bảng lô riêng theo từng lần mua):
- `paid_credit_balance` — số nguyên, cộng dồn mỗi lần mua.
- `paid_credit_expires_at` — timestamp, luôn ghi đè thành `now + 365 ngày` mỗi lần mua.

Không cần theo dõi từng lô mua kèm hạn riêng (khác cách Lovable.dev làm với top-up credit — họ có hạn riêng 12 tháng cho từng lô và chi tiêu ưu tiên theo lô gần hết hạn nhất). Ở đây chỉ một cặp số dư + một hạn dùng chung, đơn giản hơn nhiều.

### Credit tặng (gift)

Mô phỏng theo cơ chế daily credit của Lovable.dev:

- Cấp **5C mỗi ngày**, reset lúc 00:00 — không dùng hết trong ngày thì mất, **không rollover** sang hôm sau.
- Trần cộng dồn **30C/tháng** — đạt trần thì ngừng cấp tới đầu tháng sau, dù vẫn đang trong ngày mới.
- Không mua bán, không sang nhượng.

## 6. Thứ tự trừ credit khi mở khóa bài

Luôn trừ **credit tặng trước**, hết mới trừ sang **credit mua**. Vì credit tặng hết hạn cuối ngày (phí nếu để dư), ưu tiên tiêu nó trước là hợp lý cho cả người dùng lẫn hệ thống.

## 7. Trang Usage — hiển thị theo kỳ hạn hiện tại

Không phải thống kê trọn đời, chỉ phản ánh kỳ 365 ngày đang hoạt động:

- Tổng credit đã mua (số dư đang có, gồm cả phần cộng dồn từ các lần mua trước trong kỳ này)
- Credit tặng còn lại hôm nay (+ tiến độ so với trần 30C/tháng)
- Tổng credit đã dùng trong kỳ hiện tại
- Đếm ngược số ngày còn lại tới khi credit mua hết hạn — reset về 365 mỗi lần mua thêm

## 8. Ảnh hưởng tới kiến trúc hiện có

Thay thế hoàn toàn, không phải mở rộng thêm:

- Bỏ tier `OPEN/FREE/PLUS/PRO` và mọi logic gate theo tier.
- Bỏ đường cong proration PLUS→PRO (`src/lib/upgrade-pricing.ts`) và toàn bộ luồng "nâng cấp tier" — không còn khái niệm nâng cấp, chỉ có "mua thêm credit".
- Checkout chuyển từ "mua tier" sang "mua gói credit" (SePay cho VN, Paddle cho quốc tế — chiến lược gateway giữ nguyên, chỉ đổi cái được bán).
- `users.plan_started_at/plan_expires_at` được thay bằng `paid_credit_balance`/`paid_credit_expires_at` như mô tả ở mục 5.
- Tài liệu `new_model.txt` gốc coi như lỗi thời, nội dung ở file này là bản chốt cuối cùng.

## 9. Cơ chế cập nhật giá theo thị trường (Auto/Manual)

Thay bảng tĩnh hardcode trong `src/lib/geo-pricing.ts` bằng bảng giá lưu ở DB, cập nhật định kỳ hoặc thủ công. Thống nhất 2026-08-28.

### Hai biến số khác bản chất — không auto-update cùng kiểu

- **Tỷ giá (FX)**: dữ liệu thị trường thời gian thực, biến động liên tục → đây là thứ job auto-refresh thật sự đi lấy mỗi kỳ.
- **Hệ số PPP** (x4,1 cho US...): quyết định định giá chiến lược, không phải dữ liệu thị trường sống. **Cảnh báo thực tế**: các nguồn PPP chính danh (World Bank ICP, IMF WEO) không xuất bản số mới mỗi quý — ICP cập nhật vài năm một lần, IMF WEO nhiều nhất là hằng năm. Đưa hệ số PPP vào chung một quy trình auto 3 tháng để thống nhất cơ chế (đúng như bạn muốn), nhưng đừng kỳ vọng con số này đổi ở mọi kỳ chạy — phần lớn các lần refresh chỉ tỷ giá đổi, hệ số PPP giữ nguyên vì nguồn gốc chưa có số mới. Đây là đặc điểm của dữ liệu, không phải lỗi hệ thống.

### Data model (DB-backed)

- **`market_pricing`** — `country_code`, `package_id`, `fx_rate_per_vnd`, `ppp_multiplier`, `computed_price`, `currency`, `updated_at`, `updated_by` (`cron` | id admin), `source` (`auto` | `manual`).
- **`pricing_refresh_settings`** — `mode` (`AUTO` | `MANUAL`), `interval_days` (mặc định 90, sàn tối thiểu 30 để admin không tự biến nó thành "giá nhấp nháy"), `scheduled_hour_utc`, `last_run_at`, `next_run_at`.
- **`pricing_refresh_log`** — lịch sử mỗi lần chạy: `triggered_by`, `started_at`, `finished_at`, `status`, `diff` (giá cũ → mới theo từng thị trường/gói) — audit trail vì ảnh hưởng tiền thật.

### Lịch chạy — ràng buộc kỹ thuật cần biết trước khi build

Cloudflare Cron Trigger chỉ khai báo được **lịch cố định trong `wrangler.jsonc` lúc deploy** — không thể để admin đổi tần suất tại runtime mà không redeploy. Giải pháp: cron chạy **cố định mỗi ngày** vào giờ thấp điểm (đề xuất 03:00 UTC ≈ 10:00 giờ VN) chỉ để "kiểm tra tới hạn chưa" — worker so `now` với `next_run_at` lưu trong DB, **chỉ thật sự refresh khi tới hạn**. Tần suất admin cấu hình (`interval_days`) chỉ quyết định `next_run_at` được tính lại thế nào, không đụng vào bản thân lịch cron.

### Quy trình 1 lần refresh

1. Bật **chế độ bảo trì** (mục 10) — tự động.
2. Gọi API tỷ giá + đọc số PPP tham chiếu mới nhất.
3. Tính lại giá từng (thị trường × gói), làm tròn về mức "đẹp" theo quy tắc mục 5.
4. Ghi đè `market_pricing`, ghi `pricing_refresh_log` kèm diff cũ/mới.
5. Tắt chế độ bảo trì.
6. **Timeout an toàn**: bước 2-4 quá 10 phút → tắt bảo trì, ghi log lỗi, **không ghi đè giá** (giữ nguyên giá cũ), báo admin — không được để giá nửa vời do job hỏng giữa chừng.

### Chế độ Manual

Admin bấm "Cập nhật ngay" khi tỷ giá biến động mạnh, không đợi `next_run_at`. Chạy đúng quy trình trên (`triggered_by = admin`), nhưng **hiển thị bảng diff giá cũ → mới để admin xác nhận trước khi ghi đè** — khác Auto (tự áp dụng thẳng vì đã là quy trình định kỳ được chấp nhận trước, không cần duyệt lại mỗi lần).

### Nguyên tắc không đổi

Giá mới **chỉ áp dụng cho lần mua tiếp theo** — credit đã mua/đã sở hữu không bao giờ bị tính lại theo giá mới, khớp nguyên tắc "credit mua tồn tại vĩnh viễn" ở mục 5.

## 10. Chế độ bảo trì hệ thống

Cần cho quy trình refresh giá ở mục 9, và cả tình huống thủ công khác (deploy khẩn, sự cố).

- **State**: `maintenance_mode` — `enabled` (bool), `enabled_at`, `enabled_by` (`cron` | id admin), `reason` (`pricing_refresh` | `manual`), `message_vi`, `message_en`.
- **Tự bật/tắt theo job giá**: bật ngay trước bước 2 ở mục 9, tắt ngay sau bước 4 (hoặc bước 6 nếu lỗi).
- **Tự chữa lành**: nếu `enabled=true` và `now - enabled_at > 15 phút` (dài hơn ngưỡng dự kiến 10 phút, chừa biên an toàn) → middleware tự coi như hết hạn, phục vụ site bình thường dù cờ DB chưa kịp tắt. Không cần watcher/cron riêng để giám sát — job đã lỗi thì không đáng tin để tự tắt cờ, nên logic tắt phải nằm ở phía đọc (middleware), không chỉ ở phía job.
- **Toggle thủ công trong admin**: mục "Bảo trì hệ thống" — bật/tắt tay + soạn thông báo song ngữ, dùng cho các tình huống ngoài lịch refresh giá.
- **Trang bảo trì công khai**: mọi route công khai trả về trang thông báo khi `enabled=true`, dùng lại bộ từ điển 2 ngôn ngữ có sẵn ở `src/lib/i18n/translations.ts`. Loại trừ `/admin/*` và `/api/admin/*` — admin phải vào được console để tắt bảo trì ngay cả khi đang bật.

## 11. Còn mở

- Chưa chọn nhà cung cấp dữ liệu tỷ giá (API) và nguồn tham chiếu PPP cụ thể sẽ gọi ở bước 2 mục 9.
- Tỷ giá ở bảng mục 5 hiện là mốc tại thời điểm viết tài liệu — sẽ được thay bằng dữ liệu DB-backed theo cơ chế mục 9 khi triển khai.
