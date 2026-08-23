import { ShieldCheck } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
      <div className="mb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <ShieldCheck className="w-3.5 h-3.5" /> Bảo mật
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Chính sách bảo mật
        </h1>
        <p className="text-xs text-muted-foreground">Cập nhật lần cuối: tháng 1, 2026</p>
      </div>

      <div className="prose-academic max-w-none">
        <h2>1. Dữ liệu chúng tôi thu thập</h2>
        <p>
          Thông tin tài khoản (email, tên hiển thị), lịch sử đọc và tương tác (lượt xem, thích, Đọc sau),
          gói thành viên, ngôn ngữ và khu vực (dùng để tính giá PPP), cùng dữ liệu thanh toán được xử lý qua
          đối tác cổng thanh toán — chúng tôi không lưu trữ số thẻ hay thông tin VietQR trực tiếp.
        </p>

        <h2>2. Mục đích sử dụng</h2>
        <p>
          Dữ liệu được dùng để duy trì tài khoản của bạn, đồng bộ Đọc sau và lịch sử đọc giữa các thiết bị,
          xác định gói thành viên đang hoạt động, hiển thị đúng bảng giá theo khu vực, và cải thiện chất
          lượng gợi ý nội dung theo 3 trụ cột.
        </p>

        <h2>3. Chia sẻ dữ liệu</h2>
        <p>
          Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba. Dữ liệu thanh toán được chia sẻ với SePay hoặc
          Lemon Squeezy chỉ trong phạm vi cần thiết để xử lý giao dịch của bạn.
        </p>

        <h2>4. Lưu trữ & bảo mật</h2>
        <p>
          Dữ liệu được lưu trữ trên hạ tầng có mã hoá khi truyền tải. Chúng tôi áp dụng các biện pháp kỹ
          thuật hợp lý để ngăn truy cập trái phép, nhưng không có hệ thống nào an toàn tuyệt đối — vui lòng
          giữ bí mật thông tin đăng nhập của bạn.
        </p>

        <h2>5. Quyền của bạn</h2>
        <p>
          Bạn có quyền xem, chỉnh sửa hoặc yêu cầu xoá dữ liệu tài khoản bất kỳ lúc nào từ Khu vực cá nhân,
          hoặc bằng cách liên hệ trực tiếp với chúng tôi.
        </p>

        <h2>6. Liên hệ</h2>
        <p>
          Mọi câu hỏi về chính sách bảo mật, vui lòng gửi email tới{" "}
          <code>privacy@thinkandrich.app</code>.
        </p>
      </div>
    </div>
  );
}
