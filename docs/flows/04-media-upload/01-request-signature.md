# 01 -- Request Upload Signature

> **Status**: Implemented
> **BE docs**: `backend/docs/flows/04-media-upload/01-request-signature.md`

## Overview

Step 1 of the 3-step upload flow. The FE asks the BE for a signed parameter bundle that authorizes a direct upload to Cloudinary. The BE validates the upload context, generates a SHA-1 signature, creates a `MediaUpload` record in `Pending` state, and returns everything the FE needs for the Cloudinary upload.

---

## API Call

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/media/upload-signature` |
| **Permission** | `media:upload` (authenticated user) |
| **Idempotency** | Required -- `Idempotency-Key` header |

---

## FE Implementation

**File**: `src/services/mediaService.ts` -- `getUploadSignature()`

```typescript
async function getUploadSignature(
  context: string,
  fileName: string
): Promise<UploadSignatureResponse> {
  const { data } = await api.post<ApiResponse<UploadSignatureResponse>>(
    '/api/media/upload-signature',
    { context, fileName } satisfies UploadSignatureRequest,
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  );
  return data.data ?? (data as unknown as UploadSignatureResponse);
}
```

### Key details

- **Idempotency key**: A new `crypto.randomUUID()` is generated per call. The FE does not reuse keys, so each call produces a fresh signature.
- **Response unwrapping**: Handles both the standard `{ data, message, success }` wrapper and raw responses (defensive coding for BE format changes).
- **Called by**: `uploadMedia()` orchestrator, not directly by page components.

---

## Request Schema

```json
{
  "context": "item_image",
  "fileName": "photo.jpg"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `context` | `string` | Yes | Upload context name (e.g., `item_image`). Must be one of the 8 BE-registered contexts. |
| `fileName` | `string` | Yes | Original file name from the user's file picker. BE uses it for naming. |

---

## Response Schema

```typescript
interface UploadSignatureResponse {
  mediaUploadId: string;   // GUIDv7 -- tracks this upload through its lifecycle
  uploadUrl: string;       // Cloudinary endpoint: https://api.cloudinary.com/v1_1/{cloud}/image/upload
  signature: string;       // SHA-1 hex digest of signed params
  timestamp: number;       // Unix epoch seconds (used in signature)
  apiKey: string;          // Cloudinary API key (public, safe for client)
  cloudName: string;       // Cloudinary cloud name
  publicId: string;        // Leaf file name (e.g., "img_abc123def456")
  folder: string;          // Temporary folder: "{context.Folder}/pending/{userId}"
  eager: string;           // Cloudinary eager transforms (e.g., "w_800,h_800,c_limit|w_400,h_400,c_fill")
  resourceType: string;    // "image", "video", or "raw"
  maxFileSize: number;     // Max bytes allowed (e.g., 10485760 for 10 MB)
  allowedFormats: string[];// Permitted extensions (e.g., ["jpg","jpeg","png","webp"])
}
```

### Fields used by FE in subsequent steps

| Field | Used In | Purpose |
|-------|---------|---------|
| `mediaUploadId` | Step 3 (confirm) | Identifies which upload to confirm |
| `uploadUrl` | Step 2 (Cloudinary) | POST target URL |
| `signature`, `timestamp`, `apiKey` | Step 2 (Cloudinary) | Authentication fields for Cloudinary |
| `publicId` | Step 2 + Step 3 | File name leaf sent to Cloudinary; also sent to confirm to avoid mismatch |
| `folder` | Step 2 (Cloudinary) | Temporary upload folder |
| `eager` | Step 2 (Cloudinary) | Transformation string (signed, must be included) |
| `allowedFormats` | Step 2 + client validation | Format whitelist |
| `maxFileSize` | Client validation | Size limit check before uploading |

---

## Error Handling

| HTTP | Error Code | Condition | FE Handling |
|------|-----------|-----------|-------------|
| 400 | `Validation` | `context` or `fileName` empty | Caught by `uploadMedia()`, surfaces as error message |
| 400 | `Media.Context.NotInSet` | Invalid context name | Caught by `uploadMedia()`, surfaces as error message |
| 409 | `Media.IdempotencyPayloadMismatch` | Same idempotency key, different payload | Should not occur (FE uses random UUID each time) |
| 422 | `Idempotency.Required` | Missing `Idempotency-Key` header | Should not occur (FE always sends the header) |

---

## Timing Constraints

| Constraint | Value | Impact on FE |
|-----------|-------|-------------|
| Signature expiry | 30 minutes | FE must upload to Cloudinary within 30 min of receiving the signature |
| Idempotency cache TTL | 15 minutes | Irrelevant since FE uses fresh UUIDs |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/services/mediaService.ts` | `getUploadSignature()` function and `UploadSignatureRequest` / `UploadSignatureResponse` types |
| `src/services/api.ts` | Axios instance with auth token injection and silent refresh |
