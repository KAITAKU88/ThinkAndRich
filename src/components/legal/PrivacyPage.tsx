"use client";

import { ShieldCheck } from "lucide-react";
import { useSession } from "@/store/session";
import type { SupportedLanguage } from "@/lib/types";

interface PrivacySection {
  heading: string;
  body: string;
}

interface PrivacyContent {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  sections: PrivacySection[];
  contactHeading: string;
  contactPrefix: string;
}

// Full policy text only exists for vi/en/zh so far — every other language
// falls back to `en` below. Kept local to this page rather than the shared
// translations.ts dictionary since this is long-form legal prose, not
// short reusable UI strings.
const PRIVACY_CONTENT: Partial<Record<SupportedLanguage, PrivacyContent>> = {
  vi: {
    eyebrow: "Bảo mật",
    title: "Chính sách bảo mật",
    lastUpdated: "Cập nhật lần cuối: tháng 1, 2026",
    sections: [
      {
        heading: "1. Dữ liệu chúng tôi thu thập",
        body: "Thông tin tài khoản (email, tên hiển thị), lịch sử đọc và tương tác (lượt xem, thích, Đọc sau), gói thành viên, ngôn ngữ và khu vực (dùng để tính giá PPP), cùng dữ liệu thanh toán được xử lý qua đối tác cổng thanh toán — chúng tôi không lưu trữ số thẻ hay thông tin VietQR trực tiếp.",
      },
      {
        heading: "2. Mục đích sử dụng",
        body: "Dữ liệu được dùng để duy trì tài khoản của bạn, đồng bộ Đọc sau và lịch sử đọc giữa các thiết bị, xác định gói thành viên đang hoạt động, hiển thị đúng bảng giá theo khu vực, và cải thiện chất lượng gợi ý nội dung theo 3 trụ cột.",
      },
      {
        heading: "3. Chia sẻ dữ liệu",
        body: "Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba. Dữ liệu thanh toán được chia sẻ với SePay hoặc Lemon Squeezy chỉ trong phạm vi cần thiết để xử lý giao dịch của bạn.",
      },
      {
        heading: "4. Lưu trữ & bảo mật",
        body: "Dữ liệu được lưu trữ trên hạ tầng có mã hoá khi truyền tải. Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý để ngăn truy cập trái phép, nhưng không có hệ thống nào an toàn tuyệt đối — vui lòng giữ bí mật thông tin đăng nhập của bạn.",
      },
      {
        heading: "5. Quyền của bạn",
        body: "Bạn có quyền xem, chỉnh sửa hoặc yêu cầu xoá dữ liệu tài khoản bất kỳ lúc nào từ Khu vực cá nhân, hoặc bằng cách liên hệ trực tiếp với chúng tôi.",
      },
    ],
    contactHeading: "6. Liên hệ",
    contactPrefix: "Mọi câu hỏi về chính sách bảo mật, vui lòng gửi email tới",
  },
  en: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    lastUpdated: "Last updated: January 2026",
    sections: [
      {
        heading: "1. Data we collect",
        body: "Account information (email, display name), reading and interaction history (views, likes, Read Later), membership plan, language and region (used to compute PPP pricing), and payment data processed by our payment gateway partners — we do not store card numbers or VietQR details directly.",
      },
      {
        heading: "2. How we use it",
        body: "Data is used to maintain your account, sync your Read Later list and reading history across devices, determine your active membership plan, show the correct regional pricing, and improve content recommendations across the 3 pillars.",
      },
      {
        heading: "3. Data sharing",
        body: "We do not sell personal data to third parties. Payment data is shared with SePay or Lemon Squeezy only to the extent necessary to process your transaction.",
      },
      {
        heading: "4. Storage & security",
        body: "Data is stored on infrastructure encrypted in transit. We apply reasonable technical measures to prevent unauthorized access, but no system is perfectly secure — please keep your sign-in details confidential.",
      },
      {
        heading: "5. Your rights",
        body: "You can view, edit, or request deletion of your account data at any time from your personal area, or by contacting us directly.",
      },
    ],
    contactHeading: "6. Contact",
    contactPrefix: "For any questions about this privacy policy, please email",
  },
  zh: {
    eyebrow: "隐私",
    title: "隐私政策",
    lastUpdated: "最后更新：2026 年 1 月",
    sections: [
      {
        heading: "1. 我们收集的数据",
        body: "账户信息（邮箱、显示名称）、阅读与互动历史（浏览、点赞、稍后阅读）、会员方案、语言与地区（用于计算 PPP 定价），以及由支付网关合作方处理的支付数据 —— 我们不会直接存储银行卡号或 VietQR 信息。",
      },
      {
        heading: "2. 使用目的",
        body: "数据用于维护您的账户、在多设备间同步稍后阅读列表与阅读历史、确定您当前的会员方案、展示正确的地区定价，以及优化 3 大支柱下的内容推荐质量。",
      },
      {
        heading: "3. 数据共享",
        body: "我们不会向第三方出售个人数据。支付数据仅在处理您交易所必需的范围内与 SePay 或 Lemon Squeezy 共享。",
      },
      {
        heading: "4. 存储与安全",
        body: "数据存储在传输过程中加密的基础设施上。我们采取合理的技术措施防止未经授权的访问，但没有任何系统是绝对安全的 —— 请妥善保管您的登录信息。",
      },
      {
        heading: "5. 您的权利",
        body: "您可以随时在个人中心查看、修改或请求删除您的账户数据，也可以直接联系我们处理。",
      },
    ],
    contactHeading: "6. 联系方式",
    contactPrefix: "如对本隐私政策有任何疑问，请发送邮件至",
  },
};

export function PrivacyPage() {
  const language = useSession((s) => s.language);
  const content = PRIVACY_CONTENT[language] ?? PRIVACY_CONTENT.en!;

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
      <div className="mb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <ShieldCheck className="w-3.5 h-3.5" /> {content.eyebrow}
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {content.title}
        </h1>
        <p className="text-xs text-muted-foreground">{content.lastUpdated}</p>
      </div>

      <div className="prose-academic max-w-none">
        {content.sections.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </div>
        ))}

        <h2>{content.contactHeading}</h2>
        <p>
          {content.contactPrefix}{" "}
          <code>privacy@thinkandrich.app</code>.
        </p>
      </div>
    </div>
  );
}
