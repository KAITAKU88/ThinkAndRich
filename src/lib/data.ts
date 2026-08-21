import type { Post, PostCategory, UserRecord, ReadLog, AppSettings, PricingPlan } from "./types";

export const CATEGORIES: readonly ("Tất cả" | PostCategory)[] = [
  "Tất cả",
  "Mô hình Tư duy",
  "Mô hình Tâm trí",
  "Chiến lược Kinh doanh",
  "Tâm lý học & Quyết định",
  "Hiệu ứng & Định luật",
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  brandName: "Think & Rich",
  brandTagline: "Khai phóng tư duy — Đột phá chiến lược",
  primaryColor: "#0f766e",
  seoDefaultTitle: "Think & Rich — Thư viện Mô hình Tư duy & Chiến lược Kinh doanh",
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "FREE",
    name: "Gói Free",
    tagline: "Dành cho người mới bắt đầu tiếp cận các mô hình tư duy",
    price: 0,
    priceFormatted: "0đ",
    dailyLimitText: "Đọc tối đa 10 bài viết / ngày",
    features: [
      "Đăng nhập xác thực nhanh bằng Email OTP",
      "Đọc tối đa 10 bài viết tiêu chuẩn mỗi ngày",
      "Xem video YouTube phân tích tích hợp",
      "Lưu bài viết vào Tủ sách cá nhân",
      "Thả tim, tương tác và theo dõi tiến độ",
      "Không hỗ trợ các bài viết chuyên sâu Member",
    ],
    ctaText: "Đang sử dụng",
  },
  {
    id: "PLUS",
    name: "Gói Plus",
    tagline: "Đọc 15 bài/ngày & Mở khóa toàn bộ bài viết Member",
    price: 299000,
    priceFormatted: "299.000đ/năm",
    dailyLimitText: "Đọc tối đa 15 bài viết / ngày",
    badge: "Tiết kiệm",
    psychologyNote: "Gói đòn bẩy tâm lý (Decoy) — chỉ thêm 200k để lên Gói Pro Không Giới Hạn",
    features: [
      "Mở khóa TOÀN BỘ bài viết (bao gồm cả bài viết Member)",
      "Đọc tối đa 15 bài viết chuyên sâu mỗi ngày",
      "Truy cập các sơ đồ tư duy Mindmap độ phân giải cao",
      "Lưu trữ không giới hạn tủ sách cá nhân",
      "Trải nghiệm đọc tinh gọn không phân tâm",
    ],
    ctaText: "Nâng cấp Gói Plus (299k)",
  },
  {
    id: "PRO",
    name: "Gói Pro",
    tagline: "Truy cập KHÔNG GIỚI HẠN toàn bộ kho tàng tri thức",
    price: 499000,
    priceFormatted: "499.000đ/năm",
    dailyLimitText: "Đọc KHÔNG GIỚI HẠN bài viết mỗi ngày",
    isPopular: true,
    badge: "Khuyên dùng — Lựa chọn Tốt nhất",
    psychologyNote: "Hiệu ứng mỏ neo giá (Price Anchoring) & Tối đa hóa giá trị tri thức trọn đời",
    features: [
      "Đọc KHÔNG GIỚI HẠN mọi bài viết mỗi ngày",
      "Mở khóa 100% bài viết Member và phân tích chiến lược mật",
      "Tải trọn bộ Ebook & Sơ đồ Tư duy PDF vector",
      "Tham gia Nhóm độc quyền thảo luận cùng các Founder",
      "Quyền truy cập sớm các mô hình tư duy mới mỗi tuần",
      "Huy hiệu Thành viên Tinh hoa trên trang cá nhân",
    ],
    ctaText: "Nâng cấp Gói Pro (499k)",
  },
];



