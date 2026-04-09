import { Typography, Button, Flex, Card, Spin } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined, InfoCircleOutlined, ReloadOutlined, LoadingOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { PriceHistoryPoint, SealedBidInfoDto } from '@/types'

import { AuctionPriceHeader } from '@/features/auction/components/AuctionPriceHeader'
import BidForm from '@/features/auction/components/BidForm'
import { BidderPositionBlock } from '@/features/auction/components/BidderPositionBlock'
import { EligibilityPanel } from '@/features/auction/components/EligibilityPanel'
import { SealedBidPanel } from '@/features/auction/components/SealedBidPanel'
import { formatCurrency, formatDateTime } from '@/utils/format'

// ── T011: State-specific CTA helper ─────────────────────────────────

type AuctionAction =
  | 'deposit'
  | 'bid'
  | 'winning'
  | 'outbid'
  | 'won'
  | 'lost'
  | 'ended'
  | 'scheduled'
  | 'cancelled'

function getAuctionAction(
  auctionStatus: string,
  qualState: QualificationState,
  isActive: boolean,
  isScheduled: boolean,
  isTerminal: boolean,
  hub: {
    outbid?: { newAmount?: number; newHighAmount?: number } | null
    auctionEnded?: { winnerId?: string; finalPrice: number } | null
  },
  currentUserId: string | undefined,
  t: (key: string, fallback: string) => string,
  currentUserBidState?: {
    position: 'leading' | 'outbid' | 'won' | 'lost' | 'none'
    isCurrentWinner: boolean
    latestBidAmount?: number
    latestBidStatus?: string
  },
): { type: AuctionAction; message: string } {
  // Terminal states take precedence — the page is now public/read-only.
  // Decision source priority: currentUserBidState.position (server-authoritative) >
  //   live SignalR auctionEnded event > auction.status fallback.
  if (isTerminal) {
    // Cancelled / Terminated: always "no sale" regardless of user state.
    if (auctionStatus === 'cancelled' || auctionStatus === 'Cancelled') {
      return { type: 'cancelled', message: t('auctionCancelled', 'This auction has been cancelled.') }
    }
    if (auctionStatus === 'terminated' || auctionStatus === 'Terminated') {
      return { type: 'ended', message: t('auctionTerminatedGeneric', 'This auction has been terminated.') }
    }
    if (auctionStatus === 'failed' || auctionStatus === 'Failed') {
      return { type: 'ended', message: t('auctionFailedGeneric', 'This auction ended without a sale.') }
    }

    // Ended / Sold — determine outcome from currentUserBidState first.
    const position = currentUserBidState?.position
    if (position === 'won') {
      return { type: 'won', message: t('congratulations', 'Congratulations! You won this auction.') }
    }
    if (position === 'lost' || position === 'outbid') {
      return { type: 'lost', message: t('auctionLostMessage', 'This auction has ended. You did not win.') }
    }

    // Fallback to SignalR hub payload if position is not yet known.
    if (hub.auctionEnded) {
      if (!hub.auctionEnded.winnerId) {
        return { type: 'ended', message: t('auctionEndedNoSale', 'Auction ended without a sale.') }
      }
      if (currentUserId && hub.auctionEnded.winnerId === currentUserId) {
        return { type: 'won', message: t('congratulations', 'Congratulations! You won this auction.') }
      }
      return { type: 'lost', message: t('auctionLostMessage', 'This auction has ended. You did not win.') }
    }

    // Sold without a known user position — anonymous/public viewer.
    if (auctionStatus === 'sold' || auctionStatus === 'Sold') {
      return { type: 'ended', message: t('auctionSoldGeneric', 'This auction has been sold.') }
    }
    return { type: 'ended', message: t('auctionEndedGeneric', 'This auction has ended.') }
  }

  // Scheduled
  if (isScheduled) {
    return { type: 'scheduled', message: t('auctionNotStarted', 'This auction has not started yet.') }
  }

  // Active states
  if (isActive) {
    if (currentUserBidState?.position === 'outbid') {
      return { type: 'outbid', message: t('outbidMessage', 'You have been outbid! Place a higher bid now.') }
    }
    if (qualState === 'qualified') {
      return { type: 'bid', message: t('qualifiedMessage', 'You are qualified. Place your bid!') }
    }
    if (qualState === 'window_open' || qualState === 'before_window') {
      return { type: 'deposit', message: t('depositRequired', 'Place a deposit to qualify for bidding.') }
    }
  }

  return { type: 'bid', message: '' }
}

