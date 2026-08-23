import { ScrollText } from "lucide-react";

export function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
      <div className="mb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <ScrollText className="w-3.5 h-3.5" /> Điều khoản sử dụng
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Điều khoản sử dụng Think & Rich
        </h1>
        <p className="text-xs text-muted-foreground">Cập nhật lần cuối: tháng 1, 2026</p>
      </div>

      <div className="prose-academic max-w-none">
        <h2>1. Chấp nhận điều khoản</h2>
        <p>
          Khi tạo tài khoản hoặc tiếp tục sử dụng Think & Rich, bạn đồng ý tuân thủ các điều khoản dưới đây.
          Nếu không đồng ý, vui lòng ngừng sử dụng nền tảng.
        </p>

        <h2>2. Tài khoản người dùng</h2>
        <p>
          Bạn chịu trách nhiệm giữ bí mật thông tin đăng nhập của mình. Mọi hoạt động phát sinh từ tài khoản
          của bạn — bao gồm lượt đọc, bình luận và tương tác — được xem là do chính bạn thực hiện.
        </p>

        <h2>3. Nội dung & bản quyền</h2>
        <p>
          Toàn bộ hồ sơ tri thức, mô hình tư duy, công thức học thuật và sơ đồ minh hoạ thuộc bản quyền của
          Think & Rich hoặc các tác giả cộng tác. Bạn được phép đọc và trích dẫn có ghi nguồn cho mục đích cá
          nhân; sao chép để phân phối lại hoặc khai thác thương mại cần có sự đồng ý bằng văn bản trước.
        </p>

        <h2>4. Gói thành viên & thanh toán</h2>
        <p>
          Gói PLUS và PRO được tính phí theo chu kỳ đã chọn, với mức giá quy đổi theo khu vực (PPP) tại thời
          điểm đăng ký. Thanh toán được xử lý qua SePay (VietQR nội địa) hoặc Lemon Squeezy (thẻ quốc tế),
          tuỳ theo khu vực của bạn. Việc huỷ gói có hiệu lực từ chu kỳ thanh toán tiếp theo; các khoản đã
          thanh toán cho chu kỳ hiện tại không được hoàn lại trừ trường hợp lỗi hệ thống thuộc về chúng tôi.
        </p>

        <h2>5. Giới hạn trách nhiệm</h2>
        <p>
          Nội dung trên Think & Rich mang tính tham khảo học thuật và chiến lược, không phải lời khuyên tài
          chính, pháp lý hay đầu tư. Chúng tôi không chịu trách nhiệm cho các quyết định bạn đưa ra dựa trên
          nội dung của nền tảng.
        </p>

        <h2>6. Thay đổi điều khoản</h2>
        <p>
          Điều khoản này có thể được cập nhật khi nền tảng bổ sung tính năng mới. Chúng tôi sẽ thông báo các
          thay đổi đáng kể qua email hoặc thông báo trong ứng dụng trước khi áp dụng.
        </p>
      </div>
    </div>
  );
}
