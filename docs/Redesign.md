**\[CONTEXT & GOAL\]**

Tôi cần tái cấu trúc toàn bộ layout và UI của trang hiện tại. Mục tiêu:

1. Chuyển từ bố cục Header/Footer sang bố cục Sidebar  đóng/mở (giống Lovable.dev)  
2. Chuyển sang phong cách "Neo-Brutalism \+ Retro Editorial".  
3. **QUAN TRỌNG NHẤT: Xóa bỏ hoàn toàn kiểu xếp thẻ to nhỏ xen kẽ (Masonry). Bắt buộc phải dùng Grid chuẩn với CÁC THẺ CÓ KÍCH THƯỚC BẰNG NHAU 100%.**

Hãy thực hiện tuần tự theo 3 bước dưới đây. Tuyệt đối không giữ lại bất kỳ style trang trí nào của phiên bản cũ.

**\[STEP 1: TEARDOWN \- Dọn dẹp & Tẩy trắng\]**

1. Xóa hoàn toàn các component Header và Footer hiện tại.  
2. Quét và loại bỏ tất cả các class CSS/Tailwind liên quan đến trang trí hình ảnh: rounded-\* (bo góc), shadow-\* (bóng đổ mềm), bg-\* (màu nền cũ), các hiệu ứng gradient, và màu text cũ.  
3. Đưa trang về dạng HTML thô (chỉ giữ lại nội dung text, data và các action logic).

**\[STEP 2: MACRO LAYOUT & MOBILE RESPONSIVE  \- Tái cấu trúc bộ khung\]**  
Xây dựng một bộ khung Flexbox/Grid mới chia màn hình thành 2 phần chính:

1. **Sidebar (Bên trái):**  
   

   * Fixed bên trái, chiều cao 100vh. Có cơ chế đóng/mở (collapsible).  
   *   
   * Di chuyển TOÀN BỘ các thành phần từ Header cũ vào đây, sắp xếp theo chiều dọc: Logo (Think & Rich), Menu điều hướng (Trang chủ, Khám phá, Bảng giá, Khu vực cá nhân), Công cụ (Search, Theme, Ngôn ngữ, Credit).  
   *   
   * Di chuyển TOÀN BỘ các link từ Footer cũ (FAQ, Điều khoản, Bảo mật, Copyright) xuống dưới cùng của Sidebar này.  
   *   
2. **Main Content (Bên phải):**  
   

   * Chiếm phần không gian còn lại (flex-1), cuộn độc lập (overflow-y-auto).  
   *   
   * Bao gồm: Tiêu đề trang, Thanh công cụ Filter/Sort (cố định trên cùng khi cuộn \- sticky top), và Container chứa các thẻ bài viết.

**Sidebar (bên trái, fixed, có thể đóng/mở) và Main Content (bên phải, cuộn độc lập)** 

**Mobile:** Ẩn Sidebar. Thay thế bằng nút Hamburger Menu ở góc trên bên trái. Khi mở, **Sidebar sẽ trượt ra đè lên trên (hiệu ứng Overlay Drawer)**, đồng thời tạo một lớp nền mờ (backdrop-blur hoặc rgba tối màu) phủ lên vùng Main Content. Tuyệt đối không dùng hiệu ứng đẩy (push) nội dung. 

**\[STEP 3: STYLING \- Áp dụng phong cách Neo-Brutalism & Retro Editorial\]**  
Chỉ áp dụng các style sau khi đã hoàn thành Step 2:

1. **Bố cục Grid Thẻ bài (Card Container):** Chuyển từ Masonry (xen kẽ) sang Grid chuẩn. Các thẻ phải có kích thước (chiều cao, chiều rộng) hoàn toàn bằng nhau, xếp ngay ngắn thành các hàng/cột.  
2.   
3. **Thẻ Card (Neo-Brutalism):**  
4. 

   * Cạnh vuông tuyệt đối: border-radius: 0px.  
   *   
   * Viền sắc nét: Thêm viền nét liền (solid border) màu đen/tối cho toàn bộ các thẻ.  
   *   
   * Bóng đổ cứng (Hard Drop Shadow): Thêm bóng đổ lệch hướng góc dưới bên phải, không có độ nhòe (blur: 0px).  
   *   
5. **Màu sắc & Nền (Retro Editorial):**  
6. 

   * Sử dụng bảng màu trầm/be (Earthy/Beige) làm chủ đạo.  
   *   
   * Thêm họa tiết lưới kẻ ô ly (grid/graph paper pattern) mờ làm nền cho vùng Main Content để tạo cảm giác học thuật.  
   *   
7. **Typography:** Sử dụng phông chữ Serif (có chân) cổ điển cho Tiêu đề/Heading và phông Sans-serif hiện đại cho nội dung/thẻ tag.

sự kết hợp giữa phong cách **Neo-Brutalism (Tân thô mộc)** và **Retro Editorial (Phong cách dàn trang tạp chí hoài cổ / Học thuật)**.  
Dưới đây là các từ khóa và đặc điểm chi tiết cấu thành nên phong cách này để bạn có thể sử dụng khi làm việc với đội ngũ thiết kế hoặc tìm kiếm thêm tài nguyên (prompt):  
**1\. Phong cách chủ đạo: Neo-Brutalism (Tân thô mộc)**

