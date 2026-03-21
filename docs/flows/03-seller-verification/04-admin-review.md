# 04 -- Admin Identity Verification Review

> **Status**: Implemented
> **BE docs**: `backend/docs/flows/03-seller-verification/04-admin-review.md`

## Overview

Admins review identity verifications that are in `submitted` or `under_review` status. The `AdminVerificationsPage` displays a list of pending verifications with options to view details, approve, or reject (with reason and rejection code).

---

## API Calls

### GET `/api/admin/verifications` -- Fetch Pending Verifications

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/admin/verifications` |
| **Permission** | `Admin.ReadVerifications` |
| **FE Function** | `getPendingVerifications()` in `src/services/adminService.ts` |

#### Response: `200 OK` with `VerificationDto[]`

Returns verifications in `submitted` or `under_review` status, ordered by `submittedAt` ascending (oldest first).

The FE function normalizes the response to always return an array:

```typescript
export async function getPendingVerifications(): Promise<VerificationDto[]> {
  const response = await api.get('/api/admin/verifications');
  return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
}
```

---

### GET `/api/admin/verifications/{verificationId}` -- Fetch Verification Detail

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/admin/verifications/{verificationId}` |
| **Permission** | `Admin.ReadVerifications` |
| **FE Function** | `getVerificationById()` in `src/services/adminService.ts` |

#### Response: `200 OK` with `VerificationDto`

Returns full verification detail including documents. Used to populate the detail drawer.

---

### POST `/api/admin/verifications/{verificationId}/approve` -- Approve Verification

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/admin/verifications/{verificationId}/approve` |
| **Permission** | `Admin.ManageVerifications` |
| **FE Function** | `approveVerification()` in `src/services/adminService.ts` |

No request body. Checks for duplicate identity before approving.

#### Response: `204 No Content`

---

### POST `/api/admin/verifications/{verificationId}/reject` -- Reject Verification

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/admin/verifications/{verificationId}/reject` |
| **Permission** | `Admin.ManageVerifications` |
| **FE Function** | `rejectVerification()` in `src/services/adminService.ts` |

#### Request Body

```typescript
export interface RejectVerificationRequest {
  reason?: string | null;       // Required by BE (max 1000 chars), optional in FE type
  rejectionCode?: string | null; // Optional (max 50 chars)
}
```

The UI enforces non-empty reason before sending: `rejectData.reason?.trim()` check.

#### Response: `204 No Content`

---

## FE Implementation

**File**: `src/pages/admin/AdminVerificationsPage.tsx`

### Page Layout

```
AdminVerificationsPage
├── Header: Title + subtitle (showing total count) + Refresh button
├── Table<VerificationDto>
│   ├── User column: truncated userId (first 8 chars + "...")
│   ├── Type column: blue Tag (raw verificationType string)
│   ├── Status column: Badge with color map (pending=warning, approved=success, rejected=error)
│   ├── Submitted At column: formatted date (DD/MM/YYYY) with full datetime tooltip
│   └── Actions column: View + Approve + Reject buttons
├── Detail Drawer (500px width)
│   └── Descriptions: iterates all VerificationDto fields (except "id"), shows raw JSON for objects
└── Reject Modal
    ├── Rejection Code Select: INVALID_ID, BLURRY_IMAGE, EXPIRED_ID, MISMATCH, OTHER
    └── Reason TextArea (3 rows)
```

### Table Configuration

- **Row key**: `id`
- **Scroll**: Horizontal scroll at 700px
- **Size**: `middle`

### Status Color Map

```typescript
const cfg: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};
```

Status labels use i18n keys: `t('admin.verifications.status.${v}')` with fallback to raw value.

### Approve Flow

1. Admin clicks the green checkmark button (disabled when `status !== 'pending'`)
2. Ant Design `modal.confirm()` shows a confirmation dialog
3. On confirm, calls `approveMutation.mutateAsync(record.id)`
4. On success: shows `t('admin.verifications.approved')` toast, invalidates `['admin', 'verifications']` query
5. On error: shows `t('common.error.generic')` toast

### Reject Flow

1. Admin clicks the red X button (disabled when `status !== 'pending'`)
2. Opens a `Modal` with a code `Select` and reason `TextArea`
3. Available rejection codes: `INVALID_ID`, `BLURRY_IMAGE`, `EXPIRED_ID`, `MISMATCH`, `OTHER`
4. FE validates reason is non-empty via `rejectData.reason?.trim()`
5. On confirm, calls `rejectMutation.mutate({ id: rejectModal.id, data: rejectData })`
6. On success: shows `t('admin.verifications.rejected')` toast, closes modal, resets form, invalidates query
7. On error: shows `t('common.error.generic')` toast

### Detail Drawer

- Opened via the eye icon button in the Actions column
- Fetches full verification via `getVerificationById(id)` query (enabled when drawer id is set)
- Renders all fields as a bordered `Descriptions` component
- Objects are JSON-stringified for display

### TanStack Query Setup

```typescript
// List query
const { data: verifications = [], isFetching, refetch } = useQuery<VerificationDto[]>({
  queryKey: ['admin', 'verifications'],
  queryFn: getPendingVerifications,
});

// Detail query (conditional)
const { data: verificationDetail } = useQuery<VerificationDto>({
  queryKey: ['admin', 'verifications', detailDrawer.id],
  queryFn: () => getVerificationById(detailDrawer.id!),
  enabled: !!detailDrawer.id,
});
```

Mutations use inline `useMutation` with manual query invalidation (not the custom hooks from `useAdmin.ts`).

---

## Gaps vs BE

| BE Feature | FE Status | Notes |
|-----------|-----------|-------|
| Approve button disabled for wrong status | Bug: checks `status !== 'pending'` | BE allows approve on `submitted` and `under_review`, not `pending`. Button should be disabled for statuses other than `submitted`/`under_review`. |
| Reject button disabled for wrong status | Bug: checks `status !== 'pending'` | Same issue -- should check against `submitted`/`under_review` |
| Duplicate identity error on approve | Not handled | BE returns 409 `Verification.DuplicateIdentity` -- FE shows generic error |
| Verification document images in drawer | Not rendered | Drawer shows raw JSON for `documents` array, no image previews |
| VerificationSummaryDto vs VerificationDto | Type mismatch | BE list endpoint returns `VerificationSummaryDto` (fewer fields), but FE uses `VerificationDto` for both |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/pages/admin/AdminVerificationsPage.tsx` | Admin verification review page (table + detail drawer + approve/reject) |
| `src/services/adminService.ts` | `getPendingVerifications()`, `getVerificationById()`, `approveVerification()`, `rejectVerification()`, `VerificationDto`, `RejectVerificationRequest` |
| `src/hooks/useAdmin.ts` | `useAdminVerifications()`, `useAdminVerification()`, `useApproveVerification()`, `useRejectVerification()` (available but not used by page -- page uses inline mutations) |
