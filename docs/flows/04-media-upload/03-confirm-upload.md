# 03 -- Confirm Upload

> **Status**: Implemented
> **BE docs**: `backend/docs/flows/04-media-upload/03-confirm-upload.md`

## Overview

Step 3 of the 3-step upload flow. After uploading to Cloudinary, the FE sends the returned metadata to the BE to confirm the upload. The BE validates ownership and public ID match, transitions the `MediaUpload` from `Pending` to `Confirmed`, and extends the expiry to 60 minutes (orphan window).

After confirmation, the media is not yet linked to an entity. The FE must call a separate endpoint (e.g., `POST /api/items/{id}/media`) to link it.

---

## API Call

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/media/confirm` |
| **Permission** | `media:upload:confirm` (authenticated user) |
| **Idempotency** | Required -- `Idempotency-Key` header |

---

## FE Implementation

**File**: `src/services/mediaService.ts` -- `confirmUpload()`

```typescript
async function confirmUpload(
  mediaUploadId: string,
  cloudinaryResult: CloudinaryUploadResult,
  originalPublicId?: string
): Promise<ConfirmUploadResponse>
```

### Key details

- **Public ID source**: The function accepts an optional `originalPublicId` parameter. When provided, it uses that instead of `cloudinaryResult.public_id`. The `uploadMedia()` orchestrator always passes `signature.publicId` (the leaf name) to avoid the folder-prefix mismatch issue.
- **Idempotency key**: A new `crypto.randomUUID()` is generated per call.
- **Response unwrapping**: Same defensive pattern as step 1 -- handles both wrapped and unwrapped responses.

---

## Request Schema

```typescript
interface ConfirmUploadRequest {
  mediaUploadId: string;        // From step 1 response
  publicId: string | null;      // Leaf public ID from step 1 (NOT Cloudinary's full path)
  secureUrl: string | null;     // secure_url from Cloudinary response
  bytes: number;                // File size from Cloudinary response
  format: string | null;        // File format from Cloudinary response
  width: number | null;         // Image width (null for non-images)
  height: number | null;        // Image height (null for non-images)
  durationSeconds: number | null; // Video duration (null for images)
}
```

### Field mapping from Cloudinary response

| Request Field | Source |
|--------------|--------|
| `mediaUploadId` | `signature.mediaUploadId` (step 1) |
| `publicId` | `signature.publicId` (step 1, NOT `cloudinaryResult.public_id`) |
| `secureUrl` | `cloudinaryResult.secure_url` |
| `bytes` | `cloudinaryResult.bytes` |
| `format` | `cloudinaryResult.format` |
| `width` | `cloudinaryResult.width` |
| `height` | `cloudinaryResult.height` |
| `durationSeconds` | `cloudinaryResult.duration ?? null` |

---

## Response Schema

```typescript
interface ConfirmUploadResponse {
  mediaUploadId: string;         // The confirmed upload's ID
  publicId: string | null;       // Public ID echoed back
  secureUrl: string | null;      // Secure URL echoed back
  resourceType: string | null;   // "image", "video", or "raw"
}
```

---

## What Happens After Confirmation

The `uploadMedia()` orchestrator combines the confirm response and Cloudinary result into a `MediaUploadResult`:

```typescript
interface MediaUploadResult {
  mediaUploadId: string;  // Used when linking to an entity
  publicId: string;       // Cloudinary full public ID
  secureUrl: string;      // For image preview in the UI
  resourceType: string;   // From confirm response or Cloudinary
}
```

The calling page (e.g., `CreateItemPage`) stores the `MediaUploadResult` and later links it to the entity:

```typescript
// In CreateItemPage.handleSubmit():
await addItemMedia(itemId, {
  mediaUploadId: img.mediaUploadId,
  isPrimary: i === 0,
  sortOrder: i,
});
```

---

## Timing Constraints

| Window | Duration | What happens if missed |
|--------|----------|----------------------|
| Signature expiry | 30 min after step 1 | BE returns `409 Media.SignatureExpired` |
| Orphan expiry | 60 min after confirmation | BE cleanup job deletes the upload if not linked to an entity |

The 60-minute orphan window means the user has up to 1 hour after confirming uploads to complete the item creation form and submit. If they abandon the page, the uploads are automatically cleaned up.

---

## Error Handling

| HTTP | Error Code | Condition | FE Handling |
|------|-----------|-----------|-------------|
| 400 | `Validation` | Required fields missing or invalid | Caught by `uploadMedia()` |
| 404 | `Media.NotFound` | Invalid `mediaUploadId` | Caught by `uploadMedia()` |
| 403 | `Media.NotOwnedByUser` | Upload belongs to a different user | Caught by `uploadMedia()` |
| 409 | `Media.PublicIdMismatch` | Public ID does not match | Mitigated by using `signature.publicId` |
| 409 | `Media.AlreadyConfirmed` | Upload was already confirmed | Should not occur in normal flow |
| 409 | `Media.SignatureExpired` | More than 30 min since step 1 | User needs to re-upload |
| 409 | `Media.IdempotencyPayloadMismatch` | Same key, different payload | Should not occur (random UUID each time) |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/services/mediaService.ts` | `confirmUpload()` function, `ConfirmUploadRequest` / `ConfirmUploadResponse` types |
| `src/pages/seller/CreateItemPage.tsx` | Consumes `MediaUploadResult` and calls `addItemMedia()` to link media |
| `src/services/auctionService.ts` | `addItemMedia()` -- links confirmed media to an item entity |
