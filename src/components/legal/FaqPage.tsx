"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useSession } from "@/store/session";
import type { SupportedLanguage } from "@/lib/types";

interface FaqEntry {
  question: string;
  answer: string;
}

interface FaqContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  entries: FaqEntry[];
}

// Full FAQ copy only exists for vi/en/zh so far — every other language
// falls back to `en` below (see FAQ_CONTENT[language] ?? FAQ_CONTENT.en).
// Kept local to this page instead of the shared translations.ts dictionary
// since this is long-form prose, not short reusable UI strings.
const FAQ_CONTENT: Partial<Record<SupportedLanguage, FaqContent>> = {
  vi: {
    eyebrow: "Câu hỏi thường gặp",
    title: "Bạn cần biết điều gì?",
    subtitle: "Những câu hỏi người đọc Think & Rich hỏi nhiều nhất — về nội dung, gói thành viên và thanh toán.",
    entries: [
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
          "Người dùng tại Việt Nam thanh toán qua SePay (VietQR nội địa). Người dùng ở khu vực khác thanh toán qua Paddle (thẻ quốc tế, Apple Pay). Cổng thanh toán được định tuyến tự động theo khu vực của bạn.",
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
    ],
  },
  en: {
    eyebrow: "Frequently Asked Questions",
    title: "What do you need to know?",
    subtitle: "The questions Think & Rich readers ask most — about content, membership plans, and payments.",
    entries: [
      {
        question: "What is Think & Rich?",
        answer:
          "An academic and strategy knowledge platform organized around 3 pillars: Mental Models, Business Strategy, and Startup Ideas. Every model is written as something you can apply immediately, not a sprawling blog post.",
      },
      {
        question: "What's the difference between FREE, PLUS, and PRO?",
        answer:
          "FREE gives you a limited number of models per month across all 3 pillars. PLUS unlocks most of the library and removes the daily reading limit. PRO adds the deepest models (marked PRO ONLY) plus full academic formula breakdowns.",
      },
      {
        question: "Why does the price shown differ by region?",
        answer:
          "Pricing uses PPP (Purchasing Power Parity) based on the country detected from your IP, so the price matches each market's purchasing power instead of one fixed USD price for everyone.",
      },
      {
        question: "How can I pay?",
        answer:
          "Users in Vietnam pay via SePay (domestic VietQR). Users elsewhere pay via Paddle (international cards, Apple Pay). The payment gateway is routed automatically based on your region.",
      },
      {
        question: "How does \"Read Later\" work?",
        answer:
          "Tap the bookmark icon on a card or on the reading page to save it to Read Later in your personal area. You need to be signed in for the list to sync and persist across visits.",
      },
      {
        question: "Where do I change the interface language?",
        answer:
          "Tap the globe icon in the navigation bar to choose from 14 supported languages. Your language choice is independent of your payment currency.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Email support@thinkandrich.app with a description of the issue and your registered account name — our team replies within 1-2 business days.",
      },
    ],
  },
  zh: {
    eyebrow: "常见问题",
    title: "您需要了解什么？",
    subtitle: "Think & Rich 读者最常问的问题 —— 关于内容、会员方案与支付。",
    entries: [
      {
        question: "Think & Rich 是什么？",
        answer:
          "一个学术与战略知识平台，内容按 3 大支柱组织：思维模型、商业战略与创业构想。每份模型都以可立即应用的形式撰写，而不是冗长的博客文章。",
      },
      {
        question: "FREE、PLUS 和 PRO 方案有什么区别？",
        answer:
          "FREE 每月可在 3 大支柱中阅读有限数量的模型。PLUS 解锁绝大部分内容库并取消每日阅读限制。PRO 额外解锁最深度的模型（标记为仅限 PRO），并提供完整的学术公式解析。",
      },
      {
        question: "为什么不同地区显示的价格不同？",
        answer:
          "定价采用按 IP 识别国家的购买力平价 (PPP) 机制，使价格与各市场的实际购买力相符，而不是对所有人统一收取固定美元价格。",
      },
      {
        question: "可以用什么方式支付？",
        answer:
          "越南用户通过 SePay（境内 VietQR）支付；其他地区用户通过 Paddle（国际信用卡、Apple Pay）支付。支付网关会根据您所在地区自动路由。",
      },
      {
        question: "「稍后阅读」功能是如何运作的？",
        answer:
          "点击卡片或阅读页面上的收藏图标，即可保存到个人中心的稍后阅读列表。需要登录才能让列表在多次访问间同步保留。",
      },
      {
        question: "在哪里切换界面语言？",
        answer:
          "点击导航栏上的地球图标，即可从 14 种支持的语言中选择。语言选择与支付币种相互独立。",
      },
      {
        question: "如何联系客服？",
        answer:
          "请发送邮件至 support@thinkandrich.app，附上问题描述与您注册的账户名，我们的团队将在 1-2 个工作日内回复。",
      },
    ],
  },
};

export function FaqPage() {
  const language = useSession((s) => s.language);
  const content = FAQ_CONTENT[language] ?? FAQ_CONTENT.en!;

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
      <div className="mb-10 space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <HelpCircle className="w-3.5 h-3.5" /> {content.eyebrow}
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {content.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {content.subtitle}
        </p>
      </div>

      <div className="space-y-2.5">
        {content.entries.map((entry) => (
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
