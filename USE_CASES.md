# Danh sách Use Cases - Dự án Sàn đấu giá

Tài liệu này liệt kê các kịch bản sử dụng (Use Cases) chi tiết cho từng phân hệ chức năng, phục vụ cho mục đích phát triển và kiểm thử.

## 1. Xác thực & Người dùng (Auth & User)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-01 | Đăng ký tài khoản | Người dùng mới tạo tài khoản bằng email. |
| UC-02 | Đăng nhập | Người dùng truy cập hệ thống bằng email/mật khẩu. |
| UC-03 | Xác thực 2 lớp (2FA) | Người dùng thiết lập hoặc nhập mã OTP để bảo mật. |
| UC-04 | Cập nhật hồ sơ | Thay đổi thông tin cá nhân, ảnh đại diện. |
| UC-05 | Quản lý địa chỉ | Thêm/Sửa/Xóa địa chỉ nhận hàng và gửi hàng. |
| UC-06 | Xác minh danh tính (KYC) | Gửi giấy tờ để được cấp quyền bán hàng hoặc đấu giá cao cấp. |

## 2. Quản lý Đấu giá (Auction)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-07 | Tìm kiếm đấu giá | Tìm sản phẩm theo tên, danh mục hoặc trạng thái. |
| UC-08 | Đặt thầu (Place Bid) | Người mua nhập giá thầu cho một sản phẩm. |
| UC-09 | Tự động đấu giá | Thiết lập mức giá tối đa để hệ thống tự động thầu. |
| UC-10 | Quản lý Watchlist | Lưu sản phẩm quan tâm để nhận thông báo. |
| UC-11 | Tạo đấu giá (Seller) | Người bán thiết lập giá khởi điểm, bước nhảy và thời gian. |
| UC-12 | Kết thúc đấu giá | Hệ thống tự động xác định người thắng thầu khi hết giờ. |

## 3. Quản lý Sản phẩm (Item)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-13 | Đăng bán sản phẩm | Tải ảnh, mô tả và chọn danh mục cho sản phẩm. |
| UC-14 | Duyệt sản phẩm (Admin) | Kiểm tra thông tin sản phẩm và cho phép hiển thị. |
| UC-15 | Chỉnh sửa sản phẩm | Cập nhật thông tin trước khi cuộc đấu giá bắt đầu. |

## 4. Đơn hàng & Vận chuyển (Order & Shipping)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-16 | Xác nhận đơn hàng | Người thắng thầu xác nhận thông tin nhận hàng. |
| UC-17 | Giao hàng | Người bán hoặc kho gửi hàng cho đơn vị vận chuyển. |
| UC-18 | Theo dõi vận chuyển | Kiểm tra trạng thái thực tế của đơn hàng. |
| UC-19 | Xác nhận nhận hàng | Người mua xác nhận hàng đúng mô tả. |
| UC-20 | Yêu cầu trả hàng | Người mua yêu cầu hoàn trả nếu hàng lỗi. |

## 5. Thanh toán & Ví điện tử (Payment & Wallet)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-21 | Nạp tiền vào ví | Sử dụng VnPay để nạp tiền vào hệ thống. |
| UC-22 | Ký quỹ (Deposit) | Tạm giữ tiền khi tham gia đấu giá giá trị cao. |
| UC-23 | Thanh toán đơn hàng | Sử dụng số dư ví để trả tiền cho sản phẩm thắng thầu. |
| UC-24 | Rút tiền | Người bán yêu cầu rút tiền về tài khoản ngân hàng. |

## 6. Vận hành Kho & Kiểm định (Warehouse & Inspection)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-25 | Nhập kho (Inbound) | Nhân viên kho quét mã nhận hàng từ người bán. |
| UC-26 | Kiểm định (Inspection) | Chuyên gia kiểm tra tình trạng thực tế món hàng. |
| UC-27 | Lưu kho | Gán vị trí kệ cho sản phẩm trong kho. |
| UC-28 | Xuất kho (Outbound) | Đóng gói và gửi hàng cho người mua. |

## 7. Giải quyết Khiếu nại (Dispute)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-29 | Mở khiếu nại | Người mua khiếu nại về chất lượng sản phẩm sau khi nhận. |
| UC-30 | Phân xử (Admin) | Xem xét bằng chứng và đưa ra quyết định cuối cùng. |

## 8. Quản trị (Admin)
| ID | Tên Use Case | Mô tả |
|:---|:---|:---|
| UC-31 | Quản lý người dùng | Khóa/Mở khóa tài khoản người dùng. |
| UC-32 | Thống kê doanh thu | Xem báo cáo về giao dịch và phí sàn. |
| UC-33 | Cấu hình hệ thống | Thay đổi thiết lập phí sàn và quy định. |

---
*Tài liệu này được sử dụng làm cơ sở để xây dựng bộ Test Cases.*
