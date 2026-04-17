import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
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

// function getQualificationLabel(
//   auction: AuctionListItemDto,
// ): string | null {
//   const status = auction.status
//   if (status === AuctionStatus.Active) return 'Dang dien ra'
//   if (status === AuctionStatus.Scheduled) return 'Dang ky mo'
//   if (status === AuctionStatus.Ended || status === AuctionStatus.Sold) return 'Da ket thuc'
//   return null
// }

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isMobile } = useBreakpoint()
  const watchMutation = useWatchAuction()
  const unwatchMutation = useUnwatchAuction()
  const [watching, setWatching] = useState(false)

  const isActive = auction.status === AuctionStatus.Active
  const isAtStartingPrice = auction.currentPrice?.amount === auction.startingPrice?.amount

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
          aspectRatio: isMobile ? '16/10' : '4/5',
          marginBottom: isMobile ? 16 : 24,
          background: 'var(--color-bg-surface, #1f2937)',
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
          {auction.status === AuctionStatus.Scheduled && (
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
          <span
            style={{
              background: auction.auctionType === 'sealed' ? '#c026d3' : 'var(--color-accent, #3b82f6)',
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
            {auction.auctionType === 'sealed' ? t('browse.typeSealed') : t('browse.typeRegular')}
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
      <div style={{ padding: '0 8px' }}>
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
              {isAtStartingPrice ? t('startingAt') : t('currentBid')}
            </p>
            <div style={{ fontWeight: 700, color: 'var(--color-text-primary, #f3f4f6)' }}>
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
          {isActive ? t('bidNow').toUpperCase() : auction.status === AuctionStatus.Scheduled ? t('viewAuction').toUpperCase() : t('ended').toUpperCase()}
        </button>
      </div>
    </div>
  )
}