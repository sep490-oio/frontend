import { useState, useEffect } from 'react'
import { App } from 'antd'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import { CountdownTimer } from './CountdownTimer'
import { PriceDisplay } from './PriceDisplay'
import { AuctionStatus } from '@/types/enums'
import type { AuctionListItemDto } from '@/types'
import { MONO_FONT } from '@/styles/tokens'
import { useAuth } from '@/hooks/useAuth'
import { useWatchAuction, useUnwatchAuction } from '@/features/auction/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface AuctionCardProps {
  auction: AuctionListItemDto
}

/** Colour families used by the terminal chip — mirrors StatusBadge variants. */
type TerminalChipVariant = 'solid-success' | 'solid-neutral' | 'solid-danger' | 'solid-warning'

interface TerminalChip {
  label: string
  variant: TerminalChipVariant
  /** When true, the card should render the final sale price prominently. */
  showFinalPrice: boolean
}

/**
 * Route terminal-state card chips by the auction's real status.
 * Replaces the old 5-way "ENDED" conflation on the CTA button.
 *
 * Exhaustive against `AuctionStatus`: adding a new member without handling
 * it here triggers a TS error at the `never` check below.
 */
function getTerminalChip(
  status: AuctionStatus,
  t: TFunction,
): TerminalChip | null {
  switch (status) {
    case AuctionStatus.Sold:
    case AuctionStatus.Completed:
      return { label: t('card.chipSold', 'Đã bán'), variant: 'solid-success', showFinalPrice: true }
    case AuctionStatus.Failed:
      return { label: t('card.chipFailed', 'Không bán được'), variant: 'solid-neutral', showFinalPrice: false }
    case AuctionStatus.Cancelled:
      return { label: t('card.chipCancelled', 'Đã hủy'), variant: 'solid-neutral', showFinalPrice: false }
    case AuctionStatus.Terminated:
      return { label: t('card.chipTerminated', 'Đã chấm dứt'), variant: 'solid-danger', showFinalPrice: false }
    case AuctionStatus.PaymentDefaulted:
      return { label: t('card.chipPaymentDefaulted', 'Người thắng không thanh toán'), variant: 'solid-warning', showFinalPrice: false }
    // Non-terminal / non-chip states — handled by other card UI (timer, CTA).
    case AuctionStatus.Draft:
    case AuctionStatus.Pending:
    case AuctionStatus.Approved:
    case AuctionStatus.Scheduled:
    case AuctionStatus.Active:
    case AuctionStatus.Ended:
      return null
    default: {
      // Exhaustiveness guard — adding a new AuctionStatus must be handled above.
      const _exhaustive: never = status
      void _exhaustive
      return null
    }
  }
}

