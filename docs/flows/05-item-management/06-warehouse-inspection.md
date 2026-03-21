# 06 -- Warehouse Inspection

> **Status**: Not Implemented
> **BE docs**: `backend/docs/flows/05-item-management/06-warehouse-inspection.md`

## Overview

When a seller submits an item with `verifyByPlatform = true`, the item follows the warehouse inspection path. The seller ships the physical item to the OIO warehouse, where an inspector records its condition and a reviewer makes a decision (approve, reject, or request condition confirmation if the inspected condition differs from the seller's declaration).

This entire flow is **not implemented** on the frontend. The FE always uses `verifyByPlatform = false` (admin review path).

---

## BE Endpoints (Not Consumed)

### Seller Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/items/{itemId}/shipping` | Book shipping to warehouse (sender info, weight, insurance) |
| `POST` | `/api/items/{itemId}/confirm-inspected-condition` | Confirm the inspector-assessed condition |

### Warehouse Staff Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/warehouse/inbound-shipments/inspection-queue` | View shipments awaiting inspection |
| `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/inspect` | Record inspection results + evidence |
| `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/review` | Make decision (approve/reject/condition confirmation) |

---

## BE Flow Summary

```
1. Seller submits item with verifyByPlatform = true
   -> Item status: draft -> pending_verify
   -> Notification: "item_shipping_required" sent to seller

2. Seller books shipping via POST /api/items/{id}/shipping
   -> Creates InboundShipment (awaiting_pickup)
   -> Seller ships physical item to warehouse

3. Shipment arrives at warehouse (status = arrived)

4. Inspector records inspection: POST /api/warehouse/inbound-shipments/{id}/inspect
   -> Records condition, notes, evidence photos
   -> Creates WarehouseInspection (decisionStatus = pending_review)
   -> Notification: "platform_inspection_recorded" sent to seller

5. Reviewer decides: POST /api/warehouse/inbound-shipments/{id}/review
   a. Approve (condition matches declared) -> item = approved
   b. Approve (condition differs) -> item = pending_condition_confirmation
   c. Reject -> item = rejected

6. (If condition differs) Seller confirms: POST /api/items/{id}/confirm-inspected-condition
   -> Item condition updated to inspector's assessment
   -> item = approved
```

---

## Item Status Transitions (Warehouse Path)

```
draft -> pending_verify        (submit with verifyByPlatform = true)
pending_verify -> approved     (inspection approved, condition matches)
pending_verify -> rejected     (inspection rejected)
pending_verify -> pending_condition_confirmation  (condition differs)
pending_condition_confirmation -> approved  (seller confirms)
```

---

## Implementation Notes

To implement this on the frontend, the following would be needed:

### Seller-Side
1. **Shipping form page**: Address, weight, insurance, package dimensions
2. **Item status display**: Show `pending_verify` and `pending_condition_confirmation` states with explanatory text
3. **Condition confirmation page**: Show inspected vs declared condition, confirm button
4. **Tracking view**: Display shipment tracking events

### Warehouse Staff-Side
1. **Inspection queue page**: List of arrived shipments
2. **Inspection form**: Condition selector, notes, evidence photo upload
3. **Review decision form**: Approve/reject with reason

### Service Functions Needed
- `submitItemShipping()` -- POST /api/items/{id}/shipping
- `confirmInspectedCondition()` -- POST /api/items/{id}/confirm-inspected-condition
- `getInspectionQueue()` -- GET /api/warehouse/inbound-shipments/inspection-queue
- `inspectShipment()` -- POST /api/warehouse/inbound-shipments/{id}/inspect
- `reviewInspection()` -- POST /api/warehouse/inbound-shipments/{id}/review

---

## Source Files

No FE source files exist for this feature yet.
