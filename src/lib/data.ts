export const CATEGORIES = ["Tất cả", "Mô hình Tư duy", "Mô hình Tâm trí", "Chiến lược Kinh doanh", "Ý tưởng Khởi nghiệp", "Hào kinh tế & Moats", "Deep-dive Teardown"] as const;

import type {
  Post,
  UserRecord,
  ReadLog,
  AppSettings,
  PricingPlan,
  PillarType,
  PillarMetadata,
  PppPricingConfig,
  ContentAccessLevel,
} from "./types";

export const PILLARS_CONFIG: Record<PillarType, PillarMetadata> = {
  MENTAL_MODEL: {
    id: "MENTAL_MODEL",
    titleVi: "Mô hình Tư duy",
    titleEn: "Mental Models",
    taglineVi: "Tái cấu trúc nhận thức & nguyên lý gốc rễ",
    taglineEn: "Cognitive frameworks & first-principles reasoning",
    colorHex: "#991B1B",
    colorDarkHex: "#F87171",
    badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    badgeText: "Mô hình Tư duy",
    borderHover: "hover:border-rose-500/50",
    iconName: "Brain",
  },
  BUSINESS_STRATEGY: {
    id: "BUSINESS_STRATEGY",
    titleVi: "Chiến lược Kinh doanh",
    titleEn: "Business Strategy",
    taglineVi: "Hào kinh tế, bánh đà tăng trưởng & playbooks",
    taglineEn: "Economic moats, flywheels & corporate playbooks",
    colorHex: "#B45309",
    colorDarkHex: "#FBBF24",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    badgeText: "Chiến lược Kinh doanh",
    borderHover: "hover:border-amber-500/50",
    iconName: "Compass",
  },
  STARTUP_IDEA: {
    id: "STARTUP_IDEA",
    titleVi: "Ý tưởng Khởi nghiệp",
    titleEn: "Startup Ideas",
    taglineVi: "Hồ sơ teardown khoảng trống thị trường & xu hướng",
    taglineEn: "Market gap teardowns & global venture signals",
    colorHex: "#065F46",
    colorDarkHex: "#34D399",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    badgeText: "Ý tưởng Khởi nghiệp",
    borderHover: "hover:border-emerald-500/50",
    iconName: "Lightbulb",
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  brandName: "Think & Rich",
  brandTagline: "Academic & Strategic Intelligence Platform",
  primaryColor: "#0f766e",
  seoDefaultTitle: "Think & Rich — Nền tảng Tri thức Học thuật & Chiến lược Chuyên sâu",
};

export const PPP_PRICING_CONFIGS: Record<string, PppPricingConfig> = {
  VN: {
    countryCode: "VN",
    countryName: "Việt Nam",
    flag: "🇻🇳",
    currency: "VND",
    currencySymbol: "₫",
    gateway: "sepay",
    pppFactorNote: "Bảng giá cơ sở ưu đãi thị trường Việt Nam (Thanh toán VietQR SePay tự động)",
    plans: {
      FREE: { price: 0, formatted: "0 ₫" },
      PLUS: { price: 299000, formatted: "299.000 ₫/năm" },
      PRO: { price: 499000, formatted: "499.000 ₫/năm" },
    },
  },
  US: {
    countryCode: "US",
    countryName: "United States",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    gateway: "lemonsqueezy",
    pppFactorNote: "US standard pricing tier (Credit Card / Apple Pay)",
    plans: {
      FREE: { price: 0, formatted: "$0" },
      PLUS: { price: 49, formatted: "$49/yr" },
      PRO: { price: 89, formatted: "$89/yr" },
    },
  },
  EU: {
    countryCode: "EU",
    countryName: "European Union",
    flag: "🇪🇺",
    currency: "EUR",
    currencySymbol: "€",
    gateway: "lemonsqueezy",
    pppFactorNote: "European regional PPP tier",
    plans: {
      FREE: { price: 0, formatted: "0 €" },
      PLUS: { price: 39, formatted: "39 €/yr" },
      PRO: { price: 75, formatted: "75 €/yr" },
    },
  },
  JP: {
    countryCode: "JP",
    countryName: "Japan",
    flag: "🇯🇵",
    currency: "JPY",
    currencySymbol: "¥",
    gateway: "lemonsqueezy",
    pppFactorNote: "Japan regional PPP tier",
    plans: {
      FREE: { price: 0, formatted: "0 ¥" },
      PLUS: { price: 4980, formatted: "4.980 ¥/年" },
      PRO: { price: 8980, formatted: "8.980 ¥/年" },
    },
  },
  DEFAULT: {
    countryCode: "DEFAULT",
    countryName: "International",
    flag: "🌐",
    currency: "USD",
    currencySymbol: "$",
    gateway: "lemonsqueezy",
    pppFactorNote: "Global standard international pricing",
    plans: {
      FREE: { price: 0, formatted: "$0" },
      PLUS: { price: 39, formatted: "$39/yr" },
      PRO: { price: 69, formatted: "$69/yr" },
    },
  },
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "FREE",
    name: "Gói Free",
    tagline: "Dành cho người mới bắt đầu tiếp cận các mô hình tư duy",
    price: 0,
    priceFormatted: "0 ₫",
    dailyLimitText: "Đọc tối đa 10 bài viết Free / ngày",
    features: [
      "Đăng nhập xác thực nhanh bằng Email OTP (Passwordless)",
      "Truy cập tối đa 10 bài viết Free mỗi ngày",
      "Xem toàn bộ sơ đồ Vector SVG & Công thức tóm tắt",
      "Lưu bài viết vào Tủ sách cá nhân (Bookmarks)",
      "Không bao gồm các hồ sơ phân tích chuyên sâu Member",
    ],
    ctaText: "Đang sử dụng",
  },
  {
    id: "PLUS",
    name: "Gói Plus",
    tagline: "Đọc 25 bài/ngày & Mở khóa toàn bộ bài viết Member Plus",
    price: 299000,
    priceFormatted: "299.000 ₫/năm",
    dailyLimitText: "Đọc tối đa 25 bài viết / ngày",
    badge: "Tiết kiệm",
    psychologyNote: "Chỉ thêm 200k để nâng cấp lên gói Pro Toàn Diện",
    features: [
      "Mở khóa toàn bộ bài viết FREE và MEMBER_PLUS",
      "Hạn mức đọc nâng lên 25 bài viết chuyên sâu mỗi ngày",
      "Truy cập hồ sơ phân tích chiến lược & mô hình tư duy nâng cao",
      "Tải sơ đồ tư duy vector độ phân giải cao",
      "Lưu trữ không giới hạn tủ sách cá nhân",
    ],
    ctaText: "Nâng cấp Gói Plus (299k)",
  },
  {
    id: "PRO",
    name: "Gói Pro",
    tagline: "Truy cập KHÔNG GIỚI HẠN toàn bộ kho tàng tri thức 3 trụ cột",
    price: 499000,
    priceFormatted: "499.000 ₫/năm",
    dailyLimitText: "Đọc KHÔNG GIỚI HẠN mỗi ngày",
    isPopular: true,
    badge: "Khuyên dùng — Lựa chọn Tốt nhất",
    psychologyNote: "Giá trị tri thức dài hạn cho Founders & Strategists",
    features: [
      "Đọc KHÔNG GIỚI HẠN toàn bộ 3 trụ cột tri thức",
      "Mở khóa 100% hồ sơ Tear-down ý tưởng khởi nghiệp toàn cầu",
      "Quyền truy cập các Playbook thực thi và Mô hình tài chính",
      "Quyền truy cập sớm các nghiên cứu chuyên sâu mỗi tuần",
      "Huy hiệu Thành viên Tinh hoa (Pro Member Badge)",
    ],
    ctaText: "Nâng cấp Gói Pro (499k)",
  },
];

