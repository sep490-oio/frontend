# BE Bug Report — QC Session 2026-03-21

**Reporter**: QC Engineer (Claude) + Long (Stakeholder)
**Tested against**: `https://api.newlsun.com` (VPS)
**FE branch**: `feature/core-auction-flow`

---

## Bug #1: Publish fails on scheduled auctions — race condition

**Severity**: HIGH — blocks demo
**Endpoint**: `POST /api/auctions/{id}/publish`
**Error**: `400 Bad Request` — `"Auction timing (start/end time) must be set before scheduling."`

### Steps to Reproduce

1. Create auction: `POST /api/items/{itemId}/auctions` → 201 (Draft)
2. Submit auction: `POST /api/auctions/{id}/submit` → 204 (Draft → Approved)
3. Set timing: `PUT /api/auctions/{id}/timing` → 200 (Approved → Scheduled)
4. Publish: `POST /api/auctions/{id}/publish` → **400** ❌

### Key Observation

- Created 3 auctions (A1, A2, A3) with the same flow
- **A1** (created ~30 seconds before A2/A3): Publish **succeeded** (204)
- **A2 and A3** (created in quick succession): Publish **failed** (400)
- `GET /api/auctions/{id}` confirms all 3 have `status: "scheduled"` with all timing fields populated

### Affected Auction IDs (on VPS)

| Auction | ID | Status | Publish Result |
|---------|-----|--------|---------------|
| A1 | `019d0f23-6559-7215-b6cc-5e7f55fefdbf` | scheduled | 204 ✓ |
| A2 | `019d0f25-067f-7b24-ae13-13f0e42337a3` | scheduled | 400 ✗ |
| A3 | `019d0f25-4e44-714f-89cd-b80406bfd8f1` | scheduled | 400 ✗ |

### Root Cause Analysis (from BE code review)

**Source files checked**:
- `Auction.cs` lines 315-324 — `Publish()` method
- `PublishAuctionCommand.cs` lines 60-66 — handler
- `AuctionConfiguration.cs` line 96 — EF Core config

**The `Publish()` method** (Auction.cs:315-324):
```csharp
// Line 317: checks status
if (Status != AuctionStatus.Scheduled)
    return AuctionErrors.Auction.InvalidState;

// Line 320: checks Info (timing data)
if (Info is null)
    return AuctionErrors.Auction.TimingRequired;  // ← This fires for A2/A3
```

**`AuctionInfo` is a `ComplexProperty`** (AuctionConfiguration.cs:96):
- Stored as columns in the `auctions` table (`start_time`, `end_time`, `qualification_start_at`, etc.)
- Complex properties are always loaded with the entity — no `.Include()` needed
- **But**: The domain declares `public AuctionInfo? Info { get; private set; }` (nullable), while EF Core `ComplexProperty` does NOT support null values. This is a model mismatch.

**Hypothesis**: When timing is set via `PUT /timing` and publish is called immediately after, the publish handler loads the auction from the DB before the timing `SaveChangesAsync()` has fully committed. The `Info` object materializes as null (or with default values that get treated as null) due to the nullable/ComplexProperty mismatch.

### Suggested Fix

1. **Add logging** in `PublishAuctionCommandHandler` before calling `auction.Publish()`:
   ```csharp
   _logger.LogInformation("Publishing auction {Id}, Status={Status}, Info is null={InfoNull}",
       auction.Id, auction.Status, auction.Info is null);
   ```
2. **Consider explicit reload** in publish handler:
   ```csharp
   await _dbContext.Entry(auction).ReloadAsync(ct);
   ```
