# 05 -- Outbound Shipment

> **FE Status: NOT IMPLEMENTED**

## Summary

After auction ends and order is paid, admin books an outbound shipment to deliver the item from the warehouse to the buyer via GHN. The BE calls GHN's order creation API, reserves the warehouse item, and tracks delivery via webhooks.

## BE Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/warehouse/outbound-shipments` | Book outbound shipment (permission: `warehouse:outbound:book`) |
| `GET` | `/api/warehouse/outbound-shipments` | List outbound shipments |
| `GET` | `/api/warehouse/outbound-shipments/{shipmentId}` | Get outbound shipment details |

### Book Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `OrderId` | `Guid` | Yes | Associated order |
| `WarehouseItemId` | `Guid` | Yes | Must be `Stored` status |
| `RecipientName` | `string` | Yes | Buyer name |
| `RecipientPhone` | `string` | Yes | Buyer phone |
| `RecipientAddress` | `string` | Yes | Buyer street address |
| `RecipientWard` | `string` | Yes | Ward |
| `RecipientDistrict` | `string` | Yes | District |
| `RecipientProvince` | `string` | Yes | Province |
| `WeightGrams` | `int` | Yes | Package weight (> 0) |
| `InsuranceValue` | `decimal` | Yes | Insurance value (>= 0) |
| `CodAmount` | `decimal` | Yes | COD amount (>= 0) |
| `ItemName` | `string` | Yes | For carrier manifest |
| `ItemPrice` | `decimal` | Yes | For carrier manifest (>= 0) |
| `LengthCm`, `WidthCm`, `HeightCm` | `int?` | No | Package dimensions |
| `RecipientCarrierAddressDataJson` | `string?` | No | GHN address IDs JSON |
| `GhnPaymentTypeId` | `string?` | No | `"1"` = shop pays (default), `"2"` = buyer pays |
| `GhnHandlingNote` | `string?` | No | Default: `CHOTHUHANG` (allow try) |

### Outbound Shipment Statuses

`Pending` -> `Booked` -> `PickedUp` -> `InTransit` -> `Delivered`

Also: `Failed` -> `Returning` -> `Returned`, `Cancelled` (only before `PickedUp`)

### Webhook-Driven Side Effects

- **PickedUp**: `order.MarkAsShipped()`, warehouse item dispatched (storage freed)
- **Delivered**: `order.MarkAsDelivered()` with return decision window

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `bookOutboundShipment()`, `getOutboundShipments()`, `getOutboundShipment()`
- [ ] **Types**: `OutboundShipmentDto`, `BookOutboundShipmentRequest`, `OutboundShipmentStatus` enum
- [ ] **Admin page**: Form to book outbound shipment (recipient address, package details, payment type)
- [ ] **Admin page**: List outbound shipments with status badges and tracking numbers
- [ ] **Detail view**: Shipment detail with tracking timeline, GHN tracking number link
- [ ] **Order integration**: Link outbound shipment to order detail page
- [ ] **i18n**: All labels in Vietnamese (primary) and English