// ── Types ────────────────────────────────────────────────────────────

type QualificationState =
  | 'before_window'
  | 'window_open'
  | 'qualified'
  | 'window_closed'
  | 'is_seller'

export interface AuctionSidebarProps {
  // Auction & item data
  auction: {
    status: string
    auctionType: string
    startTime?: string
    endTime?: string
    startingPrice?: { amount: number }
    reservePrice?: { amount: number } | null
    isReserveMet?: boolean
    buyNowPrice?: { amount: number } | null
    isBuyNowReserved?: boolean
    buyNowReservedUntil?: string
    bidIncrement?: { amount: number }
    autoExtend?: boolean
    extensionMinutes?: number
    extensionCount?: number
    verifyByPlatform?: boolean
    qualificationStartAt?: string
    qualificationEndAt?: string
    sellerId?: string
    bidCount?: number
    currency?: string
    isEndingSoon?: boolean
  }
  item?: {
    condition?: string
    sellerId?: string
  }

  // Price & bid data
  currentPrice: number
  currency: string
  minBid: number
  bidIncrement: number
  bidCount: number
  watchCount: number
  viewCount: number
  endTime?: string
  walletBalance: number
  insufficientBalance: boolean

  // Bid state
  bidAmount: number | null
  onBidAmountChange: (v: number | null) => void

  // Auction status flags
  isActive: boolean
  isScheduled: boolean
  /** True when auction is in a terminal state (ended/sold/failed/cancelled/terminated).
   *  All interactive panels hide; sidebar becomes public read-only results view. */
  isTerminal: boolean
  isSeller: boolean
  qualState: QualificationState

  // Hub / real-time
  hubConnected: boolean
  outbid?: {
    newAmount?: number
    newHighAmount?: number
    minimumNextBid?: number
  } | null
  auctionEnded?: {
    winnerId?: string
    winnerDisplayName?: string
    finalPrice: number
  } | null

  // Watch
  isWatching: boolean
  onWatch: () => void
  watchLoading: boolean

  // Bid handlers
  onPlaceBid: () => void
  isPlacingBid: boolean

  // Auto-bid
  myAutoBid?: {
    isEnabled: boolean
    maxAmount?: { amount: number; currency?: string }
    remainingBudget?: { amount: number; currency?: string }
    totalAutoBids?: number
    status?: string
    incrementAmount?: { amount: number; currency?: string }
  } | null
  onAutoBidClick: () => void
  onPauseAutoBid: () => Promise<void>
  onResumeAutoBid: () => Promise<void>
  onModifyAutoBid: () => void
  onCancelAutoBid: () => Promise<void>
  isPauseLoading: boolean
  isResumeLoading: boolean
  isCancelLoading?: boolean

  // Price history
  priceHistory?: PriceHistoryPoint[]
  onExpandChart?: () => void

  // Eligibility / deposit
  qualificationStatus?: string
  depositStatus?: string
  depositAmount?: number
  onDeposit: () => void
  depositLoading: boolean

  // Buy now
  onBuyNowClick: () => void
  isBuyNowLoading: boolean

  // Checkout (winner)
  onCheckoutClick?: () => void

  // Winner order context (server-authoritative via AuctionDetailDto)
  currentBuyerOrder?: {
    orderId: string
    orderStatus: string
    canPayNow: boolean
  }
  onViewOrderClick?: (orderId: string) => void
  // True while the page is still polling for the winner order to materialize.
  isOrderProvisioning?: boolean
  // Manual retry when polling has timed out.
  onReloadOrder?: () => void

  // Countdown
  onCountdownEnd?: () => void
  serverTimeOffset?: number

  // Current user (for outcome detection)
  currentUserId?: string

  // Position-based bid state from server
  currentUserBidState?: {
    position: 'leading' | 'outbid' | 'won' | 'lost' | 'none'
    isCurrentWinner: boolean
    latestBidAmount?: number
    latestBidStatus?: string
  }

  isMobile: boolean
  isDesktop: boolean

  // Sealed bid
  auctionId?: string
  sealedBidInfo?: SealedBidInfoDto | null
}

