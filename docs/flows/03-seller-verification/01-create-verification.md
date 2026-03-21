# 01 -- Create & Manage Verification

> **Status**: Not Implemented
> **BE docs**: `backend/docs/flows/03-seller-verification/01-create-verification.md`

## Overview

The BE supports creating, updating, and querying identity verification requests. Users create a verification (choosing a type like `government_id`), fill in personal info (name, DOB, gender, ID number, address), and manage the request before submission. This feature is **not yet implemented** on the frontend.

---

## BE Endpoints (Not Consumed)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/me/verifications` | Create a new verification request |
| `PUT` | `/api/me/verifications/{verificationId}` | Update personal info on a verification |
| `GET` | `/api/me/verifications` | List all user's verifications |
| `GET` | `/api/me/verifications/{verificationId}` | Get a single verification with documents |

---

## BE Feature Summary

### Create Verification

- **Auth**: `Me.ManageVerification` permission
- **Request body**: `{ verificationType: "government_id" | "passport" | "business_owner" | "manual" }`
- **Constraint**: User cannot have an existing verification in `pending`, `submitted`, or `under_review` status (409 `Verification.AlreadyPending`)
- **Constraint**: User cannot have an `approved` verification of the same type (409 `Verification.AlreadyApproved`)
- **Result**: Creates `IdentityVerification` with `status = pending`, `attemptCount = 0`
- **Response**: `201 Created` with `VerificationDto`

### Update Verification

- **Auth**: `Me.ManageVerification` permission
- **Request body**: Full personal info (fullName, dateOfBirth, gender, idType, idNumber, address fields, nationality)
- **Status guard**: Allowed in `pending`, `rejected`, or `under_review` status. Admin can also update `approved`.
- **Rejected to Pending**: Updating a `rejected` verification auto-transitions it to `pending` and clears rejection fields
- **Duplicate check**: After updating, checks for duplicate identity documents across other users (409 `Verification.DuplicateIdentity`)
- **Field validation**:
  - `fullName`: required, max 200 chars
  - `dateOfBirth`: required, valid DateOnly
  - `gender`: required, one of `male`, `female`, `other`
  - `idType`: required, one of `cccd`, `cmnd`, `passport`
  - `idNumber`: required, max 50 chars
  - `idIssuedDate` / `idExpiredDate`: optional, `expiredDate` must be after `issuedDate`
  - Address fields (`fullAddress`, `province`, `district`, `ward`): required, max 100-500 chars
  - `nationality`: optional, max 100 chars

### List My Verifications

- **Auth**: `Me.ReadVerification` permission
- Returns all verifications for the current user, ordered by creation date

### Get Verification By ID

- **Auth**: `Me.ReadVerification` permission
- Returns single verification with all documents
- Returns 404 if not found or not owned by current user

### Response Shape: VerificationDto

Key fields: `id`, `userId`, `verificationType`, `autoVerified`, `fullName`, `dateOfBirth`, `gender`, `nationality`, `document` (idType/idNumber/issuedDate/expiredDate/issuedPlace), `permanentAddress` (fullAddress/province/district/ward), `status`, `verifiedAt`, `verifiedBy`, `rejectionReason`, `rejectionCode`, `submittedAt`, `expiresAt`, `attemptCount`, `documents[]`, `createdAt`, `modifiedAt`.

---

## Implementation Notes

To implement the user verification flow on the frontend, the following would be needed:

1. **Verification creation page/modal**: Select verification type, with guard against duplicate pending requests
2. **Personal info form**: Form with all identity fields (name, DOB, gender, ID type/number, issued/expired dates, address fields). Use React Hook Form + Zod for validation matching BE rules.
3. **Verification list view**: Show user's verification history with status badges (pending/submitted/under_review/approved/rejected/expired/suspended)
4. **Verification detail view**: Show full verification info including uploaded documents and rejection reason
5. **Rejected resubmission flow**: Allow editing info on rejected verifications (auto-transitions back to pending)
6. **Service functions**: `createVerification()`, `updateVerification()`, `getMyVerifications()`, `getMyVerificationById()` in a new `verificationService.ts`
7. **TanStack Query hooks**: `useMyVerifications()`, `useMyVerification()`, `useCreateVerification()`, `useUpdateVerification()`
8. **i18n keys**: All verification status labels, form labels, error messages in vi/en

---

## Source Files

| File | What it does |
|------|-------------|
| `src/services/adminService.ts` | Admin-side `VerificationDto` type (exists, used by admin page) |
| `src/types/enums.ts` | `VerificationStatus` type (exists but only covers `pending | verified | rejected` -- needs expansion for full lifecycle) |
