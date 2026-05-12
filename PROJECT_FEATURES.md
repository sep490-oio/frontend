# Tài liệu Các Chức năng Chính của Dự án

Tài liệu này tóm tắt các phân hệ chức năng chính của hệ thống Sàn đấu giá trực tuyến (Auction Platform) dựa trên cấu trúc mã nguồn hiện tại.

## 1. Hệ thống Xác thực & Người dùng (Auth & User)
*   **Auth**: Đăng nhập, đăng ký, quên/đặt lại mật khẩu, xác thực 2 lớp (2FA) và xác nhận email.
*   **User Profile**: Quản lý thông tin cá nhân, sổ địa chỉ (Addresses), thiết lập bảo mật và tùy chọn thông báo.
*   **Verification**: Quy trình xác minh danh tính cho người dùng để trở thành người bán hoặc tham gia đấu giá giá trị cao.

## 2. Quản lý Đấu giá (Auction)
*   **Bidding**: Tham gia đặt thầu, theo dõi danh sách các gói thầu đã đặt (My Bids).
*   **Browsing**: Tìm kiếm, lọc và xem danh sách các cuộc đấu giá đang diễn ra.
*   **Watchlist**: Lưu trữ các cuộc đấu giá quan tâm để nhận thông báo.
*   **Seller Auctions**: Người bán tạo mới, chỉnh sửa và quản lý các cuộc đấu giá cá nhân.

## 3. Quản lý Sản phẩm (Item)
*   **Item Listing**: Tạo mới sản phẩm, quản lý hình ảnh, mô tả và tình trạng sản phẩm.
*   **Review Queue**: Quy trình Admin phê duyệt sản phẩm dựa trên tiêu chuẩn sàn.
*   **Item Details**: Hiển thị thông tin chi tiết, thông số kỹ thuật và lịch sử của sản phẩm.

## 4. Đơn hàng & Vận chuyển (Order & Shipping)
*   **Order History**: Quản lý danh sách đơn hàng đã mua và đã bán.
*   **Returns**: Quy trình đổi trả hàng hóa (Order Return).
*   **Shipping Models**:
    *   **Direct Shipment**: Giao hàng trực tiếp từ người bán đến người mua.
    *   **Warehouse Shipping**: Giao nhận thông qua kho trung tâm để kiểm định.
*   **Shipment Tracking**: Theo dõi trạng thái vận chuyển qua mã vận đơn.

## 5. Thanh toán & Ví điện tử (Payment & Wallet)
*   **Wallet**: Ví tiền dùng để ký quỹ đấu giá, thanh toán đơn hàng và nhận tiền bán hàng.
*   **Deposit/Withdraw**: Nạp tiền qua cổng thanh toán (VnPay) và yêu cầu rút tiền về tài khoản ngân hàng.
*   **Checkout**: Quy trình thanh toán đơn hàng sau khi thắng đấu giá.

## 6. Vận hành Kho & Kiểm định (Warehouse & Inspection)
*   **Inbound**: Tiếp nhận hàng hóa từ người bán gửi về kho.
*   **Inspection**: Kiểm định chất lượng thực tế của sản phẩm so với mô tả trên hệ thống.
*   **Storage**: Quản lý vị trí lưu kho và tồn kho hàng hóa.
*   **Outbound**: Đóng gói và giao hàng cho đơn vị vận chuyển để gửi đến người mua.

## 7. Giải quyết Khiếu nại (Dispute)
*   **Dispute Thread**: Kênh trao đổi giữa người mua, người bán và Admin khi có tranh chấp.
*   **Evidence Management**: Tải lên bằng chứng hình ảnh/video để hỗ trợ giải quyết khiếu nại.

## 8. Quản trị & Điều hành (Admin)
*   **User Management**: Quản lý tài khoản, phân quyền (Roles) và khóa tài khoản vi phạm.
*   **System Monitoring**: Giám sát dòng tiền, giao dịch và các chỉ số hoạt động của sàn.
*   **Moderation**: Xử lý báo cáo vi phạm từ người dùng.

---
*Tài liệu này được tự động tổng hợp để phục vụ quá trình kiểm thử dự án.*