* **Hard Drop Shadow (Bóng đổ cứng):** Đây là đặc trưng rõ nhất. Bóng của các thẻ (card) hoặc nút bấm (button) hoàn toàn không được làm mờ (0px blur), thường là các mảng màu đặc (solid color) hoặc xám đậm đổ lệch về một hướng (offset shadow). Nó tạo cảm giác 3D dạng khối hộp xếp chồng lên nhau rất dứt khoát.  
* **Solid Borders (Đường viền sắc nét):** Các phần tử UI (thẻ, nút bấm, khung chứa) đều có đường viền nét liền, màu tối để phân định ranh giới rõ ràng.  
* **Sharp Edges (Góc cạnh vuông vức):** Hầu như không sử dụng bo góc (0px border-radius) ở các thành phần chính, tạo cảm giác mạnh mẽ, nguyên bản và kỷ luật.

**2\. Yếu tố bổ trợ: Retro Editorial & Academic (Hoài cổ & Học thuật)**

* **Grid/Graph Paper Background (Nền lưới/Giấy nháp):** Họa tiết lưới mờ ở phông nền mô phỏng lại các trang vở ô ly, sổ tay ghi chép hoặc giấy vẽ kỹ thuật. Yếu tố này định hình ngay lập tức cảm giác học thuật, nghiên cứu và tư duy logic.  
* **Muted / Earthy Color Palette (Bảng màu trầm / Chấm phá tự nhiên):** Sử dụng tông màu nền chủ đạo là be (beige), vàng kem hoặc trắng ngà (off-white) mô phỏng màu giấy cũ. Các điểm nhấn dùng màu xanh rêu, cam đất, đỏ gạch... tạo cảm giác điềm tĩnh, trưởng thành, không dùng màu gradient hay màu neon chói lóa.  
* **High-Contrast Typography (Nghệ thuật chữ tương phản):**  
  * *Heading (Tiêu đề):* Sử dụng phông chữ Serif (có chân) cổ điển, thanh lịch và kích thước lớn (đậm chất báo chí/tạp chí xưa).  
  * *Body text (Nội dung):* Kết hợp với phông chữ Sans-serif (không chân) hiện đại, dễ đọc cho các đoạn văn bản nhỏ và nút bấm.

**Tóm lại:**  
*"Thiết kế phẳng theo phong cách Neo-Brutalism kết hợp hơi hướng tạp chí học thuật (Retro Editorial). Đặc trưng với nền kẻ ô ly (grid), các khối thẻ vuông vức có đường viền rõ nét, đổ bóng cứng (hard shadow) không làm mờ, và sử dụng bảng màu be/giấy cổ điển kết hợp phông chữ Serif cho tiêu đề."*

#  **Step 4: Dưới đây là danh sách kiểm tra nhanh gọn sau khi làm xong** 

### ***1\. Kiểm tra Bố cục & Kiến trúc (Layout)***

* ***Sidebar (Desktop):** Đã nằm cố định bên trái chưa? Có cuộn độc lập với phần nội dung chính không? Thử bấm đóng/mở xem có bị giật hay vỡ layout không.*  
* ***Mobile Overlay (Đặc biệt quan trọng với màn hình nhỏ gọn):** Thu nhỏ cửa sổ trình duyệt. Sidebar có biến mất và thay bằng nút Hamburger không? Khi bấm mở, menu có trượt đè lên (Overlay) và phủ một lớp nền tối mờ che đi phần nội dung phía sau không?*  
* ***Cuộn trang (Scrolling):** Khi cuộn danh sách các thẻ kiến thức, thanh Sidebar và tiêu đề trang (nếu cài đặt sticky) có đứng yên như mong đợi không?*

### ***2\. Kiểm tra Thẻ Card (Yếu tố Sống còn)***

* ***Đồng đều 100%:** Nhìn lướt qua toàn bộ lưới thẻ. Chúng có cao bằng nhau và rộng bằng nhau không? (Tuyệt đối không được có thẻ thụt thò, nhấp nhô như phiên bản Masonry cũ).*  
* ***Bo góc (Border-radius):** Các góc của thẻ đã vuông vức hoàn toàn (0px) chưa, hay vẫn còn sót lại vài góc bo tròn nhẹ?*  
* ***Bóng đổ (Box-shadow):** Bóng của thẻ phải là một mảng màu đặc (solid), sắc nét, không có hiệu ứng tỏa mờ (blur).*

### ***3\. Kiểm tra Phong cách "Tân Thô mộc & Hoài cổ" (Styling)***

* ***Phông nền (Background):** Vùng không gian chính chứa các thẻ đã có họa tiết lưới ô ly (grid/graph) mờ chưa?*  
* ***Màu sắc:** Bảng màu tổng thể đã chuyển sang tông trầm, be (beige) hoặc trắng ngà của giấy chưa? (Đảm bảo Agent đã quét sạch các màu gradient hoặc màu nền sặc sỡ cũ).*  
* ***Phông chữ (Typography):** Các tiêu đề (Heading) đã dùng font có chân (Serif) cổ điển, trong khi nội dung chữ nhỏ dùng font không chân (Sans-serif) hiện đại chưa?*

