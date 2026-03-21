# 03 -- Seller Verification & Onboarding

> **Status**: Partial -- admin review + seller profile pages implemented; user-facing verification flow not built
> **BE docs**: `backend/docs/flows/03-seller-verification/`

## Overview

The Seller Verification module covers the full onboarding journey from identity verification (eKYC) to becoming an active seller. A user must complete identity verification before creating a seller profile, which goes through its own admin approval workflow.

The FE currently implements **admin-side review** only (admin can list/approve/reject verifications and seller profiles) plus a **public seller profile page** (mock data). The user-facing verification flow (create verification, upload documents, submit for eKYC) and the correction dispute flow are **not yet implemented**.

---

## User Flow

```
User creates verification request (NOT IMPLEMENTED)
       |
       v
Upload ID documents via Cloudinary (NOT IMPLEMENTED)
       |
       v
Submit for eKYC processing (NOT IMPLEMENTED)
       |
       v
Auto-approve / auto-reject / manual review
       |
       v
Admin reviews pending verifications (IMPLEMENTED -- AdminVerificationsPage)
       |
       v
Verification approved -> User creates seller profile (NOT IMPLEMENTED)
       |
       v
Admin reviews seller profiles (IMPLEMENTED -- AdminSellerProfilesPage)
       |
       v
Profile verified -> Seller role granted
       |
       v
Public seller profile page (PARTIAL -- SellerProfilePage, mock data)
```

---

## Component Hierarchy

```
AdminVerificationsPage (admin/AdminVerificationsPage.tsx)
├── Header: Title + subtitle (count) + Refresh button
├── Table<VerificationDto>
│   ├── User column: truncated userId
│   ├── Type column: Tag (blue)
│   ├── Status column: Badge (warning/success/error)
│   ├── Submitted At column: formatted date with tooltip
│   └── Actions column
│       ├── View detail (opens Drawer)
│       ├── Approve button (with confirm modal)
│       └── Reject button (opens modal with reason + code)
├── Detail Drawer: Descriptions listing all verification fields
└── Reject Modal: rejection code Select + reason TextArea

AdminSellerProfilesPage (admin/AdminSellerProfilesPage.tsx)
├── Header: Title + subtitle (pending count) + Refresh button
└── Table<SellerProfileDto>
    ├── Seller column: Avatar + storeName + description
    ├── Status column: Badge (warning/success/error)
    ├── Sales column: order count + total amount
    ├── Verified At column
    ├── Created At column
    └── Actions column
        ├── Verify button (with confirm modal)
        └── Reject button (with confirm modal)

SellerProfilePage (seller/SellerProfilePage.tsx)
├── Back button
├── SellerInfoCard (identity + store info)
├── SellerStats (trust metrics grid)
├── SellerListings (active auction listings)
└── SellerReviewsList (buyer reviews + rating breakdown)
```

---

## Routes

| Route | Page Component | Auth Required | Description |
|-------|---------------|---------------|-------------|
| `/admin/verifications` | `AdminVerificationsPage` | Admin | Review pending identity verifications |
| `/admin/seller-profiles` | `AdminSellerProfilesPage` | Admin | Review seller profile applications |
| `/seller/:id` | `SellerProfilePage` | No | Public seller storefront (mock data) |

---

## API Endpoints Consumed

### Admin Verification Endpoints

| Method | Path | FE Function | Page |
|--------|------|-------------|------|
| `GET` | `/api/admin/verifications` | `getPendingVerifications()` | AdminVerificationsPage |
| `GET` | `/api/admin/verifications/{id}` | `getVerificationById()` | AdminVerificationsPage (drawer) |
| `POST` | `/api/admin/verifications/{id}/approve` | `approveVerification()` | AdminVerificationsPage |
| `POST` | `/api/admin/verifications/{id}/reject` | `rejectVerification()` | AdminVerificationsPage |

### Admin Seller Profile Endpoints

| Method | Path | FE Function | Page |
|--------|------|-------------|------|
| `GET` | `/api/admin/seller-profiles` | `getSellerProfiles()` | AdminSellerProfilesPage |
| `POST` | `/api/admin/seller-profiles/{id}/verify` | `verifySellerProfile()` | AdminSellerProfilesPage |
| `POST` | `/api/admin/seller-profiles/{id}/reject` | `rejectSellerProfile()` | AdminSellerProfilesPage |

### Public Seller Endpoints (Mock Data)

