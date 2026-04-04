import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import { CountdownTimer } from './CountdownTimer'
import { PriceDisplay } from './PriceDisplay'
import { AuctionStatus } from '@/types/enums'
import type { AuctionListItemDto } from '@/types'
import { SERIF_FONT, MONO_FONT } from '@/styles/tokens'
import { useAuth } from '@/hooks/useAuth'
import { useWatchAuction, useUnwatchAuction } from '@/features/auction/api'

interface AuctionCardProps {
  auction: AuctionListItemDto
}

function getQualificationLabel(
  auction: AuctionListItemDto,
): string | null {
  const status = auction.status
  if (status === AuctionStatus.Active) return 'Dang dien ra'
  if (status === AuctionStatus.Scheduled) return 'Dang ky mo'
  if (status === AuctionStatus.Ended || status === AuctionStatus.Sold) return 'Da ket thuc'
  return null
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const watchMutation = useWatchAuction()
  const unwatchMutation = useUnwatchAuction()
  const [watching, setWatching] = useState(false)

  const isActive = auction.status === AuctionStatus.Active
  const isAtStartingPrice = auction.currentPrice?.amount === auction.startingPrice?.amount

  const qualLabel = getQualificationLabel(auction)

  const handleWatchToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (watching) {
      setWatching(false)
      unwatchMutation.mutate(auction.id)
    } else {
      setWatching(true)
      watchMutation.mutate({ auctionId: auction.id })
    }
  }

  return (
    <div
      className="oio-card-hover oio-press"
      onClick={() => navigate(`/auctions/${auction.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/auctions/${auction.id}`) } }}
      tabIndex={0}
      role="link"
      aria-label={`${auction.itemTitle} — ${auction.status}`}
      style={{
        cursor: 'pointer',
        background: 'var(--color-bg-card)',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        outline: 'none',
      }}
    >
      {/* Image */}
      <div
        className="oio-image-zoom"
        style={{
          position: 'relative',
          aspectRatio: '4 / 5',
          overflow: 'hidden',
          borderRadius: 2,
          background: 'var(--color-bg-surface)',
        }}
      >
        {auction.primaryImageUrl ? (
          <img
            alt={auction.itemTitle}
            src={auction.primaryImageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
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
            {t('noImage', 'No image')}
          </div>
        )}

        {/* LIVE badge */}
        {isActive && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              borderRadius: 100,
              padding: '2px 8px',
              background: '#C4513D',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: '16px',
            }}
          >
            LIVE
          </span>
        )}

        {/* Auction type tag */}
        {auction.auctionType && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              right: auction.isFeatured ? 24 : 10,
              borderRadius: 100,
              padding: '2px 8px',
              background: auction.auctionType === 'sealed' ? 'rgba(139,115,85,0.85)' : 'rgba(0,0,0,0.5)',
              color: '#FFFFFF',
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: '16px',
            }}
          >
            {auction.auctionType === 'sealed' ? 'Sealed' : 'Regular'}
          </span>
        )}

        {/* Featured indicator */}
        {auction.isFeatured && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-accent)',
            }}
          />
        )}

        {/* Watch button */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleWatchToggle}
            aria-label={watching ? t('unwatch', 'Unwatch') : t('watch', 'Watch')}
            style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.45)',
              color: watching ? '#ff4d4f' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              transition: 'background 200ms ease, color 200ms ease',
              backdropFilter: 'blur(4px)',
            }}
          >
            {watching ? <HeartFilled /> : <HeartOutlined />}
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: 16 }}>
        {/* LOT number */}
        <div
          className="oio-label"
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-secondary)',
            marginBottom: 4,
          }}
        >
          LOT {auction.id.slice(0, 6).toUpperCase()}
        </div>

        {/* Title */}
        <div
          className="oio-serif"
          style={{
            fontFamily: SERIF_FONT,
            fontSize: 18,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 47,
            marginBottom: 12,
          }}
        >
          {auction.itemTitle}
        </div>

        {/* Current bid label */}
        <div
          className="oio-label"
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-secondary)',
            marginBottom: 2,
          }}
        >
          {isAtStartingPrice
            ? t('startingAt', 'STARTING AT')
            : t('currentBid', 'CURRENT BID')}
        </div>

        {/* Price */}
        <PriceDisplay price={auction.currentPrice} />

        {/* Buy Now price */}
        {auction.buyNowPrice != null && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              marginTop: 4,
            }}
          >
            {t('buyNowLabel', 'Buy Now')}: <span style={{ fontFamily: MONO_FONT, fontWeight: 500 }}>{auction.buyNowPrice.symbol ?? ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: auction.buyNowPrice.currency ?? 'VND', maximumFractionDigits: 0 }).format(auction.buyNowPrice.amount)}</span>
          </div>
        )}

        {/* Reserve status */}
        {auction.currentPrice?.amount !== auction.startingPrice?.amount && (
          <div style={{ fontSize: 11, marginTop: 2, color: 'var(--color-text-secondary)' }}>
            {/* We don't have isReserveMet on list DTO — show starting price for reference */}
            {t('from', 'From')} {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: auction.startingPrice?.currency ?? 'VND', maximumFractionDigits: 0 }).format(auction.startingPrice?.amount ?? 0)}
          </div>
        )}

        {/* Secondary info line: bid count + watch count */}
        <div
          style={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            marginTop: 6,
          }}
        >
          {auction.bidCount} {t('bidsLabel', 'bids')} &middot; {auction.watchCount} {t('watchingLabel', 'watching')}
        </div>

        {/* Qualification window status */}
        {qualLabel && (
          <div
            style={{
              fontSize: 11,
              color: isActive ? 'var(--color-success)' : 'var(--color-text-secondary)',
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            {qualLabel}
          </div>
        )}

        {/* Countdown */}
        {isActive && auction.endTime && (
          <div style={{ marginTop: 10 }}>
            <CountdownTimer endTime={auction.endTime} size="small" />
          </div>
        )}
      </div>
    </div>
  )
}
