# Đề Xuất Tìm Kiếm

Đánh giá hiện trạng tính năng tìm kiếm, hướng nâng cấp bằng SQLite FTS5, và đề xuất biến các nhãn từ khóa dưới bài viết thành lối vào tìm kiếm.

## 1. Tình trạng hiện tại

Có hai lớp lọc chạy chồng lên nhau, và chúng không khớp nhau về phạm vi tìm kiếm.

**`src/lib/server/public-posts.ts:25-29`** — lớp server, dùng bởi cả Header (Ctrl+K) và trang Explore:

```ts
if (q) {
  conditions.push(
    or(like(posts.title, `%${q}%`),
       like(posts.summarySnippet, `%${q}%`),
       like(posts.tags, `%${q}%`))
  );
}
```

Khớp: tiêu đề, tóm tắt ngắn, tags. Không có category. `fullContent` bị loại khỏi response ngay từ server (`fullContent: ""`) nên chưa từng được đưa vào tìm kiếm.

**`src/components/explore/ExplorePage.tsx:250-259`** — lớp lọc lại lần nữa, chỉ chạy trên trang Explore:

```ts
list = list.filter((p) =>
  p.title... || p.summarySnippet... ||
  p.shortDescription... || p.category... ||
  p.tags?.some(...)
);
```

Thêm category — nhưng `shortDescription` luôn `undefined` (field có trong type, không tồn tại trong DB/rowToPost) — đoạn so khớp này chết, không bao giờ chạy.

**Các vấn đề:**

- Nội dung đầy đủ bài viết (`fullContent`) chưa bao giờ được tìm — chỉ tiêu đề, tóm tắt, tags.
- Header (Ctrl+K) và Explore không tìm cùng phạm vi: Explore có category, Header thì không.
- Toàn bộ so khớp dùng `LIKE '%q%'` — SQLite/D1 không dùng được index cho kiểu này, luôn quét toàn bảng.

## 2. Hướng FTS5

D1 hỗ trợ SQLite FTS5 — bảng ảo full-text index, nhanh hơn `LIKE` nhiều bậc và cho ra kết quả xếp hạng theo độ liên quan (BM25) thay vì chỉ "có/không khớp".

### Giai đoạn 1 — vá nhanh, không đổi kiến trúc (rẻ, làm ngay)

Vẫn dùng `LIKE`, chỉ sửa phạm vi cho nhất quán:

- Thêm `fullContent` và `category` vào điều kiện `LIKE` ở server.
- Xoá field chết `shortDescription` ở ExplorePage.
- Header và Explore dùng chung một phạm vi tìm kiếm.

Đủ dùng khi kho bài còn nhỏ (vài trăm bài). Không cần đổi schema hay logic ghi dữ liệu.

### Giai đoạn 2 — bảng ảo FTS5 (tốn công hơn, làm khi cần)

Full-text index thật sự, thay cho quét toàn bảng:

- Tạo bảng ảo FTS5 phủ trên `title`, `summarySnippet`, `fullContent`, `tags`.
- Thêm trigger đồng bộ mỗi khi post được insert / update / delete — để index không lệch với bảng gốc.
- Viết lại truy vấn tìm kiếm sang cú pháp `MATCH`, có thể trả về xếp hạng BM25 và đoạn trích highlight quanh từ khóa.

Đáng làm khi số bài viết tăng đáng kể hoặc người dùng bắt đầu cảm nhận được độ trễ khi gõ tìm kiếm.

**Đề xuất:** làm Giai đoạn 1 ngay — chi phí thấp, thu hẹp khoảng cách rõ nhất giữa kỳ vọng người dùng và thực tế. Để Giai đoạn 2 lại, quay lại khi khối lượng nội dung hoặc độ trễ thực tế đòi hỏi.

## 3. Nhãn từ khóa → tìm kiếm

Hiện các nhãn dưới mỗi bài (`#Amazon`, `#Jim Collins`...) chỉ là `<Badge>` tĩnh, không có `onClick` hay `href`.

**`src/components/ideas/IdeaDetailPage.tsx:342-346`**

```tsx
{post.tags.map((tag) => (
  <Badge key={tag} variant="secondary" ...>
    #{tag}
  </Badge>
))}
```

Trang Explore đã tồn tại một đường ống hoàn chỉnh cho việc này: Header điều hướng đến `/explore?q=...`, và ExplorePage có sẵn `useEffect` lắng nghe `searchParams.get("q")` để tự động lọc ngay khi trang mở. Nhãn từ khóa chỉ cần đi vào đúng con đường đó:

```
click nhãn #Amazon → /explore?q=Amazon → ExplorePage tự lọc theo q
```

**Phương án A — đơn giản.** Đổi `<Badge>` thành `<Link href="/explore?q=...">`, thêm trạng thái hover. Tái sử dụng 100% hạ tầng tìm kiếm sẵn có — không cần sửa gì ở backend hay ở Header.

**Phương án B — vừa phải.** Click nhãn mở luôn modal Ctrl+K của Header, điền sẵn từ khóa. Cần đưa state `searchOpen` hiện đang cục bộ trong `Header.tsx` ra store toàn cục (Zustand, sẵn có trong dự án) để IdeaDetailPage gọi được. Trải nghiệm nhỉnh hơn một chút, nhưng không tạo thêm giá trị so với Phương án A vì đích đến (kết quả lọc theo q) giống hệt nhau.

**Đề xuất:** Phương án A. Độ phức tạp thấp, không đụng vào state của Header, và người dùng vẫn đi đến đúng nơi họ mong đợi — trang kết quả tìm kiếm.

## 4. Tổng hợp việc cần làm

| Việc | Độ phức tạp | Phụ thuộc |
|---|---|---|
| Thêm `fullContent` + `category` vào `LIKE`, xoá field chết | Thấp | Không |
| Nhãn từ khóa → link đến `/explore?q=` | Thấp | Không |
| Bảng ảo FTS5 + trigger đồng bộ + xếp hạng BM25 | Trung bình–cao | Khi khối lượng nội dung/độ trễ đòi hỏi |
