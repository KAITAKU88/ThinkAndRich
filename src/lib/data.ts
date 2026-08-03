import type { Idea } from "./types";

export const CATEGORIES = [
  "Tất cả",
  "AI",
  "SaaS",
  "F&B",
  "Bán lẻ",
  "Fintech",
  "Sức khỏe",
  "Giáo dục",
] as const;

export const PLANS = [
  {
    id: "FREE" as const,
    name: "Free",
    priceVnd: 0,
    priceLabel: "0đ",
    period: "/ mãi mãi",
    features: [
      "Xem toàn bộ danh sách ý tưởng",
      "Đọc đầy đủ ý tưởng miễn phí",
      "Lưu tối đa 5 ý tưởng",
    ],
  },
  {
    id: "PREMIUM" as const,
    name: "Premium",
    priceVnd: 199000,
    priceLabel: "199.000đ",
    period: "/ mỗi tháng",
    highlighted: true,
    features: [
      "Mở khoá ý tưởng đã thành công",
      "Kế hoạch triển khai & số liệu tài chính",
      "Lưu không giới hạn",
      "Xuất PDF từng ý tưởng",
    ],
  },
  {
    id: "SUPER" as const,
    name: "Super",
    priceVnd: 399000,
    priceLabel: "399.000đ",
    period: "/ mỗi tháng",
    features: [
      "Mở khoá ý tưởng Super (chưa ai làm)",
      "Mọi quyền lợi Premium",
      "Báo cáo ngành hàng tháng",
      "Hỗ trợ ưu tiên 1:1",
    ],
  },
];

export const DEFAULT_SETTINGS = {
  brandName: "IdeaVault",
  primaryColor: "#1D4ED8",
  seoDefaultTitle: "IdeaVault — Thư viện ý tưởng khởi nghiệp",
};

export const CHART_DATA = [
  { name: "T1", users: 12, revenue: 4 },
  { name: "T2", users: 19, revenue: 7 },
  { name: "T3", users: 28, revenue: 11 },
  { name: "T4", users: 35, revenue: 14 },
  { name: "T5", users: 48, revenue: 22 },
  { name: "T6", users: 62, revenue: 31 },
];

