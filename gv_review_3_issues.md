## 1. Giao diện (UI/UX) & Đa ngôn ngữ
- [done] **Trang Auction:** Mặc định để các auction mới tạo lên đầu[cite: 1].
- [done] **Mobile:** Sửa lỗi giao diện (Fix UI) cho thiết bị di động[cite: 2].
- [done] **Trang Browse Seller:** Làm rõ phần "0 common.sales"[cite: 2].
- [done] **Trang My Order:** Sửa lỗi bộ lọc "returns" hiển thị chưa đúng ngôn ngữ[cite: 2].
- [done] **Navbar Seller:** Cập nhật ngôn ngữ cho mục "return"[cite: 2].
- [done] **Sidebar User:** Bổ sung tiếng Việt cho phần "payment methods"[cite: 3].
- [done] **Xác minh danh tính:** Bổ sung nút yêu cầu xác minh lại cho hình thức xác minh qua cửa hàng[cite: 3].
- [done] **Ngôn ngữ nút xác minh:** Cập nhật tiếng Việt cho nút yêu cầu xác minh lại[cite: 4].
- [done] **Điều khoản & Điều kiện:** Hoàn thiện đa ngôn ngữ (full mode)[cite: 9].
- [done] **Tên tài khoản:** Hiển thị tên tài khoản bên ngoài giao diện để giảng viên dễ theo dõi luồng demo[cite: 18].

## 2. Nghiệp vụ & Logic Đấu giá
- [done] **Đăng bài:** Làm rõ việc đặt giá kỳ vọng hay giá bán luôn khi post bài[cite: 10, 11].
- [done] **Nghiệp vụ Mua ngay:** Xem lại trạng thái hệ thống, hiện tại hiển thị chưa đúng so với nghiệp vụ đã định nghĩa[cite: 11].
- [ ] **Auto Bid:**
- [ ] Xác định tần suất đặt giá tự động (bao lâu nhảy một lần)[cite: 11, 12].
- [ ] Xử lý trường hợp có người muốn bid thủ công khi các tài khoản khác đang auto bid để đảm bảo công bằng[cite: 13, 14].
- [ ] **Đồng giá bid:** Đảm bảo hệ thống giữ mức giá của người đặt trước nếu có nhiều người cùng mức giá khi hết thời gian[cite: 15].
- [done] **Watchlist:** Ẩn các nút chức năng hoặc đưa ra khỏi watchlist đối với các đấu giá đã kết thúc[cite: 7].
- [done] **Cài đặt Watchlist:** Xóa nút bật/tắt thời gian kết thúc[cite: 8].

## 3. Quản lý Tài chính & Dòng tiền
- [ ] **Hoàn tiền cọc:** Đảm bảo trả lại tiền cọc cho người thua[cite: 15, 16].
- [done] **Log & Lịch sử cọc:**
- [done] Hệ thống phải có log ghi nhận việc trả cọc cho bidder thua[cite: 16].
- [done] Lịch sử ví của user phải chia rõ thông tin hoàn cọc theo từng phiên đấu giá[cite: 17].
- [ ] **Thông tin chi tiết:** Bổ sung thông tin trả cọc và chi tiết các phiên đấu giá đang theo dõi trên màn hình cá nhân[cite: 17].
- [ ] **Góc độ Seller:** Bổ sung đầy đủ thông tin chi tiết về các phiên đấu giá và tiền cọc cho người bán[cite: 17].
- [ ] **Dòng tiền:** Xây dựng cơ chế dòng tiền giữa người bán và sàn (hiện tại chưa có)[cite: 21].

## 4. Quản lý Đơn hàng & Hệ thống
- [done] **Lỗi Trang Order:** Sửa lỗi trang quản lý đơn hàng của bidder[cite: 17].
- [ ]    **Giao hàng:** Tích hợp quản lý trạng thái đơn hàng từ bên thứ 3[cite: 18].
- [ ] **Lịch sử đấu giá:** Sửa lỗi hiển thị lịch sử đơn hàng thay vì lịch sử đấu giá[cite: 18].
- [ ] **Quản lý trạng thái:** Bổ sung cách phân biệt đơn hàng đang tham gia và đã hoàn thành; thêm màn hình xem các đấu giá đang tham gia[cite: 20].
- [done] **Phân quyền Admin:** Hạn chế quyền admin theo đúng nghiệp vụ quản trị, không được có quyền bid, nạp/dùng ví của user[cite: 5, 6].
- [ ] **Cơ chế kiểm định:** Xây dựng cơ chế kiểm định và seed data để demo[cite: 20].

## 5. Lưu ý Demo Hội đồng
- [ ] **Chuẩn bị kịch bản:** Demo bằng 2 tài khoản (2 tab) để cho thấy việc thông báo khi có người bid xong[cite: 11].
- [ ] **Thiết bị:** Hiển thị trên nhiều màn hình khác nhau[cite: 21].
- [ ] **Kỹ năng phản biện:** Chỉ khẳng định những gì chắc chắn, nếu chưa rõ thì trao đổi lại với team trước khi trả lời để tránh bị trừ điểm[cite: 21, 22].