export const SEED_POSTS: Post[] = [
  {
    id: "first-principles-thinking",
    slug: "first-principles-thinking",
    title: "Mô hình Tư duy Nguyên lý Đầu tiên (First Principles Thinking)",
    category: "Mô hình Tư duy",
    shortDescription:
      "Cách Elon Musk và Aristotle phá vỡ mọi giả định có sẵn để tái định nghĩa ngành công nghiệp hàng không vũ trụ và xe điện từ những chân lý cơ bản nhất.",
    fullContent: `
      <h2>1. Nguyên lý đầu tiên là gì?</h2>
      <p>Nguyên lý đầu tiên (First Principles) là phương pháp tư duy bằng cách <strong>phân rã một vấn đề phức tạp thành những sự thật cơ bản, cốt lõi nhất không thể chia nhỏ hơn nữa</strong>, sau đó suy luận và xây dựng giải pháp ngược trở lên từ điểm xuất phát đó.</p>
      
      <blockquote>
        "Tôi nghĩ quá trình tư duy của hầu hết mọi người bị ràng buộc bởi việc sao chép tương đối (Reasoning by Analogy). Trong khi với Nguyên lý đầu tiên, bạn nhìn thẳng vào những chân lý nền tảng nhất và tự hỏi: 'Điều gì chúng ta chắc chắn là đúng?' rồi mới lập luận từ đó."
        <br />— <em>Elon Musk</em>
      </blockquote>

      <h2>2. Ví dụ kinh điển: Cách SpaceX giảm 90% chi phí tên lửa</h2>
      <p>Khi Elon Musk muốn mua tên lửa sang Nga, người ta chào giá 65 triệu USD cho một quả tên lửa. Thay vì chấp nhận mức giá thị trường:</p>
      <ul>
        <li><strong>Bước 1: Phân rã nguyên vật liệu</strong>: Tên lửa được làm bằng gì? Hợp kim nhôm cấp hàng không vũ trụ, titan, đồng, sợi carbon.</li>
        <li><strong>Bước 2: Định giá nguyên liệu thô</strong>: Chi phí nguyên vật liệu trên sàn giao dịch hàng hóa London chỉ chiếm khoảng <strong>2%</strong> giá thành của một quả tên lửa hoàn thiện.</li>
        <li><strong>Bước 3: Tự chế tạo từ đầu</strong>: SpaceX quyết định tự gia công 85% linh kiện trong nội bộ, cắt bỏ chuỗi cung ứng trung gian cồng kềnh, giảm giá thành mỗi lần phóng xuống mức kỷ lục.</li>
      </ul>

      <h2>3. Khung 3 bước ứng dụng trong kinh doanh & cuộc sống</h2>
      <ol>
        <li><strong>Nhận diện và nghi ngờ các giả định hiện tại</strong>: Liệt kê tất cả những niềm tin bạn đang coi là "hiển nhiên" (Ví dụ: "Làm khóa học online phải tốn tiền quay phòng studio").</li>
        <li><strong>Phân tách vấn đề về chân lý nền tảng</strong>: Bản chất cốt lõi giá trị khách hàng nhận được là gì? (Ví dụ: Kiến thức cô đọng, dễ hiểu, giải quyết được nỗi đau).</li>
        <li><strong>Kiến tạo giải pháp mới từ nền móng</strong>: Kết hợp lại các yếu tố cốt lõi mà không bị trói buộc bởi cách người khác từng làm.</li>
      </ol>

      <div class="p-4 my-6 rounded-xl border border-primary/20 bg-primary/5">
        <h3 class="font-semibold text-primary mb-2">💡 Bài học đúc kết cho Founder</h3>
        <p class="text-sm mb-0">Đừng bao giờ tối ưu hóa một thứ vốn dĩ không nên tồn tại. Hãy luôn tự hỏi: Nếu bắt đầu lại từ con số 0 trong ngày hôm nay với công nghệ hiện có, chúng ta sẽ thiết kế sản phẩm này như thế nào?</p>
      </div>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/NV3sBlRgzTI",
    author: "Ban Biên Tập Think & Rich",
    readTime: "6 phút đọc",
    status: "PUBLISHED",
    views: 3420,
    likes: 248,
    dislikes: 6,
    featured: true,
    tags: ["Tư duy gốc rễ", "Elon Musk", "Đổi mới sáng tạo", "Ra quyết định"],
    createdAt: "2026-08-15T08:00:00.000Z",
    updatedAt: "2026-08-15T08:00:00.000Z",
  },
  {
    id: "blue-ocean-strategy",
    slug: "blue-ocean-strategy",
    title: "Chiến lược Đại dương Xanh: Khiến đối thủ trở nên vô nghĩa",
    category: "Chiến lược Kinh doanh",
    shortDescription:
      "Nghệ thuật tạo ra không gian thị trường mới chưa có ai khai phá, thoát khỏi cuộc cạnh tranh đẫm máu về giá thông qua sáng tạo giá trị vượt trội.",
    fullContent: `
      <h2>1. Đại dương Đỏ vs. Đại dương Xanh</h2>
      <p>Trong nền kinh tế hiện đại, các doanh nghiệp thường chia thành hai trạng thái:</p>
      <ul>
        <li><strong>Đại dương Đỏ (Red Ocean)</strong>: Đại diện cho tất cả ngành công nghiệp hiện hữu. Ranh giới ngành đã được xác định, các công ty xâu xé nhau để giành giật thị phần, dẫn đến cạnh tranh khốc liệt và biến nước biển thành màu đỏ máu.</li>
        <li><strong>Đại dương Xanh (Blue Ocean)</strong>: Đại diện cho những khoảng trống thị trường chưa từng có. Nơi đây nhu cầu được tạo mới chứ không phải tranh giành, tăng trưởng nhanh và lợi nhuận cao.</li>
      </ul>

      <h2>2. Case Study kinh điển: Gánh xiếc Cirque du Soleil</h2>
      <p>Khi ngành xiếc truyền thống đang lụi tàn vì chi phí nuôi thú đắt đỏ và sự cạnh tranh của trò chơi điện tử, Cirque du Soleil đã làm nên kỳ tích khi tái định vị hoàn toàn:</p>
      <ul>
        <li><strong>Loại bỏ</strong>: Ngôi sao biểu diễn đắt giá, xiếc thú nguy hiểm tốn kém, 3 sàn diễn song song gây rối mắt.</li>
        <li><strong>Cắt giảm</strong>: Sự hài hước vui nhộn nhí nhố của các chú hề truyền thống.</li>
        <li><strong>Gia tăng</strong>: Địa điểm rạp hát cố định đẳng cấp, sự thoải mái và tinh tế.</li>
        <li><strong>Tạo mới</strong>: Cốt truyện kịch tính xuyên suốt, âm nhạc trực tiếp huyền ảo, vũ đạo nghệ thuật đỉnh cao kết hợp nhạc kịch Broadway.</li>
      </ul>
      <p>Kết quả: Họ không còn cạnh tranh với các gánh xiếc khác, mà thu hút đối tượng khách hàng trưởng thành sẵn sàng trả vé đắt gấp nhiều lần như đi xem opera.</p>

      <h2>3. Ma trận ERRC (Eliminate - Reduce - Raise - Create)</h2>
      <p>Để tìm đại dương xanh của riêng bạn, hãy trả lời 4 câu hỏi:</p>
      <ol>
        <li><strong>Loại bỏ (Eliminate)</strong>: Những yếu tố nào ngành mặc nhiên công nhận nhưng thực chất không còn tạo giá trị?</li>
        <li><strong>Cắt giảm (Reduce)</strong>: Những yếu tố nào nên giảm xuống dưới mức tiêu chuẩn ngành?</li>
        <li><strong>Gia tăng (Raise)</strong>: Những yếu tố nào nên nâng lên cao hơn mức tiêu chuẩn ngành?</li>
        <li><strong>Tạo mới (Create)</strong>: Những yếu tố nào ngành chưa từng cung cấp mà khách hàng khao khát?</li>
      </ol>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/clg-Qv3_f2g",
    author: "Ban Biên Tập Think & Rich",
    readTime: "7 phút đọc",
    status: "PUBLISHED",
    views: 4890,
    likes: 382,
    dislikes: 4,
    featured: true,
    tags: ["Chiến lược", "Đại dương xanh", "Định vị", "Kinh doanh"],
    createdAt: "2026-08-16T09:30:00.000Z",
    updatedAt: "2026-08-16T09:30:00.000Z",
  },
  {
    id: "circle-of-competence",
    slug: "circle-of-competence",
    title: "Mô hình Tâm trí: Vòng tròn Năng lực (Circle of Competence)",
    category: "Mô hình Tâm trí",
    shortDescription:
      "Bí quyết đầu tư và sống sót qua hơn nửa thế kỷ của Warren Buffett & Charlie Munger: Biết chính xác mình giỏi điều gì và tuyệt đối không bước qua lằn ranh mù quáng.",
    fullContent: `
      <h2>1. Định nghĩa Vòng tròn Năng lực</h2>
      <p>Vòng tròn năng lực (Circle of Competence) là phạm vi những lĩnh vực, chủ đề hoặc ngành nghề mà bạn thực sự thấu hiểu sâu sắc từ kinh nghiệm thực chiến, nguyên lý hoạt động và quy luật kinh tế của nó.</p>
      
      <blockquote>
        "Bạn không cần phải là một chuyên gia về mọi lĩnh vực. Nhưng việc biết được biên giới vòng tròn năng lực của bạn nằm ở đâu và ở yên bên trong nó là điều quan trọng nhất."
        <br />— <em>Warren Buffett</em>
      </blockquote>

      <h2>2. Sự khác biệt giữa 'Hiểu biết thật' và 'Hiểu biết mượn mỏ'</h2>
      <p>Charlie Munger thường kể câu chuyện về nhà vật lý đoạt giải Nobel Max Planck và người tài xế:</p>
      <p>Người tài xế nghe giáo sư giảng bài khắp các trường đại học đến mức thuộc làu từng chữ. Một hôm, tài xế xin được lên bục giảng thay. Mọi chuyện diễn ra trôi chảy cho đến khi một giáo sư đặt câu hỏi phản biện nâng cao. Lúc đó tài xế cứng họng và đành nhờ 'tài xế phía dưới' (chính là Max Planck thật) giải thích giúp.</p>
      <p>Bài học: <strong>Kiến thức có thể thuộc vẹt, nhưng năng lực thực sự chỉ đến từ việc trực tiếp trải nghiệm, va vấp và tư duy sâu.</strong></p>

      <h2>3. 3 Bước làm chủ Vòng tròn Năng lực</h2>
      <ul>
        <li><strong>Xác định đường biên rõ ràng</strong>: Trung thực tuyệt đối với bản thân. Bạn hiểu sâu về cái gì (công nghệ, tài chính, phân phối bán lẻ) và hoàn toàn mù mờ về cái gì?</li>
        <li><strong>Nói 'Không' với những cơ hội ngoài vòng tròn</strong>: Dù thị trường có sốt dẻo hay hấp dẫn đến đâu, nếu không hiểu cách nó tạo ra tiền, đừng mạo hiểm.</li>
        <li><strong>Mở rộng vòng tròn từ tốn và kiên định</strong>: Đọc sách, học hỏi chuyên gia, tích lũy kinh nghiệm qua nhiều năm tháng để dần nới rộng biên giới.</li>
      </ul>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/m91f_ZfO1_Y",
    author: "Charlie Munger / Think & Rich",
    readTime: "5 phút đọc",
    status: "PUBLISHED",
    views: 2950,
    likes: 195,
    dislikes: 2,
    featured: true,
    tags: ["Warren Buffett", "Charlie Munger", "Tâm trí", "Đầu tư"],
    createdAt: "2026-08-17T11:15:00.000Z",
    updatedAt: "2026-08-17T11:15:00.000Z",
  },
  {
    id: "second-order-thinking",
    slug: "second-order-thinking",
    title: "Tư duy Bậc hai (Second-Order Thinking): Nhìn xa hơn điều hiển nhiên",
    category: "Mô hình Tư duy",
    shortDescription:
      "Trong khi người bình thường chỉ hỏi 'Hành động này mang lại kết quả gì?', bậc thầy tư duy luôn hỏi câu tiếp theo: 'Và rồi sau đó sẽ xảy ra chuyện gì nữa?'",
    fullContent: `
      <h2>1. Phân biệt Tư duy bậc một và Tư duy bậc hai</h2>
      <p>Nhà đầu tư huyền thoại Howard Marks trong cuốn sách <em>The Most Important Thing</em> đã chỉ rõ:</p>
      <ul>
        <li><strong>Tư duy bậc một (First-Order Thinking)</strong>: Nhanh chóng, đơn giản, chỉ tập trung vào giải quyết vấn đề tức thời trước mắt. Ví dụ: <em>"Công ty này tốt, hãy mua cổ phiếu của nó."</em></li>
        <li><strong>Tư duy bậc hai (Second-Order Thinking)</strong>: Phức tạp, đa chiều, tính toán đến các hệ quả dây chuyền kéo theo trong tương lai dài hạn. Ví dụ: <em>"Công ty này tốt, nhưng tất cả mọi người đều nghĩ vậy nên giá cổ phiếu đã bị thổi phồng quá mức. Hãy bán ra."</em></li>
      </ul>

      <h2>2. Hiệu ứng Rắn hổ mang (The Cobra Effect)</h2>
      <p>Thời kỳ thuộc địa tại Ấn Độ, chính quyền Anh muốn diệt trừ rắn hổ mang ở Delhi. Họ ra chính sách thưởng tiền cho mỗi con rắn chết nộp lên (Tư duy bậc một: Treo thưởng &rarr; Người dân đi bắt rắn &rarr; Hết rắn).</p>
      <p>Kết quả của Tư duy bậc hai: Người dân nhận thấy nuôi rắn đẻ con đem nộp lấy tiền dễ hơn đi săn. Khi chính quyền phát hiện và hủy bỏ tiền thưởng, người nuôi thả hàng vạn con rắn vô giá trị ra đường, khiến số lượng rắn hổ mang tăng gấp bội!</p>

      <h2>3. Ứng dụng trong quản trị và xây dựng sản phẩm</h2>
      <ol>
        <li>Luôn đặt câu hỏi: <strong>"Và rồi sau đó thì sao?" (And then what?)</strong></li>
        <li>Xem xét tác động qua các mốc thời gian: 10 phút nữa, 10 tháng nữa, 10 năm nữa.</li>
        <li>Dự đoán phản ứng của đối thủ, nhân viên và người dùng khi một chính sách mới được ban hành.</li>
      </ol>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/4q1dH4j1xXg",
    author: "Howard Marks / Think & Rich",
    readTime: "6 phút đọc",
    status: "PUBLISHED",
    views: 3820,
    likes: 310,
    dislikes: 5,
    featured: false,
    isPro: true,
    tags: ["Tư duy chiến lược", "Ra quyết định", "Hệ quả bậc hai"],

    createdAt: "2026-08-18T14:00:00.000Z",
    updatedAt: "2026-08-18T14:00:00.000Z",
  },
  {
    id: "the-flywheel-effect",
    slug: "the-flywheel-effect",
    title: "Hiệu ứng Bánh đà (The Flywheel Effect): Động lực tăng trưởng kép",
    category: "Chiến lược Kinh doanh",
    shortDescription:
      "Cách Amazon, Uber và Costco xây dựng cỗ máy kinh doanh tự vận hành và tự gia tốc ngày càng mạnh mẽ nhờ vòng lặp phản hồi tích cực.",
    fullContent: `
      <h2>1. Khái niệm Bánh đà của Jim Collins</h2>
      <p>Trong cuốn sách kinh điển <em>Good to Great</em>, Jim Collins mô tả quá trình chuyển đổi vĩ đại của một công ty không bao giờ đến từ một cú hích duy nhất, một phát minh thần kỳ hay một chiến dịch quảng cáo rầm rộ. Nó giống như việc đẩy một chiếc bánh đà khổng lồ bằng kim loại nặng hàng chục tấn.</p>
      <p>Ban đầu bạn phải dùng hết sức bình sinh để đẩy nó nhích từng milimet. Nhưng qua thời gian, khi lực đẩy liên tục theo đúng một hướng nhất định, trọng lượng của chính chiếc bánh đà sẽ tạo ra quán tính tự quay cuồng cuộn.</p>

      <h2>2. Vòng tròn Bánh đà của Jeff Bezos (Amazon)</h2>
      <p>Năm 2001, Jeff Bezos đã phác thảo mô hình bánh đà Amazon trên một tờ khăn ăn giấy:</p>
      <ul>
        <li><strong>Trải nghiệm khách hàng tuyệt vời</strong> &rarr; Tăng lưu lượng truy cập (Traffic).</li>
        <li><strong>Nhiều Traffic</strong> &rarr; Thu hút các nhà bán hàng bên thứ 3 (Sellers).</li>
        <li><strong>Nhiều Sellers</strong> &rarr; Mở rộng danh mục sản phẩm và tạo sự cạnh tranh.</li>
        <li><strong>Quy mô mở rộng</strong> &rarr; Giảm chi phí vận hành cố định trên từng đơn hàng.</li>
        <li><strong>Chi phí thấp hơn</strong> &rarr; Giảm giá bán cho khách hàng &rarr; Tăng trải nghiệm khách hàng!</li>
      </ul>

      <h2>3. Cách thiết kế Bánh đà cho doanh nghiệp của bạn</h2>
      <ol>
        <li>Xác định 4–6 thành tố then chốt tạo nên thành công của doanh nghiệp.</li>
        <li>Sắp xếp chúng theo vòng tròn tuần hoàn sao cho: <strong>A thúc đẩy B, B thúc đẩy C, C thúc đẩy D, và D quay lại củng cố A</strong>.</li>
        <li>Tập trung toàn lực của tổ chức vào việc loại bỏ mọi ma sát cản trở vòng quay đó.</li>
      </ol>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/5_hKooT_e18",
    author: "Jim Collins / Think & Rich",
    readTime: "8 phút đọc",
    status: "PUBLISHED",
    views: 4120,
    likes: 345,
    dislikes: 3,
    featured: true,
    tags: ["Amazon", "Tăng trưởng kép", "Bánh đà", "Quy mô"],
    createdAt: "2026-08-19T07:20:00.000Z",
    updatedAt: "2026-08-19T07:20:00.000Z",
  },
  {
    id: "inversion-thinking",
    slug: "inversion-thinking",
    title: "Phương pháp Nghịch đảo (Inversion): Đảo ngược vấn đề để chiến thắng",
    category: "Mô hình Tư duy",
    shortDescription:
      "Lời khuyên của nhà toán học Carl Jacobi: 'Nghịch đảo, luôn luôn nghịch đảo'. Thay vì tìm cách trở nên xuất sắc, hãy tìm cách không trở nên ngu ngốc.",
    fullContent: `
      <h2>1. Nghịch đảo là gì?</h2>
      <p>Hầu hết chúng ta dành cả đời để suy nghĩ theo hướng tiến về phía trước: <em>"Làm sao để kiếm được nhiều tiền?", "Làm sao để công ty thành công?", "Làm sao để hạnh phúc?"</em>.</p>
      <p>Tư duy nghịch đảo yêu cầu bạn lật ngược vấn đề: <em>"Điều gì chắc chắn sẽ làm công ty phá sản?", "Điều gì sẽ khiến cuộc sống rơi vào bất hạnh và nợ nần?"</em>. Khi bạn liệt kê hết các nguyên nhân gây thất bại và kiên quyết tránh xa chúng, thành công sẽ tự động xuất hiện.</p>

      <blockquote>
        "Tất cả những gì tôi muốn biết là nơi tôi sẽ chết, để tôi không bao giờ đến đó."
        <br />— <em>Charlie Munger</em>
      </blockquote>

      <h2>2. Ứng dụng trong Quản trị Rủi ro (Pre-Mortem)</h2>
      <p>Trước khi tung ra một dự án lớn, hãy tổ chức một buổi họp <strong>Khám nghiệm tử thi trước (Pre-Mortem)</strong>:</p>
      <ul>
        <li>Tưởng tượng chúng ta đang ở thời điểm 1 năm sau và dự án này đã <strong>thất bại thảm hại toàn diện</strong>.</li>
        <li>Yêu cầu mỗi thành viên trong nhóm viết ra 5 nguyên nhân trực tiếp dẫn đến cái chết của dự án.</li>
        <li>Tập hợp danh sách và xây dựng phương án phòng ngừa ngay từ ngày đầu tiên.</li>
      </ul>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/Yx_6rPqLz_Y",
    author: "Charlie Munger / Think & Rich",
    readTime: "5 phút đọc",
    status: "PUBLISHED",
    views: 2190,
    likes: 178,
    dislikes: 1,
    featured: false,
    tags: ["Charlie Munger", "Nghịch đảo", "Quản trị rủi ro", "Tư duy"],
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "ooda-loop-strategy",
    slug: "ooda-loop-strategy",
    title: "Vòng lặp OODA: Tốc độ ra quyết định trong môi trường biến động",
    category: "Chiến lược Kinh doanh",
    shortDescription:
      "Chiến lược không chiến của phi công John Boyd áp dụng vào kỷ nguyên số: Observe - Orient - Decide - Act để luôn dẫn trước đối thủ một bước.",
    fullContent: `
      <h2>1. Nguồn gốc Vòng lặp OODA</h2>
      <p>Được phát triển bởi Đại tá không quân Hoa Kỳ John Boyd, OODA Loop ban đầu giải thích lý do các phi công lái F-86 có thể đánh bại MiG-15 của đối phương dù MiG có thông số kỹ thuật vượt trội. Bí quyết nằm ở <strong>tốc độ hoàn thành một vòng lặp ra quyết định nhanh hơn đối thủ</strong>.</p>

      <h2>2. 4 Giai đoạn của OODA</h2>
      <ol>
        <li><strong>Observe (Quan sát)</strong>: Thu thập dữ liệu thực tế từ thị trường, phản hồi khách hàng và hành động của đối thủ mà không bị thiên kiến.</li>
        <li><strong>Orient (Định hướng - Khâu quan trọng nhất)</strong>: Phân tích dữ liệu thông qua lăng kính kinh nghiệm, mô hình tâm trí và văn hóa để hiểu đúng thực tại.</li>
        <li><strong>Decide (Quyết định)</strong>: Đưa ra giả thuyết hành động rõ ràng và dứt khoát.</li>
        <li><strong>Act (Hành động)</strong>: Thực thi nhanh chóng, kiểm tra kết quả để bắt đầu vòng quan sát tiếp theo.</li>
      </ol>

      <p>Khi bạn vận hành OODA nhanh hơn đối thủ, bạn sẽ làm họ rối loạn phản xạ, liên tục rơi vào thế bị động chống đỡ.</p>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/8w1bVfH5Ecg",
    author: "John Boyd / Think & Rich",
    readTime: "7 phút đọc",
    status: "PUBLISHED",
    views: 3100,
    likes: 220,
    dislikes: 4,
    featured: false,
    isPro: true,
    tags: ["OODA", "Tốc độ", "Chiến lược", "Linh hoạt"],
    createdAt: "2026-08-20T16:30:00.000Z",
    updatedAt: "2026-08-20T16:30:00.000Z",
  },
  {
    id: "barbell-strategy",
    slug: "barbell-strategy",
    title: "Chiến lược Đòn tạ (The Barbell Strategy): Vững như bàn thạch",
    category: "Tâm lý học & Quyết định",
    shortDescription:
      "Khung tư duy của Nassim Nicholas Taleb: Kết hợp giữa sự an toàn cực độ ở một đầu và những canh bạc có tiềm năng vô hạn ở đầu kia, triệt tiêu vùng trung dung nguy hiểm.",
    fullContent: `
      <h2>1. Nghịch lý của vùng Trung bình</h2>
      <p>Trong cuốn sách <em>Antifragile (Khả năng chống mong manh)</em>, Nassim Taleb chỉ ra rằng hầu hết mọi người thất bại vì họ chọn con đường 'rủi ro trung bình'. Một rủi ro trung bình thực chất đem lại sự an toàn giả tạo và nguy cơ mất trắng khi có biến cố Thiên nga đen.</p>

      <h2>2. Cấu trúc Đòn tạ (Barbell)</h2>
      <p>Hình ảnh chiếc đòn tạ với hai quả tạ nặng ở hai đầu cực, ở giữa là thanh nối rỗng:</p>
      <ul>
        <li><strong>Đầu 1 (85–90% nguồn lực)</strong>: Cực kỳ bảo thủ và an toàn tuyệt đối (tiền mặt, tài sản phòng thủ, công việc ổn định mang lại dòng tiền). Mục tiêu: Không bao giờ bị loại khỏi cuộc chơi.</li>
        <li><strong>Đầu 2 (10–15% nguồn lực)</strong>: Đầu tư vào các dự án mạo hiểm có rủi ro hữu hạn (chỉ mất tối đa số tiền nhỏ bỏ ra) nhưng nếu thắng thì tiềm năng tăng trưởng là vô cực (Startups, công nghệ mới, bản quyền trí tuệ).</li>
      </ul>
      <p>Chiến lược này giúp bạn miễn nhiễm với sự sụp đổ của thị trường trong khi vẫn nắm bắt được những cơ hội đổi đời.</p>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/Fw03oR4_pG4",
    author: "Nassim Taleb / Think & Rich",
    readTime: "6 phút đọc",
    status: "PUBLISHED",
    views: 2680,
    likes: 215,
    dislikes: 2,
    featured: false,
    isPro: true,
    tags: ["Nassim Taleb", "Chống mong manh", "Quản lý vốn", "Đòn tạ"],

    createdAt: "2026-08-21T09:00:00.000Z",
    updatedAt: "2026-08-21T09:00:00.000Z",
  },
  {
    id: "network-effects-moat",
    slug: "network-effects-moat",
    title: "Hiệu ứng Mạng lưới (Network Effects): Con hào kinh tế thời đại số",
    category: "Hiệu ứng & Định luật",
    shortDescription:
      "Mỗi người dùng mới tham gia sẽ làm gia tăng trực tiếp giá trị dịch vụ cho tất cả người dùng hiện tại, tạo ra rào cản độc quyền tự nhiên không thể lật đổ.",
    fullContent: `
      <h2>1. Định luật Metcalfe</h2>
      <p>Hiệu ứng mạng lưới xảy ra khi giá trị của một sản phẩm/dịch vụ tăng lên theo cấp số nhân khi số lượng người sử dụng nó tăng lên. Giá trị của mạng lưới tỷ lệ thuận với bình phương số người dùng: <code>V = N²</code>.</p>
      
      <h2>2. Các loại Hiệu ứng Mạng lưới</h2>
      <ul>
        <li><strong>Trực tiếp (Direct)</strong>: Thêm 1 người dùng thì mạng lưới hữu ích hơn cho người khác (Ví dụ: Facebook, Zalo, WhatsApp - nếu chỉ có 1 mình bạn dùng thì vô nghĩa).</li>
        <li><strong>Hai phía (2-Sided Marketplace)</strong>: Càng nhiều người mua thì càng hút nhiều người bán, và ngược lại (Ví dụ: Shopee, Grab, Airbnb).</li>
        <li><strong>Dữ liệu (Data Network Effects)</strong>: Càng nhiều người dùng tìm kiếm &rarr; thuật toán càng thông minh &rarr; trả kết quả chính xác hơn &rarr; hút thêm người dùng (Ví dụ: Google Search, Waze).</li>
      </ul>

      <h2>3. Vượt qua bài toán 'Con gà & Quả trứng' (Cold Start Problem)</h2>
      <p>Khi chưa có mạng lưới, làm sao thu hút người đầu tiên? Hãy tạo ra công cụ hữu ích cho người dùng đơn lẻ trước (<em>"Come for the tool, stay for the network"</em> - Ví dụ: Instagram ban đầu chỉ là app chỉnh sửa bộ lọc ảnh đẹp).</p>
    `,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop",
    videoUrl: "https://www.youtube.com/embed/p1716G2F-oY",
    author: "Ban Biên Tập Think & Rich",
    readTime: "7 phút đọc",
    status: "PUBLISHED",
    views: 3560,
    likes: 290,
    dislikes: 3,
    featured: false,
    tags: ["Hiệu ứng mạng lưới", "Con hào kinh tế", "Nền tảng", "Công nghệ"],
    createdAt: "2026-08-21T14:15:00.000Z",
    updatedAt: "2026-08-21T14:15:00.000Z",
  },
];

