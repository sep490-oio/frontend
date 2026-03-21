# 02 -- Manage Media

> **Status**: Implemented (upload during creation only -- no edit/remove/reorder)
> **BE docs**: `backend/docs/flows/05-item-management/02-manage-media.md`

## Overview

Image management is embedded within `CreateItemPage` as Step 0 of the wizard. Sellers upload images via the Cloudinary signed upload flow (see [04-media-upload](../04-media-upload/README.md) module), preview them in a grid, and remove them locally before saving. After item creation, images are attached to the item via `POST /api/items/{id}/media`.

The FE does **not** implement post-creation media management (remove, reorder, set primary). Those BE endpoints exist but have no corresponding UI.

---

## API Calls

### POST `/api/items/{itemId}/media` -- Attach Media to Item

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/items/{itemId}/media` |
| **Permission** | `items.manage_media` |
| **FE Function** | `addItemMedia()` in `src/services/auctionService.ts` |

#### Request Body

```typescript
{
  mediaUploadId: string;  // GUID from Cloudinary upload flow
  isPrimary: boolean;     // true for the first image (index 0)
  sortOrder: number;      // 0-based display order
}
```

#### Response: `201 Created`

Returns `ItemMediaDto` with `id`, `url`, `publicId`, `resourceType`, `isPrimary`, `sortOrder`, and dimensions.

---

### Not Implemented Endpoints

| Method | Path | BE Feature |
|--------|------|-----------|
| `DELETE` | `/api/items/{id}/media/{mediaId}` | Remove media from item |
| `POST` | `/api/items/{id}/media/{mediaId}/primary` | Set primary image |
| `PUT` | `/api/items/{id}/media/reorder` | Reorder item media |

These endpoints require an item edit page, which does not exist yet.

---

## FE Implementation

**File**: `src/pages/seller/CreateItemPage.tsx`

### Upload Flow

The `handleUpload` function orchestrates the 3-step Cloudinary flow for each file:

```typescript
const handleUpload = async (file: File) => {
  const result = await mediaService.uploadMedia(file, 'item_image');
  // result: { mediaUploadId, publicId, secureUrl, resourceType }
  setUploadedImages((prev) => [...prev, { ...result, file: uploadFile }]);
};
```

**Upload context**: `item_image` (hardcoded). This tells the BE to apply item-image-specific limits (max 10 images, max 10 MB per file, jpeg/png/webp formats).

**File acceptance**: `image/jpeg,image/png,image/webp` set via Ant Design `Upload` component's `accept` prop.

### Image Preview Grid

Uploaded images are displayed in a `Flex` grid of 104x104px thumbnails:

- **First image** has a blue border and a "Primary image" badge at the bottom
- Each image has a delete button (top-right corner) that removes it from local state
- Images use Ant Design `Image` component with preview support

### Local State

```typescript
interface UploadedImage {
  mediaUploadId: string;  // From BE upload signature
  publicId: string;       // Cloudinary public ID
  secureUrl: string;      // Cloudinary CDN URL (for preview)
  file: UploadFile;       // Ant Design upload file metadata
}
```

Images are stored in `uploadedImages` state. Removal (`handleRemoveImage`) filters by `mediaUploadId` -- this only removes from local state, not from Cloudinary or the BE.

### Attachment on Submit

After creating the draft item, the FE loops through `uploadedImages` and attaches each one:

```typescript
for (let i = 0; i < uploadedImages.length; i++) {
  const img = uploadedImages[i];
  await addItemMedia(itemId, {
    mediaUploadId: img.mediaUploadId,
    isPrimary: i === 0,    // First image = primary
    sortOrder: i,          // Order matches upload order
  });
}
```

This is sequential (not parallel) to preserve ordering guarantees.

---

## Media Limits

| Constraint | Value | Enforced By |
|-----------|-------|-------------|
| Max images per item | 10 | BE (`UploadContextRegistry`) |
| Max videos per item | 3 | BE (not used by FE -- video upload not implemented) |
| Max file size | 10 MB | BE (via `maxFileSize` in signature response) + `mediaService` client-side check |
| Allowed formats | jpg, jpeg, png, webp | BE (via `allowedFormats`) + `<Upload accept>` prop |
| Minimum images to submit | 1 | BE (`Item.Submit()` checks `media.Count >= 1`) |

---

## Gaps vs BE

| BE Feature | FE Status | Notes |
|-----------|-----------|-------|
| Inline images on `POST /api/items` | Not used | FE attaches images separately via `POST /api/items/{id}/media` |
| Remove media after creation | Not implemented | No edit-item page |
| Reorder media | Not implemented | No drag-and-drop UI |
| Set primary image | Not implemented | Always first uploaded image |
| Video uploads (`item_video` context) | Not implemented | Only `item_image` context used |
| Editable state check (Draft/Rejected) | N/A | FE only uploads during creation (always Draft) |

---

## Source Files

| File | What it does |
|------|-------------|
| `src/pages/seller/CreateItemPage.tsx` | Upload UI, preview grid, attachment logic |
| `src/services/mediaService.ts` | `uploadMedia()` -- 3-step Cloudinary signed upload |
| `src/services/auctionService.ts` | `addItemMedia()` -- POST /api/items/{id}/media |
| `src/types/item.ts` | `ItemImage` interface (id, imageUrl, isPrimary, sortOrder) |