export const SEED_POSTS: Post[] = [
  // ----------------------------------------------------
  // TRỤ CỘT 1: MENTAL MODELS (MÔ HÌNH TƯ DUY)
  // ----------------------------------------------------
  {
    id: "first-principles-thinking",
    slug: "first-principles-thinking",
    title: "Nguyên lý Đệ nhất (First Principles Thinking): Phân rã về chân lý nền tảng",
    pillar: "MENTAL_MODEL",
    category: "Mô hình Tư duy",
    displaySize: "SQUARE_LG",
    academicFormula: "F(x) = \\sum_{i=1}^n \\text{BaseTruth}_i \\implies \\text{Reconstruct}(S)",
    summarySnippet:
      "Phá vỡ mọi suy luận bằng phép loại suy (Analogy). Phân rã vấn đề thành các chân lý cơ bản nhất không thể chia nhỏ hơn để tái cấu trúc giải pháp đột phá.",
    keyTakeaways: [
      "Loại bỏ tư duy sao chép tương đối (Reasoning by Analogy).",
      "Xác định nguyên vật liệu & định luật vật lý cơ bản cấu thành giá trị.",
      "Tái thiết kế giải pháp từ con số 0 với công nghệ hiện đại.",
    ],
    schematicSvg: `<svg viewBox="0 0 200 120" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="60" r="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.4"/>
      <text x="40" y="64" font-size="9" text-anchor="middle" fill="currentColor">Complex</text>
      <path d="M72 60 L108 60" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="140" cy="35" r="14" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <text x="140" y="38" font-size="8" text-anchor="middle" fill="currentColor">Truth A</text>
      <circle cx="140" cy="85" r="14" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <text x="140" y="88" font-size="8" text-anchor="middle" fill="currentColor">Truth B</text>
    </svg>`,
    fullContent: `
      <h2>1. Bản chất của Nguyên lý Đệ nhất</h2>
      <p>Nguyên lý Đệ nhất (First Principles Thinking) là phương pháp nhận thức xuất phát từ triết học Aristotle và vật lý học lượng tử. Thay vì kết luận dựa trên giả định hoặc tiền lệ có sẵn (<em>"Người ta luôn làm như vậy"</em>), ta chủ động bóc tách từng lớp giả định cho đến khi chạm tới chân lý cơ bản nhất được chứng thực.</p>
      <blockquote>
        "Đừng lý luận bằng phép loại suy. Hãy phân rã sự vật về các chân lý nền tảng nhất và tự hỏi: 'Điều gì chúng ta biết chắc chắn là đúng?' rồi xây dựng logic ngược lên."
        <br/>— <em>Elon Musk</em>
      </blockquote>
      <h2>2. Minh chứng: Tái cấu trúc giá thành tên lửa SpaceX</h2>
      <p>Khi ngành hàng không vũ trụ định giá tên lửa 65 triệu USD, SpaceX phân tích giá trị nguyên vật liệu thô (nhôm, titan, sợi carbon) chỉ chiếm 2% tổng giá thành. Bằng cách tự sản xuất 85% linh kiện, họ hạ giá phóng xuống mức không đối thủ nào theo kịp.</p>
      <h2>3. 3 Bước thực hành</h2>
      <ol>
        <li><strong>Xác định & nghi ngờ các giả định</strong>: Đặt câu hỏi Socratic với mọi định kiến trong ngành.</li>
        <li><strong>Phân tách về các tiên đề không thể phủ nhận</strong>: Đơn vị kinh tế tối thiểu, giới hạn công nghệ thực tế.</li>
        <li><strong>Tạo dựng giải pháp mới</strong>: Ghép nối lại từ nền móng mà không phụ thuộc quy trình cũ.</li>
      </ol>
    `,
    accessLevel: "FREE",
    readingTimeMinutes: 6,
    status: "PUBLISHED",
    views: 4520,
    likes: 380,
    dislikes: 2,
    author: "Ban Học Thuật Think & Rich",
    tags: ["Aristotle", "Elon Musk", "Vật lý học", "Ra quyết định"],
    createdAt: "2026-08-15T08:00:00.000Z",
    updatedAt: "2026-08-15T08:00:00.000Z",
    shortDescription: "Phá vỡ mọi suy luận bằng phép loại suy. Phân rã vấn đề thành các chân lý cơ bản nhất.",
    readTime: "6 phút",
  },
  {
    id: "inversion-principle",
    slug: "inversion-principle",
    title: "Tư duy Đảo ngược (Inversion): Nghịch đảo bài toán để phòng tránh thảm họa",
    pillar: "MENTAL_MODEL",
    category: "Mô hình Tư duy",
    displaySize: "SQUARE_SM",
    academicFormula: "\\text{Success} = \\max(S) \\iff \\min(\\text{Stupidity})",
    summarySnippet:
      "Thay vì cố gắng tìm cách thành công xuất chúng, hãy liệt kê tất cả những sai lầm dẫn đến thất bại chắc chắn và kiên quyết loại bỏ chúng.",
    keyTakeaways: [
      "Nghịch đảo vấn đề: 'Điều gì chắc chắn làm dự án thất bại?'",
      "Áp dụng kỹ thuật Khám nghiệm tử thi trước (Pre-Mortem).",
      "Giảm thiểu sự ngu ngốc dễ hơn tìm kiếm sự thiên tài.",
    ],
    schematicSvg: `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 L50 80 M50 80 L35 65 M50 80 L65 65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="50" cy="20" r="8" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    fullContent: `
      <h2>1. Tiên đề Carl Jacobi</h2>
      <p>Nhà toán học người Đức Carl Jacobi có câu châm ngôn nổi tiếng: <em>"Man muss immer umkehren" (Nghịch đảo, luôn luôn nghịch đảo)</em>. Khi giải một phương trình hóc búa, việc biến đổi ngược thường mang lại lời giải tức thì.</p>
      <h2>2. Ứng dụng của Charlie Munger</h2>
      <p>Charlie Munger cho rằng tránh né sai lầm ngớ ngẩn đem lại lợi thế sinh tồn lớn hơn nhiều so với việc cố trở nên thông thái:</p>
      <blockquote>"Tất cả những gì tôi muốn biết là nơi tôi sẽ chết, để tôi không bao giờ đến đó."</blockquote>
    `,
    accessLevel: "FREE",
    readingTimeMinutes: 4,
    status: "PUBLISHED",
    views: 3120,
    likes: 240,
    dislikes: 1,
    author: "Charlie Munger / Think & Rich",
    tags: ["Charlie Munger", "Nghịch đảo", "Quản trị rủi ro"],
    createdAt: "2026-08-16T09:00:00.000Z",
    updatedAt: "2026-08-16T09:00:00.000Z",
    shortDescription: "Thay vì cố gắng tìm cách thành công xuất chúng, hãy liệt kê và loại bỏ các nguyên nhân thất bại.",
    readTime: "4 phút",
  },
  {
    id: "second-order-thinking",
    slug: "second-order-thinking",
    title: "Tư duy Bậc hai (Second-Order Thinking): Tính toán hệ quả dây chuyền",
    pillar: "MENTAL_MODEL",
    category: "Mô hình Tư duy",
    displaySize: "SQUARE_MD",
    academicFormula: "\\mathcal{E}_2 = f(\\mathcal{E}_1(t)) \\quad \\text{với } \\mathcal{E}_2 \\gg \\mathcal{E}_1",
    summarySnippet:
      "Người bình thường chỉ nhìn thấy kết quả trước mắt (Bậc 1). Nhà hoạch định chiến lược luôn đặt câu hỏi then chốt: 'Và rồi sau đó thì sao?'",
    keyTakeaways: [
      "Hệ quả bậc một thường dễ chịu nhưng hệ quả bậc hai gây kiệt quệ.",
      "Hiệu ứng Rắn hổ mang (Cobra Effect) trong hoạch định chính sách.",
      "Đánh giá quyết định qua lăng kính 10 phút, 10 tháng, 10 năm.",
    ],
    schematicSvg: `<svg viewBox="0 0 160 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="35" width="30" height="30" rx="6" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <text x="30" y="53" font-size="10" text-anchor="middle" fill="currentColor">1st</text>
      <path d="M48 50 L72 50" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/>
      <rect x="75" y="25" width="40" height="50" rx="8" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2"/>
      <text x="95" y="53" font-size="11" text-anchor="middle" font-weight="bold" fill="currentColor">2nd</text>
    </svg>`,
    fullContent: `
      <h2>1. Phân cấp mức độ tư duy</h2>
      <p>Howard Marks trong cuốn sách <em>The Most Important Thing</em> khẳng định: Tư duy bậc một đơn giản và phổ biến, do đó không thể mang lại lợi nhuận vượt trội. Tư duy bậc hai đòi hỏi phải tính đến các phản ứng dây chuyền từ thị trường và đối thủ cạnh tranh.</p>
      <h2>2. Bài học từ Hiệu ứng Rắn hổ mang</h2>
      <p>Khi chính quyền thực dân Anh trả tiền thưởng cho mỗi con rắn chết nộp lên, người dân lập trang trại nuôi rắn để kiếm tiền. Khi chính sách bị bãi bỏ, hàng vạn con rắn được thả rông ra đường, biến thảm họa thành gấp bội.</p>
    `,
    accessLevel: "MEMBER_PLUS",
    readingTimeMinutes: 5,
    status: "PUBLISHED",
    views: 2890,
    likes: 310,
    dislikes: 3,
    author: "Howard Marks / Think & Rich",
    tags: ["Howard Marks", "Hệ quả bậc hai", "Động lực học"],
    createdAt: "2026-08-17T11:00:00.000Z",
    updatedAt: "2026-08-17T11:00:00.000Z",
    shortDescription: "Người bình thường chỉ nhìn thấy kết quả trước mắt. Nhà chiến lược hỏi: 'Và rồi sau đó thì sao?'",
    readTime: "5 phút",
  },
  {
    id: "game-theory-nash-equilibrium",
    slug: "game-theory-nash-equilibrium",
    title: "Lý thuyết Trò chơi & Cân bằng Nash: Chiến lược hợp tác trong bất định",
    pillar: "MENTAL_MODEL",
    category: "Mô hình Tâm trí",
    displaySize: "SQUARE_MD",
    academicFormula: "u_i(s_i^*, s_{-i}^*) \\ge u_i(s_i, s_{-i}^*) \\quad \\forall s_i \\in S_i",
    summarySnippet:
      "Trạng thái mà không người chơi nào có động lực đơn phương thay đổi chiến lược nếu các đối thủ khác giữ nguyên lựa chọn của họ.",
    keyTakeaways: [
      "Thế lưỡng nan của người tù (Prisoner's Dilemma).",
      "Xây dựng cơ chế khuyến khích hợp tác dài hạn (Tit-for-Tat).",
      "Nhận diện trò chơi có tổng bằng 0 (Zero-sum) vs. tổng dương.",
    ],
    schematicSvg: `<svg viewBox="0 0 160 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="50" x2="140" y2="50" stroke="currentColor" stroke-width="1" opacity="0.3"/>
      <line x1="80" y1="15" x2="80" y2="85" stroke="currentColor" stroke-width="1" opacity="0.3"/>
      <circle cx="110" cy="35" r="16" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
      <text x="110" y="39" font-size="9" text-anchor="middle" fill="currentColor">Nash</text>
    </svg>`,
    fullContent: `
      <h2>1. Khung toán học của Cân bằng Nash</h2>
      <p>John Nash chứng minh rằng trong bất kỳ trò chơi hữu hạn nào với thông tin hoàn hảo hoặc không hoàn hảo, luôn tồn tại ít nhất một điểm cân bằng nơi mọi người chơi đều tối ưu hóa lợi ích dựa trên kỳ vọng về đối phương.</p>
    `,
    accessLevel: "MEMBER_PRO",
    readingTimeMinutes: 7,
    status: "PUBLISHED",
    views: 1980,
    likes: 185,
    dislikes: 0,
    author: "Ban Học Thuật Think & Rich",
    tags: ["John Nash", "Lý thuyết trò chơi", "Toán học ứng dụng"],
    createdAt: "2026-08-18T14:30:00.000Z",
    updatedAt: "2026-08-18T14:30:00.000Z",
    shortDescription: "Tối ưu hóa chiến lược hợp tác và cạnh tranh trong điều kiện bất định.",
    readTime: "7 phút",
  },

  // ----------------------------------------------------
  // TRỤ CỘT 2: BUSINESS STRATEGY (CHIẾN LƯỢC KINH DOANH)
  // ----------------------------------------------------
  {
    id: "the-flywheel-effect",
    slug: "the-flywheel-effect",
    title: "Bánh đà Tăng trưởng (The Flywheel Effect): Động lực tự gia tốc",
    pillar: "BUSINESS_STRATEGY",
    category: "Chiến lược Kinh doanh",
    displaySize: "SQUARE_LG",
    academicFormula: "\\omega(t) = \\int \\frac{\\tau_{\\text{net}}(t)}{I} \\, dt \\implies \\text{Compounding Loop}",
    summarySnippet:
      "Tạo dựng cỗ máy kinh doanh tuần hoàn nơi mỗi mắt xích thành công tự động tiếp thêm động năng cho mắt xích kế tiếp, tạo đà bứt phá không thể ngăn cản.",
    keyTakeaways: [
      "Chiếc bánh đà cần lực đẩy ban đầu rất lớn nhưng quán tính sẽ duy trì vòng quay.",
      "Mô hình khăn ăn Amazon: Giá thấp -> Khách hàng -> Sellers -> Chi phí biên giảm.",
      "Loại bỏ triệt để ma sát nội bộ cản trở vòng quay.",
    ],
    schematicSvg: `<svg viewBox="0 0 160 120" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="60" r="38" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="8 4"/>
      <circle cx="80" cy="22" r="6" fill="currentColor"/>
      <circle cx="118" cy="60" r="6" fill="currentColor"/>
      <circle cx="80" cy="98" r="6" fill="currentColor"/>
      <circle cx="42" cy="60" r="6" fill="currentColor"/>
      <path d="M86 16 L94 22 L86 28" fill="currentColor"/>
      <text x="80" y="64" font-size="9" text-anchor="middle" font-weight="bold" fill="currentColor">Flywheel</text>
    </svg>`,
    fullContent: `
      <h2>1. Khái niệm Bánh đà của Jim Collins</h2>
      <p>Trong <em>Good to Great</em>, Jim Collins mô tả chuyển đổi của một công ty vĩ đại không bao giờ đến từ một cú hích may mắn hay sự kiện đơn lẻ. Nó giống như việc kiên trì đẩy chiếc bánh đà khổng lồ bằng kim loại.</p>
      <h2>2. Bản phác thảo khăn ăn của Jeff Bezos</h2>
      <p>Năm 2001, Bezos mô tả bánh đà Amazon: Trải nghiệm người dùng tốt thu hút Traffic -> Traffic thu hút người bán bên thứ 3 -> Tăng danh mục sản phẩm -> Tối ưu hóa quy mô và chi phí vận hành -> Giảm giá bán -> Cải thiện trải nghiệm người dùng!</p>
    `,
    accessLevel: "FREE",
    readingTimeMinutes: 6,
    status: "PUBLISHED",
    views: 5210,
    likes: 490,
    dislikes: 4,
    author: "Jim Collins / Think & Rich",
    tags: ["Amazon", "Tăng trưởng kép", "Bánh đà", "Jim Collins"],
    createdAt: "2026-08-16T10:00:00.000Z",
    updatedAt: "2026-08-16T10:00:00.000Z",
    shortDescription: "Tạo dựng cỗ máy kinh doanh tuần hoàn tự gia tốc ngày càng mạnh mẽ.",
    readTime: "6 phút",
  },
  {
    id: "7-powers-economic-moats",
    slug: "7-powers-economic-moats",
    title: "7 Quyền lực Chiến lược (7 Powers): Cấu trúc con hào kinh tế bền vững",
    pillar: "BUSINESS_STRATEGY",
    category: "Hào kinh tế & Moats",
    displaySize: "SQUARE_MD",
    academicFormula: "\\text{Moat} = \\text{Value Differential} \\times \\text{Barrier to Arbitrage}",
    summarySnippet:
      "Khung phân tích của Hamilton Helmer giải mã 7 nguồn sức mạnh duy nhất tạo ra lợi nhuận vượt trội bền vững và rào cản bất khả xâm phạm trước đối thủ.",
    keyTakeaways: [
      "Scale Economies, Network Effects, Counter-Positioning.",
      "Switching Costs, Branding, Cornered Resource, Process Power.",
      "Sức mạnh chỉ tồn tại khi có đồng thời: Lợi thế cạnh tranh + Rào cản sao chép.",
    ],
    schematicSvg: `<svg viewBox="0 0 160 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <polygon points="80,15 135,45 135,75 80,95 25,75 25,45" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="80" cy="55" r="14" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
      <text x="80" y="58" font-size="8" text-anchor="middle" font-weight="bold" fill="currentColor">7 Powers</text>
    </svg>`,
    fullContent: `
      <h2>1. 7 Nguồn sức mạnh phòng thủ</h2>
      <p>Hamilton Helmer chỉ ra rằng 99% chiến lược tiếp thị thông thường chỉ tạo ra lợi thế ngắn hạn. Chỉ có 7 cấu trúc sức mạnh này mới bảo vệ được dòng tiền doanh nghiệp trong hàng thập kỷ.</p>
    `,
    accessLevel: "MEMBER_PLUS",
    readingTimeMinutes: 8,
    status: "PUBLISHED",
    views: 3900,
    likes: 340,
    dislikes: 1,
    author: "Hamilton Helmer / Think & Rich",
    tags: ["7 Powers", "Con hào kinh tế", "Hamilton Helmer"],
    createdAt: "2026-08-17T08:30:00.000Z",
    updatedAt: "2026-08-17T08:30:00.000Z",
    shortDescription: "7 nguồn sức mạnh tạo ra lợi nhuận vượt trội bền vững và rào cản bất khả xâm phạm.",
    readTime: "8 phút",
  },
  {
    id: "unit-economics-saas",
    slug: "unit-economics-saas",
    title: "Đơn vị Kinh tế Cốt lõi (Unit Economics): LTV / CAC & Thời gian hoàn vốn",
    pillar: "BUSINESS_STRATEGY",
    category: "Chiến lược Kinh doanh",
    displaySize: "SQUARE_SM",
    academicFormula: "\\frac{\\text{LTV}}{\\text{CAC}} \\ge 3.0 \\quad \\& \\quad \\text{Payback Period} \\le 12 \\text{ months}",
    summarySnippet:
      "Quy luật sống còn của mô hình kinh doanh số. Nếu từng đơn vị khách hàng không tạo ra lợi nhuận ròng sau chi phí thu hút, mở rộng quy mô chỉ dẫn tới phá sản nhanh hơn.",
    keyTakeaways: [
      "Tỷ lệ LTV/CAC tối thiểu đạt 3x để duy trì tái đầu tư.",
      "Thời gian hoàn vốn (CAC Payback) quyết định nhu cầu vốn lưu động.",
      "Net Revenue Retention (NRR) trên 115% chứng minh Product-Market Fit vững.",
    ],
    schematicSvg: `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 75 L45 50 L65 60 L85 25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="85" cy="25" r="4" fill="currentColor"/>
    </svg>`,
    fullContent: `
      <h2>1. Phương trình toán học LTV</h2>
      <p>LTV (Customer Lifetime Value) = (ARPU × Gross Margin %) / Churn Rate. Khi tỷ lệ Churn giảm một nửa, LTV sẽ tăng gấp đôi mà không tốn thêm 1 đồng chi phí quảng cáo.</p>
    `,
    accessLevel: "FREE",
    readingTimeMinutes: 5,
    status: "PUBLISHED",
    views: 4120,
    likes: 310,
    dislikes: 2,
    author: "Ban Biên Tập Think & Rich",
    tags: ["SaaS", "Unit Economics", "LTV", "CAC", "Tài chính"],
    createdAt: "2026-08-18T16:00:00.000Z",
    updatedAt: "2026-08-18T16:00:00.000Z",
    shortDescription: "Quy luật sống còn của mô hình kinh doanh số: LTV/CAC và CAC Payback.",
    readTime: "5 phút",
  },
  {
    id: "blitzscaling-defensibility",
    slug: "blitzscaling-defensibility",
    title: "Blitzscaling: Tăng trưởng chớp nhoáng & Độc chiếm thị trường",
    pillar: "BUSINESS_STRATEGY",
    category: "Chiến lược Kinh doanh",
    displaySize: "SQUARE_MD",
    academicFormula: "\\text{Speed} > \\text{Efficiency} \\quad \\text{khi rủi ro lớn nhất là chậm trễ}",
    summarySnippet:
      "Khung chiến lược của Reid Hoffman (LinkedIn): Chấp nhận sự thiếu hiệu quả trong vận hành để ưu tiên tốc độ chiếm lĩnh thị trường mạng lưới người thắng hưởng tất.",
    keyTakeaways: [
      "Winner-Take-Most / Winner-Take-All Market Dynamics.",
      "Quản lý sự hỗn loạn khi tổ chức tăng quy mô 10x mỗi năm.",
      "Khi nào nên Blitzscale và khi nào KHÔNG ĐƯỢC áp dụng.",
    ],
    schematicSvg: `<svg viewBox="0 0 160 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 80 Q 70 75 90 40 T 140 15" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="140" cy="15" r="5" fill="currentColor"/>
      <text x="50" y="45" font-size="8" fill="currentColor">Blitz</text>
    </svg>`,
    fullContent: `
      <h2>1. Nghịch lý Blitzscaling</h2>
      <p>Trong điều kiện bình thường, quản trị kinh doanh luôn hướng tới tối ưu hóa chi phí và hiệu quả. Nhưng trong thị trường có hiệu ứng mạng lưới khổng lồ, công ty đạt quy mô tới hạn trước tiên sẽ chiếm lĩnh toàn bộ giá trị.</p>
    `,
    accessLevel: "MEMBER_PRO",
    readingTimeMinutes: 7,
    status: "PUBLISHED",
    views: 2650,
    likes: 210,
    dislikes: 2,
    author: "Reid Hoffman / Think & Rich",
    tags: ["Reid Hoffman", "Blitzscaling", "Silicon Valley"],
    createdAt: "2026-08-19T13:00:00.000Z",
    updatedAt: "2026-08-19T13:00:00.000Z",
    shortDescription: "Chấp nhận sự thiếu hiệu quả trong vận hành để ưu tiên tốc độ độc chiếm thị trường.",
    readTime: "7 phút",
  },

  // ----------------------------------------------------
  // TRỤ CỘT 3: STARTUP IDEAS (Ý TƯỞNG KHỞI NGHIỆP)
  // ----------------------------------------------------
  {
    id: "regulatory-tech-saas-teardown",
    slug: "regulatory-tech-saas-teardown",
    title: "Regulatory Tech Micro-SaaS: Tự động hóa kiểm định tuân thủ AI & ESG",
    pillar: "STARTUP_IDEA",
    category: "Deep-dive Teardown",
    displaySize: "SQUARE_LG",
    academicFormula: "\\text{Opportunity} = \\text{Compliance Cost} \\times \\Delta \\text{Penalty Risk} \\times \\text{API Automation}",
    summarySnippet:
      "Hồ sơ phân tích cơ hội thị trường 12 tỷ USD: Xây dựng công cụ kiểm tra và cấp chứng chỉ tuân thủ quy chuẩn AI Act & chuẩn phát thải Scope 3 tự động cho doanh nghiệp vừa và nhỏ.",
    keyTakeaways: [
      "Khoảng trống thị trường: Luật mới ban hành nhưng thiếu công cụ triển khai mức giá rẻ.",
      "Mô hình doanh thu: Thu phí thuê bao định kỳ + Phí kiểm định theo lượt báo cáo.",
      "Rào cản gia nhập: Xây dựng bộ quy chuẩn dữ liệu độc quyền.",
    ],
    schematicSvg: `<svg viewBox="0 0 180 120" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="40" width="40" height="40" rx="8" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <text x="35" y="63" font-size="8" text-anchor="middle" fill="currentColor">Raw Data</text>
      <path d="M58 60 L78 60" stroke="currentColor" stroke-width="1.5"/>
      <polygon points="90,40 110,60 90,80 70,60" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
      <text x="90" y="63" font-size="7" text-anchor="middle" font-weight="bold" fill="currentColor">RegEngine</text>
      <path d="M112 60 L132 60" stroke="currentColor" stroke-width="1.5"/>
      <rect x="135" y="40" width="35" height="40" rx="8" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <text x="152" y="63" font-size="8" text-anchor="middle" fill="currentColor">Audit Pass</text>
    </svg>`,
    fullContent: `
      <h2>1. Tín hiệu thị trường & Nỗi đau ngành</h2>
      <p>Liên minh Châu Âu (EU) ban hành AI Act và quy định báo cáo phát thải ESG bắt buộc. Hàng trăm ngàn doanh nghiệp SMB đang đối mặt với án phạt hàng triệu Euro nhưng không đủ ngân sách thuê các hãng kiểm toán Big 4.</p>
      <h2>2. Cấu trúc sản phẩm cốt lõi</h2>
      <ul>
        <li><strong>API Ingestion</strong>: Thu thập metadata từ hệ thống CI/CD hoặc hóa đơn năng lượng.</li>
        <li><strong>Rule Validator</strong>: Đối soát với 180+ điều khoản pháp lý bằng mô hình ngôn ngữ chuyên sâu.</li>
        <li><strong>One-click Certified Export</strong>: Xuất báo cáo PDF chuẩn mực có gắn chữ ký số.</li>
      </ul>
      <h2>3. Lộ trình Go-to-Market (GTM)</h2>
      <p>Tập trung tiếp cận các công ty công nghệ B2B chuẩn bị gọi vốn Series A/B cần hoàn tất hồ sơ Due Diligence pháp lý.</p>
    `,
    accessLevel: "FREE",
    readingTimeMinutes: 7,
    status: "PUBLISHED",
    views: 4890,
    likes: 412,
    dislikes: 1,
    author: "Venture Intelligence Desk",
    tags: ["RegTech", "ESG", "EU AI Act", "Micro-SaaS", "Teardown"],
    createdAt: "2026-08-17T15:00:00.000Z",
    updatedAt: "2026-08-17T15:00:00.000Z",
    shortDescription: "Cơ hội thị trường 12 tỷ USD: Tự động hóa kiểm định tuân thủ luật AI & ESG cho SMBs.",
    readTime: "7 phút",
  },
  {
    id: "vertical-erp-specialty-manufacturing",
    slug: "vertical-erp-specialty-manufacturing",
    title: "Vertical ERP ngách cho xưởng sản xuất thiết bị y tế & phòng thí nghiệm",
    pillar: "STARTUP_IDEA",
    category: "Ý tưởng Khởi nghiệp",
    displaySize: "SQUARE_MD",
    academicFormula: "\\text{TAM} = 45{,}000 \\text{ Labs} \\times \\$18{,}000/\\text{yr} = \\$810\\text{M ARR}",
    summarySnippet:
      "Thay thế các phần mềm kế toán rời rạc bằng hệ thống ERP chuyên biệt hóa cho chu trình kiểm nghiệm, quản lý hóa chất độc hại và chứng nhận ISO 13485.",
    keyTakeaways: [
      "Phần mềm ngang hàng (SAP/Oracle) quá đắt và không đáp ứng tiêu chuẩn phòng Lab.",
      "Tỷ lệ rời bỏ (Churn) cực thấp (< 3%/năm) do chi phí chuyển đổi dữ liệu cao.",
      "Tích hợp IoT cân đo tự động giảm 90% lỗi con người.",
    ],
    schematicSvg: `<svg viewBox="0 0 160 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="35" height="60" rx="4" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <rect x="65" y="20" width="35" height="60" rx="4" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
      <rect x="110" y="20" width="35" height="60" rx="4" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <text x="82" y="55" font-size="8" text-anchor="middle" fill="currentColor">ERP Lab</text>
    </svg>`,
    fullContent: `
      <h2>1. Tại sao Vertical ERP là xu hướng thống trị thập kỷ mới?</h2>
      <p>Các giải pháp phần mềm tổng quát đã bão hòa. Cơ hội lớn nhất hiện nay thuộc về việc phục vụ sâu sắc một ngành nghề ngách có rào cản kỹ thuật cao.</p>
    `,
    accessLevel: "MEMBER_PLUS",
    readingTimeMinutes: 6,
    status: "PUBLISHED",
    views: 3200,
    likes: 275,
    dislikes: 1,
    author: "Venture Intelligence Desk",
    tags: ["Vertical SaaS", "ERP", "Y tế", "B2B"],
    createdAt: "2026-08-18T10:20:00.000Z",
    updatedAt: "2026-08-18T10:20:00.000Z",
    shortDescription: "ERP chuyên biệt hóa cho chu trình kiểm nghiệm và chứng nhận y tế ISO 13485.",
    readTime: "6 phút",
  },
  {
    id: "cross-border-logistics-arbitrage",
    slug: "cross-border-logistics-arbitrage",
    title: "Nền tảng Tối ưu Kho vận Xuyên biên giới & Tự động tính Thuế quan",
    pillar: "STARTUP_IDEA",
    category: "Deep-dive Teardown",
    displaySize: "SQUARE_SM",
    academicFormula: "\\text{Margin} = \\text{Freight Consolidation} - \\text{Customs Clearance Overhead}",
    summarySnippet:
      "Tích hợp dữ liệu biểu thuế quan hải quan thời gian thực để tự động đề xuất lộ trình gom hàng đa phương thức rẻ nhất cho nhà bán lẻ e-Commerce.",
    keyTakeaways: [
      "Hợp nhất đơn hàng (Consolidation) tiết kiệm 35% cước hàng không.",
      "Tự động tính thuế DDP (Delivered Duty Paid) chính xác 99.8%.",
      "Plug-in kết nối trực tiếp Shopify & Amazon FBA.",
    ],
    schematicSvg: `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="50" r="14" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="70" cy="50" r="14" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
      <path d="M44 50 L56 50" stroke="currentColor" stroke-width="2"/>
    </svg>`,
    fullContent: `
      <h2>1. Bài toán hải quan xuyên biên giới</h2>
      <p>Nhà bán lẻ quốc tế mất tới 15% doanh thu vì các khoản phí ẩn và tiền phạt phân loại sai mã HS Code. Phần mềm tự động giải quyết dứt điểm vấn đề này bằng thị giác máy tính và cơ sở dữ liệu luật hải quan.</p>
    `,
    accessLevel: "FREE",
    readingTimeMinutes: 4,
    status: "PUBLISHED",
    views: 2980,
    likes: 230,
    dislikes: 1,
    author: "Venture Intelligence Desk",
    tags: ["Logistics", "Cross-border", "eCommerce", "Thuế quan"],
    createdAt: "2026-08-19T09:15:00.000Z",
    updatedAt: "2026-08-19T09:15:00.000Z",
    shortDescription: "Tự động tính thuế quan và tối ưu hóa lộ trình gom hàng vận chuyển xuyên biên giới.",
    readTime: "4 phút",
  },
  {
    id: "ai-patent-intelligence-copilot",
    slug: "ai-patent-intelligence-copilot",
    title: "AI Bằng sáng chế & Phân tích Bản đồ Công nghệ Đối thủ",
    pillar: "STARTUP_IDEA",
    category: "Ý tưởng Khởi nghiệp",
    displaySize: "SQUARE_MD",
    academicFormula: "\\text{Patent Defense} = \\text{Semantic Search}(\\mathcal{D}_{\\text{Prior Art}}) \\cap \\text{Claim Matrix}",
    summarySnippet:
      "Công cụ quét và đối soát hàng triệu hồ sơ sáng chế USPTO / EPO để cảnh báo vi phạm bản quyền và phát hiện các cụm bằng sáng chế chưa được bảo hộ.",
    keyTakeaways: [
      "Chi phí luật sư sáng chế trung bình $600/giờ -> Công cụ AI giảm 80% thời gian nghiên cứu.",
      "Bản đồ nhiệt công nghệ (Technology Landscape Heatmap) cho các quỹ đầu tư VC.",
      "Tạo báo cáo Freedom-to-Operate (FTO) tự động.",
    ],
    schematicSvg: `<svg viewBox="0 0 160 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/>
      <circle cx="110" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/>
      <path d="M70 50 A 25 25 0 0 1 90 50 A 25 25 0 0 1 70 50" fill="currentColor" fill-opacity="0.3"/>
      <text x="80" y="53" font-size="8" text-anchor="middle" fill="currentColor">Patent Gap</text>
    </svg>`,
    fullContent: `
      <h2>1. Thị trường sở hữu trí tuệ công nghệ cao</h2>
      <p>Hàng năm có hơn 3.5 triệu bằng sáng chế mới được nộp. Các công ty R&D lớn và quỹ DeepTech VC cần liên tục quét không gian giải pháp để bảo vệ sản phẩm trước những kẻ đầu cơ bằng sáng chế (Patent Trolls).</p>
    `,
    accessLevel: "MEMBER_PRO",
    readingTimeMinutes: 7,
    status: "PUBLISHED",
    views: 2450,
    likes: 190,
    dislikes: 0,
    author: "Venture Intelligence Desk",
    tags: ["AI", "Bằng sáng chế", "Sở hữu trí tuệ", "DeepTech"],
    createdAt: "2026-08-20T11:00:00.000Z",
    updatedAt: "2026-08-20T11:00:00.000Z",
    shortDescription: "Quét và đối soát hàng triệu bằng sáng chế toàn cầu bằng AI.",
    readTime: "7 phút",
  },
];

export const SEED_USERS: UserRecord[] = [
  {
    id: "admin-1",
    email: "admin@thinkandrich.com",
    name: "Admin Think & Rich",
    role: "ADMIN",
    tier: "PRO",
    countryCode: "VN",
    preferredLang: "vi",
    createdAt: "2026-08-01T00:00:00.000Z",
    lastLoginAt: "2026-08-23T06:00:00.000Z",
    readPosts: [
      "first-principles-thinking",
      "the-flywheel-effect",
      "7-powers-economic-moats",
      "regulatory-tech-saas-teardown",
      "inversion-principle",
    ],
    bookmarkedPosts: ["first-principles-thinking", "7-powers-economic-moats", "regulatory-tech-saas-teardown"],
    likedPosts: ["first-principles-thinking", "the-flywheel-effect", "regulatory-tech-saas-teardown"],
    dislikedPosts: [],
  },
  {
    id: "user-minhtri",
    email: "minhtri.founder@gmail.com",
    name: "Minh Trí",
    role: "USER",
    tier: "FREE",
    countryCode: "VN",
    preferredLang: "vi",
    createdAt: "2026-08-05T10:20:00.000Z",
    lastLoginAt: "2026-08-23T05:30:00.000Z",
    dailyReads: { date: "2026-08-23", count: 4 },
    readPosts: [
      "first-principles-thinking",
      "inversion-principle",
      "the-flywheel-effect",
      "cross-border-logistics-arbitrage",
    ],
    bookmarkedPosts: ["first-principles-thinking", "the-flywheel-effect"],
    likedPosts: ["first-principles-thinking", "the-flywheel-effect"],
    dislikedPosts: [],
  },
];

export const SEED_READ_LOGS: ReadLog[] = [
  {
    id: "log-1",
    userId: "user-minhtri",
    userEmail: "minhtri.founder@gmail.com",
    userName: "Minh Trí",
    postId: "first-principles-thinking",
    postTitle: "Nguyên lý Đệ nhất (First Principles Thinking)",
    pillar: "MENTAL_MODEL",
    readAt: "2026-08-23T05:30:00.000Z",
    reaction: "like",
  },
  {
    id: "log-2",
    userId: "user-minhtri",
    userEmail: "minhtri.founder@gmail.com",
    userName: "Minh Trí",
    postId: "the-flywheel-effect",
    postTitle: "Bánh đà Tăng trưởng (The Flywheel Effect)",
    pillar: "BUSINESS_STRATEGY",
    readAt: "2026-08-23T04:45:00.000Z",
    reaction: "like",
  },
];

// Tự động tạo 50 bài viết giả để test thuật toán lưới
const dummyTitles = [
  // Ngắn (ưu tiên ô 2x2)
  "Bẫy tâm lý cơ bản", "Chiến lược giá", "Tư duy khác biệt", "Khởi nghiệp tinh gọn", "Lợi thế cạnh tranh",
  // Vừa (ưu tiên ô 3x3 hoặc 2x2)
  "Quy luật 80/20 trong việc tối ưu hóa hiệu suất làm việc",
  "Làm thế nào để xây dựng một văn hóa doanh nghiệp bền vững?",
  "Bản chất của tiền tệ và những nguyên lý tài chính cá nhân",
  "Tư duy hệ thống: Nhìn nhận bức tranh toàn cảnh của doanh nghiệp",
  // Dài (ưu tiên ô 4x4 hoặc 3x3)
  "Nguyên lý Đệ nhất (First Principles Thinking): Phân rã vấn đề về chân lý nền tảng để tái cấu trúc giải pháp đột phá, loại bỏ tư duy sao chép tương đối trong thời đại thay đổi liên tục.",
  "Hiệu ứng Bánh đà (The Flywheel Effect): Bí quyết xây dựng quán tính tăng trưởng không thể cản phá của Amazon và cách áp dụng vào mô hình kinh doanh SME.",
  "Chiến lược Đại dương Xanh: Cách tạo ra không gian thị trường không cạnh tranh, biến đối thủ trở nên không liên quan bằng cách tái định nghĩa giá trị cốt lõi."
];

// Seeded PRNG (not Math.random()) — this module runs during SSR *and*
// during client hydration, each a separate module evaluation. Math.random()
// and Date.now() would draw different values each time, so the numbers
// the server sent down wouldn't match what the client computes on mount,
// which React reports as a hydration mismatch (and reacts to by discarding
// and re-rendering the affected subtree — visible as a jump/flash). A
// seeded generator produces the same sequence every time, server or client.
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Fixed anchor instead of Date.now(), for the same reason.
const DUMMY_SEED_ANCHOR = new Date("2026-01-01T00:00:00.000Z").getTime();

const dummyPosts: Post[] = Array.from({ length: 50 }).map((_, i): Post => {
  const titleCategory = i % 3; // 0: ngắn, 1: vừa, 2: dài
  const titleBase = dummyTitles[titleCategory * 4 + (i % 4)] || dummyTitles[i % dummyTitles.length];
  const pillar: PillarType = i % 2 === 0 ? "MENTAL_MODEL" : "BUSINESS_STRATEGY";
  const accessLevel: ContentAccessLevel =
    i % 4 === 0 ? "MEMBER_PRO" : i % 3 === 0 ? "MEMBER_PLUS" : "FREE";
  const rand = seededRandom(1000 + i);

  return {
    id: `dummy-post-${i}`,
    slug: `dummy-post-${i}`,
    title: `[Seed ${i+1}] ${titleBase}`,
    pillar,
    category: "Thử nghiệm Lưới",
    displaySize: "SQUARE_SM",
    summarySnippet: "Đây là dữ liệu tự động tạo ra nhằm kiểm tra thuật toán Continuous Skyline Tiling và Elastic Dispatcher trên diện rộng với số lượng bài viết lớn.",
    keyTakeaways: ["Kiểm tra độ khít lưới", "Kiểm tra Container Queries font-size", "Kiểm tra sự đa dạng kích thước (Variety Rule)"],
    schematicSvg: "",
    fullContent: "<p>Nội dung thử nghiệm hiển thị chi tiết.</p>",
    accessLevel,
    readingTimeMinutes: Math.floor(rand() * 10) + 1,
    status: "PUBLISHED",
    views: Math.floor(rand() * 5000),
    likes: Math.floor(rand() * 500),
    dislikes: Math.floor(rand() * 10),
    author: "Thuật toán Seed",
    tags: ["Test", "UI/UX", "Bento Grid"],
    createdAt: new Date(DUMMY_SEED_ANCHOR - i * 86400000).toISOString(),
    updatedAt: new Date(DUMMY_SEED_ANCHOR - i * 86400000).toISOString(),
    shortDescription: "Dữ liệu test grid.",
    readTime: "3 phút",
  };
});

SEED_POSTS.push(...dummyPosts);
