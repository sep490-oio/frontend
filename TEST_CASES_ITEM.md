# Bộ Test Cases - Phân hệ Sản phẩm (Item)

Tài liệu này chi tiết các kịch bản kiểm thử cho Use Case UC-13, UC-14 và UC-15.

## UC-13: Đăng bán sản phẩm

| TC ID | Tên kịch bản | Các bước thực hiện | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-13.1 | Đăng sản phẩm thành công | 1. Vào trang "Tạo sản phẩm"<br>2. Tải lên ít nhất 1 ảnh<br>3. Nhập tiêu đề, mô tả, chọn danh mục<br>4. Nhấn "Gửi duyệt" | Sản phẩm được tạo thành công với trạng thái "Pending Review". |
| TC-13.2 | Thiếu thông tin bắt buộc | 1. Để trống tiêu đề hoặc không chọn danh mục<br>2. Nhấn "Gửi duyệt" | Hệ thống báo lỗi tại các trường còn trống, không cho phép gửi. |
| TC-13.3 | Không có ảnh sản phẩm | 1. Nhập đầy đủ thông tin chữ<br>2. Không tải ảnh nào<br>3. Nhấn "Gửi duyệt" | Thông báo lỗi: "Vui lòng tải lên ít nhất một ảnh minh họa sản phẩm". |
| TC-13.4 | Định dạng ảnh không hỗ trợ | 1. Tải lên file không phải ảnh (ví dụ: .pdf, .zip)<br>2. Nhấn "Gửi duyệt" | Hệ thống chặn file và báo lỗi định dạng không hợp lệ. |
| TC-13.5 | Lưu bản nháp | 1. Nhập một vài thông tin cơ bản<br>2. Nhấn "Lưu bản nháp" | Sản phẩm được lưu với trạng thái "Draft", người bán có thể sửa tiếp sau đó. |

## UC-14: Duyệt sản phẩm (Admin)

| TC ID | Tên kịch bản | Các bước thực hiện | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-14.1 | Phê duyệt sản phẩm | 1. Admin vào "Hàng đợi duyệt"<br>2. Xem chi tiết sản phẩm hợp lệ<br>3. Nhấn "Phê duyệt" | Trạng thái sản phẩm chuyển thành "Approved". Sản phẩm sẵn sàng để đưa lên sàn đấu giá. |
| TC-14.2 | Từ chối sản phẩm | 1. Xem sản phẩm không hợp lệ (ví dụ: mô tả vi phạm quy định)<br>2. Nhấn "Từ chối"<br>3. Nhập lý do từ chối | Trạng thái chuyển thành "Rejected". Người bán nhận được thông báo kèm lý do. |
| TC-14.3 | Kiểm tra hàng đợi | 1. Đăng nhập quyền Admin<br>2. Truy cập /admin/items/review | Danh sách hiển thị đúng các sản phẩm đang ở trạng thái "Pending Review". |

## UC-15: Chỉnh sửa sản phẩm

| TC ID | Tên kịch bản | Các bước thực hiện | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-15.1 | Chỉnh sửa thành công | 1. Người bán vào "Sản phẩm của tôi"<br>2. Chọn sản phẩm đang chờ duyệt hoặc nháp<br>3. Thay đổi tiêu đề/mô tả và nhấn "Cập nhật" | Thông tin mới được lưu thành công. |
| TC-15.2 | Chặn sửa khi đang đấu giá | 1. Truy cập trang sửa của sản phẩm đang trong phiên đấu giá "Active"<br>2. Cố gắng nhấn "Lưu" | Hệ thống không cho phép chỉnh sửa (nút Lưu bị vô hiệu hóa hoặc báo lỗi hệ thống). |
| TC-15.3 | Kiểm tra quyền truy cập | 1. Đăng nhập tài khoản A<br>2. Cố gắng truy cập link chỉnh sửa sản phẩm của tài khoản B | Hệ thống báo lỗi "403 Forbidden" hoặc chuyển hướng về trang danh sách. |

---
*Ghi chú: Đảm bảo kiểm tra tính đồng bộ của dữ liệu giữa giao diện người bán và giao diện Admin.*