3. **Investigate the nullable mismatch** — `AuctionInfo?` vs `ComplexProperty` (which doesn't support null in EF Core)

---

## Bug #2: SignalR CORS — partially fixed

**Severity**: LOW (localhost) / MEDIUM (VPS deploy)
**Endpoint**: `wss://api.newlsun.com/hubs/auction`

### Status After Tân's Fix

**Verified 2026-03-21**: CORS is now correctly configured for `localhost:3000`:
```
access-control-allow-credentials: true
access-control-allow-origin: http://localhost:3000
access-control-allow-headers: authorization
```

SignalR negotiate endpoint returns 200 with WebSocket transport available. **localhost dev is unblocked.**

### Remaining Issue: VPS origin not whitelisted

CORS preflight from `http://14.225.222.182` returns **no CORS headers** (204 without `access-control-allow-origin`). This means SignalR will still fail on the deployed VPS frontend.

**Action needed**: Add `http://14.225.222.182` to the CORS allowed origins list in production config.

### Note

The QC session browser errors (`WebSocket connection failed`) were from **before** Tân's fix was deployed. The FE SignalR code uses the correct path (`/hubs/auction`). With CORS now fixed for localhost, real-time bid updates should work on local dev. Re-test needed.

---

## Bug #3: Auction detail returns empty item images

**Severity**: HIGH — auction detail pages show "No images available"
**Endpoint**: `GET /api/auctions/{auctionId}`

### Symptom

`GET /api/auctions/{auctionId}` returns `item.images: []` (empty array), but the same item fetched via `GET /api/items/my` has images (1-2 images with Cloudinary URLs).

### Root Cause (from BE code review)

In `GetAuctionByIdQueryHandler.cs` (line 49):
```csharp
.Include(x => x.Item)       // ← Loads Item entity
.AsSplitQuery()
```

**Missing**: `.ThenInclude(x => x.Media)` to eager-load the item's media collection.

The `ItemMappings.ToDto()` method then calls `item.Media.Select(i => i.ToDto()).ToList()` — but since Media wasn't loaded, EF Core returns an empty collection (no exception, just empty).

### Why `GET /api/items/my` works

`GetMyItemsQueryHandler` uses a `Select()` projection that directly accesses `item.Media` within the LINQ query, which forces EF Core to load it automatically. The auction handler uses `.Include()` instead, which requires explicit `.ThenInclude()` for nested collections.

### Fix

In `GetAuctionByIdQueryHandler.cs` line 49, add:
```csharp
.Include(x => x.Item)
.ThenInclude(x => x.Media)  // ← Add this line
.AsSplitQuery()
```

### FE Status

FE code is correct — `mapAuctionDetail()` properly maps `item.images` and `ImageGallery` renders them. No FE changes needed.

---

## Bug #4: ActivateAuctionJob not firing

**Severity**: HIGH — auctions stay `scheduled` past startTime
**Auction ID**: `019d0f51-4fee-7af7-9a1e-7a52d8bad75a`

### Symptom

Auction has `startTime: 2026-03-21T08:09:39.506Z` (15:09 local). At 15:11 local, the auction status is still `scheduled` — it should have transitioned to `active` (if participants exist) or `cancelled` (if no participants).

### Expected Behavior (from BE docs)

Per `docs/flows/06-auction-lifecycle/04-activation.md`:
- `ActivateAuctionJob` (Quartz) fires at `startTime`
- Checks `HasBidEligibleParticipants()`
- If no eligible participants → `auction.CancelAuction()` with reason
- If yes → `auction.Start()` → Status = Active

### What Happened

Neither activation nor cancellation occurred. Status remains `scheduled`. Possible causes:
1. The Quartz job wasn't scheduled during `Publish()`
2. The `AuctionPollingFallbackJob` (runs every 60s) didn't catch overdue auctions
3. The job fired but encountered an error and silently failed

### Additional Evidence from VPS Logs

**ActivateAuctionCommand DID fire** (caught by AuctionPollingFallbackJob):
```
[08:15:29 INF] Handling ActivateAuctionCommand
[08:15:29 INF] Handled ActivateAuctionCommand
[08:16:29 INF] Handling ActivateAuctionCommand  (ran again)
[08:16:29 INF] Handled ActivateAuctionCommand
```

But **DB still shows `scheduled`** after both runs:
```sql
SELECT status FROM auctions WHERE id = '019d0f51-4fee...';
-- Result: scheduled (not cancelled, not active)
```

No error logs around the handler execution. The command ran "successfully" but didn't persist the state change.

**Possible root cause**: `ActivateScheduledAuctionAsync` calls `CancelAuction()` + `SaveChangesAsync()`, but `SaveChangesAsync` may have silently failed (concurrency conflict from multiple polling job runs) or the `CancelAuction` domain method returned an error result that the handler didn't check.

### Impact

Without working activation/cancellation, auctions never go live — bidding is impossible. The polling fallback job runs every 60 seconds and keeps retrying but never succeeds.

---

## Test Environment

- **BE**: `https://api.newlsun.com` (VPS, `develop` branch)
- **FE**: `http://localhost:3000` (local dev server, `feature/core-auction-flow` branch)
- **Accounts used**: admin@oio.com, coreflow.seller@example.com, coreflow.bidder1@example.com, coreflow.bidder2@example.com
- **Date**: 2026-03-21
