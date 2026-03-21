# 03 - Submit & Publish Auction (Frontend)

## Status: Implemented

---

## Overview

Two separate operations complete the auction lifecycle from the seller's perspective:

1. **Submit** (`POST /api/auctions/{id}/submit`) — transitions Draft -> Approved (requires item to be approved). Called from both CreateAuctionPage (during 3-step flow) and MyListingsPage (for standalone draft auctions).
2. **Publish** (`POST /api/auctions/{id}/publish`) — transitions Scheduled -> Active (or schedules activation). Called from CreateAuctionPage (step 3 done screen) and MyListingsPage (scheduled auctions).

---

## API Calls

| Step | Function | Method | Endpoint | Response | Purpose |
|------|----------|--------|----------|----------|---------|
| 1 | `submitAuction()` | POST | `/api/auctions/{id}/submit` | 204 | Draft -> Approved |
| 2 | `publishAuction()` | POST | `/api/auctions/{id}/publish` | 204 | Scheduled -> Active |

Both are in `src/services/auctionService.ts`.

---

## Submit Flow

### In CreateAuctionPage (3-step flow)

Submit is step 2 of the 3-step flow, called inside `handleCreate()`:

```typescript
// Step 1: Create draft
const { id: auctionId } = await createAuction.mutateAsync({ itemId, request });
// Step 2: Submit (Draft → Approved)
await submitAuction.mutateAsync(auctionId);
// Step 3: Set timing (Approved → Scheduled)
await setTiming.mutateAsync({ auctionId, timing });
```

### In MyListingsPage (standalone)

The "Submit" button appears for auctions with `status === 'draft'`:

```typescript
{record.status === 'draft' && (
  <Button onClick={() => handlePublish(record.id)}>
    {t('myListings.submit')}
  </Button>
)}
```

Note: The function is named `handlePublish` but it calls `submitAuction.mutateAsync()` — this submits a draft, it does not publish.

### BE Preconditions for Submit

| Check | Error |
|-------|-------|
| Auction status must be `Draft` | `Auction.CannotSubmit` |
| Item status must be `Approved` | `Item.InvalidState` |

### Submit Outcome

The BE examines the auction's `AuctionInfo`:
- **If `Info` is null** (no timing set): Status -> `Approved`
- **If `Info` is not null** (timing already set): Status -> `Scheduled` + raises `AuctionScheduledEvent`

In the CreateAuctionPage 3-step flow, timing is always null at submit time (it is set afterward), so the auction transitions to `Approved`.

---

## Publish Flow

### In CreateAuctionPage (step 3 done screen)

After the 3-step flow completes, the "Publish Now" button appears:

```typescript
const handlePublish = async () => {
  if (!createdAuctionId) return;
  await publishAuction.mutateAsync(createdAuctionId);
  setPublished(true);
  message.success(t('createAuction.publishSuccess'));
};
```

### In MyListingsPage

The "Publish" button appears for auctions with `status === 'scheduled'`:

```typescript
{record.status === 'scheduled' && (
  <Button type="primary" onClick={() => handlePublishAuction(record.id)}>
    {t('myListings.publish')}
  </Button>
)}
```

### BE Preconditions for Publish

| Check | Error |
|-------|-------|
| Auction status must be `Scheduled` | `Auction.InvalidState` |
| `Info` must not be null | `Auction.TimingRequired` |
| Caller must be seller | `Auction.OnlyOwnerCanPublish` |

### Publish Outcome

The BE decides between immediate and deferred activation:
- **If startTime already passed**: `AuctionActivationService` runs immediately -> checks for bid-eligible participants -> activates or auto-cancels
- **If startTime in future**: Schedules `ActivateAuctionJob` via Quartz to fire at `startTime`

---

## Error Handling

### Submit Error Mapping (MyListingsPage)

```typescript
if (beDetail.includes('pending_verify')) {
  errorMsg = t('myListings.submitErrorItemPendingVerify');
} else if (beDetail.includes('pending_review')) {
  errorMsg = t('myListings.submitErrorItemPendingReview');
} else if (beDetail.includes("Cannot perform") || beDetail.includes("cannot perform")) {
  errorMsg = t('myListings.submitErrorInvalidStatus');
}
```

### Publish Error Mapping (CreateAuctionPage)

```typescript
if (beDetail.includes('pending_verify') || beDetail.includes('pending_review')) {
  errorMsg = t('myListings.submitErrorItemPendingVerify');
} else if (beDetail.includes('Cannot perform') || beDetail.includes('cannot perform')) {
  errorMsg = t('createAuction.submitErrorInvalidStatus');
}
```

---

## Hooks Used

| Hook | Source | Purpose |
|------|--------|---------|
| `useSubmitAuction()` | `useSellerManagement.ts` | Mutation: POST submit |
| `usePublishAuction()` | `useSellerManagement.ts` | Mutation: POST publish |

Both invalidate `['myAuctions']` on success.

---

## Source Files

| File | Path |
|------|------|
| CreateAuctionPage | `src/pages/seller/CreateAuctionPage.tsx` |
| MyListingsPage | `src/pages/seller/MyListingsPage.tsx` |
| Service | `src/services/auctionService.ts` (submitAuction, publishAuction) |
| Hook | `src/hooks/useSellerManagement.ts` (useSubmitAuction, usePublishAuction) |

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/03-submit-publish.md` for the submit decision tree, VerifyByPlatform flag, and activation service details.
