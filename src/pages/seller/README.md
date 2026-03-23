# Seller Pages

Các trang dành cho người bán (seller) trên nền tảng đấu giá.

## Pages

### SellerDashboardPage
Trang dashboard chính cho người bán, hiển thị:
- **Hero Stats Section**: Thống kê tổng quan (độ tin cậy, đánh giá, doanh thu, số vật phẩm)
- **Wallet Balance**: Số dư ví và các thao tác rút tiền/xem lịch sử
- **Tabs Navigation**: Điều hướng giữa các tab (Tổng quan, Đấu giá đang tham gia, Vật phẩm, Đơn hàng, Phân tích)
- **Performance Chart**: Biểu đồ hiệu suất bán hàng theo thời gian
- **Active Auctions**: Danh sách các đấu giá đang hoạt động
- **Marketplace Explorer**: Khám phá các danh mục sản phẩm

**Route**: `/seller-dashboard`

**Design**: Theo đúng thiết kế Figma với:
- Gradient backgrounds
- Blur effects
- Card-based layout
- Responsive grid system

### SellerActiveAuctionsPage
Trang hiển thị các đấu giá mà seller đang tham gia, bao gồm:
- **Sub-navigation**: Tab bar để chuyển đổi giữa các section
- **Auctions Grid**: Danh sách các đấu giá với 2 chế độ xem (grid/list)
- **Status Badges**: Hiển thị trạng thái (Đang dẫn đầu/Bị vượt giá)
- **Time Countdown**: Đếm ngược thời gian còn lại
- **Bid Information**: Giá hiện tại và số lượt đặt giá
- **Marketplace Explorer**: Section khám phá danh mục

**Route**: `/seller-dashboard/active-auctions`

**Features**:
- Toggle giữa grid view và list view
- Status indicators (leading/outbid) với màu sắc khác nhau
- Real-time countdown timer
- CTA buttons khác nhau tùy trạng thái
- Responsive design

### SellerProfilePage
Trang hồ sơ công khai của người bán, hiển thị cho người mua xem.

**Route**: `/seller/:id`

### SellerItemsPage
Trang hiển thị các vật phẩm đang được seller bán đấu giá.

**Route**: `/seller-dashboard/items`

**Features**:
- Sub-navigation với 3 tabs (Đấu giá tham gia, Vật phẩm đang đấu giá, Đơn hàng)
- Toggle view mode (Grid/List)
- Item cards với status badges, countdown timer, giá hiện tại
- Marketplace Explorer section
- Responsive grid layout

### CreateAuctionPage
Trang tạo đấu giá mới cho seller đăng vật phẩm lên đấu giá.

**Route**: `![v](image.png)`

**Features**:
- **Section 1 - Thông tin vật phẩm**:
  - Tên vật phẩm (required)
  - Danh mục (dropdown: Đồng hồ, Túi xách, Rượu vang, Nghệ thuật)
  - Tình trạng (buttons: Mới 100%/Đã qua sử dụng)
  - Mô tả chi tiết (textarea)

- **Section 2 - Hình ảnh vật phẩm**:
  - Upload area với drag & drop support
  - Photo guidelines với 4 loại ảnh: Góc chính, Chi tiết, Nhãn mác, Chứng từ
  - Status indicators (success/pending)
  - Warning message về yêu cầu ảnh
  - Hỗ trợ tối đa 8 ảnh, mỗi ảnh 5MB

- **Section 3 - Giá & Thời gian**:
  - Giá khởi điểm (VND) với currency symbol
  - Giá bán ngay (optional)
  - Thời gian đấu giá (dropdown: 3/5/7/10 ngày)
  - Bước giá tối thiểu

- **Verification Section**:
  - Toggle switch để yêu cầu xác thực bởi chuyên gia oio.vn
  - Shield icon với gradient background

- **Form Actions**:
  - "Lưu bản nháp" button (secondary)
  - "Đăng vật phẩm đấu giá" button (primary với icon)

- Back link về Seller Dashboard
- Responsive design với breakpoints

**Styling**: `CreateAuctionPage.scss`
- Dark theme (#030712, #111827)
- Blue accents (#0F66BD, #2563EB)
- Gradient sections với rgba(15, 102, 189, 0.05) backgrounds
- Custom toggle switch với smooth transitions
- Upload area với dashed border (#0F66BD)
- Photo guidelines grid (4 columns)
- Price input với absolute positioned currency symbol
- Form sections với blue tinted borders
- Shadow effects với blue tint

### CreateItemPage
Trang tạo vật phẩm mới để đưa vào đấu giá.

**Route**: `/create-item`

## Styling

Tất cả các trang seller sử dụng design system thống nhất:
- **Colors**: Dark theme với blue accents (#0F66BD, #2563EB)
- **Typography**: Inter font family
- **Spacing**: 8px base unit
- **Border Radius**: 8px, 12px, 16px, 24px
- **Shadows**: Subtle shadows với blue tint

## Status Colors

- **Leading (Đang dẫn đầu)**: Green (#16A34A)
- **Outbid (Bị vượt giá)**: Red (#EF4444)
- **Primary Blue**: #0F66BD
- **Secondary Blue**: #2563EB

## Data Flow

```
SellerActiveAuctionsPage
  ↓
useSellerDashboard() hook
  ↓
TanStack Query
  ↓
API Service (mock data hiện tại)
```

## Navigation Flow

```
SellerDashboardPage (Tổng quan)
  ↓
Tab: "Đấu giá đang tham gia"
  ↓
SellerActiveAuctionsPage
```

## TODO

- [ ] Kết nối với API thật thay vì mock data
- [ ] Implement real-time countdown timer
- [ ] Thêm WebSocket cho live bid updates
- [ ] Implement list view mode
- [ ] Thêm filters (status, category, price range)
- [ ] Implement pagination
- [ ] Thêm sort options (time, price, bids)
- [ ] Implement quick bid modal
