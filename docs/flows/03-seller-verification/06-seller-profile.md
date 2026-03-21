# 06 -- Seller Profile

> **Status**: Partial -- public seller profile page exists with mock data; user-facing create/update not built
> **BE docs**: `backend/docs/flows/03-seller-verification/06-seller-profile.md`

## Overview

The BE supports creating, updating, and viewing seller profiles. Users with an approved identity verification can create a seller profile (storeName + storeDescription), which enters admin review. There is also a public seller profile page and a public seller items endpoint.

The FE has a **public seller profile page** (`SellerProfilePage`) at `/seller/:id`, but it uses **mock data**. The user-facing create/update seller profile endpoints are **not yet consumed**.

---

## API Calls

### Consumed (Mock Data)

#### GET `/api/sellers/{id}` -- Public Seller Profile

| | |
|---|---|
| **Method** | `GET` |
| **Path** | `/api/sellers/{id}` (will be, currently mock) |
| **Permission** | Anonymous (no auth required) |
| **FE Function** | `getSellerProfile()` in `src/services/sellerService.ts` |

Currently returns mock data via `getMockSellerProfile()`. When connected to real API, will return `PublicSellerProfileDto` with fields: `id`, `storeName`, `storeDescription`, `status`, `totalSalesCount`, `trustScore`, `createdAt`.

#### GET `/api/sellers/{id}/auctions` -- Seller's Auctions (Mock)

| | |
|---|---|
| **FE Function** | `getSellerAuctions()` in `src/services/sellerService.ts` |

Currently returns mock auction listings.

#### GET `/api/sellers/{id}/reviews` -- Seller's Reviews (Mock)

| | |
|---|---|
| **FE Function** | `getSellerReviews()` in `src/services/sellerService.ts` |

Currently returns mock buyer reviews.

---

### Not Consumed

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/me/seller-profile` | Create seller profile (requires approved verification) |
| `PUT` | `/api/me/seller-profile` | Update store name and description |
| `GET` | `/api/me/seller-profile` | Get own seller profile |
| `GET` | `/api/sellers/{id}/items` | Public seller items (paginated) |

---

## BE Feature Summary (Not Consumed)

### Create Seller Profile

- **Auth**: `Me.ManageSellerProfile` permission
- **Request body**: `{ storeName: string (max 200), storeDescription: string (max 2000) }`
- **Constraint**: User cannot already have a seller profile (409 `SellerProfile.AlreadyExists`)
- **Constraint**: User must have at least one approved identity verification (403 `SellerProfile.IdentityNotVerified`)
- **Result**: Creates profile with `status = pending`, ID = user's own ID
- **Response**: `201 Created` with `SellerProfileDto`

### Update Seller Profile

- **Auth**: `Me.ManageSellerProfile` permission
- **Request body**: `{ storeName, storeDescription }` (same validation)
- **Behavior**: If status is `rejected`, auto-resets to `pending` for re-review
- **Response**: `200 OK` with updated `SellerProfileDto`

### Get My Seller Profile

- **Auth**: `Me.ReadSellerProfile` permission
- **Response**: `200 OK` with `SellerProfileDto` (includes `trustScore`, `trustScoreCalculatedAt`, `totalSalesAmount`, `verifiedAt`)

---

## FE Implementation

**File**: `src/pages/seller/SellerProfilePage.tsx`

### Page Layout

```
SellerProfilePage (/seller/:id)
├── Back button (navigate(-1))
├── SellerInfoCard — seller identity + store info
├── SellerStats — trust metrics grid
├── SellerListings — active auction listings
└── SellerReviewsList — buyer reviews + rating breakdown
```

### Query Setup

Three parallel queries, all disabled until `id` route param is available:

```typescript
const { data: seller, isLoading } = useSellerProfile(id);   // queryKey: ['seller', id]
const { data: auctions } = useSellerAuctions(id);            // queryKey: ['seller', id, 'auctions']
const { data: reviews } = useSellerReviews(id);              // queryKey: ['seller', id, 'reviews']
```

### Loading and Error States

- **Loading**: Full-page centered `Spin`
- **Not found**: `Result` with 404 status, "Back to Browse" button navigating to `/browse`

### Component Breakdown

| Component | File | Data Source |
|-----------|------|------------|
| `SellerInfoCard` | `src/components/seller/SellerInfoCard.tsx` | `SellerProfileDetail.profile` + `displayName` + `avatarUrl` |
| `SellerStats` | `src/components/seller/SellerStats.tsx` | `SellerProfileDetail.profile` (trust metrics) |
| `SellerListings` | `src/components/seller/SellerListings.tsx` | `AuctionListItem[]` from `useSellerAuctions` |
| `SellerReviewsList` | `src/components/seller/SellerReviewsList.tsx` | `SellerReview[]` + `SellerRatingSummary` |

### FE Types

```typescript
// src/types/user.ts
export interface SellerProfile {
  id: string;
  userId: string;
  storeName: string | null;
  storeDescription: string | null;
  status: VerificationStatus;  // 'pending' | 'verified' | 'rejected'
  verifiedAt: string | null;
  city: string | null;
  region: string | null;
  totalSalesCount: number;
  totalSalesAmount: number;
  successfulSalesCount: number;
  ratingAverage: number;
  ratingCount: number;
  disputeCount: number;
  disputeRate: number;
  responseRate: number;
  trustScore: number;
  trustScoreUpdatedAt: string | null;
  createdAt: string;
  modifiedAt: string;
}

