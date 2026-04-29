# Frontend Integration Guide: GHN Inbound Shipping Booking

This guide provides the necessary information for the Frontend to implement inbound shipping booking using the GHN specialized API.

## 1. GHN Inbound Booking
Use this endpoint when the user selects **"GHN (Giao Hàng Nhanh)"** as the shipping method. This API ensures accurate shipping fees by providing GHN-specific District and Ward IDs.

*   **Endpoint**: `POST /api/warehouse/ghn/book-inbound`
*   **Authentication**: Required (Seller)
*   **Success Response**: `201 Created`

### Request Body Example:
```json
{
  "items": [
    {
      "itemId": "019dd9f9-d089-7813-bcac-379ff0b44079", // Item UUID
      "itemPrice": 500000 // Optional declared value
    }
  ],
  "weightGrams": 500, // Total weight in grams
  "insuranceValue": 1000000, // Total insurance value (VNĐ)
  "senderMetadata": {
    "id": 1442,      // GHN DistrictID (Required for accuracy)
    "code": "21012"  // GHN WardCode (Required for accuracy)
  },
  "senderName": "Nguyen Van A",
  "senderPhone": "0912345678",
  "senderAddress": "123 Le Loi",
  "senderWard": "Phuong Ben Nghe",
  "senderDistrict": "Quan 1",
  "senderProvince": "TP. Ho Chi Minh",
  "lengthCm": 10,
  "widthCm": 10,
  "heightCm": 10,
  "notes": "Fragile",
  "ghnHandlingNote": "CHOTHUHANG" // CHOTHUHANG | CHOXEMHANGKHONGTHU | KHONGCHOXEMHANG
}
```

---

## 2. Error Handling: Duplicate Prevention

The backend prevents creating multiple active shipments for the same item.

### Duplicate Found Error
If an item already has an active inbound shipment, the API returns:

*   **Status Code**: `409 Conflict`
*   **Code**: `InboundShipment.AlreadyExists`

**Frontend Action**: Show an alert to the user: *"This item already has an active shipping request. Please check your history."*

---

## 3. Key Fields Reference

| Field | Description |
| :--- | :--- |
| `senderMetadata.id` | **GHN DistrictID**. Fetch this from GHN location API or your mapping. |
| `senderMetadata.code` | **GHN WardCode**. Fetch this from GHN location API or your mapping. |
| `ghnHandlingNote` | Instruction for the courier regarding viewing/trying on the item. |
