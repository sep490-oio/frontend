import { useState } from 'react'
import { Typography, Row, Col, Card, Button, Select, Spin, Empty, Flex, Pagination } from 'antd'
import { HistoryOutlined, ThunderboltOutlined, TrophyOutlined, LineChartOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyBids, useMyPendingWinnerOffers, useRespondRunnerUpOffer, useAuctionDetail } from '@/features/auction/api'
import { useUserHubStatus } from '@/features/user/contexts/UserHubContext'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { MyBidDto } from '@/features/auction/api'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { AuctionStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { WinnerOfferPanel } from '@/features/auction/components/WinnerOfferPanel'
import { MyBidPositionBadge, type MyBidPosition } from '@/features/auction/components/MyBidPositionBadge'
import { PriceHistoryChart } from '@/features/auction/components/PriceHistoryChart'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { useCurrentUser } from '@/features/user/api'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

interface StatusPill {
  value: string
  label: string
}

function AuctionCell({ bid }: { bid: MyBidDto }) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  
  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id
  
  // Fetch detailed data and subscribe to SignalR for real-time updates
  const { data: detailData, isLoading } = useAuctionDetail(bid.auctionId, userId)
  useAuctionHub(bid.auctionId, undefined, userId)
  
  const priceHistory = detailData?.priceHistory ?? []
  const auction = detailData?.auction
  const bidState = detailData?.currentUserBidState
  
  // Prefer real-time patched data from the cache, fallback to the initial list data
  const currentPriceAmount = auction?.currentPrice?.amount ?? bid.currentPrice.amount
  const currentPriceCurrency = auction?.currentPrice?.currency ?? bid.currentPrice.currency
  const position = bidState?.position ?? bid.position
  const auctionStatus = auction?.status ?? bid.auctionStatus
  const myLatestBidAmount = bidState?.latestBidAmount ?? bid.myLatestBidAmount.amount
  const myLatestBidCurrency = bid.myLatestBidAmount.currency
  const lastBidAt = bidState?.latestBidAt ?? bid.lastBidAt
  const bidCountForUser = bidState?.position ? Math.max(bid.bidCountForUser, bidState.position ? bid.bidCountForUser + (bidState.latestBidAt !== bid.lastBidAt ? 1 : 0) : bid.bidCountForUser) : bid.bidCountForUser
  const totalBidCount = auction?.bidCount ?? 0
  
  const isActive = auctionStatus === AuctionStatus.Active
  const isWon = position === 'won'
  
  const navState = {
    knownPosition: position,
    returnTo: '/me/bids',
    returnLabel: t('myBids', 'My Bids'),
  }

  return (
    <div 
      className="oio-press group"
      onClick={() => navigate(`/auctions/${bid.auctionId}`, { state: navState })}
      tabIndex={0}
      role="link"
      style={{ 
        background: 'var(--color-bg-card, #11141b)',
        border: '1px solid var(--color-border, rgba(255,255,255,0.05))',
        marginBottom: 16, 
        borderRadius: isMobile ? 16 : 24, 
        overflow: 'hidden', 
        padding: isMobile ? 10 : 16,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 16 : 24,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        outline: 'none',
        width: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent, rgba(59, 130, 246, 0.5))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.05))';
      }}
    >
      {/* Left: Image Block */}
      <div style={{
        position: 'relative',
        width: isMobile ? '100%' : 240,
        height: isMobile ? 240 : 'auto',
        minHeight: 200,
        borderRadius: isMobile ? 12 : 16,
        overflow: 'hidden',
        background: 'var(--color-bg-surface, #1f2937)',
        flexShrink: 0
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {bid.primaryImageUrl ? (
            <img 
              src={bid.primaryImageUrl} 
              alt={bid.itemTitle} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }} 
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--color-text-secondary)', fontSize: 13 }}>{t('noImage')}</div>
          )}
        </div>

        {/* Top Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, zIndex: 10 }}>
          {auctionStatus === AuctionStatus.Scheduled && (
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
          <MyBidPositionBadge position={position as MyBidPosition} label="" />
        </div>

        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <StatusBadge status={auctionStatus as AuctionStatus} />
        </div>
        
        {/* Timer Float */}
        {((isActive && auction?.endTime) || (auctionStatus === AuctionStatus.Scheduled && auction?.startTime)) && (
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

      {/* Middle: Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: isMobile ? '0 8px' : '8px 0' }}>
        <h3
          style={{
            fontWeight: 700,
            fontSize: 20,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--color-text-primary, #f3f4f6)',
          }}
        >
          {bid.itemTitle}
        </h3>
        <p style={{ color: 'var(--color-text-secondary, #6b7280)', fontSize: 12, marginBottom: 24 }}>
          {t('itemCode')}: #{bid.auctionId.slice(0, 6)}
        </p>

        <Flex gap={32} wrap="wrap" style={{ marginBottom: 24, flex: 1 }}>
          <div>
            <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-secondary, #6b7280)', margin: '0 0 2px 0' }}>
              {t('currentPrice', 'Current Price')}
            </p>
            <div style={{ fontFamily: MONO_FONT, fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              <PriceDisplay amount={currentPriceAmount} currency={currentPriceCurrency} />
            </div>
          </div>
          
          <div>
            <p style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-secondary, #6b7280)', margin: '0 0 2px 0' }}>
              {t('myLatestBid', 'My Bid')}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontFamily: MONO_FONT, fontSize: 20, fontWeight: 700, color: 'var(--color-accent, #3b82f6)' }}>
                <PriceDisplay amount={myLatestBidAmount} currency={myLatestBidCurrency} />
              </div>
              {isActive && (position === 'leading' || position === 'outbid') && (
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  color: position === 'leading' ? 'var(--color-success)' : 'var(--color-danger)',
                  background: position === 'leading' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.02em'
                }}>
                  {position === 'leading' ? t('bidStatusLeading', 'Leading') : t('bidStatusOutbid', 'Outbid')}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary, #9ca3af)', marginTop: 4, margin: 0 }}>
              {formatDateTime(lastBidAt)}
            </p>
          </div>
        </Flex>

        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isWon && bid.canPayNow && bid.orderId ? (
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/checkout/${bid.orderId}`) }}
                style={{
                  flex: 1,
                  background: '#B8860B',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  border: '1px solid #B8860B',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(184, 134, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <ThunderboltOutlined />
                {t('payNow', 'Pay Now')}
              </button>
            ) : isWon && bid.orderId ? (
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/me/orders/${bid.orderId}`) }}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                {t('viewOrder', 'View Order')}
              </button>
            ) : isActive ? (
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/auctions/${bid.auctionId}`, { state: navState }) }}
                style={{
                  flex: 1,
                  background: 'var(--color-accent, #3b82f6)',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  border: '1px solid var(--color-accent, #3b82f6)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <ThunderboltOutlined />
                {t('quickBid', 'Quick Bid').toUpperCase()}
              </button>
            ) : null}
            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/auctions/${bid.auctionId}`, { state: navState }) }}
              style={{
                flex: isActive || (isWon && bid.canPayNow) ? 'none' : 1,
                padding: '12px 24px',
                background: 'transparent',
                color: 'var(--color-text-secondary, #9ca3af)',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-light)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'var(--color-text-secondary, #9ca3af)';
              }}
            >
              {t('viewDetails', 'View Details').toUpperCase()}
            </button>
        </div>
      </div>

      {/* Right: Chart */}
      <div style={{ 
        flex: isMobile ? 'none' : 1.5,
        width: isMobile ? '100%' : 'auto', 
        borderLeft: isMobile ? 'none' : '1px solid var(--color-border, rgba(255,255,255,0.05))', 
        borderTop: isMobile ? '1px solid var(--color-border, rgba(255,255,255,0.05))' : 'none',
        padding: isMobile ? '16px 8px 0' : '8px 0 8px 24px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: isMobile ? 0 : 400
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontFamily: SANS_FONT, fontWeight: 600, color: 'var(--color-text-secondary, #9ca3af)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <LineChartOutlined style={{ marginRight: 8 }} />
            {t('priceHistory', 'Price History')}
          </span>
          <span style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-tertiary, #6b7280)', textTransform: 'uppercase', fontWeight: 600 }}>
            {totalBidCount > 1 ? `${totalBidCount} ${t('bidsLabel', 'bids')}` : `${totalBidCount} ${t('bidLabel', 'bid')}`}
          </span>
        </div>
        
        <div style={{ flex: 1, minHeight: 140, position: 'relative' }}>
          {isLoading ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
          ) : priceHistory.length > 0 ? (
            <PriceHistoryChart priceHistory={priceHistory} currency={currentPriceCurrency} mode="inline" />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary, #6b7280)', fontSize: 13 }}>
              {t('noPriceHistory', 'No price history available')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MyBidsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile, isTablet } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('LastBidAt Desc')
  const { connected } = useUserHubStatus()

  const params = statusFilter 
    ? { pageNumber: page, pageSize: Math.max(pageSize, 50), sortBy }
    : { pageNumber: page, pageSize, sortBy }

  const { data, isLoading } = useMyBids({
    ...params,
    ...(connected ? {} : { refetchInterval: 30000 }) as any,
  })

  const STATUS_PILLS: StatusPill[] = [
    { value: '', label: t('bidStatusAll', 'All') },
    { value: 'leading', label: t('bidStatusLeading', 'Leading') },
    { value: 'outbid', label: t('bidStatusOutbid', 'Outbid') },
    { value: 'won', label: t('bidStatusWon', 'Won') },
    { value: 'lost', label: t('bidStatusLost', 'Lost') },
  ]

  const { data: pendingOffers } = useMyPendingWinnerOffers()
  const respondMutation = useRespondRunnerUpOffer()

  const items = data?.items ?? []
  
  // Client-side filtering because backend MyBids may not support filtering by position
  const displayItems = statusFilter
    ? items.filter((bid) => bid.position === statusFilter)
    : items

  const totalCount = data?.metadata?.totalCount ?? 0
  const isNarrow = isMobile || isTablet

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: isMobile ? '0 0 80px' : isTablet ? '0 0 64px' : '0 24px 80px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 20 : 32 }}>
        <Typography.Title
          level={isMobile ? 3 : 2}
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          <HistoryOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
          {t('myBids', 'My Bids')}
        </Typography.Title>
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: isMobile ? 14 : 15,
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          {t('myBidsSubtitle', 'Track and manage your auction participation and performance')}
        </p>
      </div>

      {/* Pending Offers */}
      {pendingOffers && pendingOffers.length > 0 && (
        <div style={{ marginBottom: isMobile ? 20 : 28 }}>
          <Typography.Title
            level={4}
            style={{
              fontFamily: SANS_FONT,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 12,
              fontSize: isMobile ? 15 : undefined,
            }}
          >
            <TrophyOutlined style={{ marginRight: 8, color: 'var(--color-accent)' }} />
            {t('pendingOffers', 'Pending Offers')}
          </Typography.Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingOffers.map((offer) => (
              <WinnerOfferPanel
                key={offer.offerId}
                offer={offer as any}
                onAccept={(_offerId) =>
                  respondMutation.mutate(
                    { auctionId: offer.auctionId, accept: true },
                    {
                      onSuccess: (result) => {
                        const orderId = (result as any)?.orderId
                        if (orderId) {
                          navigate(`/checkout/${orderId}`)
                        } else {
                          navigate(`/auctions/${offer.auctionId}`)
                        }
                      },
                    },
                  )
                }
                onDecline={(_offerId) => respondMutation.mutate({ auctionId: offer.auctionId, accept: false })}
                isAcceptLoading={respondMutation.isPending}
                isDeclineLoading={respondMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter pills + sort */}
      <Flex
        align={isMobile ? 'flex-start' : 'center'}
        justify="space-between"
        vertical={isMobile}
        gap={isMobile ? 12 : 8}
        wrap={isNarrow ? undefined : 'wrap'}
        style={{ marginBottom: 20 }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            overflowX: isMobile ? 'auto' : undefined,
            scrollbarWidth: 'none',
            paddingBottom: isMobile ? 2 : 0,
          }}
        >
          {STATUS_PILLS.map((pill) => {
            const isActive = statusFilter === pill.value
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => {
                  setStatusFilter(pill.value)
                  setPage(1)
                }}
                style={{
                  padding: isMobile ? '6px 14px' : '6px 18px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: SANS_FONT,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: 34,
                  border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: isActive ? 'var(--color-accent)' : 'var(--color-bg-container)',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 200ms ease',
                  flexShrink: 0,
                }}
              >
                {pill.label}
              </button>
            )
          })}
        </div>

        <Select
          value={sortBy}
          onChange={(v) => { setSortBy(v); setPage(1) }}
          style={{ width: isMobile ? '100%' : 180, flexShrink: 0 }}
          options={[
            { value: 'LastBidAt Desc', label: t('sortNewest', 'Newest First') },
            { value: 'LastBidAt Asc', label: t('sortOldest', 'Oldest First') },
            { value: 'MyLatestBidAmount Desc', label: t('sortHighest', 'Highest Bid Amount') },
            { value: 'MyLatestBidAmount Asc', label: t('sortLowest', 'Lowest Bid Amount') },
          ]}
        />
      </Flex>

      {/* Content List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? 48 : 80 }}>
          <Spin size="large" />
        </div>
      ) : displayItems.length === 0 ? (
        <Empty
          description={t('noBidsYet', 'You have not participated in any auctions yet')}
          style={{ padding: isMobile ? '40px 0' : '60px 0' }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayItems.map((bid: MyBidDto) => (
            <AuctionCell key={bid.auctionId} bid={bid} />
          ))}
        </div>
      )}
      
      {displayItems.length > 0 && (
        <Flex justify="center" style={{ marginTop: 32 }}>
          <Pagination
            current={data?.metadata?.currentPage ?? page}
            pageSize={data?.metadata?.pageSize ?? pageSize}
            total={totalCount}
            showSizeChanger={!isMobile}
            showTotal={isMobile ? undefined : (total) => tc('pagination.total', { total })}
            size={isMobile ? 'small' : undefined}
            onChange={(p, ps) => {
              setPage(p)
              setPageSize(ps)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </Flex>
      )}
    </div>
  )
}