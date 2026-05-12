# Bộ Test Cases - Phân hệ Xác thực (Auth)

Tài liệu này chi tiết các kịch bản kiểm thử cho Use Case UC-01, UC-02 và UC-03.

## UC-01: Đăng ký tài khoản

| TC ID | Tên kịch bản | Các bước thực hiện | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-01.1 | Đăng ký thành công | 1. Truy cập trang /register<br>2. Nhập Email chưa đăng ký<br>3. Nhập mật khẩu đúng quy định<br>4. Nhấn "Đăng ký" | Hệ thống tạo tài khoản thành công và gửi email xác nhận. Chuyển hướng người dùng. |
| TC-01.2 | Email đã tồn tại | 1. Nhập Email đã có trong hệ thống<br>2. Nhập các thông tin còn lại hợp lệ<br>3. Nhấn "Đăng ký" | Thông báo lỗi: "Email đã được sử dụng". Không tạo tài khoản mới. |
| TC-01.3 | Định dạng Email sai | 1. Nhập Email thiếu dấu "@" hoặc không có domain (ví dụ: test.com)<br>2. Nhấn "Đăng ký" | Hệ thống báo lỗi định dạng Email không hợp lệ ngay tại form. |
| TC-01.4 | Mật khẩu yếu | 1. Nhập mật khẩu đơn giản (ví dụ: 123456)<br>2. Nhấn "Đăng ký" | Hệ thống báo lỗi mật khẩu phải bao gồm tối thiểu 8 ký tự, chữ hoa, số và ký tự đặc biệt. |
| TC-01.5 | Xác nhận mật khẩu sai | 1. Nhập mật khẩu A<br>2. Nhập xác nhận mật khẩu B<br>3. Nhấn "Đăng ký" | Thông báo lỗi: "Mật khẩu xác nhận không khớp". |

## UC-02: Đăng nhập

| TC ID | Tên kịch bản | Các bước thực hiện | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-02.1 | Đăng nhập thành công | 1. Truy cập trang /login<br>2. Nhập Email và mật khẩu chính xác<br>3. Nhấn "Đăng nhập" | Đăng nhập thành công, chuyển hướng người dùng về Dashboard. |
| TC-02.2 | Sai mật khẩu | 1. Nhập Email đúng<br>2. Nhập mật khẩu sai<br>3. Nhấn "Đăng nhập" | Thông báo lỗi: "Email hoặc mật khẩu không chính xác". |
| TC-02.3 | Email không tồn tại | 1. Nhập một Email chưa từng đăng ký<br>2. Nhấn "Đăng nhập" | Thông báo lỗi: "Tài khoản không tồn tại hoặc thông tin không chính xác". |
| TC-02.4 | Chuyển hướng 2FA | 1. Đăng nhập bằng tài khoản đã bật 2FA<br>2. Nhấn "Đăng nhập" | Hệ thống không vào thẳng Dashboard mà chuyển sang trang nhập mã OTP (UC-03). |
| TC-02.5 | Quên mật khẩu | 1. Nhấn vào liên kết "Quên mật khẩu?" | Chuyển hướng người dùng sang trang khôi phục mật khẩu. |

## UC-03: Xác thực 2 lớp (2FA)

| TC ID | Tên kịch bản | Các bước thực hiện | Kết quả mong đợi |
|:---|:---|:---|:---|
| TC-03.1 | OTP chính xác | 1. Tại trang 2FA, nhập mã OTP nhận được từ Email/App<br>2. Nhấn "Xác nhận" | Xác thực thành công, cho phép truy cập vào Dashboard. |
| TC-03.2 | OTP sai | 1. Nhập mã OTP không khớp với mã hệ thống gửi<br>2. Nhấn "Xác nhận" | Thông báo lỗi: "Mã OTP không chính xác. Vui lòng thử lại." |
| TC-03.3 | OTP hết hạn | 1. Đợi mã OTP hết hiệu lực (thường sau 2-5 phút)<br>2. Nhập mã đó và nhấn "Xác nhận" | Thông báo lỗi: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." |
| TC-03.4 | Gửi lại mã (Resend) | 1. Nhấn vào nút "Gửi lại mã"<br>2. Kiểm tra hòm thư/app | Hệ thống gửi một mã OTP mới và cập nhật thời gian hết hạn. |

---
*Ghi chú: Các Test Case này được thiết kế để bao phủ các luồng chính (Happy Path) và các lỗi phổ biến (Edge Cases).*
