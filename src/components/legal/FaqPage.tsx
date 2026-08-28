"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useSession } from "@/store/session";
import { interpolateSiteCopy } from "@/lib/site-config";
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
    subtitle: "Những câu hỏi người đọc Think & Rich hỏi nhiều nhất — về nội dung, credit và thanh toán.",
    entries: [
      {
        question: "Think & Rich là gì?",
        answer:
          "Một nền tảng tri thức học thuật & chiến lược, tổ chức nội dung theo {pillarCount} trụ cột: Mô hình Tư duy, Chiến lược Kinh doanh và Ý tưởng Khởi nghiệp. Mỗi hồ sơ được viết như một mô hình có thể áp dụng ngay, không phải bài blog dàn trải.",
      },
      {
        question: "Credit dùng để làm gì? Có những gói nào?",
        answer:
          "Bài Open đọc miễn phí. Các bài khác trừ credit khi mở khóa — bài đã mở thì xem lại không mất thêm. Ba gói mua: {packageCreditsList} credit; mỗi lần mua cộng dồn vào số dư và gia hạn {paidTermDays} ngày cho toàn bộ số dư. Tài khoản đăng nhập còn được {giftDaily} credit tặng mỗi ngày (trần {giftMonthlyCap}/tháng).",
      },
      {
        question: "Vì sao giá hiển thị khác nhau tuỳ khu vực?",
        answer:
          "Giá theo khu vực của bạn. Việt Nam thanh toán bằng VNĐ qua SePay; khu vực khác thanh toán bằng tiền tệ địa phương qua Paddle.",
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
          "Nhấn biểu tượng quả cầu trên thanh điều hướng để chọn 1 trong {languageCount} ngôn ngữ hỗ trợ. Lựa chọn ngôn ngữ độc lập với đơn vị tiền tệ thanh toán.",
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
    subtitle: "The questions Think & Rich readers ask most — about content, credits, and payments.",
    entries: [
      {
        question: "What is Think & Rich?",
        answer:
          "An academic and strategy knowledge platform organized around {pillarCount} pillars: Mental Models, Business Strategy, and Startup Ideas. Every model is written as something you can apply immediately, not a sprawling blog post.",
      },
      {
        question: "How do credits work? What packages are there?",
        answer:
          "Open articles are free to read. Other articles cost credits to unlock — once unlocked, you can reread them at no extra cost. Three purchase packs: {packageCreditsList} credits; each purchase adds to your balance and resets the {paidTermDays}-day expiry for the whole balance. Signed-in accounts also receive {giftDaily} gift credits per day (capped at {giftMonthlyCap} per month).",
      },
      {
        question: "Why does the price shown differ by region?",
        answer:
          "Prices match your region. Vietnam pays in VND via SePay; other regions pay in local currency via Paddle.",
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
          "Tap the globe icon in the navigation bar to choose from {languageCount} supported languages. Your language choice is independent of your payment currency.",
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
    subtitle: "Think & Rich 读者最常问的问题 —— 关于内容、点数与支付。",
    entries: [
      {
        question: "Think & Rich 是什么？",
        answer:
          "一个学术与战略知识平台，内容按 {pillarCount} 大支柱组织：思维模型、商业战略与创业构想。每份模型都以可立即应用的形式撰写，而不是冗长的博客文章。",
      },
      {
        question: "点数怎么用？有哪些套餐？",
        answer:
          "Open 文章可免费阅读。其他文章解锁时扣除点数 —— 解锁后可随时重读，不再扣费。三种购买套餐：{packageCreditsList}；每次购买累加余额，并将全部余额的有效期重置为 {paidTermDays} 天。登录账户每天还可获赠 {giftDaily} 点（每月上限 {giftMonthlyCap}）。",
      },
      {
        question: "为什么不同地区显示的价格不同？",
        answer:
          "价格按您所在地区显示。越南用户通过 SePay 以越南盾支付；其他地区通过 Paddle 以当地货币支付。",
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
          "点击导航栏上的地球图标，即可从 {languageCount} 种支持的语言中选择。语言选择与支付币种相互独立。",
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
              {interpolateSiteCopy(entry.answer, language)}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
