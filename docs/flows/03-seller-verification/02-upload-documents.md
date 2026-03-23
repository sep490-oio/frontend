# 02 -- Upload Verification Documents

> **Status**: Not Implemented
> **BE docs**: `backend/docs/flows/03-seller-verification/02-upload-documents.md`

## Overview

The BE supports a 4-step document upload flow for verification: request a Cloudinary signed upload URL, upload the file directly to Cloudinary, confirm the upload back to the API, then attach the confirmed upload to a verification as a specific document type (id_front, id_back, selfie, etc.). Documents can also be deleted. This feature is **not yet implemented** on the frontend.

---

## BE Endpoints (Not Consumed)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/media/upload-signature` | Get signed upload params for Cloudinary (context: `verification_document`) |
| `POST` | `/api/media/confirm` | Confirm upload completed with file metadata |
| `POST` | `/api/me/verifications/{id}/documents` | Attach confirmed media upload as a document |
| `DELETE` | `/api/me/verifications/{id}/documents/{docId}` | Remove document from verification |

---

## BE Feature Summary

### Upload Flow (4 Steps)

1. **Request signature**: `POST /api/media/upload-signature` with `{ context: "verification_document", fileName: "id_front.jpg" }`. Returns `mediaUploadId`, Cloudinary signature, publicId, folder, maxFileSize (10 MB), allowedFormats (jpg/jpeg/png/webp).
2. **Upload to Cloudinary**: Client uploads directly to Cloudinary using returned signed params. No file passes through the API server.
3. **Confirm upload**: `POST /api/media/confirm` with `{ mediaUploadId, publicId, secureUrl, bytes, format, width, height }`. Marks upload as confirmed.
4. **Attach to verification**: `POST /api/me/verifications/{id}/documents` with `{ mediaUploadId, documentType }`. Links the confirmed upload to the verification.

### Document Types

| Value | Description |
|-------|-------------|
| `id_front` | Front side of government ID |
| `id_back` | Back side of government ID |
| `selfie` | Selfie photo of the user |
| `selfie_with_id` | Selfie holding the ID document |
| `business_license` | Business license document |
| `bank_statement` | Bank statement document |
| `other` | Other supporting document |

### Attach Document Business Rules

- Verification must be in `pending` or `rejected` status (403 `Verification.CannotUploadDoc`)
- MediaUpload must be confirmed, not already linked, and have a verification context
- Max 10 documents per verification
- Both verification and media upload must belong to the current user

### Delete Document

- Verification must be in `pending` or `rejected` status (403 `Verification.CannotDeleteDoc`)
- Document must exist in the verification's collection

### Upload Context Configuration

| Setting | Value |
|---------|-------|
| Context name | `verification_document` |
| Resource type | `image` |
| Max file size | 10 MB (10485760 bytes) |
| Allowed formats | `jpg`, `jpeg`, `png`, `webp` |
| Eager transform | `w_1200,h_1200,c_limit` |
| Max uploads per entity | 10 |

---

## Implementation Notes

To implement document upload on the frontend, the following would be needed:

1. **Document upload component**: Similar to item image upload (already exists in `CreateItemPage`), but scoped to verification documents. The 4-step signed upload flow (`mediaService.ts`) can be reused.
2. **Document type selector**: Radio or card-based UI for selecting which document type to upload (id_front, id_back, selfie -- at minimum)
3. **Document preview grid**: Show uploaded documents with type labels, thumbnails, and delete buttons
4. **Required document indicators**: Highlight that `id_front` and `selfie` are required for eKYC submission
5. **Service functions**: `uploadVerificationDocument()`, `deleteVerificationDocument()` in `verificationService.ts`
6. **TanStack Query mutations**: `useUploadVerificationDocument()`, `useDeleteVerificationDocument()`
7. **Reuse existing media flow**: `src/services/mediaService.ts` already implements the Cloudinary signed upload pattern for items -- same pattern applies with `context: "verification_document"`

---

## Source Files

| File | What it does |
|------|-------------|
| `src/services/mediaService.ts` | Existing Cloudinary signed upload flow (reusable for verification documents) |
| `src/services/adminService.ts` | `VerificationDto` type includes `documents[]` field (admin can view uploaded docs) |
