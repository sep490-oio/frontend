# 07 -- Cancel Shipment

> **FE Status: NOT IMPLEMENTED**

## Summary

Cancel inbound or outbound shipments. The BE calls GHN's cancel API if a carrier booking exists. For outbound cancellations, the warehouse item is restored to `Stored` status.

## BE Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/cancel` | Cancel inbound shipment (permission: `warehouse:shipments:read`) |
| `POST` | `/api/warehouse/outbound-shipments/{shipmentId}/cancel` | Cancel outbound shipment (permission: `warehouse:shipments:read`) |

### Request Body

```json
{ "Reason": "string" }
```

### Cancellation Rules

**Inbound** -- can cancel from: `AwaitingPickup`, `InTransit`, `Arrived`, `Inspected`. Cannot cancel: `Completed`, `Cancelled`, `Failed`.

**Outbound** -- can cancel from: `Pending`, `Booked`, `Failed`, `Returning`, `Returned`, `Cancelled` (idempotent). Cannot cancel: `PickedUp`, `InTransit`, `Delivered`.

### Outbound Cancel Side Effect

When an outbound shipment is cancelled and the warehouse item still has a `StorageLocationId`, the item is restored to `Stored` status (re-shelved).

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `cancelInboundShipment()`, `cancelOutboundShipment()`
- [ ] **Types**: Cancel request type with `reason` field
- [ ] **UI**: Cancel button on shipment detail/list views (shown only when cancellation is allowed per status rules)
- [ ] **UI**: Confirmation modal with reason textarea before cancellation
- [ ] **Error handling**: Display GHN rejection errors (`Ghn.CancelOrder.Rejected`)
- [ ] **i18n**: All labels in Vietnamese (primary) and English
