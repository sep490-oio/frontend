# 05 -- Verification Correction Dispute

> **Status**: Not Implemented
> **BE docs**: `backend/docs/flows/03-seller-verification/05-correction-dispute.md`

## Overview

The BE supports correction disputes for auto-approved verifications. When eKYC auto-approves a verification but the OCR data is incorrect (e.g., wrong name, wrong DOB), the user can open a correction dispute. This creates a dispute thread between the user and an admin, including corrected information and optional attachments. This feature is **not yet implemented** on the frontend.

---

## BE Endpoints (Not Consumed)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/me/verifications/{verificationId}/disputes` | Open a correction dispute for an auto-approved verification |

---

## BE Feature Summary

### Create Correction Dispute

- **Auth**: `Me.ManageVerification` permission
- **Constraint**: Verification must be `approved` with `autoVerified == true` (403 `Verification.CorrectionDispute.RequiresAutoApproved`)
- **Constraint**: No open correction dispute for this verification already exists (409 `Verification.CorrectionDispute.AlreadyOpen`)
- **Respondent**: Automatically assigned to the earliest active admin user
- **Dispute type**: `verification_correction` with `medium` priority

### Request Body

```json
{
  "reason": "OCR misread my name",
  "correctedInfo": {
    "fullName": "Nguyen Van A",
    "dateOfBirth": "1990-01-15",
    "gender": "male",
    "idType": "cccd",
    "idNumber": "012345678901",
    "idIssuedDate": "2020-06-01",
    "idExpiredDate": "2035-06-01",
    "idIssuedPlace": "Cuc CS QLHC ve TTXH",
    "fullAddress": "123 Le Loi",
    "province": "TP Ho Chi Minh",
    "district": "Quan 1",
    "ward": "Phuong Ben Thanh",
    "nationality": "Viet Nam"
  },
  "message": "Additional note about the correction",
  "mediaUploadIds": ["019..."]
}
```

Required fields in `correctedInfo`: `fullName`, `dateOfBirth`, `gender`, `idType`, `idNumber`, `fullAddress`, `province`, `district`, `ward`. Optional: `idIssuedDate`, `idExpiredDate`, `idIssuedPlace`, `nationality`.

### Behavior

1. Validates verification is auto-approved and no open dispute exists
2. Finds earliest active admin as respondent
3. Validates any media uploads (must be confirmed, `dispute_attachment` context, not already linked)
4. Creates `Dispute` aggregate with structured initial message containing all corrected fields
5. Creates attachments from media uploads
6. Returns `DisputeThreadMetaDto` (dispute ID, number, title, status, priority, participants)

### Response: `201 Created` with `DisputeThreadMetaDto`

Key fields: `id`, `disputeNumber`, `title` ("KYC correction request"), `status`, `priority` ("medium"), `verificationId`, `complainantId`, `respondentId`, `createdAt`.

---

## Implementation Notes

To implement the correction dispute on the frontend, the following would be needed:

1. **Dispute button**: On the verification detail page, visible only when verification is `approved` and `autoVerified == true`
2. **Correction form**: Pre-filled with current verification data, allowing the user to edit fields that need correction
3. **Reason field**: Required text input explaining what is wrong (max 1000 chars)
4. **Optional message**: Additional note text (max 5000 chars)
5. **Attachment upload**: Optional file upload using `dispute_attachment` media context
6. **Diff view**: Consider showing a side-by-side comparison of current vs corrected data
7. **Service function**: `createCorrectionDispute(verificationId, data)` in `verificationService.ts`
8. **TanStack Query mutation**: `useCreateCorrectionDispute()` with navigation to dispute thread on success
9. **Integration with dispute system**: After creation, the dispute appears in the general disputes UI (if built)

---

## Source Files

| File | What it does |
|------|-------------|
| (no FE files exist for this flow yet) | -- |