| Method | Path | FE Function | Page |
|--------|------|-------------|------|
| `GET` | `/api/sellers/{id}` | `getSellerProfile()` | SellerProfilePage (currently mock) |
| `GET` | `/api/sellers/{id}/auctions` | `getSellerAuctions()` | SellerProfilePage (currently mock) |
| `GET` | `/api/sellers/{id}/reviews` | `getSellerReviews()` | SellerProfilePage (currently mock) |

### Not Yet Consumed

| Method | Path | BE Feature | Reason |
|--------|------|-----------|--------|
| `POST` | `/api/me/verifications` | Create verification request | User verification flow not built |
| `PUT` | `/api/me/verifications/{id}` | Update verification info | User verification flow not built |
| `GET` | `/api/me/verifications` | List my verifications | User verification flow not built |
| `GET` | `/api/me/verifications/{id}` | Get single verification | User verification flow not built |
| `POST` | `/api/me/verifications/{id}/documents` | Attach document | Document upload flow not built |
| `DELETE` | `/api/me/verifications/{id}/documents/{docId}` | Remove document | Document upload flow not built |
| `POST` | `/api/me/verifications/{id}/submit` | Submit for eKYC | eKYC submission not built |
| `POST` | `/api/me/verifications/{id}/disputes` | Correction dispute | Dispute flow not built |
| `POST` | `/api/me/seller-profile` | Create seller profile | Seller profile creation not built |
| `PUT` | `/api/me/seller-profile` | Update seller profile | Seller profile management not built |
| `GET` | `/api/me/seller-profile` | Get my seller profile | Seller profile management not built |
| `GET` | `/api/sellers/{id}/items` | Public seller items | Public seller items not built |
| `POST` | `/api/me/terms/{id}/accept` | Accept terms document | Terms acceptance not built |
| `GET` | `/api/me/terms` | List accepted terms | Terms acceptance not built |

---

## Subflow Index

| # | File | Topic | Status |
|---|------|-------|--------|
| 1 | [01-create-verification.md](./01-create-verification.md) | Create & manage verification requests | Not Implemented |
| 2 | [02-upload-documents.md](./02-upload-documents.md) | Upload verification documents | Not Implemented |
| 3 | [03-submit-ekyc.md](./03-submit-ekyc.md) | Submit for eKYC processing | Not Implemented |
| 4 | [04-admin-review.md](./04-admin-review.md) | Admin approve/reject verifications | Implemented |
| 5 | [05-correction-dispute.md](./05-correction-dispute.md) | Correction dispute for auto-approved verifications | Not Implemented |
| 6 | [06-seller-profile.md](./06-seller-profile.md) | Seller profile (create, update, public view) | Partial |
| 7 | [07-seller-admin-review.md](./07-seller-admin-review.md) | Admin verify/reject seller profiles | Partial |

---

## Source Files

| File | Purpose |
|------|---------|
| `src/pages/admin/AdminVerificationsPage.tsx` | Admin KYC verification review (table + approve/reject + detail drawer) |
| `src/pages/admin/AdminSellerProfilesPage.tsx` | Admin seller profile review (table + verify/reject) |
| `src/pages/seller/SellerProfilePage.tsx` | Public seller storefront page (mock data) |
| `src/services/adminService.ts` | Admin API functions: `getPendingVerifications()`, `getVerificationById()`, `approveVerification()`, `rejectVerification()`, `getSellerProfiles()`, `verifySellerProfile()`, `rejectSellerProfile()` |
| `src/services/sellerService.ts` | Public seller API functions (currently mock): `getSellerProfile()`, `getSellerAuctions()`, `getSellerReviews()` |
| `src/hooks/useAdmin.ts` | TanStack Query hooks: `useAdminVerifications()`, `useAdminVerification()`, `useApproveVerification()`, `useRejectVerification()`, `useAdminSellerProfiles()`, `useVerifySellerProfile()`, `useRejectSellerProfile()` |
| `src/hooks/useSeller.ts` | TanStack Query hooks: `useSellerProfile()`, `useSellerAuctions()`, `useSellerReviews()` |
| `src/components/seller/SellerInfoCard.tsx` | Seller identity card component |
| `src/components/seller/SellerStats.tsx` | Trust metrics grid component |
| `src/components/seller/SellerListings.tsx` | Seller's auction listings component |
| `src/components/seller/SellerReviewsList.tsx` | Buyer reviews list component |
| `src/types/user.ts` | Types: `SellerProfile`, `SellerSummary`, `SellerProfileDetail`, `SellerReview`, `SellerRatingSummary` |
| `src/types/enums.ts` | `VerificationStatus` type (`'pending' | 'verified' | 'rejected'`) |
