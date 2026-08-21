# TÀI LIỆU ĐẶC TẢ YÊU CẦU KỸ THUẬT (PRD)
**Module:** Đa Ngôn Ngữ, Đa Tiền Tệ & Định Tuyến Thanh Toán (Lemon Squeezy + SePay)

---

## 1. Mục Tiêu Dẫn Hướng
Tài liệu này được cung cấp cho AI Agent (Developer) nhằm xây dựng module Localization và Billing cho nền tảng học tập và tra cứu mô hình tư duy. Hệ thống cần đảm bảo tính linh hoạt về ngôn ngữ cho người dùng, đồng thời kiểm soát chặt chẽ chính sách định giá quốc tế thông qua cơ chế khóa tiền tệ theo IP. 

Đặc biệt, **bảng giá được thiết kế dựa trên Chỉ số Sức mua Tương đương (Purchasing Power Parity - PPP)**, giúp tối ưu hóa doanh thu tại các quốc gia phát triển và đảm bảo khả năng tiếp cận tại các quốc gia đang phát triển.

---

## 2. Đặc Tả Tính Năng Đa Ngôn Ngữ (Multi-language)

### 2.1. Logic Nhận Diện Ban Đầu
1. **Bước 1:** Khi người dùng truy cập lần đầu, hệ thống lấy địa chỉ IP của Client.
2. **Bước 2:** Gửi IP qua dịch vụ GeoIP (ví dụ: MaxMind, IPinfo) để trích xuất mã quốc gia (`country_code`).
3. **Bước 3:** Ánh xạ `country_code` với mã ngôn ngữ mặc định (ví dụ: VN -> `vi`, US -> `en`, CN -> `zh`).
4. **Bước 4:** Lưu ngôn ngữ vào LocalStorage/Cookie (`preferred_lang`) để tự động áp dụng cho các lần tải trang sau.

### 2.2. Cho Phép Thay Đổi (Manual Override)
* Hệ thống **bắt buộc** tích hợp Dropdown chọn ngôn ngữ ở giao diện (Header/Footer).
* Khi người dùng chủ động đổi ngôn ngữ, hệ thống cập nhật lại `preferred_lang` trong LocalStorage/Cookie và User Profile (nếu đã đăng nhập).
* **Lưu ý cốt lõi:** Việc thay đổi Ngôn Ngữ chỉ thay đổi nội dung văn bản trên giao diện (UI), **KHÔNG** làm thay đổi Tiền Tệ hay Bảng Giá.

---

## 3. Đặc Tả Tính Năng Đa Tiền Tệ & Khóa Theo IP (Currency Lock)

### 3.1. Logic Định Tuyến Thanh Toán (Payment Routing)
Hệ thống sử dụng song song 2 cổng thanh toán, được phân tách hoàn toàn theo định vị địa lý:
* **Khách hàng có IP Việt Nam (`country_code == 'VN'`):** Hiển thị giá VNĐ. Cổng thanh toán duy nhất được định tuyến là **SePay** (Xử lý quét mã QR / Chuyển khoản ngân hàng nội địa).
* **Khách hàng có IP Quốc tế (`country_code != 'VN'`):** Hiển thị giá theo đồng tiền tương ứng khu vực. Cổng thanh toán duy nhất được định tuyến là **Lemon Squeezy** (Xử lý thẻ tín dụng, Apple Pay, và tự động thu hộ thuế VAT/Sales Tax toàn cầu).

### 3.2. Cơ Chế Khóa Tiền Tệ (Currency Locking)
> ⚠️ **Nguyên tắc bảo mật:** Đồng tiền thanh toán bị khóa cứng theo IP Request hiện tại tại thời điểm tạo phiên thanh toán (Checkout Session), độc lập hoàn toàn với ngôn ngữ giao diện mà người dùng đang chọn.

* **Hiển thị bảng giá (Frontend):** Backend trả về mức giá và loại tiền tệ trực tiếp dựa trên IP Request (Server-side rendering hoặc qua API trả về kèm định danh quốc gia). Không cho phép Frontend tự chuyển đổi tỷ giá.
* **Xác thực giao dịch (Backend):**
  * *Đối với SePay:* Nếu người dùng cố tình dùng VPN IP Việt Nam để nhận giá rẻ, hệ thống vẫn an toàn vì họ bắt buộc phải có tài khoản ngân hàng nội địa Việt Nam để chuyển khoản thành công.
  * *Đối với Lemon Squeezy:* Khi gọi API tạo `Checkout URL`, truyền cứng tham số loại tiền tệ (Currency) đã được Backend ấn định. Tận dụng thêm tính năng đối chiếu Bank BIN (6 số đầu của thẻ) của Lemon Squeezy với IP thanh toán để chặn các giao dịch chênh lệch địa lý bất thường.

