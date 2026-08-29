"use client";

import { ScrollText } from "lucide-react";
import { useSession } from "@/store/session";
import { interpolateSiteCopy } from "@/lib/site-config";
import type { SupportedLanguage } from "@/lib/types";

interface TermsSection {
  heading: string;
  body: string;
}

interface TermsContent {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  sections: TermsSection[];
}

// Full terms text only exists for vi/en/zh so far — every other language
// falls back to `en` below. Kept local to this page rather than the shared
// translations.ts dictionary since this is long-form legal prose, not
// short reusable UI strings.
const TERMS_CONTENT: Partial<Record<SupportedLanguage, TermsContent>> = {
  vi: {
    eyebrow: "Điều khoản sử dụng",
    title: "Điều khoản sử dụng Think & Rich",
    lastUpdated: "Cập nhật lần cuối: tháng 1, 2026",
    sections: [
      {
        heading: "1. Chấp nhận điều khoản",
        body: "Khi tạo tài khoản hoặc tiếp tục sử dụng Think & Rich, bạn đồng ý tuân thủ các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng nền tảng.",
      },
      {
        heading: "2. Tài khoản người dùng",
        body: "Bạn chịu trách nhiệm giữ bí mật thông tin đăng nhập của mình. Mọi hoạt động phát sinh từ tài khoản của bạn — bao gồm lượt đọc, bình luận và tương tác — được xem là do chính bạn thực hiện.",
      },
      {
        heading: "3. Nội dung & bản quyền",
        body: "Toàn bộ hồ sơ tri thức, mô hình tư duy, công thức học thuật và sơ đồ minh hoạ thuộc bản quyền của Think & Rich hoặc các tác giả cộng tác. Bạn được phép đọc và trích dẫn có ghi nguồn cho mục đích cá nhân; sao chép để phân phối lại hoặc khai thác thương mại cần có sự đồng ý bằng văn bản trước.",
      },
      {
        heading: "4. Credit & thanh toán",
        body: "Bạn mua gói credit ({packageCreditsList}). Mỗi lần mua cộng dồn vào số dư và gia hạn {paidTermDays} ngày cho toàn bộ số dư. Giá theo khu vực tại thời điểm mua. Thanh toán qua SePay (VietQR nội địa) hoặc Paddle (thẻ quốc tế), tuỳ khu vực. Credit đã mua không hoàn lại trừ trường hợp lỗi hệ thống thuộc về chúng tôi.",
      },
      {
        heading: "5. Giới hạn trách nhiệm",
        body: "Nội dung trên Think & Rich mang tính tham khảo học thuật và chiến lược, không phải lời khuyên tài chính, pháp lý hay đầu tư. Chúng tôi không chịu trách nhiệm cho các quyết định bạn đưa ra dựa trên nội dung của nền tảng.",
      },
      {
        heading: "6. Thay đổi điều khoản",
        body: "Điều khoản này có thể được cập nhật khi nền tảng bổ sung tính năng mới. Chúng tôi sẽ thông báo các thay đổi đáng kể qua email hoặc thông báo trong ứng dụng trước khi áp dụng.",
      },
    ],
  },
  en: {
    eyebrow: "Terms of Use",
    title: "Think & Rich Terms of Use",
    lastUpdated: "Last updated: January 2026",
    sections: [
      {
        heading: "1. Accepting these terms",
        body: "By creating an account or continuing to use Think & Rich, you agree to the terms below. If you don't agree, please stop using the platform.",
      },
      {
        heading: "2. User accounts",
        body: "You are responsible for keeping your sign-in details confidential. Any activity originating from your account — including reads, comments, and interactions — is treated as performed by you.",
      },
      {
        heading: "3. Content & copyright",
        body: "All knowledge models, mental frameworks, academic formulas, and diagrams are copyrighted by Think & Rich or its contributing authors. You may read and cite them, with attribution, for personal use; copying for redistribution or commercial use requires prior written consent.",
      },
      {
        heading: "4. Credits & billing",
        body: "You buy credit packs ({packageCreditsList}). Each purchase adds to your balance and resets the {paidTermDays}-day expiry for the whole balance. Prices are those of your region at the time of purchase. Payments go through SePay (domestic VietQR) or Paddle (international cards), depending on your region. Purchased credits are non-refundable except in the case of a system error on our part.",
      },
      {
        heading: "5. Limitation of liability",
        body: "Content on Think & Rich is for academic and strategic reference only, not financial, legal, or investment advice. We are not responsible for decisions you make based on the platform's content.",
      },
      {
        heading: "6. Changes to these terms",
        body: "These terms may be updated as the platform adds new features. We'll notify you of significant changes by email or in-app notice before they take effect.",
      },
    ],
  },
  zh: {
    eyebrow: "使用条款",
    title: "Think & Rich 使用条款",
    lastUpdated: "最后更新：2026 年 1 月",
    sections: [
      {
        heading: "1. 接受条款",
        body: "创建账户或继续使用 Think & Rich 即表示您同意遵守以下条款。如果您不同意，请停止使用本平台。",
      },
      {
        heading: "2. 用户账户",
        body: "您需自行妥善保管登录信息。您账户下产生的所有活动 —— 包括阅读、评论和互动 —— 均视为由您本人执行。",
      },
      {
        heading: "3. 内容与版权",
        body: "全部知识模型、思维框架、学术公式与示意图均归 Think & Rich 或其合作作者所有版权。您可为个人用途阅读并注明出处引用；如需复制用于再分发或商业用途，须事先获得书面同意。",
      },
      {
        heading: "4. 点数与计费",
        body: "您可购买点数套餐（{packageCreditsList}）。每次购买累加余额，并将全部余额的有效期重置为 {paidTermDays} 天。价格以购买时您所在地区为准。支付通过 SePay（境内 VietQR）或 Paddle（国际信用卡）处理，具体取决于您所在地区。已购买的点数不予退还，除非因我方系统错误所致。",
      },
      {
        heading: "5. 责任限制",
        body: "Think & Rich 上的内容仅供学术与战略参考，不构成财务、法律或投资建议。我们对您依据平台内容作出的决定不承担责任。",
      },
      {
        heading: "6. 条款变更",
        body: "本条款可能随平台新增功能而更新。我们会在重大变更生效前，通过邮件或应用内通知告知您。",
      },
    ],
  },
};

export function TermsPage() {
  const language = useSession((s) => s.language);
  const content = TERMS_CONTENT[language] ?? TERMS_CONTENT.en!;

  return (
    <div>
      <div>
        <span>
          <ScrollText /> {content.eyebrow}
        </span>
        <h1>
          {content.title}
        </h1>
        <p>{content.lastUpdated}</p>
      </div>

      <div >
        {content.sections.map((section) => (
          <div key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{interpolateSiteCopy(section.body, language)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
