# GV Review 3 – Danh sách lỗi & thiếu sót cần xử lý

---

## 1. Đặt giá kỳ vọng khi đăng bài

**Vấn đề:** Chưa rõ khi seller đăng sản phẩm có thể đặt giá kỳ vọng (expected price) không, hay hệ thống chỉ hỗ trợ giá bán luôn (buy-now price).

**Yêu cầu:** Xác nhận và hiển thị rõ hai loại giá này trong luồng đăng bài.

**Lưu ý demo:** Chuẩn bị 2 tab (2 tài khoản khác nhau) để minh họa rằng khi một tài khoản đặt bid xong, tài khoản kia nhận được thông báo tương ứng. Cần chuẩn bị demo kỹ hơn.

---

## 2. Nghiệp vụ "Mua ngay" (Buy Now) – Trạng thái hiển thị sai

**Vấn đề:** Luồng nghiệp vụ mua ngay được định nghĩa đúng về mặt logic, nhưng trạng thái đơn hàng hiển thị trên hệ thống chưa phản ánh đúng.

**Yêu cầu:** Rà soát và cập nhật lại các trạng thái (status) liên quan đến luồng mua ngay trên giao diện.

---

## 3. Auto Bid – Thiếu ràng buộc thời gian và xử lý xung đột

**Vấn đề 1:** Chưa có giới hạn tần suất đặt giá tự động. Hiện tại hệ thống chỉ phản ứng khi có người khác đặt bid, nhưng chưa xác định rõ: nếu tất cả người tham gia đều bật auto bid, bao lâu hệ thống sẽ tự động nhảy giá một lần?

**Vấn đề 2:** Khi nhiều tài khoản đang dùng auto bid mà có một người muốn đặt giá thủ công, hệ thống chưa có cơ chế xử lý. Điều này tạo ra sự mất công bằng cho người đặt thủ công.

**Yêu cầu:**
- Định nghĩa rõ khoảng thời gian tối thiểu giữa các lần auto bid.
- Xử lý tình huống cạnh tranh giữa auto bid và manual bid.

---

## 4. Xử lý khi hết thời gian và nhiều người cùng mức giá

**Trạng thái:** Đã ổn.

Hệ thống đáp ứng đúng: khi hết thời gian đấu giá mà có nhiều người cùng mức giá cao nhất, người đặt trước sẽ được ưu tiên. Cần đảm bảo quy tắc bước giá (price increment) vẫn được áp dụng nhất quán.

---

## 5. Tiền cọc (Deposit) – Thiếu log và lịch sử hoàn trả

**Vấn đề 1:** Hệ thống chưa có log ghi nhận việc hoàn trả tiền cọc cho các bidder thua.

**Vấn đề 2:** Trong lịch sử ví của bidder chưa phân tách giao dịch hoàn cọc theo từng phiên đấu giá. Một user có thể tham gia nhiều phiên, nên lịch sử ví phải hiển thị rõ từng phiên tương ứng.

**Yêu cầu:**
- Thêm log hoàn trả tiền cọc cho bidder thua.
- Phân chia lịch sử ví theo phiên đấu giá.

---

## 6. Màn hình cá nhân của Bidder – Thiếu thông tin

**Vấn đề:** Trang cá nhân của bidder thiếu:
- Thông tin hoàn trả tiền cọc.
- Chi tiết các phiên đấu giá đang theo dõi (follow).

**Yêu cầu:** Bổ sung hai mục trên vào màn hình cá nhân.

---

## 7. Màn hình của Seller – Thiếu thông tin

**Vấn đề:** Từ góc độ seller, trang quản lý phiên đấu giá chưa hiển thị đầy đủ:
- Chi tiết các phiên đấu giá.
- Thông tin tiền cọc liên quan.

**Yêu cầu:** Bổ sung thông tin chi tiết phiên đấu giá và tiền cọc cho màn hình seller.

---

## 8. Trang Order của Bidder – Đang lỗi

**Vấn đề:** Trang order của bidder hiện đang bị lỗi (bug).

**Yêu cầu:** Kiểm tra và sửa lỗi trang order.

---

## 9. Quản lý giao hàng – Chưa tích hợp trạng thái đơn vị vận chuyển

**Vấn đề:** Hệ thống sử dụng bên thứ 3 (3PL) để giao hàng, nhưng chưa tích hợp để hiển thị và quản lý các trạng thái vận chuyển bên trong hệ thống.

**Yêu cầu:** Tích hợp API gọi trạng thái đơn hàng từ bên thứ 3 và hiển thị trong hệ thống.

---

## 10. Tên tài khoản demo – Chưa dễ theo dõi

**Vấn đề:** Các tài khoản dùng để demo không có tên hiển thị rõ ràng, khiến GV khó theo dõi luồng nghiệp vụ.

**Yêu cầu:** Đặt tên tài khoản rõ ràng (ví dụ: Seller_A, Bidder_1, Bidder_2) trước khi demo.

---

## 11. Lịch sử đấu giá – Hiển thị sai và thiếu màn hình

**Vấn đề 1:** Màn hình "Xem lịch sử đấu giá" đang thực chất hiển thị lịch sử đơn hàng – không đúng chức năng.

**Vấn đề 2:** Hiện tại bấm vào sản phẩm mới xem được lịch sử – cần xem xét lại UX này có hợp lý không.

**Vấn đề 3:** Chưa có cách phân biệt đơn hàng nào đang tham gia và đơn hàng đã hoàn thành.

**Vấn đề 4:** Thiếu màn hình tổng hợp các phiên đấu giá mà user đang tham gia.

**Yêu cầu:**
- Tách biệt lịch sử đấu giá và lịch sử đơn hàng.
- Thêm màn hình "Các phiên đấu giá đang tham gia".
- Thêm bộ lọc trạng thái: đang tham gia / đã hoàn thành.

---

## 12. Cơ chế kiểm định (Verification) – Chưa có

**Vấn đề:** Hệ thống chưa có cơ chế kiểm định sản phẩm.

**Yêu cầu:** Xây dựng hoặc seed data mô phỏng cơ chế kiểm định trước khi demo.

---

## 13. Dòng tiền giữa Seller và Sàn – Chưa có

**Vấn đề:** Chưa định nghĩa và triển khai luồng thanh toán giữa người bán và sàn giao dịch (platform fee, settlement, v.v.).

**Yêu cầu:** Xác định và triển khai luồng dòng tiền này.

---

## 14. Lưu ý khi demo trước Hội đồng

- Chuẩn bị nhiều màn hình khác nhau để trình bày đa dạng tính năng.
- Khi phản biện: **chỉ trả lời những gì chắc chắn**. Nếu chưa rõ, hỏi lại team trước khi trả lời – tránh phản biện sai bị trừ điểm hoặc bị bắt bẻ.
