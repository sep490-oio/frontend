# 02 - Update Timing (Frontend)

## Status: Implemented

---

## Overview

Step 2 of the 3-step auction creation flow (called after submit in the actual code order: create -> submit -> timing). The FE calls `PUT /api/auctions/{id}/timing` to set the qualification window and auction start/end times. This transitions an `Approved` auction to `Scheduled`.

**Critical timing rules:**
- `qualificationStartAt` must NOT be in the past
- `qualificationEndAt` must be strictly BEFORE `startTime`
- `startTime` must be at least 30 minutes in the future (enforced by FE auto-calculation)

---

## API Call

| Step | Function | Method | Endpoint | Purpose |
|------|----------|--------|----------|---------|
| 1 | `setAuctionTiming()` | PUT | `/api/auctions/{id}/timing` | Set timing on Approved auction -> Scheduled |

Defined in `src/services/auctionService.ts`.

---

## Request Schema

```typescript
// src/types/auction.ts
interface SetAuctionTimingRequest {
  startTime: string;              // ISO 8601
  endTime: string;                // ISO 8601
  qualificationStartAt: string;   // ISO 8601
  qualificationEndAt: string;     // ISO 8601
  autoExtend: boolean;
  extensionMinutes: number;
}
```

All fields are required. The BE validates them strictly.

---

## Auto-Calculation of Qualification Window

The seller only picks `startTime` and `endTime` in the form. The FE automatically calculates the qualification window:

```typescript
// CreateAuctionPage.tsx — handleCreate()
const qualStart = values.startTime.subtract(30, 'minute');
const qualEnd = values.startTime.subtract(1, 'minute');

await setTiming.mutateAsync({
  auctionId,
  timing: {
    startTime: values.startTime.toISOString(),
    endTime: values.endTime.toISOString(),
    qualificationStartAt: qualStart.toISOString(),
    qualificationEndAt: qualEnd.toISOString(),
    autoExtend: values.autoExtend,
    extensionMinutes: values.extensionMinutes,
  },
});
```

### Calculation Rules

| Field | Formula | Example (startTime = 10:00) |
|-------|---------|----------------------------|
| `qualificationStartAt` | `startTime - 30 min` | 09:30 |
| `qualificationEndAt` | `startTime - 1 min` | 09:59 |
| `startTime` | User-selected | 10:00 |
| `endTime` | User-selected | Next day 10:00 |

This means the seller must pick a `startTime` at least 30 minutes in the future, otherwise `qualificationStartAt` would be in the past and the BE would reject it.

---

## FE Form Validation (Ant Design)

| Field | Rule | Error Key |
|-------|------|-----------|
| `startTime` | Required | `createAuction.startTimeRequired` |
| `endTime` | Required, must be after startTime | `createAuction.endTimeRequired`, `createAuction.endTimeBeforeStart` |
| `autoExtend` | Boolean switch, default `true` | -- |
| `extensionMinutes` | Required when autoExtend=true, 1-30 | `createAuction.extensionMinutesRequired`, `createAuction.extensionMinutesRange` |

The DatePicker disables past dates (at day granularity):

```typescript
const disablePassedDates = (current: Dayjs) =>
  current && current.isBefore(dayjs(), 'day');
```

---

## BE Validation (from SetAuctionTimingCommand.Validate())

| Field | Rule |
|-------|------|
| `AuctionId` | Not empty GUID |
| `QualificationStartAt` | Not in the past |
| `QualificationEndAt` | Not in the past |
| `ExtensionMinutes` | Between 1 and 30 inclusive |

### BE Handler Preconditions

- Auction status must be `Approved`. Otherwise -> `Auction.CannotSetTiming`
- If `AuctionType == Sealed` and `autoExtend == true` -> `Auction.SealedAutoExtendNotSupported`
- `EndTime` must be after `StartTime` -> `Auction.InvalidPeriod`

---

## State Transition

```
Approved + SetTiming() → Scheduled
```

The `SetTiming()` domain method:
1. Verifies status is `Approved`
2. Creates `QualificationWindow` + `AuctionInfo`
3. Transitions status to `Scheduled`
4. Raises `AuctionScheduledEvent`

---

## Response Handling

```typescript
// auctionService.ts
export async function setAuctionTiming(
  auctionId: string,
  timing: SetAuctionTimingRequest
): Promise<void> {
  await api.put(`/api/auctions/${auctionId}/timing`, timing);
}
```

BE returns `200 OK` with `AuctionDto`. The FE ignores the response body (returns `void`).

---

## Error Handling

Errors are caught in `handleCreate()` and displayed via `message.error()`:

| BE Error Code | When |
|---------------|------|
| `Auction.CannotSetTiming` | Auction is not in `Approved` status |
| `Auction.SealedAutoExtendNotSupported` | Sealed auction with autoExtend=true |
| `Auction.InvalidPeriod` | endTime not after startTime |
| `Auction.QualificationWindowRequired` | Qualification window missing |

---

## Hooks Used

| Hook | Source | Purpose |
|------|--------|---------|
| `useSetAuctionTiming()` | `useSellerManagement.ts` | Mutation: PUT set timing |

Invalidates `['myAuctions']` on success.

---

## Source Files

| File | Path |
|------|------|
| Page | `src/pages/seller/CreateAuctionPage.tsx` (handleCreate, lines 124-173) |
| Service | `src/services/auctionService.ts` (setAuctionTiming) |
| Hook | `src/hooks/useSellerManagement.ts` (useSetAuctionTiming) |
| Request type | `src/types/auction.ts` (SetAuctionTimingRequest) |

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/02-update-timing.md` for full handler flow, qualification window concept, and the general `PUT /api/auctions/{id}` update endpoint.
