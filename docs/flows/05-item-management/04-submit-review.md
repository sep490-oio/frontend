# 04 -- Submit for Review

> **Status**: Implemented
> **BE docs**: `backend/docs/flows/05-item-management/04-submit-review.md`

## Overview

After a seller finishes preparing an item (title, images, details), they submit it for admin review. The FE always uses the admin review path (`verifyByPlatform = false`), which transitions the item from `draft` to `pending_review`. The warehouse inspection path (`verifyByPlatform = true`) is not implemented on the frontend.

Submission happens in two places:
1. **Automatically** at the end of the CreateItemPage wizard (after creating the item and attaching images)
2. **Manually** from the MyListingsPage "Submit for Review" button (for items that stayed as drafts)

---

## API Call

### POST `/api/items/{itemId}/submit` -- Submit Item

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/items/{itemId}/submit` |
| **Permission** | `items.create` |
| **FE Function** | `submitItemForReview()` in `src/services/auctionService.ts` |
| **Hook** | `useSubmitItem()` in `src/hooks/useItems.ts` |

#### Request Body

```json
{
  "verifyByPlatform": false
}
```

The FE always sends `false` -- admin reviews the item online.

#### Response: `204 No Content`

---

## FE Implementation

### Service Function

**File**: `src/services/auctionService.ts`

```typescript
export async function submitItemForReview(
  itemId: string,
  verifyByPlatform: boolean = false
): Promise<void> {
  await api.post(`/api/items/${itemId}/submit`, { verifyByPlatform });
}
```

### Hook

**File**: `src/hooks/useItems.ts`

```typescript
export function useSubmitItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => submitItemForReview(itemId, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myItems'] });
    },
  });
}
```

Hardcodes `verifyByPlatform = false` in the hook itself.

### Usage in CreateItemPage

Submit is called as step 3 of the creation flow, after item creation and image attachment:

```typescript
if (uploadedImages.length > 0) {
  try {
    await submitItem.mutateAsync(itemId);
    setSubmitted(true);
    message.success(t('createItem.submitSuccess'));
  } catch {
    // Submit failed — item stays as draft with images attached
  }
}
```

Note: Submit is only attempted if images were uploaded (the BE requires at least 1 media to submit).

### Usage in MyListingsPage

A "Submit for Review" button appears for items with `status === 'draft'`:

```typescript
{record.status === 'draft' && (
  <Button size="small" loading={submitItem.isPending}
    onClick={() => handleSubmitItem(record.id)}>
    {t('myListings.submitForReview')}
  </Button>
)}
```

Error handling extracts the `detail` or `title` from BE error responses:

```typescript
const errorMsg = axios.isAxiosError(err)
  ? (err.response?.data?.detail ?? err.response?.data?.title ?? t('common.error'))
  : t('common.error');
message.error(errorMsg);
```

---

## State Transitions

```
draft --(submit, verifyByPlatform=false)--> pending_review
```

The FE does not support:
- `verifyByPlatform = true` (warehouse path: `draft` -> `pending_verify`)
- Resubmit (`rejected` -> `pending_review` via `POST /api/items/{id}/resubmit`)

---

## BE Preconditions

| Precondition | BE Error Code | FE Prevention |
|-------------|--------------|---------------|
| Item must exist | `Item.NotFound` | N/A (item just created) |
| Caller must be seller | `Item.NotOwnedByUser` | Seller role gate on page |
| Status must be `draft` | `Item.InvalidState` | Button only shown for draft items |
| Must have >= 1 media | `Item.CannotActivate` | Submit only attempted if `uploadedImages.length > 0` |

---

## BE Side Effects (Not Visible to FE)

When an item is submitted with `verifyByPlatform = false`:

1. Status changes to `pending_review`
2. An `ItemModerationReview` record is created with `action = submitted`
3. If no admin is assigned, one is auto-assigned via `AuctionReviewAssignments`
4. An `ItemStatusChangedEvent` is raised
5. If an auction exists for this item, a `item_submitted_for_review` notification is dispatched

---

## Not Implemented: Resubmit

The BE supports resubmitting rejected items via `POST /api/items/{id}/resubmit`:
- Increments `ResubmissionCount`
- Clears `RejectionReason`
- Can choose either admin review or warehouse path

The FE does not have a resubmit button or UI for rejected items. A seller whose item is rejected has no way to resubmit from the current frontend.

---

## Source Files

| File | What it does |
|------|-------------|
| `src/services/auctionService.ts` | `submitItemForReview()` function |
| `src/hooks/useItems.ts` | `useSubmitItem()` mutation hook |
| `src/pages/seller/CreateItemPage.tsx` | Auto-submit after creation (step 3) |
| `src/pages/seller/MyListingsPage.tsx` | Manual "Submit for Review" button for draft items |
