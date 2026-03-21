# 07 -- Admin Seller Profile Review

> **Status**: Partial -- verify/reject implemented; terms acceptance not built
> **BE docs**: `backend/docs/flows/03-seller-verification/07-seller-admin-review.md`

## Overview

Admins review pending seller profiles and either verify (granting the Seller role) or reject them. The `AdminSellerProfilesPage` displays all seller profiles in a table with verify and reject actions. The BE also includes terms acceptance endpoints, which are not yet consumed.

---

## API Calls

### GET `/api/admin/seller-profiles` -- Fetch All Seller Profiles

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/admin/seller-profiles` |
| **Permission** | `Admin.ReadSellerProfiles` |
| **FE Function** | `getSellerProfiles()` in `src/services/adminService.ts` |

#### Response: `200 OK` with `SellerProfileDto[]`

Returns all seller profiles (all statuses), ordered by `createdAt` descending (newest first).

The FE function normalizes the response:

```typescript
export async function getSellerProfiles(): Promise<SellerProfileDto[]> {
  const response = await api.get('/api/admin/seller-profiles');
  return Array.isArray(response.data) ? response.data : response.data?.items ?? [];
}
```

---

### POST `/api/admin/seller-profiles/{id}/verify` -- Verify Seller Profile

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/admin/seller-profiles/{id}/verify` |
| **Permission** | `Admin.ManageSellerProfiles` |
| **FE Function** | `verifySellerProfile()` in `src/services/adminService.ts` |

No request body. Only `pending` profiles can be verified (403 `SellerProfile.CannotVerify`).

On the BE, verification also:
- Grants the `Seller` role to the user (`user.AssignRole("Seller")`)
- Invalidates the permission cache so the role takes effect immediately

#### Response: `204 No Content`

---

### POST `/api/admin/seller-profiles/{id}/reject` -- Reject Seller Profile

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/admin/seller-profiles/{id}/reject` |
| **Permission** | `Admin.ManageSellerProfiles` |
| **FE Function** | `rejectSellerProfile()` in `src/services/adminService.ts` |

No request body. Only `pending` profiles can be rejected (403 `SellerProfile.CannotReject`).

#### Response: `204 No Content`

---

### Not Consumed (Terms Acceptance)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/me/terms/{termDocumentId}/accept` | User accepts a terms document (captures IP + UserAgent) |
| `GET` | `/api/me/terms` | List user's accepted terms documents |

---

## FE Implementation

**File**: `src/pages/admin/AdminSellerProfilesPage.tsx`

### Page Layout

```
AdminSellerProfilesPage
├── Header: Title + subtitle (pending count) + Refresh button
└── Table<SellerProfileDto>
    ├── Seller column: Avatar (ShopOutlined icon) + storeName + truncated storeDescription
    ├── Status column: Badge with color map (pending=warning, verified=success, rejected=error)
    ├── Sales column: order count + total amount in VND
    ├── Verified At column: formatted date or dash
    ├── Created At column: formatted date
    └── Actions column: Verify + Reject buttons
```

### Table Configuration

- **Row key**: `id`
- **Scroll**: Horizontal scroll at 800px
- **Size**: `middle`

### Status Color Map

```typescript
const cfg: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  verified: 'success',
  rejected: 'error',
};
```

Status labels use i18n keys: `t('admin.sellerProfiles.status.${v}')` with fallback to raw value.

### Verify Flow

1. Admin clicks the green checkmark button (disabled when `status === 'verified'`)
2. Ant Design `modal.confirm()` shows confirmation with store name
3. On confirm, calls `verifyMutation.mutateAsync(record.id)`
4. On success: shows `t('admin.sellerProfiles.verified')` toast, invalidates `['admin', 'seller-profiles']`
5. On error: shows `t('common.error.generic')` toast

### Reject Flow

1. Admin clicks the red X button (disabled when `status === 'rejected'`)
2. Ant Design `modal.confirm()` shows confirmation with store name (danger style)
3. On confirm, calls `rejectMutation.mutateAsync(record.id)`
4. On success: shows `t('admin.sellerProfiles.rejected')` toast, invalidates `['admin', 'seller-profiles']`
5. On error: shows `t('common.error.generic')` toast

Note: The FE reject flow does not provide a rejection reason (just a confirm dialog). The BE also does not require a reason for seller profile rejection.

### Subtitle

Shows the count of `pending` profiles only: `profiles.filter((p) => p.status === 'pending').length`.

### TanStack Query Setup

```typescript
const { data: profiles = [], isFetching, refetch } = useQuery({
  queryKey: ['admin', 'seller-profiles'],
  queryFn: getSellerProfiles,
});
```

Mutations use inline `useMutation` with manual query invalidation (not the custom hooks from `useAdmin.ts`).

---

## FE Types

```typescript
// src/services/adminService.ts
export interface SellerProfileDto {
  id: string;
  storeName?: string | null;
  storeDescription?: string | null;
  status?: string | null;
  verifiedAt?: string | null;
  totalSalesCount?: number;
  totalSalesAmount?: number;
  createdAt: string;
  modifiedAt?: string | null;
}
```

Note: The admin `SellerProfileDto` is simpler than the full `SellerProfile` in `src/types/user.ts`. Missing fields vs BE DTO: `trustScore`, `trustScoreCalculatedAt`.

---

## Gaps vs BE

| BE Feature | FE Status | Notes |
|-----------|-----------|-------|
| Verify button disabled for wrong status | Partial | Checks `status === 'verified'` but should check `status !== 'pending'` (BE only allows pending) |
| Reject button disabled for wrong status | Partial | Checks `status === 'rejected'` but should check `status !== 'pending'` |
| Seller role grant on verify | Not visible | BE grants Seller role + invalidates cache. FE has no indication of this to the admin. |
| Trust score display | Not shown | `SellerProfileDto` lacks `trustScore` field |
| Terms acceptance | Not implemented | `POST /api/me/terms/{id}/accept` and `GET /api/me/terms` not consumed |
| Seller profile detail view | Not built | No drawer/modal for viewing full seller profile details |
| Status filter | Not built | Table shows all profiles without filtering by status |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/pages/admin/AdminSellerProfilesPage.tsx` | Admin seller profile review page (table + verify/reject) |
| `src/services/adminService.ts` | `getSellerProfiles()`, `verifySellerProfile()`, `rejectSellerProfile()`, `SellerProfileDto` |
| `src/hooks/useAdmin.ts` | `useAdminSellerProfiles()`, `useVerifySellerProfile()`, `useRejectSellerProfile()` (available but not used by page -- page uses inline mutations) |
