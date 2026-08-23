import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "Think & Rich là gì?",
    answer:
      "Một nền tảng tri thức học thuật & chiến lược, tổ chức nội dung theo 3 trụ cột: Mô hình Tư duy, Chiến lược Kinh doanh và Ý tưởng Khởi nghiệp. Mỗi hồ sơ được viết như một mô hình có thể áp dụng ngay, không phải bài blog dàn trải.",
  },
  {
    question: "Gói FREE, PLUS và PRO khác nhau ở đâu?",
    answer:
      "FREE cho đọc một số lượng hồ sơ giới hạn mỗi tháng trên cả 3 trụ cột. PLUS mở khoá phần lớn thư viện và bỏ giới hạn lượt đọc. PRO thêm các hồ sơ chuyên sâu nhất (đánh dấu PRO ONLY) cùng các phân tích công thức học thuật đầy đủ.",
  },
  {
    question: "Vì sao giá hiển thị khác nhau tuỳ khu vực?",
    answer:
      "Bảng giá áp dụng PPP (Purchasing Power Parity) theo quốc gia phát hiện qua IP, để mức giá phù hợp với sức mua từng thị trường thay vì một mức giá USD cố định cho tất cả.",
  },
  {
    question: "Thanh toán bằng cách nào?",
    answer:
      "Người dùng tại Việt Nam thanh toán qua SePay (VietQR nội địa). Người dùng ở khu vực khác thanh toán qua Lemon Squeezy (thẻ quốc tế, Apple Pay). Cổng thanh toán được định tuyến tự động theo khu vực của bạn.",
  },
  {
    question: "\"Đọc sau\" hoạt động như thế nào?",
    answer:
      "Nhấn biểu tượng bookmark trên thẻ bài viết hoặc trong trang đọc để lưu vào mục Đọc sau trong Khu vực cá nhân. Cần đăng nhập để danh sách được đồng bộ và giữ lại giữa các lượt truy cập.",
  },
  {
    question: "Đổi ngôn ngữ giao diện ở đâu?",
    answer:
      "Nhấn biểu tượng quả cầu trên thanh điều hướng để chọn 1 trong 14 ngôn ngữ hỗ trợ. Lựa chọn ngôn ngữ độc lập với đơn vị tiền tệ thanh toán.",
  },
  {
    question: "Tôi cần liên hệ hỗ trợ thì làm sao?",
    answer:
      "Gửi email tới support@thinkandrich.app kèm mô tả vấn đề và tên tài khoản đã đăng ký, đội ngũ hỗ trợ sẽ phản hồi trong vòng 1-2 ngày làm việc.",
  },
];

export function FaqPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
      <div className="mb-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <HelpCircle className="w-3.5 h-3.5" /> Câu hỏi thường gặp
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Bạn cần biết điều gì?
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Những câu hỏi người đọc Think & Rich hỏi nhiều nhất — về nội dung, gói thành viên và thanh toán.
        </p>
      </div>

      <div className="space-y-2.5">
        {FAQ_ENTRIES.map((entry) => (
          <details
            key={entry.question}
            className="group rounded-2xl border border-border bg-card overflow-hidden"
          >
            <summary className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer list-none select-none font-semibold text-sm sm:text-base text-foreground">
              <span>{entry.question}</span>
              <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
