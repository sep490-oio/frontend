import { Typography, Button, Flex, Card } from 'antd'
import { ThunderboltOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { PriceHistoryPoint } from '@/types'

import { AuctionPriceHeader } from '@/features/auction/components/AuctionPriceHeader'
import BidForm from '@/features/auction/components/BidForm'
import { BidderPositionBlock } from '@/features/auction/components/BidderPositionBlock'
import { EligibilityPanel } from '@/features/auction/components/EligibilityPanel'
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
  // Cancelled
  if (auctionStatus === 'Cancelled' || auctionStatus === 'cancelled') {
    return { type: 'cancelled', message: t('auctionCancelled', 'This auction has been cancelled.') }
  }

  // Ended states
  if (hub.auctionEnded) {
    if (!hub.auctionEnded.winnerId) {
      return { type: 'ended', message: t('auctionEndedNoSale', 'Auction ended without a sale.') }
    }
    if (currentUserId && hub.auctionEnded.winnerId === currentUserId) {
      return { type: 'won', message: t('congratulations', 'Congratulations! You won this auction.') }
    }
    return { type: 'lost', message: t('auctionLostMessage', 'This auction has ended. You did not win.') }
  }

  if (auctionStatus === 'Ended' || auctionStatus === 'ended') {
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
  onDepositWallet: () => void
  onDepositVnPay: () => void
  isWalletDepositLoading: boolean
  isVnPayDepositLoading: boolean

  // Buy now
  onBuyNowClick: () => void
  isBuyNowLoading: boolean

  // Checkout (winner)
  onCheckoutClick?: () => void

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
  onDepositWallet,
  onDepositVnPay,
  isWalletDepositLoading,
  isVnPayDepositLoading,
  onBuyNowClick,
  isBuyNowLoading,
  onCheckoutClick,
  onCountdownEnd,
  serverTimeOffset = 0,
  currentUserId,
  currentUserBidState,
  isMobile: _isMobile,
  isDesktop,
}: AuctionSidebarProps) {
  const { t } = useTranslation('auction')

  const auctionAction = getAuctionAction(
    auction.status,
    qualState,
    isActive,
    isScheduled,
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

        {/* 2. Bid Form — immediately after price, ALWAYS VISIBLE at top when qualified & active */}
        {isActive && qualState === 'qualified' && isDesktop && (
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
        )}

        {/* 3. Eligibility Panel */}
        <div style={{ marginTop: 20 }}>
          <EligibilityPanel
            qualificationStatus={qualificationStatus}
            depositStatus={depositStatus}
            depositAmount={depositAmount ?? auction.startingPrice?.amount}
            currency={currency}
            walletBalance={walletBalance}
            qualificationStartAt={auction.qualificationStartAt}
            qualificationEndAt={auction.qualificationEndAt}
            isSeller={isSeller}
            onDepositWallet={onDepositWallet}
            onDepositVnPay={onDepositVnPay}
            isWalletDepositLoading={isWalletDepositLoading}
            isVnPayDepositLoading={isVnPayDepositLoading}
          />

          {/* 4. Buy Now — only during qualification window & if configured */}
          {!isSeller && auction.buyNowPrice != null && (qualState === 'window_open' || qualState === 'qualified') && (
            <>
              <div style={{ height: 1, background: 'var(--color-border-light)', margin: '12px 0' }} />
              <Button
                block
                icon={<ThunderboltOutlined />}
                onClick={onBuyNowClick}
                loading={isBuyNowLoading}
                disabled={isBuyNowLoading || auction.isBuyNowReserved}
                style={{
                  height: 52,
                  borderRadius: 8,
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                }}
              >
                {auction.isBuyNowReserved
                  ? t('buyNowReserved', 'Buy Now Reserved')
                  : `${t('buyNow', 'Buy Now')} — ${formatCurrency(auction.buyNowPrice?.amount ?? 0, currency)}`}
              </Button>
              {auction.isBuyNowReserved && auction.buyNowReservedUntil && (
                <Typography.Text style={{ display: 'block', marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
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

        {/* 7. Outcome sections (T013) */}
        {auctionAction.type === 'won' && (
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
              {auctionEnded && (
                <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                  {t('finalPrice', 'Final price')}: {formatCurrency(auctionEnded.finalPrice, currency)}
                </Typography.Text>
              )}
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

        {auctionAction.type === 'lost' && (
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

        {auctionAction.type === 'ended' && (
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
                {t('endedNoSale', 'Auction ended without a sale.')}
              </Typography.Text>
            </Flex>
          </Card>
        )}
      </div>
    </>
  )
}

export default AuctionSidebar
