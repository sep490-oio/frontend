# 05 -- Upload Contexts Reference

> **Status**: Reference
> **BE docs**: `backend/docs/flows/04-media-upload/05-upload-contexts-reference.md`

## Overview

The BE defines 8 upload contexts, each specifying allowed file types, size limits, and Cloudinary transformations. The FE passes a context string (e.g., `"item_image"`) when requesting an upload signature. This document lists all contexts and where they are (or will be) used in the FE.

---

## All Upload Contexts (BE-Defined)

| Context Name | Resource Type | Max Size | Allowed Formats | Max Per Entity | FE Status |
|-------------|--------------|----------|-----------------|---------------|-----------|
| `item_image` | image | 10 MB | jpg, jpeg, png, webp | 10 | Implemented |
| `item_video` | video | 100 MB | mp4, mov, webm | 3 | Not implemented |
| `user_avatar` | image | 5 MB | jpg, jpeg, png, webp | 1 | Not implemented |
| `verification_document` | image | 10 MB | jpg, jpeg, png, webp | 10 | Not implemented |
| `verification_image` | image | 10 MB | jpg, jpeg, png, webp | 10 | Not implemented |
| `warehouse_inspection_image` | image | 10 MB | jpg, jpeg, png, webp | 10 | Not implemented |
| `dispute_attachment` | image | 10 MB | jpg, jpeg, png, webp | 10 | Not implemented |
| `term_document` | raw (PDF) | 10 MB | pdf | 1 | Not implemented |

---

## FE Usage: Where Each Context Is Used

### `item_image` -- Implemented

**Used in**: `src/pages/seller/CreateItemPage.tsx`

The seller uploads item images during item creation. The flow:

1. User selects images via Ant Design `<Upload>` component (`accept="image/jpeg,image/png,image/webp"`)
2. Each file is uploaded via `mediaService.uploadMedia(file, 'item_image')`
3. Uploaded images are stored in component state as `UploadedImage[]`
4. On form submit, each image is linked via `addItemMedia(itemId, { mediaUploadId, isPrimary, sortOrder })`
5. The first image is marked as primary (`isPrimary: true`)

**Constraints enforced by FE**:
- File types: `image/jpeg`, `image/png`, `image/webp` (via `<Upload accept>`)
- File size: checked against `signature.maxFileSize` (10 MB) before Cloudinary upload
- Format: checked against `signature.allowedFormats` before Cloudinary upload
- Max per entity (10): **not enforced on FE** -- BE enforces this when linking

---

### `item_video` -- Not Yet Implemented

**Future use**: Video uploads for item listings. Would need:
- Video file picker (accept `video/mp4,video/quicktime,video/webm`)
- Progress bar (important for large files up to 100 MB)
- `eager_async` handling (video transforms are async on Cloudinary)

### `user_avatar` -- Not Yet Implemented

**Future use**: Profile page avatar upload. Would need:
- Single image upload (max 1 per entity)
- Image cropper for 1:1 aspect ratio
- Replace existing avatar flow

### `verification_document` / `verification_image` -- Not Yet Implemented

**Future use**: Identity verification (CCCD upload). Would need:
- Document/photo capture for front and back of ID
- Secure upload flow (verification-specific UI)

### `warehouse_inspection_image` -- Not Yet Implemented

**Future use**: Warehouse staff uploading inspection evidence photos.

### `dispute_attachment` -- Not Yet Implemented

**Future use**: Users attaching evidence images to dispute messages.

### `term_document` -- Not Yet Implemented

**Future use**: Admin uploading terms & conditions PDFs.

---

## How to Add a New Upload Context to the FE

When implementing a new context, follow the same pattern used by `CreateItemPage`:

1. **Call `mediaService.uploadMedia(file, 'context_name')`** -- the service handles all 3 steps automatically
2. **Store the result** (`MediaUploadResult`) in component state
3. **Link to entity** via the appropriate BE endpoint after entity creation
4. **Validate on the client side**: use `accept` on the file picker and check `signature.maxFileSize` / `signature.allowedFormats`

No changes to `mediaService.ts` are needed -- the service is context-agnostic. The `context` string is just passed through to the BE.

---

## Discovering Available Contexts at Runtime

The BE exposes a `GET /api/media/contexts` endpoint (permission: `media:contexts:read`) that returns all contexts with their constraints:

```json
[
  {
    "name": "item_image",
    "resourceType": "image",
    "maxFileSizeBytes": 10485760,
    "allowedFormats": ["jpg", "jpeg", "png", "webp"],
    "maxUploadsPerEntity": 10
  }
]
```

The FE does not currently call this endpoint. It could be used to dynamically configure upload components instead of hardcoding constraints.

---

## Source Files

| File | What it does |
|------|-------------|
| `src/services/mediaService.ts` | Context-agnostic upload service (pass any context string) |
| `src/pages/seller/CreateItemPage.tsx` | Uses `item_image` context for item photo uploads |
| `src/services/auctionService.ts` | `addItemMedia()` -- links media to items after upload |
| `src/components/auction/ImageGallery.tsx` | Displays item images (read-only, consumes `ItemImage[]`) |
| `src/types/item.ts` | `ItemImage` type with `id`, `imageUrl`, `isPrimary`, `sortOrder` |