---

## 4. Bảng Định Giá Đa Quốc Gia (Tính Theo Sức Mua - PPP)

Bảng giá dưới đây lấy mức giá tại Việt Nam làm cơ sở (Base). Các thị trường khác được điều chỉnh dựa trên Hệ số Sức mua tương đương (PPP Index) so với Việt Nam để đảm bảo tính công bằng và tối ưu doanh thu.

| Thị trường (IP) | Cổng Thanh Toán | Gói Free | Gói Plus (1 Năm) | Gói Pro (1 Năm) | Ghi chú (Mức độ PPP so với VN) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Việt Nam (VN)** | **SePay** | 0 VNĐ | **299,000 VNĐ** | **499,000 VNĐ** | *Thị trường cơ sở (Base)* |
| **Mỹ (US)** | Lemon Squeezy | $0 | **$49** | **$89** | Sức mua cao nhất (~ x4 lần VN) |
| **Châu Âu (EU)** | Lemon Squeezy | 0 € | **39 €** | **75 €** | Sức mua cao (~ x3.5 lần VN) |
| **Nhật Bản (JP)** | Lemon Squeezy | 0 ¥ | **4,980 ¥** | **8,980 ¥** | Sức mua cao (~ x2.5 lần VN) |
| **Hàn Quốc (KR)** | Lemon Squeezy | 0 ₩ | **45,000 ₩** | **79,000 ₩** | Sức mua cao (~ x2.5 lần VN) |
| **Đài Loan (TW)** | Lemon Squeezy | 0 NT$ | **899 NT$** | **1,599 NT$** | Sức mua trung bình cao (~ x2 lần VN) |
| **Trung Quốc (CN)** | Lemon Squeezy | 0 ¥ | **149 ¥** | **259 ¥** | Sức mua trung bình (~ x1.5 lần VN) |
| **Quốc gia khác (Default)**| Lemon Squeezy | $0 | **$39** | **$69** | Mức giá chung cho các khu vực còn lại |

*(Tỷ giá và mức thu nhập được tham khảo tại thời điểm 2026, làm tròn để tạo tâm lý giá tốt).*

---

## 5. Hướng Dẫn Tích Hợp (Implementation Notes)

### 5.1. Cấu Trúc Dữ Liệu Sản Phẩm Khuyến Nghị (JSON Payload)
```json
{
  "product_id": "mental_models_subscription",
  "pricing": {
    "VN": { "currency": "VND", "price": 499000, "gateway": "sepay" },
    "US": { "currency": "USD", "price": 89, "gateway": "lemonsqueezy" },
    "EU": { "currency": "EUR", "price": 75, "gateway": "lemonsqueezy" },
    "JP": { "currency": "JPY", "price": 8980, "gateway": "lemonsqueezy" },
    "KR": { "currency": "KRW", "price": 79000, "gateway": "lemonsqueezy" },
    "TW": { "currency": "TWD", "price": 1599, "gateway": "lemonsqueezy" },
    "CN": { "currency": "CNY", "price": 259, "gateway": "lemonsqueezy" },
    "DEFAULT": { "currency": "USD", "price": 69, "gateway": "lemonsqueezy" }
  }
}
```

### 5.2. Luồng Gọi API (API Flow)
1. Client gửi request truy cập trang `/pricing`.
2. Server Middleware lấy IP -> Xác định `User_Country`.
3. API trả về JSON Bảng giá tương ứng với `User_Country`.
4. Khi người dùng bấm "Mua Ngay":
   * **Nếu `gateway == "sepay"`:** Tạo đơn hàng nội bộ, sinh mã QR SePay. Thiết lập Webhook lắng nghe từ SePay để tự động cấp quyền Pro.
   * **Nếu `gateway == "lemonsqueezy"`:** Gọi Lemon Squeezy API tạo Checkout URL với `custom_price` hoặc ID sản phẩm tương ứng khu vực. Redirect Client tới URL đó. Thiết lập Webhook (`subscription_created`) để cập nhật trạng thái User.
