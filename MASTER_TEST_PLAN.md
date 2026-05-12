# Tài liệu Tổng hợp Kiểm thử Dự án Sàn Đấu Giá (Master Test Plan)

Tài liệu này tổng hợp toàn bộ thông tin về chức năng, kịch bản sử dụng (Use Cases) và các bộ kiểm thử (Test Cases) của dự án.

---

## I. TỔNG QUAN CÁC CHỨC NĂNG CHÍNH

Hệ thống bao gồm các phân hệ chính sau:
1.  **Auth & User**: Đăng nhập, đăng ký, 2FA, xác minh danh tính (KYC).
2.  **Auction**: Đặt thầu, theo dõi (Watchlist), quản lý phiên đấu giá.
3.  **Item**: Đăng bán, quản lý sản phẩm, duyệt sản phẩm (Admin).
4.  **Order & Shipping**: Đơn hàng, vận chuyển trực tiếp/qua kho, đổi trả.
5.  **Payment & Wallet**: Ví điện tử, nạp/rút tiền, thanh toán đơn hàng.
6.  **Warehouse & Inspection**: Lưu kho, kiểm định chất lượng sản phẩm.
7.  **Dispute**: Giải quyết khiếu nại giữa người mua và người bán.
8.  **Admin**: Quản trị người dùng, hệ thống và kiểm duyệt.

---

## II. DANH SÁCH USE CASES TỔNG QUÁT

| Module | ID | Tên Use Case | Mô tả |
|:---|:---|:---|:---|
| **Auth** | UC-01 | Đăng ký | Tạo tài khoản mới. |
| | UC-02 | Đăng nhập | Truy cập hệ thống. |
| | UC-03 | Xác thực 2FA | Bảo mật 2 lớp qua OTP. |
| **Item** | UC-13 | Đăng bán | Seller tạo thông tin sản phẩm. |
| | UC-14 | Duyệt sản phẩm | Admin phê duyệt sản phẩm hợp lệ. |
| | UC-15 | Chỉnh sửa | Cập nhật thông tin sản phẩm. |
| **Auction**| UC-08 | Đặt thầu | Tham gia trả giá sản phẩm. |
| | UC-11 | Tạo đấu giá | Seller thiết lập phiên đấu giá. |
| **Payment**| UC-21 | Nạp tiền | Nạp tiền vào ví qua VnPay. |
| | UC-24 | Rút tiền | Yêu cầu rút tiền về ngân hàng. |

*(Xem thêm chi tiết tại file USE_CASES.md nếu cần)*

---

## III. BỘ TEST CASES CHI TIẾT

### 1. Phân hệ Xác thực (Auth & User)

| TC ID | Use Case | Tên kịch bản | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-01.1 | UC-01 | Đăng ký thành công | Tài khoản được tạo, gửi email xác nhận. |
| TC-01.2 | UC-01 | Email đã tồn tại | Báo lỗi "Email đã được sử dụng". |
| TC-02.1 | UC-02 | Đăng nhập thành công | Vào Dashboard thành công. |
| TC-02.2 | UC-02 | Sai mật khẩu | Báo lỗi "Thông tin không chính xác". |
| TC-03.1 | UC-03 | OTP chính xác | Xác thực 2FA thành công. |
| TC-03.3 | UC-03 | OTP hết hạn | Báo lỗi và yêu cầu gửi lại mã mới. |

### 2. Phân hệ Quản lý Sản phẩm (Item)

| TC ID | Use Case | Tên kịch bản | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-13.1 | UC-13 | Đăng sản phẩm thành công | Trạng thái chuyển sang "Pending Review". |
| TC-13.3 | UC-13 | Thiếu ảnh sản phẩm | Hệ thống chặn và yêu cầu ít nhất 1 ảnh. |
| TC-14.1 | UC-14 | Admin phê duyệt | Trạng thái chuyển thành "Approved". |
| TC-14.2 | UC-14 | Admin từ chối | Trạng thái "Rejected", yêu cầu lý do. |
| TC-15.1 | UC-15 | Sửa thành công | Lưu thông tin mới khi chưa đấu giá. |
| TC-15.2 | UC-15 | Chặn sửa khi đang đấu giá | Nút lưu bị vô hiệu hóa hoặc báo lỗi. |

---

## IV. HƯỚNG DẪN TIẾP TỤC KIỂM THỬ

Để tiếp tục ở máy khác, bạn nên:
1.  **Checkout** mã nguồn mới nhất.
2.  **Mở file MASTER_TEST_PLAN.md** này để nắm bắt tiến độ.
3.  Tiếp tục viết Test Case cho các module chưa hoàn thiện (Auction, Payment, Warehouse).
4.  Sử dụng các ID (TC-xx.x) để đánh dấu kết quả trong file Excel hoặc công cụ quản lý test (Jira, TestRail).

---
*Tài liệu được khởi tạo tự động phục vụ quá trình bàn giao và kiểm thử.*
