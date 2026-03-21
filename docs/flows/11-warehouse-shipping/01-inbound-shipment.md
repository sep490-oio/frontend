# 01 -- Inbound Shipment

> **FE Status: NOT IMPLEMENTED**

## Summary

Seller books a shipment to send their item to the OIO warehouse via GHN carrier. The BE calls GHN's order creation API, generates a tracking number, and sets shipment status to `AwaitingPickup`.

## BE Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/warehouse/inbound-shipments` | Book inbound shipment (permission: `warehouse:inbound:book`) |
| `GET` | `/api/warehouse/inbound-shipments` | List inbound shipments (paginated, filterable) |
| `GET` | `/api/warehouse/inbound-shipments/{shipmentId}` | Get single shipment details |

### Book Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `ItemId` | `Guid` | Yes | Catalog item being shipped |
| `SenderName` | `string` | Yes | Seller pickup contact |
| `SenderPhone` | `string` | Yes | Seller phone |
| `SenderAddress` | `string` | Yes | Seller street address |
| `SenderWard` | `string` | Yes | Ward |
| `SenderDistrict` | `string` | Yes | District |
| `SenderProvince` | `string` | Yes | Province |
| `WeightGrams` | `int` | Yes | Package weight (> 0) |
| `InsuranceValue` | `decimal` | Yes | Insurance value (>= 0) |
| `ItemName` | `string` | Yes | For carrier manifest |
| `ItemPrice` | `decimal` | Yes | For carrier manifest (>= 0) |
| `LengthCm`, `WidthCm`, `HeightCm` | `int?` | No | Package dimensions |
| `SenderCarrierAddressDataJson` | `string?` | No | GHN address IDs JSON |
| `ProviderCode` | `string?` | No | `null` = default provider |
| `Notes` | `string?` | No | Internal notes |
| `GhnHandlingNote` | `string?` | No | `CHOTHUHANG` / `CHOXEMHANGKHONGTHU` / `KHONGCHOXEMHANG` |

### Inbound Shipment Statuses

`AwaitingPickup` -> `InTransit` -> `Arrived` -> `Inspected` -> `Completed`

Also: `Cancelled`, `Failed` (from various states)

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `bookInboundShipment()`, `getInboundShipments()`, `getInboundShipment()`
- [ ] **Types**: `InboundShipmentDto`, `BookInboundShipmentRequest`, `InboundShipmentStatus` enum
- [ ] **Seller page**: Form to book inbound shipment (sender address fields, package dimensions, weight)
- [ ] **Seller page**: List of seller's inbound shipments with status badges
- [ ] **Admin page**: List all inbound shipments with filters (status, date range)
- [ ] **Detail view**: Shipment detail with tracking info, status timeline
- [ ] **i18n**: All labels in Vietnamese (primary) and English
