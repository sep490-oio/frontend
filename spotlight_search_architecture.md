# Kiến trúc & Triển khai tính năng Global Spotlight Search

Dưới đây là một bản tổng hợp kỹ thuật (Technical Walkthrough) về toàn bộ quá trình xây dựng và tối ưu tính năng Global Spotlight Search trên nền tảng OIO.

## 1. Mục tiêu kiến trúc (Architecture Goals)
Hệ thống Spotlight Search được thiết kế để thay thế thanh công cụ tìm kiếm truyền thống, cung cấp cho người dùng một trải nghiệm tập trung, nhanh chóng và hiệu quả giống như hệ điều hành macOS.

Các mục tiêu bao gồm:
- **Tốc độ truy cập tức thời** trên toàn dải ứng dụng.
- **Không xâm lấn UI**, hoàn toàn nằm ẩn và chỉ gọi lên khi cần.
- **Tương thích hoàn hảo** giữa thao tác phím tắt (Desktop) và thao tác chạm (Mobile).
- **Phân quyền chặt chẽ (RBAC)** nhằm bảo vệ các Route nhạy cảm.

## 2. Các thành phần kỹ thuật cốt lõi

### 2.1. Quản lý trạng thái và Trigger toàn cục
Thay vì phải truyền `state` và `props` (prop-drilling) xuống từng cây Component phức tạp, Modal Spotlight được mount duy nhất một lần ở cấp độ cao nhất (`RootLayout` hoặc Layout cha).
- Kích hoạt dựa trên **Global Event Listener**: `window.dispatchEvent(new Event('open-spotlight'))`. Các Node như thanh Search ở Drawer di động hay bất kỳ nút bấm nào trên Header đều có thể gọi Spotlight lên một cách đồng bộ mà không cần Redux Event.
- Cài đặt Hotkey **`Ctrl + Space`** liên kết qua `window.addEventListener('keydown')`, đồng thời chặn thông minh (không mở thẻ Spotlight nếu người dùng đang soạn thảo văn bản trong một `input` hoặc `textarea` khác).

### 2.2. Thuật toán lọc mềm (Fuzzy Search & Matching)
Để đảm bảo trải nghiệm tìm kiếm tự nhiên:
- Dữ liệu `SPOTLIGHT_DATA` được lập chỉ mục với các trường siêu dữ liệu ẩn: `keywords`, `path`, `category`, `title`, và `description`.
- Khi `query` thay đổi, hệ thống chuyển tất cả chuỗi về `toLowerCase()` và lọc toàn diện dữ liệu.
- **Highlighter Regex**: Bóc tách nội dung khớp và làm nổi bật màu xanh. Tôi đã phát hiện và xử lý lỗi **Regex Crash** (Uncaught Error do thiếu Regex Escape). Trước đó, nếu dùng bàn phím ảo gõ các ký tự `+ ? ( [`, App sẽ lập tức văng màn hình. Bằng cách nối thêm bước `search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`, hệ thống hiện tại an toàn tuyệt đối với mọi Input.

### 2.3. Điều hướng không thông qua Chuột (Accessibility Key Navigation)
Spotlight mạnh mẽ nhờ thao tác bàn phím:
- Biến trạng thái `selectedIndex` theo dõi ví trí con trỏ ảo.
- Lắng nghe `ArrowUp` (`↑`) và `ArrowDown` (`↓`) để điều khiển con trỏ. Tính năng **Auto-scroll** được đính kèm (`itemRefs.current[index]?.scrollIntoView`) để kéo trang cuộn tự động khi danh sách quá dài.
- Xử lý phím `Enter` tự động trigger sự kiện `navigate(path)` kết hợp hàm ngắt Pop-up `setIsOpen(false)`.

### 2.4. Phân quyền thông minh (Role-Based Access Control)
Hiển thị danh sách tuân theo các nguyên tắc an ninh Front-end:
- Giải mã trực tiếp token qua Base64 (`atob(token.split('.')[1])`) để đồng bộ Role cục bộ cấp tốc (Sync Render) thay vì đợi API trả về.
- Khớp mảng `auth: []`. Ví dụ: mục **Admin Dashboard** chỉ có mảng `['admin']`, mục **My Wallet** có `['user']`.
- Bộ lọc `useMemo` sẽ quét qua quyền của user hiện tại, vứt bỏ toàn bộ đường dẫn không dành cho họ để tạo ra mảng Navigation sạch. Chống trường hợp user nhìn thấy menu Admin và nhấp vào lỗi.

### 2.5. Xử lý tương thích & Thẩm mỹ UI (Styling Refinements)
- **Vượt rào Ant Design Override**: Ant Design quy định cấu trúc padding quá dày cho Modal và Input. Tôi đã cấp thẳng `className="spotlight-modal"` cho component và áp dụng Overrides trong file `global.css` cuối cùng. Kỹ thuật này tạc đi viền xám rườm rà, ép thanh Input trở về `background: transparent !important`, giúp thiết kế giao thoa đồng bộ bảng màu chuẩn của OIO.
- **Responsive Mobile**: Triển khai check hiển thị bằng `useBreakpoint()`. Trên Mobile, chúng ta mạnh tay ẩn đi dòng hướng dẫn phím cơ (`Esc`, `Enter`) vô nghĩa do thiếu thiết bị nhập. Thiết lập vùng Tap diện tích lớn (Size padding: 12px 20px) cho ngón tay dễ chọn.

