# 05 -- Admin Review

> **Status**: Implemented
> **BE docs**: `backend/docs/flows/05-item-management/05-admin-review.md`

## Overview

Admins review items submitted via the `pending_review` path. The `AdminItemsPage` displays a paginated review queue with filtering by status. Admins can approve items (one-click with confirmation) or reject them (with a required rejection reason).

---

## API Calls

### GET `/api/admin/items/review-queue` -- Fetch Review Queue

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/admin/items/review-queue` |
| **Permission** | `Catalogs.Admin.ReadItems` |
| **FE Function** | `getItemReviewQueue()` in `src/services/adminService.ts` |

#### Query Parameters

```typescript
export interface ItemReviewQueueParams {
  Status?: string;           // Filter by item status
  AssignedAdminId?: string;  // Filter by assigned reviewer
  PageNumber?: number;       // Page number (default 1)
  PageSize?: number;         // Page size (default 15)
}
```

#### Response: `200 OK` with `PagedList<ReviewQueueItemDto>`

Queue items include: `itemId`, `title`, `status`, `condition`, `sellerId`, `assignedAdminId`, `resubmissionCount`, `mediaCount`, `submittedAt`, `createdAt`.

Ordered by `submittedAt` ascending (oldest first).

---

### POST `/api/admin/items/{itemId}/approve` -- Approve Item

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/admin/items/{itemId}/approve` |
| **Permission** | `Catalogs.Admin.ManageItems` |
| **FE Function** | `approveItem()` in `src/services/adminService.ts` |

No request body. Transitions item: `pending_review` -> `approved`.

#### Response: `204 No Content`

---

### POST `/api/admin/items/{itemId}/reject` -- Reject Item

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/admin/items/{itemId}/reject` |
| **Permission** | `Catalogs.Admin.ManageItems` |
| **FE Function** | `rejectItem()` in `src/services/adminService.ts` |

#### Request Body

```typescript
export interface RejectItemRequest {
  reason?: string | null;  // Required by BE (max 1000 chars), optional in FE type
}
```

Note: The FE type marks `reason` as optional, but the UI enforces non-empty input before sending.

#### Response: `204 No Content`

---

### Available but Not Surfaced in UI

| Method | Path | FE Function | Notes |
|--------|------|-------------|-------|
| `GET` | `/api/admin/items/{id}` | `getAdminItemDetail()` | Item detail view not built |
| `POST` | `/api/admin/items/{id}/assign` | `assignItemReviewer()` | Manual reviewer assignment not surfaced |
| `GET` | `/api/admin/items/{id}/reviews` | `getItemReviewHistory()` | Moderation history timeline not built |

---

## FE Implementation

**File**: `src/pages/admin/AdminItemsPage.tsx`

### Page Layout

```
AdminItemsPage
├── Header: Title + subtitle (showing total count) + Refresh button
├── Filter: Status Select (pending / approved / rejected)
└── Table (review queue)
    ├── Item column: Avatar + title + condition + categoryId
    ├── Status column: Color-coded Tag
    ├── Reviewer column: "Assigned" tag or "Not assigned" text
    ├── Created At column: Formatted date with tooltip
    └── Actions column: Approve + Reject buttons
```

### Table Configuration

- **Row key**: `itemId` (not `id` -- BE response uses `itemId` for review queue items)
- **Page size**: 15 rows per page
- **Scroll**: Horizontal scroll at 800px
- **Pagination**: Server-side via `PageNumber` parameter

### Status Color Map

```typescript
const colorMap: Record<string, string> = {
  draft: 'default',
  pending_review: 'processing',
  pending_verify: 'gold',
  pending_condition_confirmation: 'gold',
  approved: 'cyan',
  rejected: 'red',
  active: 'green',
  in_auction: 'blue',
  sold: 'purple',
  removed: 'red',
};
```

Status labels use dynamic i18n keys: `t('admin.items.status.${status}')` with a fallback to the raw status string.

### Approve Flow

1. Admin clicks the green checkmark button
2. Ant Design `modal.confirm()` shows a confirmation dialog
3. On confirm, calls `approveMutation.mutateAsync(record.itemId)`
4. On success: shows `t('admin.items.approved')` toast, invalidates `['admin', 'items', 'review-queue']` query
5. On error: shows `t('common.error.generic')` toast

### Reject Flow

1. Admin clicks the red X button
2. Opens a `Modal` with a `TextArea` for the rejection reason
3. FE validates the reason is non-empty (`rejectReason.trim()`)
4. On confirm, calls `rejectMutation.mutate({ itemId, reason: rejectReason })`
5. On success: shows `t('admin.items.rejected')` toast, closes modal, resets reason, invalidates query
6. On error: shows `t('common.error.generic')` toast

### TanStack Query Setup

```typescript
const { data, isFetching, refetch } = useQuery({
  queryKey: ['admin', 'items', 'review-queue', params],
  queryFn: () => getItemReviewQueue(params),
  placeholderData: (prev) => prev,  // Keep previous data while refetching
});
```

Mutations use inline `useMutation` (not extracted to a custom hook) with manual query invalidation.

---

## Status Filter

The UI offers three filter options via a `Select` dropdown:

| Value | Label Key | Description |
|-------|----------|-------------|
| `pending` | `admin.items.status.pending` | Items awaiting review |
| `approved` | `admin.items.status.approved` | Already approved items |
| `rejected` | `admin.items.status.rejected` | Rejected items |

Note: The filter sends the selected value as the `Status` query parameter. The BE validates against `ItemStatus.All`.

---

## Gaps vs BE

| BE Feature | FE Status | Notes |
|-----------|-----------|-------|
| Admin item detail view | Service exists, no UI | `getAdminItemDetail()` available |
| Manual reviewer assignment | Service exists, no UI | `assignItemReviewer()` available |
| Review/moderation history | Service exists, no UI | `getItemReviewHistory()` available |
| Filter by `assignedAdminId` | Param supported, no UI | `ItemReviewQueueParams` has the field |
| Reviewer column shows name | Not implemented | Shows "Assigned"/"Not assigned" tags only |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/pages/admin/AdminItemsPage.tsx` | Admin review queue page (table + approve/reject actions) |
| `src/services/adminService.ts` | `getItemReviewQueue()`, `approveItem()`, `rejectItem()`, `assignItemReviewer()`, `getAdminItemDetail()`, `getItemReviewHistory()` |
