# 05 - Auto-Extension / Anti-Sniping (Frontend)

## Status: BE-Only

Auto-extension is handled entirely by the BE domain logic inside `Auction.PlaceBid()`. The FE receives the result via the `AuctionExtended` SignalR event and updates the countdown timer accordingly.

---

## How Auto-Extension Works (BE)

When a bid is placed within the final 5 minutes of an active auction (configurable `ExtensionThreshold`), the auction's end time is automatically extended by `extensionMinutes` (seller-configurable, 1-30, default 5).

### Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `ExtensionThreshold` | 5 minutes | Bid within this window triggers extension |
| `MaxExtensionsPerAuction` | 10 | Maximum extensions per auction |
| `MaxDuration` | 30 days | Absolute ceiling for total duration |
| `ExtensionMinutes` | 5 (seller-set) | Minutes added per extension |

### Conditions for Extension

All must be true:
1. `AuctionInfo.AutoExtend == true`
2. `ExtensionCount < MaxExtensionsPerAuction` (10)
3. Bid placed within `ExtensionThreshold` of `EndTime`
4. Auction status is `Active`

Sealed auctions (`AuctionType.Sealed`) have `autoExtend` forced to `false` and never extend.

---

## FE Impact

### SignalR Event: `AuctionExtended`

```typescript
// src/types/signalr.ts
interface AuctionExtendedNotification {
  auctionId: string;
  newEndTime: string;
  extensionMinutes: number;
}
```

When the FE receives this event:
1. The auction data cache is invalidated -> refetch with new `endTime`
2. The `AuctionCard` countdown timer recalculates based on the new `endTime`
3. The `AuctionDetailPage` updates to reflect the extended time

### AuctionCard Countdown

The `AuctionCard` component computes `msLeft` from `auction.endTime`:

```typescript
const [msLeft, setMsLeft] = useState(
  () => new Date(auction.endTime).getTime() - Date.now()
);

useEffect(() => {
  if (!isLive) return;
  const timer = setInterval(() => {
    setMsLeft(new Date(auction.endTime).getTime() - Date.now());
  }, 1000);
  return () => clearInterval(timer);
}, [isLive, auction.endTime]);
```

When the auction data refetches after an extension, `auction.endTime` changes, and the countdown resets to the new longer duration.

### Seller Configuration

In `CreateAuctionPage`, the seller configures anti-sniping:

- **Auto-extend toggle**: `Switch` component, default `true`
- **Extension minutes**: `InputNumber` (1-30), shown only when auto-extend is on, default 5

These values are sent to the BE in both the `createAuctionFromItem()` call (as `extensionMinutes`) and the `setAuctionTiming()` call (as `autoExtend` + `extensionMinutes`).

---

## Example Timeline

| Time | Event | EndTime | Extensions |
|------|-------|---------|------------|
| T+0:00 | Auction starts, EndTime = T+1:00 | T+1:00 | 0 |
| T+0:54 | Bid placed (6 min before end) | T+1:00 | 0 (outside threshold) |
| T+0:56 | Bid placed (4 min before end) | T+1:05 | 1 (extended!) |
| T+1:02 | Bid placed (3 min before new end) | T+1:10 | 2 (extended!) |
| ... | After 10 extensions | unchanged | 10 (max, no more) |

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/05-auto-extension.md` for `TryAutoExtend()` domain logic, `IsEndingSoon()`, `AuctionExtendedEvent`, and `AuctionExtendedEventHandler` (reschedules `EndAuctionJob`).
