# 01 -- Initiate Buy Now Reservation (Frontend)

> **Status**: Partial (modal + API call exist; VNPay redirect not wired)
> **BE doc**: `backend/docs/flows/08-buy-now/01-initiate-reservation.md`

## Overview

The FE has a working `BuyNowConfirmModal` that confirms the purchase and calls the BE via SignalR (primary) or REST (fallback). However, the full reservation + VNPay redirect flow is not yet wired. The FE currently treats the buy-now response as a direct purchase confirmation rather than a reservation that requires VNPay payment.

## What Exists

### Component: BuyNowConfirmModal

**File**: `src/components/auction/BuyNowConfirmModal.tsx`

**Props**:

```typescript
interface BuyNowConfirmModalProps {
  open: boolean;
  onClose: () => void;
  auction: Auction;
  /** SignalR hub buyNow action -- if provided, used as primary channel */
  hubBuyNow?: () => Promise<void>;
}
```

**Display**:
1. Price display: buy-now price in large orange text (28px, `#fa8c16`) using `formatVND()`
2. Confirmation text: `bidding.buyNowConfirm` with amount interpolation
3. Warning alert (type="warning"): "Phien dau gia se ket thuc ngay lap tuc" / "The auction will end immediately"
4. Info alert (type="info"): "Day la tinh nang mo phong" / "This is a simulated feature"

Responsive: full-width on mobile (`isMobile ? '100%' : 480`), top-positioned on mobile (`top: 20`).

**Dual-channel execution**:

```typescript
const handleConfirm = async () => {
  // SignalR primary path
  if (hubBuyNow) {
    await hubBuyNow();
    message.success(t('bidding.buyNowSuccess'));
    onClose();
    return;
  }
  // REST fallback
  buyNow.mutate(auction.id, {
    onSuccess: () => { message.success(...); onClose(); },
    onError: () => { message.error(...); },
  });
};
```

### BiddingPanel Integration

**File**: `src/components/auction/BiddingPanel.tsx`

The buy-now button renders when the auction has a `buyNowPrice` AND the user is qualified:

```tsx
{auction.buyNowPrice && isQualified && (
  <Button
    size="large"
    block
    icon={<ShoppingCartOutlined />}
    onClick={() => setBuyNowOpen(true)}
    style={{ color: '#fa8c16', borderColor: '#fa8c16' }}
  >
    {t('bidding.buyNowButton')} -- {formatVND(auction.buyNowPrice)}
  </Button>
)}
```

The modal receives the optional `hubBuyNow` prop from the SignalR connection:

```tsx
<BuyNowConfirmModal
  open={buyNowOpen}
  onClose={() => setBuyNowOpen(false)}
  auction={auction}
  hubBuyNow={isConnected ? hubBuyNow : undefined}
/>
```

### Service Function: buyNow()

**File**: `src/services/auctionService.ts`

```typescript
export async function buyNow(auctionId: string): Promise<BuyNowResponse> {
  const { data } = await api.post<BuyNowResponse>(
    `/api/auctions/${auctionId}/buy-now`,
  );
  return data;
}
```

No request body. No `Idempotency-Key` header (the BE uses its own `IdempotencyFilter`).

### Mutation Hook: useBuyNow()

**File**: `src/hooks/useBidding.ts`

```typescript
export function useBuyNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => buyNow(auctionId),
    onSuccess: (_data, auctionId) => {
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['myBids'] });
    },
  });
}
```

### SignalR Hub Action

**File**: `src/services/auctionHubService.ts`

```typescript
async function buyNow(auctionId: string): Promise<void> {
  const conn = getOrCreateConnection();
  await conn.invoke('BuyNow', auctionId);
}
```

**File**: `src/hooks/useAuctionHub.ts`

```typescript
const buyNow = useCallback(() => {
  return auctionHubService.buyNow(auctionId);
}, [auctionId]);
```

### SignalR Event: BuyNowExecuted

**File**: `src/types/signalr.ts`

```typescript
export interface BuyNowNotification {
  auctionId: string;
  buyerId: string;
  price: number;
}
```

Handled in `useAuctionHub.ts` via the `onBuyNowExecuted` callback, which triggers cache invalidation in `AuctionDetailPage`.

### i18n Keys