// ── Component ────────────────────────────────────────────────────────

export function AuctionSidebar({
  auction,
  item,
  currentPrice,
  currency,
  minBid,
  bidIncrement,
  bidCount,
  watchCount,
  viewCount,
  endTime,
  walletBalance,
  insufficientBalance,
  bidAmount,
  onBidAmountChange,
  isActive,
  isScheduled,
  isTerminal,
  isSeller,
  qualState,
  hubConnected,
  outbid,
  auctionEnded,
  isWatching,
  onWatch,
  watchLoading,
  onPlaceBid,
  isPlacingBid,
  myAutoBid,
  onAutoBidClick,
  onPauseAutoBid,
  onResumeAutoBid,
  onModifyAutoBid,
  onCancelAutoBid,
  isPauseLoading,
  isResumeLoading,
  isCancelLoading,
  priceHistory,
  onExpandChart,
  qualificationStatus,
  depositStatus,
  depositAmount,
  onDeposit,
  depositLoading,
  onBuyNowClick,
  isBuyNowLoading,
  onCheckoutClick,
  currentBuyerOrder,
  onViewOrderClick,
  isOrderProvisioning,
  onReloadOrder,
  onCountdownEnd,
  serverTimeOffset = 0,
  currentUserId,
  currentUserBidState,
  isMobile: _isMobile,
  isDesktop,
  auctionId,
  sealedBidInfo,
}: AuctionSidebarProps) {
  const { t } = useTranslation('auction')

  const auctionAction = getAuctionAction(
    auction.status,
    qualState,
    isActive,
    isScheduled,
    isTerminal,
    { outbid, auctionEnded },
    currentUserId,
    t,
    currentUserBidState,
  )

  return (
    <>
      <div style={isDesktop ? { position: 'sticky', top: 24 } : undefined}>
        {/* 1. Price header — status badges, price, countdown, stats, watch */}
        <AuctionPriceHeader
          auction={auction}
          item={item}
          currentPrice={currentPrice}
          currency={currency}
          bidCount={bidCount}
          watchCount={watchCount}
          viewCount={viewCount}
          endTime={endTime}
          isActive={isActive}
          isScheduled={isScheduled}
          hubConnected={hubConnected}
          isWatching={isWatching}
          onWatch={onWatch}
          watchLoading={watchLoading}
          onCountdownEnd={onCountdownEnd}
          serverTimeOffset={serverTimeOffset}
        />

        {/* 1b. TERMINAL OUTCOME BLOCK — always rendered at TOP of read-only sidebar
              when auction is in a terminal state. Priority order (decision source):
                1. currentUserBidState.position (server-authoritative: won/lost/outbid)
                2. auctionAction.type (derived from status + hub.auctionEnded fallback)
              Generic "This auction has been sold" card only renders when NO
              user-specific state exists (anonymous or non-participant viewer). */}
        {isTerminal && (() => {
          const position = currentUserBidState?.position
          const finalPriceAmount = auctionEnded?.finalPrice ?? currentPrice
          const isUserWinner = position === 'won' || auctionAction.type === 'won'
          const isUserLoser = position === 'lost' || position === 'outbid' || auctionAction.type === 'lost'
          const isCancelled = auctionAction.type === 'cancelled' || auction.status === 'cancelled' || auction.status === 'Cancelled'

          if (isUserWinner) {
            return (
              <Card
                style={{
                  marginTop: 16,
                  borderColor: 'var(--color-success)',
                  background: 'rgba(74, 124, 89, 0.06)',
                }}
              >
                <Flex vertical gap={12} align="center">
                  <CheckCircleOutlined style={{ fontSize: 32, color: 'var(--color-success)' }} />
                  <Typography.Text strong style={{ color: 'var(--color-success)', fontSize: 16 }}>
                    {t('youWon', 'Bạn đã thắng')}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    {t('finalPrice', 'Giá cuối cùng')}: {formatCurrency(finalPriceAmount, currency)}
                  </Typography.Text>
                  {currentBuyerOrder?.canPayNow && onCheckoutClick && (
                    <Button
                      type="primary"
                      block
                      onClick={onCheckoutClick}
                      style={{
                        height: 48,
                        borderRadius: 8,
                        fontWeight: 500,
                        background: 'var(--color-success)',
                        borderColor: 'var(--color-success)',
                      }}
                    >
                      {t('completePayment', 'Hoàn tất thanh toán')}
                    </Button>
                  )}
                  {currentBuyerOrder && !currentBuyerOrder.canPayNow && onViewOrderClick && (
                    <Button
                      type="primary"
                      block
                      onClick={() => onViewOrderClick(currentBuyerOrder.orderId)}
                      style={{
                        height: 48,
                        borderRadius: 8,
                        fontWeight: 500,
                      }}
                    >
                      {t('viewOrder', 'View Order')}
                    </Button>
                  )}
                  {!currentBuyerOrder && isOrderProvisioning && (
                    <Button block disabled style={{ height: 48, borderRadius: 8 }}>
                      <Spin
                        size="small"
                        indicator={<LoadingOutlined spin style={{ marginRight: 8 }} />}
                      />
                      {t('orderBeingPrepared', 'Đang chuẩn bị đơn hàng...')}
                    </Button>
                  )}
                  {!currentBuyerOrder && !isOrderProvisioning && (
                    <Flex vertical gap={8} style={{ width: '100%' }}>
                      <Typography.Text
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: 13,
                          textAlign: 'center',
                        }}
                      >
                        {t('orderBeingCreated', 'Đơn hàng đang được tạo, vui lòng tải lại sau')}
                      </Typography.Text>
                      {onReloadOrder && (
                        <Button
                          block
                          icon={<ReloadOutlined />}
                          onClick={onReloadOrder}
                          style={{ height: 48, borderRadius: 8 }}
                        >
                          {t('reload', 'Tải lại')}
                        </Button>
                      )}
                    </Flex>
                  )}
                </Flex>
              </Card>
            )
          }

          if (isUserLoser) {
            return (
              <Card
                style={{
                  marginTop: 16,
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-surface)',
                }}
              >
                <Flex vertical gap={12} align="center">
                  <InfoCircleOutlined style={{ fontSize: 32, color: 'var(--color-text-secondary)' }} />
                  <Typography.Text strong style={{ fontSize: 16, textAlign: 'center' }}>
                    {t('youDidNotWin', 'Bạn không thắng')}
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {t('finalPrice', 'Giá cuối cùng')}: {formatCurrency(finalPriceAmount, currency)}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                    {t('depositRefund', 'Tiền cọc sẽ được hoàn về ví.')}
                  </Typography.Text>
                </Flex>
              </Card>
            )
          }

          if (isCancelled) {
            return (
              <Card
                style={{
                  marginTop: 16,
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-surface)',
                }}
              >
                <Flex vertical gap={8} align="center">
                  <InfoCircleOutlined style={{ fontSize: 28, color: 'var(--color-text-secondary)' }} />
                  <Typography.Text style={{ fontSize: 14, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    {t('auctionCancelled', 'Phiên đấu giá đã bị hủy.')}
                  </Typography.Text>
                </Flex>
              </Card>
            )
          }

          // Generic public-viewer fallback — no user-specific outcome available.
          return (
            <Card
              style={{
                marginTop: 16,
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-surface)',
              }}
            >
              <Flex vertical gap={8} align="center">
                <InfoCircleOutlined style={{ fontSize: 28, color: 'var(--color-text-secondary)' }} />
                <Typography.Text style={{ fontSize: 14, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  {auctionAction.message || t('auctionEndedGeneric', 'Phiên đấu giá đã kết thúc.')}
                </Typography.Text>
                {currentPrice > 0 && (bidCount ?? 0) > 0 && (
                  <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {t('finalPrice', 'Giá cuối cùng')}: {formatCurrency(currentPrice, currency)}
                  </Typography.Text>
                )}
              </Flex>
            </Card>
          )
        })()}

        {/* 2. Bid Form / Sealed Bid Panel */}
        {auction.auctionType === 'sealed' ? (
          /* Sealed auction: show SealedBidPanel instead of regular BidForm */
          (isActive || isTerminal) && isDesktop && auctionId ? (
            <SealedBidPanel
              auctionId={auctionId}
              currency={currency}
              minBid={minBid}
              bidIncrement={bidIncrement}
              isActive={isActive}
              isTerminal={isTerminal}
              sealedBidInfo={sealedBidInfo}
              isSeller={isSeller}
            />
          ) : null
        ) : (
          /* Regular auction: show BidForm when qualified & active */
          isActive && qualState === 'qualified' && isDesktop && (
            <>
              {currentUserBidState && currentUserBidState.position !== 'none' && (
                <BidderPositionBlock
                  position={currentUserBidState.position}
                  currency={currency}
                />
              )}
              <BidForm
                currentPrice={currentPrice}
                minBid={minBid}
                bidIncrement={bidIncrement}
                currency={currency}
                walletBalance={walletBalance}
                bidAmount={bidAmount}
                onBidAmountChange={onBidAmountChange}
                onPlaceBid={onPlaceBid}
                isPlacingBid={isPlacingBid}
                insufficientBalance={insufficientBalance}
                myAutoBid={myAutoBid}
                onAutoBidClick={onAutoBidClick}
                onPauseAutoBid={onPauseAutoBid}
                onResumeAutoBid={onResumeAutoBid}
                onModifyAutoBid={onModifyAutoBid}
                onCancelAutoBid={onCancelAutoBid}
                isPauseLoading={isPauseLoading}
                isResumeLoading={isResumeLoading}
                isCancelLoading={isCancelLoading}
                priceHistory={priceHistory}
                onExpandChart={onExpandChart}
              />
            </>
          )
        )}

        {/* 3. Eligibility Panel — hidden in terminal state (public read-only results view) */}
        <div style={{ marginTop: 20 }}>
          {!isTerminal && (
            <EligibilityPanel
              qualificationStatus={qualificationStatus}
              depositStatus={depositStatus}
              depositAmount={depositAmount ?? auction.startingPrice?.amount}
              currency={currency}
              walletBalance={walletBalance}
              qualificationStartAt={auction.qualificationStartAt}
              qualificationEndAt={auction.qualificationEndAt}
              isSeller={isSeller}
              onDeposit={onDeposit}
              depositLoading={depositLoading}
            />
          )}

          {/* 4. Buy Now — during qualification window (scheduled) OR while auction is active */}
          {!isTerminal && !isSeller && auction.buyNowPrice != null && !auction.isBuyNowReserved &&
           (isActive || (isScheduled && (qualState === 'window_open' || qualState === 'qualified'))) && (
            <>
              <div style={{ height: 1, background: 'var(--color-border-light)', margin: '12px 0' }} />
              <Button
                block
                icon={<ThunderboltOutlined />}
                onClick={onBuyNowClick}
                loading={isBuyNowLoading}
                disabled={isBuyNowLoading}
                style={{
                  height: 52,
                  borderRadius: 8,
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                }}
              >
                {`${t('buyNow', 'Buy Now')} — ${formatCurrency(auction.buyNowPrice?.amount ?? 0, currency)}`}
              </Button>
            </>
          )}
          {!isTerminal && !isSeller && (isScheduled || isActive) && auction.buyNowPrice != null && auction.isBuyNowReserved && (
            <>
              <div style={{ height: 1, background: 'var(--color-border-light)', margin: '12px 0' }} />
              <Button block disabled style={{ height: 44, borderRadius: 8 }}>
                {t('buyNowReserved', 'Buy Now Reserved')}
              </Button>
              {auction.buyNowReservedUntil && (
                <Typography.Text style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {t('buyNowReservedUntil', 'Reserved until')}: {formatDateTime(auction.buyNowReservedUntil)}
                </Typography.Text>
              )}
            </>
          )}
        </div>

        {/* 5. Outbid warning banner */}
        {outbid && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(196, 81, 61, 0.06)',
              border: '1px solid rgba(196, 81, 61, 0.15)',
            }}
          >
            <Typography.Text style={{ color: 'var(--color-danger)', fontWeight: 500 }}>
              {t('outbidWarning', 'You have been outbid!')}
              {(outbid.newHighAmount ?? outbid.newAmount) != null && !isNaN(outbid.newHighAmount ?? outbid.newAmount ?? NaN) && (
                <> {t('newPrice', 'New price')}: {formatCurrency(outbid.newHighAmount ?? outbid.newAmount ?? 0, currency)}</>
              )}
            </Typography.Text>
          </div>
        )}

        {/* 6. Auction ended banner */}
        {auctionEnded && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(74, 124, 89, 0.06)',
              border: '1px solid rgba(74, 124, 89, 0.15)',
            }}
          >
            <Typography.Text style={{ color: 'var(--color-success)', fontWeight: 500 }}>
              {t('auctionEnded', 'Auction has ended!')}
              {auctionEnded.winnerDisplayName && (
                <> {t('winner', 'Winner')}: {auctionEnded.winnerDisplayName} &mdash; {formatCurrency(auctionEnded.finalPrice, currency)}</>
              )}
            </Typography.Text>
          </div>
        )}

        {/* 7. Outcome sections (T013) — only for live SignalR transition.
              When isTerminal is already true, the top outcome block above has
              already rendered; skip these to avoid duplicate cards. */}
        {!isTerminal && auctionAction.type === 'won' && (
          <Card
            style={{
              marginTop: 16,
              borderColor: 'var(--color-success)',
              background: 'rgba(74, 124, 89, 0.06)',
            }}
          >
            <Flex vertical gap={12} align="center">
              <CheckCircleOutlined style={{ fontSize: 32, color: 'var(--color-success)' }} />
              <Typography.Text strong style={{ color: 'var(--color-success)', fontSize: 15 }}>
                {t('congratulations', 'Congratulations! You won this auction.')}
              </Typography.Text>
              {/* Final price: prefer SignalR payload, fall back to auction.currentPrice
                  (which equals final price once the auction is terminal). */}
              <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('finalPrice', 'Final price')}: {formatCurrency(auctionEnded?.finalPrice ?? currentPrice, currency)}
              </Typography.Text>
              <Button
                type="primary"
                block
                onClick={onCheckoutClick}
                style={{
                  height: 48,
                  borderRadius: 8,
                  fontWeight: 500,
                  background: 'var(--color-success)',
                  borderColor: 'var(--color-success)',
                }}
              >
                {t('completePayment', 'Complete Payment')}
              </Button>
            </Flex>
          </Card>
        )}

        {!isTerminal && auctionAction.type === 'lost' && (
          <Card
            style={{
              marginTop: 16,
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-surface)',
            }}
          >
            <Flex vertical gap={12} align="center">
              <InfoCircleOutlined style={{ fontSize: 32, color: 'var(--color-text-secondary)' }} />
              <Typography.Text style={{ fontSize: 14, textAlign: 'center' }}>
                {t('auctionLost', 'This auction has ended. You did not win.')}
              </Typography.Text>
              <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                {t('finalPrice', 'Final price')}: {formatCurrency(auctionEnded?.finalPrice ?? currentPrice, currency)}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('depositRefund', 'Your deposit will be refunded to your wallet.')}
              </Typography.Text>
              <Link to="/auctions">
                <Button
                  type="default"
                  style={{
                    borderRadius: 8,
                    fontWeight: 500,
                  }}
                >
                  {t('browseAuctions', 'Browse Auctions')}
                </Button>
              </Link>
            </Flex>
          </Card>
        )}

        {!isTerminal && auctionAction.type === 'ended' && (
          <Card
            style={{
              marginTop: 16,
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-surface)',
            }}
          >
            <Flex vertical gap={8} align="center">
              <InfoCircleOutlined style={{ fontSize: 28, color: 'var(--color-text-secondary)' }} />
              <Typography.Text style={{ fontSize: 14, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {auctionAction.message || t('endedNoSale', 'Auction ended without a sale.')}
              </Typography.Text>
              {/* Show final price for sold/ended terminal states so public viewers see the result. */}
              {isTerminal && currentPrice > 0 && (auction.status === 'sold' || auction.status === 'Sold' || (bidCount ?? 0) > 0) && (
                <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {t('finalPrice', 'Final price')}: {formatCurrency(currentPrice, currency)}
                </Typography.Text>
              )}
            </Flex>
          </Card>
        )}

        {false && auctionAction.type === 'cancelled' && isTerminal && (
          <Card
            style={{
              marginTop: 16,
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-surface)',
            }}
          >
            <Flex vertical gap={8} align="center">
              <InfoCircleOutlined style={{ fontSize: 28, color: 'var(--color-text-secondary)' }} />
              <Typography.Text style={{ fontSize: 14, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {t('auctionCancelled', 'This auction has been cancelled.')}
              </Typography.Text>
            </Flex>
          </Card>
        )}
      </div>
    </>
  )
}

export default AuctionSidebar
