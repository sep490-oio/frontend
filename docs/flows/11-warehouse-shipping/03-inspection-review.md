# 03 -- Inspection Review

> **FE Status: NOT IMPLEMENTED**

## Summary

Admin reviews a warehouse inspection and decides: approve, reject, or require seller condition confirmation (when inspected condition differs from declared). Approval can auto-advance the associated auction via `ContinueVerifiedAuctionService`.

## BE Endpoint

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/warehouse/inbound-shipments/{shipmentId}/review` | Review inspection (permission: `warehouse:item:inspect`) |

### Request Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `Decision` | `string` | Yes | `"approve"` or `"reject"` |
| `Reason` | `string?` | Required if reject | Rejection reason |

### Three Decision Paths

1. **Approve + condition matches** -- inspection approved, item advances, auction auto-continues if exists
2. **Approve + condition differs** -- `condition_confirmation_required` status, seller must confirm via `POST /api/items/{id}/confirm-inspected-condition`
3. **Reject** -- inspection rejected with reason, seller notified

### Inspection Decision Statuses

| Status | Description |
|--------|-------------|
| `pending_review` | Default after inspector submits |
| `approved` | Admin approved, condition matches |
| `rejected` | Admin rejected with reason |
| `condition_confirmation_required` | Condition differs, awaiting seller confirmation |
| `condition_confirmed` | Seller confirmed updated condition |

## FE Requirements Checklist

- [ ] **Service**: `warehouseService.ts` -- `reviewWarehouseInspection()`
- [ ] **Types**: `ReviewWarehouseInspectionRequest`, `WarehouseInspectionDecisionStatus` enum
- [ ] **Admin page**: Review UI accessible from inspection queue (`awaiting_review` items)
- [ ] **Admin page**: Side-by-side view of declared vs. inspected condition with evidence photos
- [ ] **Admin page**: Approve/reject buttons with rejection reason modal
- [ ] **Condition mismatch handling**: Visual highlight when conditions differ
- [ ] **i18n**: All labels in Vietnamese (primary) and English