export const SEED_IDEAS: Idea[] = [
  {
    id: "1",
    title: "AI Agent chăm sóc khách hàng cho SME",
    shortDescription:
      "Bot trả lời đa kênh (Zalo, Facebook, Website), học từ FAQ nội bộ và chuyển người thật khi cần.",
    fullContent: `<h2>Vấn đề thị trường</h2><p>Doanh nghiệp nhỏ mất nhiều giờ mỗi ngày để trả lời tin nhắn trên nhiều kênh, dẫn đến mất khách và trải nghiệm không đồng đều.</p><h2>Cách triển khai</h2><ul><li>Tuần 1-2: phỏng vấn khách hàng và thu thập FAQ</li><li>Tuần 3-6: xây MVP tích hợp Zalo OA + web chat</li><li>Tuần 7+: huấn luyện model và mở rộng Messenger</li></ul><h2>Số liệu tài chính</h2><p>Giá bán trung bình 149 USD/tháng, biên lợi nhuận 72%.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
    category: "AI",
    status: "PUBLISHED",
    isPremiumOnly: false,
    requiresPremium: false,
    views: 18420,
    location: "Singapore",
    createdAt: "2026-07-28",
    isTrending: true,
    seoTitle: "AI Agent CSKH cho SME",
    seoDescription: "Bot CSKH đa kênh cho doanh nghiệp nhỏ",
  },
  {
    id: "2",
    title: "SaaS quản lý tiến độ cho nhà thầu xây dựng",
    shortDescription:
      "Theo dõi công việc hiện trường, ảnh nhật ký và báo cáo tự động gửi chủ đầu tư mỗi tuần.",
    fullContent: `<h2>Vấn đề</h2><p>Nhà thầu vẫn dùng Excel và nhóm chat để theo dõi tiến độ, dễ sai lệch và thiếu minh bạch với chủ đầu tư.</p><h2>Giải pháp</h2><p>Ứng dụng mobile cho giám sát công trường, đồng bộ ảnh nhật ký và tự sinh báo cáo tuần.</p><h2>Mô hình kinh doanh</h2><p>Subscription theo số dự án đang mở: $79–$299/tháng.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop",
    category: "SaaS",
    status: "PUBLISHED",
    isPremiumOnly: false,
    requiresPremium: true,
    views: 12980,
    location: "Hoa Kỳ",
    createdAt: "2026-07-25",
    seoTitle: "SaaS tiến độ xây dựng",
  },
  {
    id: "3",
    title: "Chuỗi cà phê mini nhượng quyền chi phí thấp",
    shortDescription:
      "Mô hình 12–18m², menu tối giản 8 món, break-even khoảng 8–10 tháng tại mặt bằng trung tâm.",
    fullContent: `<h2>Tổng quan</h2><p>Kiot cà phê diện tích nhỏ, menu cố định, vận hành 2 người/ca.</p><h2>Số liệu</h2><p>Vốn ban đầu ~400–600 triệu VND. Biên gộp đồ uống 65–70%.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop",
    category: "F&B",
    status: "PUBLISHED",
    isPremiumOnly: false,
    requiresPremium: true,
    views: 24310,
    location: "Việt Nam",
    createdAt: "2026-07-20",
  },
  {
    id: "4",
    title: "Marketplace thuê thiết bị sự kiện theo giờ",
    shortDescription:
      "Kết nối chủ máy chiếu, âm thanh, ánh sáng với freelancer tổ chức event — thanh toán escrow.",
    fullContent: `<h2>Cơ hội</h2><p>Thị trường event SME tăng nhanh nhưng thiết bị đắt và ít dùng hết công suất.</p><h2>Mô hình</h2><p>Take rate 12–15% mỗi giao dịch + phí bảo hiểm thiết bị.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop",
    category: "Bán lẻ",
    status: "PUBLISHED",
    isPremiumOnly: true,
    requiresPremium: true,
    views: 8750,
    location: "Indonesia",
    createdAt: "2026-07-27",
    isTrending: true,
  },
  {
    id: "5",
    title: "App quản lý chi tiêu nhóm bạn đi du lịch",
    shortDescription:
      "Chia bill thông minh theo người/món, đồng bộ tỷ giá và xuất báo cáo cuối chuyến.",
    fullContent: `<h2>Vấn đề</h2><p>Nhóm đi chơi hay tranh cãi vì chia tiền thủ công và quên giao dịch.</p><h2>Giải pháp</h2><p>Scan hóa đơn OCR, gợi ý chia đều hoặc theo món, settle qua QR ngân hàng.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=800&auto=format&fit=crop",
    category: "Fintech",
    status: "PUBLISHED",
    isPremiumOnly: false,
    requiresPremium: false,
    views: 15200,
    location: "Thái Lan",
    createdAt: "2026-07-26",
  },
  {
    id: "6",
    title: "Nền tảng đặt lịch khám chuyên khoa online",
    shortDescription:
      "Ghép bác sĩ độc lập với bệnh nhân, nhắc tái khám và lưu hồ sơ sức khỏe cơ bản.",
    fullContent: `<h2>Giải pháp</h2><p>Marketplace booking + teleconsult cho bác sĩ ngoài bệnh viện công.</p><h2>Doanh thu</h2><p>Hoa hồng 10% mỗi lịch khám + gói clinic SaaS.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop",
    category: "Sức khỏe",
    status: "PUBLISHED",
    isPremiumOnly: false,
    requiresPremium: true,
    views: 11040,
    location: "Việt Nam",
    createdAt: "2026-07-22",
    isTrending: true,
  },
  {
    id: "7",
    title: "LMS nội bộ cho chuỗi bán lẻ nhiều cửa hàng",
    shortDescription:
      "Đào tạo SOP, quiz chứng nhận và bảng xếp hạng nhân viên theo khu vực.",
    fullContent: `<h2>Pain point</h2><p>Chuỗi bán lẻ khó chuẩn hóa kiến thức sản phẩm khi tuyển dụng nhanh.</p><h2>Product</h2><p>Mobile-first LMS với video ngắn, quiz và chứng chỉ nội bộ.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
    category: "Giáo dục",
    status: "PUBLISHED",
    isPremiumOnly: false,
    requiresPremium: false,
    views: 6890,
    location: "Malaysia",
    createdAt: "2026-07-18",
  },
  {
    id: "8",
    title: "Công cụ SEO nội dung đa ngôn ngữ bằng AI",
    shortDescription:
      "Nghiên cứu từ khóa, draft bài và kiểm tra E-E-A-T trước khi xuất bản.",
    fullContent: `<h2>Định vị</h2><p>Dành cho agency content Đông Nam Á cần xuất bản EN/VI/ID cùng lúc.</p><h2>Pricing</h2><p>Freemium + Pro $39/tháng theo số bài xuất bản.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
    category: "AI",
    status: "PUBLISHED",
    isPremiumOnly: true,
    requiresPremium: true,
    views: 22100,
    location: "Hàn Quốc",
    createdAt: "2026-07-29",
  },
  {
    id: "9",
    title: "Subscription box nông sản sạch theo mùa",
    shortDescription:
      "Kết nối nông trại sạch với hộ gia đình thành phố, giao hàng cố định mỗi tuần.",
    fullContent: `<h2>Mô hình</h2><p>Hộp rau củ theo mùa, giao thứ 3 và thứ 6 hàng tuần.</p><h2>Unit economics</h2><p>ARPU ~450k/tháng, churn mục tiêu dưới 8%.</p>`,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1488459716781-31a44007c5e7?q=80&w=800&auto=format&fit=crop",
    category: "F&B",
    status: "PUBLISHED",
    isPremiumOnly: false,
    requiresPremium: true,
    views: 9340,
    location: "Việt Nam",
    createdAt: "2026-07-15",
  },
];
