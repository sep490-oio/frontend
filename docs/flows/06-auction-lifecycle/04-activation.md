# 04 - Auction Activation (Frontend)

## Status: BE-Only

Activation is a backend background process. The FE does not call any activation endpoint directly. Instead, the FE receives the result via SignalR events and polling.

---

## How Activation Works (BE)

When a scheduled auction's `startTime` arrives, a Quartz job (`ActivateAuctionJob`) fires and transitions the auction from `Scheduled` to `Active`:

1. Check if auction is still `Scheduled` (idempotent)
2. Verify qualification window exists
3. Check for bid-eligible participants
   - **If no eligible participants**: Auto-cancel the auction, return item to `Active` status
   - **If eligible participants exist**: `Auction.Start()` -> `Active`, schedule `EndAuctionJob`

Alternatively, if the seller publishes after `startTime` has passed, activation happens immediately in the publish handler.

---

## FE Impact

### SignalR Event: `AuctionStarted`

When the BE activates an auction, it broadcasts via SignalR:

```typescript
// src/types/signalr.ts
interface AuctionStartedNotification {
  auctionId: string;
  startTime: string;
  endTime: string;
}
```

The FE handles this in `useAuctionHub` (used by AuctionDetailPage):

```typescript
// On AuctionStarted event:
queryClient.invalidateQueries({ queryKey: ['auction', id] });
```

This causes the auction detail to refetch, updating the status badge and enabling the bidding panel.

### Polling Fallback

`useAuction()` polls every 10 seconds as a fallback:

```typescript
export function useAuction(id: string | undefined) {
  return useQuery({
    queryKey: ['auction', id],
    queryFn: () => getAuctionById(id!),
    enabled: !!id,
    refetchInterval: 10_000,  // 10s polling fallback
  });
}
```

This catches activation even if the SignalR connection drops.

### UI Changes on Activation

When the auction status changes from `scheduled` to `active`:

| Component | Change |
|-----------|--------|
| AuctionCard | Status badge changes to "DANG DIEN RA" (red), countdown starts ticking |
| AuctionDetailPage | BiddingPanel enables bid input, deposit becomes relevant |
| MyListingsPage | Status tag changes to `active`, publish button disappears |
| BrowsePage | Auction appears in `active` status filter results |

---

## Auto-Cancel (No Participants)

If no bid-eligible participants exist at `startTime`, the BE auto-cancels the auction. The FE receives:

```typescript
// SignalR event
interface AuctionCancelledNotification {
  auctionId: string;
  reason: string;  // "Auction automatically cancelled because no bid-eligible participants..."
}
```

---

## BE Reference

See `backend/docs/flows/06-auction-lifecycle/04-activation.md` for the full activation flow, `ActivateAuctionJob` details, `AuctionActivationService`, and `HasBidEligibleParticipants()` logic.