export interface SellerProfileDetail {
  profile: SellerProfile;
  displayName: string;
  avatarUrl: string | null;
  ratingSummary: SellerRatingSummary;
}
```

Note: The FE `SellerProfile` type is more extensive than the BE `SellerProfileDto` (includes `city`, `region`, `successfulSalesCount`, `ratingAverage`, `ratingCount`, `disputeCount`, `disputeRate`, `responseRate` -- some of these may need to come from a different BE endpoint or be computed client-side).

---

## Gaps vs BE

| BE Feature | FE Status | Notes |
|-----------|-----------|-------|
| Create seller profile (`POST /api/me/seller-profile`) | Not implemented | No UI for users to create a seller profile |
| Update seller profile (`PUT /api/me/seller-profile`) | Not implemented | No UI for editing store name/description |
| Get own profile (`GET /api/me/seller-profile`) | Not implemented | No dashboard for seller to view own profile status |
| Real API for public profile | Mock data only | `sellerService.ts` returns mock data, not real API calls |
| Public seller items | Not consumed | `GET /api/sellers/{id}/items` not called |
| Seller profile status lifecycle | Not reflected | `SellerProfileDto.status` field exists but no pending/rejected UI for the seller |
| Identity verification prerequisite | Not enforced | No UI flow connecting verification approval to seller profile creation |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/pages/seller/SellerProfilePage.tsx` | Public seller storefront page (back button + 4 stacked sections) |
| `src/components/seller/SellerInfoCard.tsx` | Seller identity card component |
| `src/components/seller/SellerStats.tsx` | Trust metrics grid component |
| `src/components/seller/SellerListings.tsx` | Seller's auction listings component |
| `src/components/seller/SellerReviewsList.tsx` | Buyer reviews list with rating breakdown |
| `src/services/sellerService.ts` | Public seller API functions (mock): `getSellerProfile()`, `getSellerAuctions()`, `getSellerReviews()` |
| `src/hooks/useSeller.ts` | TanStack Query hooks: `useSellerProfile()`, `useSellerAuctions()`, `useSellerReviews()` |
| `src/types/user.ts` | Types: `SellerProfile`, `SellerSummary`, `SellerProfileDetail`, `SellerReview`, `SellerRatingSummary` |
| `src/services/adminService.ts` | Admin `SellerProfileDto` type (simpler than `user.ts` version) |
