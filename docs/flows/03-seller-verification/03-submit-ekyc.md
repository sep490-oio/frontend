# 03 -- Submit Verification & eKYC Processing

> **Status**: Not Implemented
> **BE docs**: `backend/docs/flows/03-seller-verification/03-submit-ekyc.md`

## Overview

The BE supports submitting a verification for asynchronous eKYC processing via VNPT. After submission, the system uploads images to VNPT, performs OCR, card liveness, face comparison, and face liveness checks. Based on the results, the verification is auto-approved (score >= 80), auto-rejected (score < 50 or failed checks), or moved to manual review (score 50-80). This feature is **not yet implemented** on the frontend.

---

## BE Endpoints (Not Consumed)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/me/verifications/{verificationId}/submit` | Submit verification for eKYC processing |

---

## BE Feature Summary

### Submit Verification

- **Auth**: `Me.ManageVerification` permission
- **Status guard**: Must be in `pending` status (403 `Verification.CannotSubmit`)
- **Constraint**: At least one document must be attached (403 `Verification.NoDocuments`)
- **Constraint**: Duplicate identity pre-check (409 `Verification.DuplicateIdentity`)
- **Behavior**: Sets status to `submitted`, increments `attemptCount`, raises `VerificationSubmittedEvent`
- **Response**: `204 No Content`

### Async eKYC Processing (Server-Side)

The `VerificationSubmittedEvent` triggers an async handler that:

1. Extracts `id_front`, `id_back` (optional), and `selfie` documents
2. If `id_front` or `selfie` is missing, moves to manual review (score=0)
3. Uploads images to VNPT eKYC API (`POST /file-service/v1/addFile`)
4. Runs OCR on ID front+back (`POST /ai/v1/ocr/id`)
5. Runs card liveness check (`POST /ai/v1/card/liveness`)
6. Runs face comparison: ID photo vs selfie (`POST /ai/v1/face/compare`)
7. Runs face liveness check (`POST /ai/v1/face/liveness`)
8. Populates OCR data into verification (fullName, DOB, gender, idNumber, address)
9. Runs duplicate identity detection (auto-rejects with `DUPLICATE_IDENTITY` if found)
10. Applies decision logic:
    - `isIdFake OR isTampered OR !isCardLive OR !isFaceLive` -> **Auto-reject** (EKYC_FAILED)
    - `!isFaceMatch OR faceMatchScore < 50` -> **Auto-reject** (EKYC_FAILED)
    - `faceMatchScore >= 80 AND isFaceMatch` -> **Auto-approve**
    - Score 50-80 -> **Needs manual review**

### Notifications Sent (Server-Side)

| Decision | Event Type | Description |
|----------|-----------|-------------|
| Approved | `verification_auto_approved` | KYC verified successfully |
| Rejected | `verification_auto_rejected` | KYC failed (with reason) |
| Needs Review | `verification_manual_review_required` | Requires manual admin review |

---

## Implementation Notes

To implement eKYC submission on the frontend, the following would be needed:

1. **Submit button**: On the verification detail/edit page, enabled only when at least `id_front` and `selfie` documents are uploaded and status is `pending`
2. **Pre-submit validation**: Check required documents are present before calling the API
3. **Loading/processing state**: After submission, show a "processing" indicator -- eKYC runs asynchronously, so the user should see `submitted` status and a message explaining the wait
4. **Status polling or real-time update**: After submission, either poll `GET /api/me/verifications/{id}` periodically, or listen for a notification via SignalR to detect status changes (approved/rejected/under_review)
5. **Result display**: Show outcome with explanation (approved: success message, rejected: rejection reason, under_review: info about manual review timeline)
6. **Service function**: `submitVerification(verificationId)` in `verificationService.ts`
7. **TanStack Query mutation**: `useSubmitVerification()` with query invalidation on `['myVerifications']`

---

## Source Files

| File | What it does |
|------|-------------|
| (no FE files exist for this flow yet) | -- |