| Key | Vietnamese | English |
|-----|-----------|---------|
| `bidding.buyNowTitle` | Xac nhan mua ngay | Confirm Buy Now |
| `bidding.buyNowConfirm` | Ban se thanh toan {{amount}} | You will pay {{amount}} |
| `bidding.buyNowWarning` | Phien dau gia se ket thuc ngay lap tuc | The auction will end immediately |
| `bidding.buyNowButton` | Mua ngay | Buy Now |
| `bidding.buyNowConfirmButton` | Xac nhan mua | Confirm Purchase |
| `bidding.buyNowSuccess` | Mua thanh cong! Don hang da duoc tao. | Purchase successful! Order has been created. |
| `bidding.buyNowNote` | Day la tinh nang mo phong. | This is a simulated feature. |

## What's Missing

### 1. BuyNowCheckoutDto Response Handling

The BE returns `BuyNowCheckoutDto` (201 Created):

```
{
  reservationId: Guid,
  paymentUrl: string,        // VNPay redirect URL
  expiresAt: DateTime,       // reservation expiry (now + 15 min)
  buyNowPrice: MoneyDto,     // full price
  depositAppliedAmount: MoneyDto,  // deposit offset
  amountDue: MoneyDto        // what buyer pays via VNPay
}
```

The FE type `BuyNowResponse` currently expects `{ orderId, finalPrice }` which does not match.

### 2. VNPay Redirect

After receiving `BuyNowCheckoutDto`, the FE should redirect the user to `paymentUrl` (same pattern as `createDepositUrl()`):

```typescript
// Target implementation:
const checkout = await buyNow(auctionId);
window.location.href = checkout.paymentUrl;
```

### 3. Reservation Timer

The FE should display a countdown timer showing time remaining until `expiresAt`. If the buyer does not complete payment within 15 minutes, the reservation expires and the auction is unlocked.

### 4. Deposit Breakdown Display

The modal should show the pricing breakdown:
- Full buy-now price
- Deposit applied (from held auction deposit)
- Amount due via VNPay (the difference)

### 5. Auction Lock Indicator

When another buyer has an active reservation, the FE should show "Buy-now in progress" to other bidders. This requires handling the `BuyNowReserved` and `BuyNowReservationReleased` SignalR events.

### 6. FE Type Update

```typescript
// Current (incorrect):
export interface BuyNowResponse {
  orderId: string;
  finalPrice: number;
}

// Target:
export interface BuyNowCheckoutDto {
  reservationId: string;
  paymentUrl: string;
  expiresAt: string;
  buyNowPrice: MoneyDto;
  depositAppliedAmount: MoneyDto;
  amountDue: MoneyDto;
}

interface MoneyDto {
  amount: number;
  currency: string;
  symbol: string;
}
```

## BE Validation (6 Checks)

The BE validates before creating a reservation:

| # | Check | Error Code |
|---|-------|------------|
| 1 | Auction has a `buyNowPrice` and it is available | `Auction.NotSupportBuyNow` |
| 2 | No other active reservation exists | `Auction.BuyNowReservationActive` |
| 3 | Buyer is not the seller | `Auction.SelfBid` |
| 4 | Auction status is `Scheduled` | `Auction.BuyNowUnavailableForScheduledAuction` |
| 5 | Auction timing is configured | `Auction.TimingRequired` |
| 6 | Qualification window is open | `Auction.BuyNowUnavailableForScheduledAuction` |

The FE does not currently display specific error messages for these codes.

## BE Deposit Calculation

```
depositApplied = min(heldDeposit.Amount, buyNowPrice.Amount)
gatewayAmountDue = buyNowPrice.Amount - depositApplied
```

If the buyer has no held deposit, the full price is charged via VNPay.

## Source Files

| File | Path |
|------|------|
| Component | `src/components/auction/BuyNowConfirmModal.tsx` |
| Orchestrator | `src/components/auction/BiddingPanel.tsx` |
| Service (REST) | `src/services/auctionService.ts` -- `buyNow()` |
| Service (SignalR) | `src/services/auctionHubService.ts` -- `buyNow()` |
| Hook (mutation) | `src/hooks/useBidding.ts` -- `useBuyNow()` |
| Hook (hub) | `src/hooks/useAuctionHub.ts` -- `buyNow` callback |
| Type (incorrect) | `src/types/auction.ts` -- `BuyNowResponse` |
| Type (SignalR event) | `src/types/signalr.ts` -- `BuyNowNotification` |
| i18n (VI) | `src/locales/vi/common.json` -- `bidding.buyNow*` |
| i18n (EN) | `src/locales/en/common.json` -- `bidding.buyNow*` |
