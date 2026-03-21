# 02 -- Inspector Queue

> **FE Status: NOT IMPLEMENTED**

## Summary

Inspectors view a queue of items that have arrived at the warehouse and submit physical inspection results (condition assessment + photo evidence). The queue has two categories: `awaiting_inspection` (arrived, not yet inspected) and `awaiting_review` (inspected, pending admin review).

## BE Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/warehouse/inbound-shipments/inspection-queue` | Get inspection queue (permission: `warehouse:shipments:read`) |
| `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/inspect` | Submit inspection (permission: `warehouse:item:inspect`) |

### Inspection Queue Response (`InspectionQueueItemDto`)

| Field | Type | Description |
|-------|------|-------------|
| `InboundShipmentId` | `Guid` | Shipment ID |
| `ItemId` | `Guid` | Catalog item ID |
| `ItemTitle` | `string` | Item title for display |
| `SellerId` | `Guid` | Seller user ID |
| `WarehouseItemId` | `Guid?` | Null if not yet inspected |
| `InspectionId` | `Guid?` | Null if not yet inspected |
| `ShipmentStatus` | `string` | `arrived` or `inspected` |
| `QueueStatus` | `string` | `awaiting_inspection` or `awaiting_review` |
| `CarrierTrackingNumber` | `string?` | GHN tracking number |
| `ArrivedAt` | `DateTime?` | Arrival timestamp |
| `DeclaredCondition` | `string` | Seller's declared condition |
| `ConditionOnArrival` | `string?` | Inspector's assessed condition (null if not inspected) |
| `InspectedAt` | `DateTime?` | Inspection timestamp |

### Inspect Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `Condition` | `string` | Yes | One of: `new`, `like_new`, `very_good`, `good`, `acceptable`, `damaged` |
| `InspectionNotes` | `string?` | No | Free-text notes |
| `InspectionMediaUploadIds` | `Guid[]` | Yes (min 1) | Pre-uploaded media with context `warehouse_inspection` |

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `getInspectionQueue()`, `inspectWarehouseItem()`
- [ ] **Types**: `InspectionQueueItemDto`, `InspectWarehouseItemRequest`, `WarehouseItemCondition` enum
- [ ] **Inspector page**: Queue list with tabs or filters for `awaiting_inspection` / `awaiting_review`
- [ ] **Inspector page**: Inspection form with condition dropdown, notes textarea, media upload
- [ ] **Media upload**: Integrate with existing media upload (context = `warehouse_inspection`)
- [ ] **Condition comparison**: Show seller's declared condition alongside inspector's assessment
- [ ] **i18n**: All labels in Vietnamese (primary) and English