### 2.6. Đa ngôn ngữ (i18n Translation) Default Fallback
Tái thiết kế lại mạng lưới Dữ liệu (Mock Data) Spotlight:
- Nhúng `SPOTLIGHT_DATA` vào bên trong Scope của Functional Component bằng `useMemo` để nó khởi tạo lại mỗi lần Hook `i18n.language` chuyển đổi.
- Thiết lập một cấu trúc Namespace chuẩn JSON: `common:spotlight.title.xxx`, `common:spotlight.desc.xxx`.
- Triển khai dịch thuật song phương cho cả kho `vi/common.json` và `en/common.json`. Toàn bộ văn bản đều nhận dạng chủ động và hỗ trợ Fallback default text.

### 2.7. Mở rộng kiến trúc lệnh điều hướng tắt (Short-path Expansion)
Dựa trên quyền hạn (RBAC), hệ thống Spotlight được mở rộng cấu trúc dữ liệu không chỉ dừng ở Menu cơ bản, mà còn "lách" sâu vào bên trong các nhánh tính năng quản trị phức tạp:
- **Role SELLER**: Tích hợp các thao tác nhanh chặn đầu như *Ví doanh thu bán hàng* (`/seller/wallet`), *Phân tích hoạt động*, *Tạo mới phiên đấu giá/sản phẩm*, và *Lệnh nhập kho OIO*.
- **Role ADMIN**: Cắm rễ trực tiếp tới các bảng điều khiển cốt lõi như *Hồ sơ KYC/KYB cần duyệt*, *Quản trị tài khoản Shop*, *Giám sát ngân quỹ nền tảng* và *Hoạt động truy xuất phiên đấu giá kết thúc*.
Nhờ cơ chế từ khóa mảng (`keywords: []`), người quản trị thay vì click 3-4 lớp menu, trình điều hướng Spotlight có thể tiếp nhận input "nạp kho" hoặc "duyệt" và dịch ngược ra thẳng Route đích.

### 2.8. Tìm kiếm mờ đa ngữ cảnh (Cross-Lingual Fuzzy Search)
Một vấn đề thường gặp đối với cơ chế dịch `i18n` là giá trị Render trên màn hình sẽ quyết định luồng dò tìm (nếu bật tiếng Việt, gõ tiếng Anh sẽ không ra kết quả). 
Hệ thống OIO Spotlight đã xử lý triệt để điều này bằng cơ chế tiêm từ khóa ẩn kép (Dual-hidden Keywords): Mảng `keywords` của mỗi tính năng (Ví dụ như *Ví doanh thu*) được thiết kế hardcode chứa trực tiếp cả bộ alias Tiếng Anh lẫn Tiếng Việt (`['wallet', 'payouts', 'balance', 'finance', 'ví', 'rút tiền', 'doanh thu']`). 
Nhờ vậy thuật toán `item.keywords.some(...)` luôn trả về đúng trang đích bất chấp việc người dùng đang cắm giao diện ngôn ngữ gốc là gì. Trải nghiệm thao tác phím mượt mà như dùng Apple Spotlight.

### 2.9. Kiến trúc Theo dõi Lịch sử Thời gian thực (Real-time Recent Tracker)
Để tối ưu hóa trải nghiệm điều hướng chéo, hệ thống được trang bị bộ lưu trữ đệm truy cập gần nhất (Local-caching):
- **Phân tách Hộp cát (Sandbox):** Mỗi tài khoản người dùng đăng nhập sẽ nhận một `localStorage` Key riêng biệt thông qua việc trích xuất Claims (cụ thể là Subject/Id từ JWT `accessToken` qua hàm `getUserIdFromToken`). Điều này giải quyết triệt để rò rỉ dữ liệu "Vừa xem" giữa hai Account đăng nhập chéo trên cùng một thiết bị.
- **Render Đột biến Thẩm mỹ (Highlight UI):** Thông qua thẻ đánh dấu `isRecent`, Component sẽ từ bỏ việc render chuỗi URL UUID dài nhàm chán, đồng thời "nhuộm" xanh (`var(--color-info)`) icon tự động và làm đậm Text (`font-weight: 600`), giúp phiên bản Lịch sử trở nên bắt mắt vô cùng như Apple Spotlight.
- **Liên kết Dependency Chain (Bắt lỗi Caching React):** Việc đọc LocalStorage chỉ "chớp nhoáng" diễn ra khi Hook `useMemo` nhận diện có sự thay đổi ở `isOpen` (khi bật tắt modal) hoặc `currentUserId` (đổi account). Chuỗi phản ứng `isOpen ➜ SPOTLIGHT_DATA ➜ filteredData ➜ results` vốn đứt gãy đã được lập trình lại, ép kết quả tìm kiếm tự động load Realtime ngay khi bạn vừa dời khỏi một trang chi tiết.

---

### Tổng kết
Chỉ từ một tính năng Pop-up nhỏ, kiến trúc này đã bóc tách sâu qua: **Event Bus, RBAC Security, Keyboard Accessibility, Custom CSS Override, Regex Error Boundary và Internationalization Hook.** Hệ thống này giờ đây đã ổn định và hoàn toàn sẵn sàng vận hành trên thực tế.