export const SEED_USERS: UserRecord[] = [
  {
    id: "admin-1",
    email: "admin@thinkandrich.com",
    name: "Admin Think & Rich",
    role: "ADMIN",
    tier: "PRO",
    createdAt: "2026-08-01T00:00:00.000Z",
    lastLoginAt: "2026-08-21T19:00:00.000Z",
    readPosts: [
      "first-principles-thinking",
      "blue-ocean-strategy",
      "circle-of-competence",
      "the-flywheel-effect",
      "second-order-thinking",
      "inversion-thinking",
    ],
    likedPosts: ["first-principles-thinking", "the-flywheel-effect", "blue-ocean-strategy"],
    dislikedPosts: [],
  },
  {
    id: "user-minhtri",
    email: "minhtri.founder@gmail.com",
    name: "Minh Trí",
    role: "USER",
    tier: "FREE",
    createdAt: "2026-08-05T10:20:00.000Z",
    lastLoginAt: "2026-08-21T18:30:00.000Z",
    dailyReads: { date: "2026-08-21", count: 4 },
    readPosts: [
      "first-principles-thinking",
      "blue-ocean-strategy",
      "the-flywheel-effect",
      "barbell-strategy",
    ],
    likedPosts: ["first-principles-thinking", "the-flywheel-effect"],
    dislikedPosts: [],
  },
  {
    id: "user-hoanganh",
    email: "hoanganh.strategy@outlook.com",
    name: "Hoàng Anh",
    role: "USER",
    tier: "PLUS",
    createdAt: "2026-08-10T14:00:00.000Z",
    lastLoginAt: "2026-08-21T15:45:00.000Z",
    dailyReads: { date: "2026-08-21", count: 7 },
    readPosts: [
      "circle-of-competence",
      "second-order-thinking",
      "inversion-thinking",
      "network-effects-moat",
    ],
    likedPosts: ["circle-of-competence", "second-order-thinking"],
    dislikedPosts: [],
  },
  {
    id: "user-thanhha",
    email: "thanhha.invest@gmail.com",
    name: "Thanh Hà",
    role: "USER",
    tier: "FREE",
    createdAt: "2026-08-12T09:15:00.000Z",
    lastLoginAt: "2026-08-20T20:10:00.000Z",
    dailyReads: { date: "2026-08-21", count: 2 },
    readPosts: ["circle-of-competence", "barbell-strategy", "inversion-thinking"],
    likedPosts: ["barbell-strategy"],
    dislikedPosts: [],
  },
  {
    id: "user-ducthang",
    email: "ducthang.ceo@techcorp.vn",
    name: "Đức Thắng",
    role: "USER",
    tier: "PRO",
    createdAt: "2026-08-15T16:40:00.000Z",
    lastLoginAt: "2026-08-21T12:00:00.000Z",
    dailyReads: { date: "2026-08-21", count: 12 },
    readPosts: ["ooda-loop-strategy", "the-flywheel-effect", "blue-ocean-strategy"],
    likedPosts: ["ooda-loop-strategy", "blue-ocean-strategy"],
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
    postTitle: "Mô hình Tư duy Nguyên lý Đầu tiên (First Principles Thinking)",
    postCategory: "Mô hình Tư duy",
    readAt: "2026-08-21T18:30:00.000Z",
    reaction: "like",
  },
  {
    id: "log-2",
    userId: "user-minhtri",
    userEmail: "minhtri.founder@gmail.com",
    userName: "Minh Trí",
    postId: "the-flywheel-effect",
    postTitle: "Hiệu ứng Bánh đà (The Flywheel Effect): Động lực tăng trưởng kép",
    postCategory: "Chiến lược Kinh doanh",
    readAt: "2026-08-21T17:45:00.000Z",
    reaction: "like",
  },
  {
    id: "log-3",
    userId: "user-hoanganh",
    userEmail: "hoanganh.strategy@outlook.com",
    userName: "Hoàng Anh",
    postId: "circle-of-competence",
    postTitle: "Mô hình Tâm trí: Vòng tròn Năng lực (Circle of Competence)",
    postCategory: "Mô hình Tâm trí",
    readAt: "2026-08-21T15:45:00.000Z",
    reaction: "like",
  },
  {
    id: "log-4",
    userId: "user-hoanganh",
    userEmail: "hoanganh.strategy@outlook.com",
    userName: "Hoàng Anh",
    postId: "second-order-thinking",
    postTitle: "Tư duy Bậc hai (Second-Order Thinking): Nhìn xa hơn điều hiển nhiên",
    postCategory: "Mô hình Tư duy",
    readAt: "2026-08-21T15:10:00.000Z",
    reaction: "like",
  },
  {
    id: "log-5",
    userId: "user-thanhha",
    userEmail: "thanhha.invest@gmail.com",
    userName: "Thanh Hà",
    postId: "barbell-strategy",
    postTitle: "Chiến lược Đòn tạ (The Barbell Strategy): Vững như bàn thạch",
    postCategory: "Tâm lý học & Quyết định",
    readAt: "2026-08-20T20:10:00.000Z",
    reaction: "like",
  },
  {
    id: "log-6",
    userId: "user-ducthang",
    userEmail: "ducthang.ceo@techcorp.vn",
    userName: "Đức Thắng",
    postId: "ooda-loop-strategy",
    postTitle: "Vòng lặp OODA: Tốc độ ra quyết định trong môi trường biến động",
    postCategory: "Chiến lược Kinh doanh",
    readAt: "2026-08-21T12:00:00.000Z",
    reaction: "like",
  },
  {
    id: "log-7",
    userId: "user-ducthang",
    userEmail: "ducthang.ceo@techcorp.vn",
    userName: "Đức Thắng",
    postId: "blue-ocean-strategy",
    postTitle: "Chiến lược Đại dương Xanh: Khiến đối thủ trở nên vô nghĩa",
    postCategory: "Chiến lược Kinh doanh",
    readAt: "2026-08-21T11:20:00.000Z",
    reaction: "like",
  },
  {
    id: "log-8",
    userId: "admin-1",
    userEmail: "admin@thinkandrich.com",
    userName: "Admin Think & Rich",
    postId: "first-principles-thinking",
    postTitle: "Mô hình Tư duy Nguyên lý Đầu tiên (First Principles Thinking)",
    postCategory: "Mô hình Tư duy",
    readAt: "2026-08-21T19:00:00.000Z",
    reaction: "like",
  },
];