const CHIP_STYLE: Record<TerminalChipVariant, { bg: string; color: string; border: string }> = {
  'solid-success': { bg: 'var(--color-success)', color: '#fff', border: 'var(--color-success)' },
  'solid-neutral': { bg: '#4b5563', color: '#fff', border: '#4b5563' },
  'solid-danger':  { bg: 'var(--color-danger)', color: '#fff', border: 'var(--color-danger)' },
  'solid-warning': { bg: '#f59e0b', color: '#fff', border: '#f59e0b' },
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isMobile } = useBreakpoint()
  const watchMutation = useWatchAuction()
  const unwatchMutation = useUnwatchAuction()
  const { message } = App.useApp()
  const [watching, setWatching] = useState(auction.isWatched ?? auction.hasWatched ?? false)

  useEffect(() => {
    const isWatched = auction.isWatched ?? auction.hasWatched
    if (isWatched !== undefined) {
      setWatching(isWatched)
    }
  }, [auction.isWatched, auction.hasWatched])

  const isActive = auction.status === AuctionStatus.Active
  const isScheduled = auction.status === AuctionStatus.Scheduled
  const terminalChip = getTerminalChip(auction.status, t)
  const isAtStartingPrice = auction.currentPrice?.amount === auction.startingPrice?.amount

  const handleWatchToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (watching) {
      setWatching(false)
      unwatchMutation.mutate(auction.id, {
        onSuccess: () => message.success(t('removedFromWatchlist', 'Removed from watchlist')),
        onError: (err) => {
          setWatching(true)
          const data = (err as { response?: { data?: any } })?.response?.data
          const detail = data?.detail ?? data?.title ?? data?.message ?? (err as Error)?.message
          message.error(detail ?? t('watchError', 'Failed to update watchlist'))
        }
      })
    } else {
      setWatching(true)
      watchMutation.mutate({ auctionId: auction.id }, {
        onSuccess: () => message.success(t('addedToWatchlist', 'Added to watchlist')),
        onError: (err) => {
          setWatching(false)
          const data = (err as { response?: { data?: any } })?.response?.data
          const detail = data?.detail ?? data?.title ?? data?.message ?? (err as Error)?.message
          message.error(detail ?? t('watchError', 'Failed to update watchlist'))
        }
      })
    }
  }

  return (
    <div
      className="oio-press group"
      onClick={() => navigate(`/auctions/${auction.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/auctions/${auction.id}`) } }}
      tabIndex={0}
      role="link"
      aria-label={`${auction.itemTitle} — ${auction.status}`}
      style={{
        cursor: 'pointer',
        background: 'var(--color-bg-card, #11141b)',
        border: '1px solid var(--color-border, rgba(255,255,255,0.05))',
        borderRadius: isMobile ? 16 : 24,
        padding: isMobile ? 10 : 16,
        transition: 'all 0.3s ease',
        outline: 'none',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent, rgba(59, 130, 246, 0.5))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.05))';
      }}
    >
      {/* Image Block */}
      <div
        style={{
          position: 'relative',
          borderRadius: isMobile ? 12 : 16,
          overflow: 'hidden',
          aspectRatio: '1/1',
          width: '100%',
          marginBottom: isMobile ? 16 : 24,
          background: 'var(--color-bg-surface, #1f2937)',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          {auction.primaryImageUrl ? (
            <img
              alt={auction.itemTitle}
              src={auction.primaryImageUrl}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.5s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
              }}
            >
              {t('noImage')}
            </div>
          )}
        </div>

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, zIndex: 10 }}>
          {isActive && (
            <span
              style={{
                background: 'var(--color-success)',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 100,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="animate-pulse" style={{ width: 6, height: 6, background: '#ffffff', borderRadius: '50%' }} />
              {t('statusTab.active')}
            </span>
          )}
          {isScheduled && (
            <span
              style={{
                background: '#f97316',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 100,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 6, height: 6, background: '#ffffff', borderRadius: '50%' }} />
              {t('statusTab.scheduled')}
            </span>
          )}
          {terminalChip && (
            <span
              data-testid={`card-chip-${auction.status}`}
              style={{
                background: CHIP_STYLE[terminalChip.variant].bg,
                color: CHIP_STYLE[terminalChip.variant].color,
                border: `1px solid ${CHIP_STYLE[terminalChip.variant].border}`,
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 12px',
                borderRadius: 100,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {terminalChip.label}
            </span>
          )}
          <span
            style={{
              background: auction.auctionType?.toLowerCase() === 'sealed' ? '#c026d3' : 'var(--color-accent, #3b82f6)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: 100,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {auction.auctionType?.toLowerCase() === 'sealed' ? t('browse.typeSealed', 'Kín') : t('browse.typeRegular', 'Thường')}
          </span>
        </div>

        {/* Watch button (top right) */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleWatchToggle}
            aria-label={watching ? t('unwatch') : t('watch')}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0, 0, 0, 0.4)',
              color: watching ? '#ef4444' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              transition: 'all 200ms ease',
              backdropFilter: 'blur(8px)',
            }}
          >
            {watching ? <HeartFilled /> : <HeartOutlined />}
          </button>
        )}

        {/* Timer Float */}
        {((isActive && auction.endTime) || (auction.status === AuctionStatus.Scheduled && auction.startTime)) && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: 8,
              borderRadius: 12,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>
              {isActive ? t('timeRemaining') : t('startsIn')}
            </p>
            <div style={{ color: isActive ? 'var(--color-accent, #3b82f6)' : '#fb923c', fontFamily: MONO_FONT, fontWeight: 700 }}>
              <CountdownTimer endTime={isActive ? auction.endTime! : auction.startTime!} size="small" />
            </div>
          </div>
        )}
      </div>

      {/* Details Block */}
      <div style={{ padding: '0 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3
          style={{
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--color-text-primary, #f3f4f6)',
          }}
        >
          {auction.itemTitle}
        </h3>
        <p style={{ color: 'var(--color-text-secondary, #6b7280)', fontSize: 12, marginBottom: 16 }}>
          {t('itemCode')}: #{auction.id.slice(0, 6)}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-secondary, #6b7280)', margin: '0 0 2px 0' }}>
              {terminalChip?.showFinalPrice
                ? t('card.finalPrice', 'Giá chốt')
                : isAtStartingPrice ? t('startingAt') : t('currentBid')}
            </p>
            <div
              data-testid={terminalChip?.showFinalPrice ? 'card-final-price' : undefined}
              style={{
                fontWeight: 700,
                color: terminalChip?.showFinalPrice
                  ? 'var(--color-success)'
                  : 'var(--color-text-primary, #f3f4f6)',
              }}
            >
              <PriceDisplay price={auction.currentPrice} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-secondary, #6b7280)', margin: '0 0 2px 0' }}>
              {t('bids')}
            </p>
            <p style={{ fontWeight: 700, margin: 0, color: 'var(--color-text-primary, #f3f4f6)' }}>
              {auction.bidCount}
            </p>
          </div>
        </div>

        <button
          style={{
            width: '100%',
            background: isActive ? 'var(--color-accent, #3b82f6)' : 'rgba(255,255,255,0.05)',
            color: isActive ? '#fff' : 'var(--color-text-secondary, #9ca3af)',
            padding: '12px 0',
            marginTop: 'auto',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            border: `1px solid ${isActive ? 'var(--color-accent, #3b82f6)' : 'var(--color-border, rgba(255,255,255,0.1))'}`,
            transition: 'all 0.3s ease',
            cursor: isActive || auction.status === AuctionStatus.Scheduled ? 'pointer' : 'not-allowed',
            boxShadow: isActive ? '0 10px 15px -3px rgba(59, 130, 246, 0.2)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (isActive) {
              e.currentTarget.style.opacity = '0.9';
            } else if (auction.status === AuctionStatus.Scheduled) {
              e.currentTarget.style.borderColor = 'var(--color-accent, #3b82f6)';
            }
          }}
          onMouseLeave={(e) => {
            if (isActive) {
              e.currentTarget.style.opacity = '1';
            } else {
              e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.1))';
            }
          }}
        >
          {isActive
            ? t('bidNow').toUpperCase()
            : isScheduled
              ? t('viewAuction').toUpperCase()
              : (terminalChip?.label ?? t('ended')).toUpperCase()}
        </button>
      </div>
    </div>
  )
}