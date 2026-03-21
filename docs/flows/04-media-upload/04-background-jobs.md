# 04 -- Background Jobs

> **Status**: BE-only (no FE implementation required)
> **BE docs**: `backend/docs/flows/04-media-upload/04-background-jobs.md`

## Overview

After the FE completes the 3-step upload and links media to an entity, the BE runs two background jobs on a 15-minute interval. These jobs are fully server-side -- the FE does not participate, trigger, or monitor them. This document explains what they do so FE developers understand the media lifecycle.

---

## Job 1: Relocation (PendingUploadRelocationJob)

**What it does**: Moves uploaded files from the temporary `pending/` folder to their final Cloudinary path.

**Example**:
```
Before:  items/pending/{userId}/img_abc123def456
After:   items/{itemId}/img_abc123def456
```

**When it runs**: Every 15 minutes, processes up to 50 uploads per run.

**Retry behavior**: If a rename fails on Cloudinary, the job retries with exponential backoff:
- Attempt 0: retry after 1 minute
- Attempt 1: retry after 5 minutes
- Attempt 2: retry after 15 minutes
- After 3 failures: gives up permanently

### FE Impact

- **Image URLs change** after relocation. The `secure_url` the FE received during upload points to the `pending/` folder. After relocation, the URL changes to the final folder. The BE updates entity snapshots (e.g., `Item.images[].imageUrl`), so the FE gets the correct URL when it fetches the entity.
- **No action needed**: The FE should always read image URLs from entity API responses (e.g., `GET /api/items/{id}`), not cache the `secureUrl` from the upload flow long-term.
- **Temporary delay**: There may be a brief period (up to 15 minutes) where the old `pending/` URL still works. Cloudinary keeps the old URL working via redirect after a rename, so there is no broken image risk.

---

## Job 2: Cleanup (PendingUploadCleanupJob)

**What it does**: Removes expired and orphaned uploads from both Cloudinary and the database.

**When it runs**: Every 15 minutes.

### Three cleanup cases

| Case | Condition | What gets deleted |
|------|-----------|-------------------|
| **Expired unconfirmed** | Signature requested but never confirmed within 30 min | DB record only (file was never uploaded to Cloudinary) |
| **Orphan confirmed** | Confirmed but never linked to an entity within 60 min | Cloudinary resource + DB record |
| **Old linked records** | Linked, relocated, and 7+ days old | DB record only (Cloudinary resource is kept -- it is in active use) |

### FE Impact

- **Abandoned uploads are cleaned up automatically**: If a user uploads images but never submits the form, the uploads expire after 60 minutes and are deleted. No FE cleanup logic needed.
- **No stale references**: Since orphaned uploads are deleted from Cloudinary, any `secureUrl` from an abandoned upload will eventually return a 404. This is expected behavior.

---

## What the FE Should (and Should Not) Do

| Do | Do Not |
|----|--------|
| Show a loading/processing indicator while uploads are in `pending/` state | Try to trigger relocation or cleanup from the FE |
| Read image URLs from entity API responses (e.g., `item.images[].imageUrl`) | Cache `secureUrl` from the upload response as the permanent URL |
| Let abandoned uploads expire naturally (60-min orphan window) | Build custom cleanup logic on the FE side |
| Handle the case where an image URL returns 404 (graceful fallback) | Assume `pending/` URLs will work forever |
