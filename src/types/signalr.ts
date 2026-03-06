/**
 * SignalR notification types — matches Tan's C# records exactly.
 *
 * Source: docs/vps/IAuctionHubClient.cs
 * These are the payloads the server pushes to connected clients
 * via the AuctionHub SignalR hub.
 *
 * C# `Guid` maps to `string` (UUID format).
 * C# `decimal` maps to `number`.
 * C# `DateTimeOffset` maps to `string` (ISO 8601).
 * C# `TimeSpan` maps to `string` ("hh:mm:ss" format from JSON serialization).
 */

// ─── Bid Events ─────────────────────────────────────────────────────

/** Broadcast to auction group when any bid is placed */
export interface BidNotification {
  auctionId: string;
  bidId: string;
  bidderId: string;
  bidderDisplayName: string;
  amount: number;
  currentPrice: number;
  minimumNextBid: number;
  totalBids: number;
  isAutoBid: boolean;
  timestamp: string;
}

/** Sent to the specific user who was outbid (via user:{userId} group) */
export interface OutbidNotification {
  auctionId: string;
  newHighAmount: number;
  minimumNextBid: number;
  newHighBidderDisplayName: string;
}

/** Broadcast when a buy-now purchase completes — auction ends immediately */
export interface BuyNowNotification {
  auctionId: string;
  buyerId: string;
  price: number;
}

// ─── Auction Lifecycle Events ───────────────────────────────────────

/** Broadcast when auction transitions from Pending to Active */
export interface AuctionStartedNotification {
  auctionId: string;
  startTime: string;
  endTime: string;
}

/** Broadcast when auction ends (timer expires or buy-now) */
export interface AuctionEndedNotification {
  auctionId: string;
  winnerId: string | null;
  winnerDisplayName: string | null;
  finalPrice: number;
  totalBids: number;
  reserveMet: boolean;
}

/** Broadcast when anti-sniping extends the auction timer */
export interface AuctionExtendedNotification {
  auctionId: string;
  newEndTime: string;
  extensionMinutes: number;
}

/** Broadcast when an admin cancels the auction */
export interface AuctionCancelledNotification {
  auctionId: string;
  reason: string;
}

// ─── Price Update ───────────────────────────────────────────────────

/** Periodic price/time sync broadcast to auction group */
export interface PriceUpdateNotification {
  auctionId: string;
  currentPrice: number;
  minimumNextBid: number;
  totalBids: number;
  /** TimeSpan serialized as "hh:mm:ss" or "d.hh:mm:ss" by .NET JSON */
  remainingTime: string;
}

// ─── Error ──────────────────────────────────────────────────────────

/** Sent to Clients.Caller when a hub method fails */
export interface HubErrorNotification {
  code: string;
  message: string;
  /** Validation errors keyed by property name */
  errors: Record<string, string[]> | null;
}

// ─── Hub Event Map ──────────────────────────────────────────────────
// Used by the hub service to provide type-safe event registration.

export interface AuctionHubEvents {
  BidPlaced: BidNotification;
  Outbid: OutbidNotification;
  BuyNowExecuted: BuyNowNotification;
  AuctionStarted: AuctionStartedNotification;
  AuctionEnded: AuctionEndedNotification;
  AuctionExtended: AuctionExtendedNotification;
  AuctionCancelled: AuctionCancelledNotification;
  PriceUpdated: PriceUpdateNotification;
  Error: HubErrorNotification;
}
