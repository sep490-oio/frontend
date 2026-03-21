# 03a - Auction Review / Item Approval (Frontend)

## Status: Partial

The admin item review flow (approve/reject) is implemented via `adminService.ts`. The platform verification path (warehouse inspection, condition confirmation) has service functions defined but no dedicated admin UI pages.

---

## Overview

Before an auction can be submitted, the underlying **Item** must be approved. The FE has two touchpoints:

1. **Seller side**: `submitItemForReview()` sends the item for admin review (`POST /api/items/{id}/submit`)
2. **Admin side**: `approveItem()` / `rejectItem()` approve or reject the item

The `VerifyByPlatform` flag determines the review path:
- `false` (default in FE): Standard admin review — admin approves/rejects online
- `true`: Platform verification — item shipped to warehouse for physical inspection (not yet built in FE)

---

## API Calls (Implemented)

### Seller Functions (auctionService.ts)

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `submitItemForReview()` | POST | `/api/items/{id}/submit` | Submit item for review (draft -> pending_review) |

```typescript
export async function submitItemForReview(
  itemId: string,
  verifyByPlatform: boolean = false  // Always false in current FE
): Promise<void> {
  await api.post(`/api/items/${itemId}/submit`, { verifyByPlatform });
}
```

### Admin Functions (adminService.ts)

| Function | Method | Endpoint | Purpose |
|----------|--------|----------|---------|
| `approveItem()` | POST | `/api/admin/items/{id}/approve` | Approve item (pending_review -> approved) |
| `rejectItem()` | POST | `/api/admin/items/{id}/reject` | Reject item with reason |
| `getItemReviewQueue()` | GET | `/api/admin/items/review-queue` | List items pending review |
| `getAdminItemDetail()` | GET | `/api/admin/items/{id}` | Get item detail for review |
| `assignItemReviewer()` | POST | `/api/admin/items/{id}/assign` | Assign admin to review |
| `getItemReviewHistory()` | GET | `/api/admin/items/{id}/reviews` | Get review history |

---

## Seller Flow (MyListingsPage)

The "Submit for Review" button appears for items with `status === 'draft'`:

```typescript
{record.status === 'draft' && (
  <Button onClick={() => handleSubmitItem(record.id)}>
    {t('myListings.submitForReview')}
  </Button>
)}
```

After submission, the item status changes to `pending_review` and the "Create Auction" button is hidden until the admin approves.

---

## Admin Flow (AdminItemsPage — partial)

The admin items page uses `approveItem()` and `rejectItem()` from `adminService.ts`. The item review queue is fetched via `getItemReviewQueue()`.

---

## Item Status Lifecycle (FE display)

The FE displays item statuses with color-coded tags in MyListingsPage:

| Status | Color | i18n Key |
|--------|-------|----------|
| `draft` | default (grey) | `myListings.itemStatusDraft` |
| `pending_review` | processing (blue) | `myListings.itemStatusPendingReview` |
| `pending_verify` | gold | `myListings.itemStatusPendingVerify` |
| `approved` | cyan | `myListings.itemStatusApproved` |
| `active` | green | `myListings.itemStatusActive` |
| `in_auction` | blue | `myListings.itemStatusInAuction` |
| `sold` | purple | `myListings.itemStatusSold` |
| `removed` | red | `myListings.itemStatusRemoved` |

---

## Not Yet Implemented

The following BE flows have no FE UI:

1. **Platform verification path** (`VerifyByPlatform = true`):
   - Warehouse inspection submission (`POST /api/warehouse/inbound-shipments/{id}/inspect`)
   - Inspection review (`POST /api/warehouse/inbound-shipments/{id}/review`)
   - Condition confirmation (`POST /api/items/{id}/confirm-inspected-condition`)
   - `ContinueVerifiedAuctionService` auto-continuation

2. **Dedicated admin auction review page** — auctions are reviewed indirectly through item approval

---

## Source Files

| File | Path |
|------|------|
| Seller service | `src/services/auctionService.ts` (submitItemForReview) |
| Seller hook | `src/hooks/useItems.ts` (useSubmitItem) |
| Admin service | `src/services/adminService.ts` (approveItem, rejectItem, etc.) |
| MyListingsPage | `src/pages/seller/MyListingsPage.tsx` |

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/03a-auction-review.md` for the full dual-path review flow, platform verification steps, and `ContinueVerifiedAuctionService` details.
