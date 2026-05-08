# Hướng dẫn tích hợp Frontend: Item Shipment Status

Tài liệu này giải thích thay đổi trong API Response của Item để hỗ trợ việc ẩn/hiện UI dựa trên trạng thái gửi hàng.

## 1. Thay đổi chính
- **Thêm trường mới**: `hasInboundShipment` (kiểu boolean).

## 2. Các API áp dụng
Tất cả các endpoint trả về thông tin Item đều được cập nhật:
- `GET /api/items/{itemId}` (Chi tiết sản phẩm).
- `GET /api/items/my` (Danh sách sản phẩm của người bán).
- `GET /api/auctions/{auctionId}` (Thông tin sản phẩm nằm trong object `item`).

## 3. Ý nghĩa trường `hasInboundShipment`
Trường này cho biết sản phẩm hiện đã có đơn gửi hàng (inbound shipment) nào đang hoạt động hoặc đã hoàn thành trên hệ thống hay chưa.

- **`true`**: Đã có đơn gửi hàng. 
    - **Hành động FE**: **ẨN** các nút hoặc UI liên quan đến việc tạo đơn gửi hàng (ví dụ: nút **"Gửi hàng tới sàn"**).
- **`false`**: Chưa có đơn gửi hàng (hoặc các đơn trước đó đã bị Hủy/Thất bại).
    - **Hành động FE**: **HIỆN** nút **"Gửi hàng tới sàn"** để người dùng có thể bắt đầu quy trình gửi hàng.

### Logic trạng thái (Phía Backend):
Trường này sẽ là `true` nếu đơn hàng ở các trạng thái: `AwaitingPickup`, `InTransit`, `Arrived`, `Inspected`, `Completed`.
Trường này sẽ là `false` nếu không có đơn hoặc đơn ở trạng thái: `Cancelled`, `Failed`.

## 4. Ví dụ JSON Response
```json
{
  "id": "018f4a1b-...",
  "title": "Tên sản phẩm",
  "status": "approved",
  "hasInboundShipment": true, 
  "images": [...],
  "createdAt": "2026-05-05T..."
}
```
