import { useState, useRef, useEffect, useMemo } from 'react'
import { Typography, Select, Spin, Empty, Flex, Pagination, Button, Tag } from 'antd'
import { HistoryOutlined, ThunderboltOutlined, TrophyOutlined, LineChartOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons'
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
import { useUserHub } from '@/features/auction/hooks/useUserHub'
import { useCurrentUser } from '@/features/user/api'
import { useNotifications } from '@/features/notification/api'
import { BidderPositionBlock } from '@/features/auction/components/BidderPositionBlock'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'


const { Title, Text } = Typography

interface StatusPill {
  value: string
  label: string
}

function AuctionCell({ bid }: { bid: MyBidDto }) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()
  const { isMobile, isTablet } = useBreakpoint()

  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id

  // Fetch detailed data and subscribe to SignalR for real-time updates
  const { data: detailData, isLoading } = useAuctionDetail(bid.auctionId, userId)
  useAuctionHub(bid.auctionId, undefined, userId)
  useUserHub(bid.auctionId, userId)

  const priceHistory = detailData?.priceHistory ?? []
  const auction = detailData?.auction
  const bidState = detailData?.currentUserBidState

  // Prefer real-time patched data from the cache, fallback to the initial list data
  const currentPriceAmount = auction?.currentPrice?.amount ?? bid.currentPrice?.amount
  const currentPriceCurrency = auction?.currentPrice?.currency ?? bid.currentPrice?.currency
  const position = bidState?.position ?? bid.position
  const auctionStatus = (auction?.status ?? bid.auctionStatus) as AuctionStatus
  const myLatestBidAmount = bidState?.latestBidAmount ?? bid.myLatestBidAmount?.amount
  const myLatestBidCurrency = bid.myLatestBidAmount?.currency
  const lastBidAt = bidState?.latestBidAt ?? bid.lastBidAt
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
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        padding: isMobile ? 12 : 20,
        display: 'flex',
        flexDirection: isMobile || isTablet ? 'column' : 'row',
        gap: isMobile ? 16 : 24,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Left: Image Block */}
      <div style={{
        position: 'relative',
        width: isMobile || isTablet ? '100%' : 240,
        height: isMobile ? 240 : isTablet ? 300 : 'auto',
        minHeight: isMobile ? 200 : 240,
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--color-bg-surface)',
        flexShrink: 0
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {bid.primaryImageUrl ? (
            <img
              src={bid.primaryImageUrl}
              alt={bid.itemTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
          <StatusBadge status={auctionStatus} size="small" />
        </div>

        {/* Timer Float */}
        {((isActive && (auction?.endTime || bid.auctionStatus)) || (auctionStatus === AuctionStatus.Scheduled && (auction?.startTime || bid.auctionStatus))) && (
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
            <div style={{ color: isActive ? 'var(--color-accent)' : '#fb923c', fontFamily: MONO_FONT, fontWeight: 700 }}>
              <CountdownTimer endTime={isActive ? (auction?.endTime ?? '') : (auction?.startTime ?? '')} size="small" />
            </div>
          </div>
        )}
      </div>

      {/* Middle: Details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 200, padding: isMobile ? '0 4px' : '4px 0' }}>
        <h3
          style={{
            fontWeight: 700,
            fontSize: isMobile ? 18 : 22,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--color-text-primary)',
            fontFamily: SANS_FONT
          }}
        >
          {bid.itemTitle}
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: isMobile ? 12 : 16 }}>
          {t('itemCode')}: <span style={{ fontFamily: MONO_FONT }}>#{bid.auctionId.slice(0, 6)}</span>
        </p>

        {isActive && (position === 'leading' || position === 'outbid') && (
          <div style={{ marginBottom: 16 }}>
            <BidderPositionBlock position={position as any} />
          </div>
        )}

        <Flex gap={isMobile ? 24 : 32} wrap="wrap" style={{ marginBottom: isMobile ? 24 : 32, flex: 1 }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
              {t('currentPrice', 'Current Price')}
            </p>
            <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 22 : 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              <PriceDisplay amount={currentPriceAmount ?? 0} currency={currentPriceCurrency ?? 'VND'} />
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', margin: '0 0 4px 0', letterSpacing: '0.05em' }}>
              {t('myLatestBid', 'My Bid')}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--color-accent)' }}>
                <PriceDisplay amount={myLatestBidAmount ?? 0} currency={myLatestBidCurrency ?? 'VND'} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4, margin: 0 }}>
              {formatDateTime(lastBidAt)}
            </p>
          </div>
        </Flex>

        {/* Spacer to push items apart if needed, or you can use justifyContent: space-between on the parent */}
        <div style={{ flex: 1 }} />
      </div>

      {/* Right: Chart */}
      {!isMobile && (
        <div style={{
          flex: isTablet ? 'none' : 1,
          width: isTablet ? '100%' : 'auto',
          borderLeft: isTablet ? 'none' : '1px solid var(--color-border)',
          borderTop: isTablet ? '1px solid var(--color-border)' : 'none',
          padding: isTablet ? '20px 0 0' : '8px 0 8px 32px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: isTablet ? 0 : 300
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontFamily: SANS_FONT, fontWeight: 600, color: 'var(--color-text-tertiary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <LineChartOutlined style={{ marginRight: 8, color: 'var(--color-accent)' }} />
              {t('priceHistory', 'Price History')}
            </span>
            <Tag style={{ borderRadius: 6, margin: 0, fontWeight: 600, background: 'var(--color-bg-surface)' }}>
              {totalBidCount} {t(totalBidCount > 1 ? 'bidsLabel' : 'bidLabel', 'bids')}
            </Tag>
          </div>

          <div style={{ flex: 1, minHeight: 160, position: 'relative', marginBottom: 20 }}>
            {isLoading ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
            ) : priceHistory.length > 0 ? (
              <PriceHistoryChart priceHistory={priceHistory} currency={currentPriceCurrency} mode="inline" />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                {t('noPriceHistory', 'No price history available')}
              </div>
            )}
          </div>

          {/* Buttons Moved Here (Desktop/Tablet) */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 'auto' }}>
            {isWon && bid.canPayNow && bid.orderId ? (
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/checkout/${bid.orderId}`) }}
                style={{
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  borderRadius: 12,
                  fontWeight: 600,
                  height: 44,
                  padding: '0 24px'
                }}
              >
                {t('payNow', 'Pay Now')}
              </Button>
            ) : isWon && bid.orderId ? (
              <Button
                size="large"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/me/orders/${bid.orderId}`) }}
                style={{
                  borderRadius: 12,
                  fontWeight: 600,
                  height: 44,
                  padding: '0 24px'
                }}
              >
                {t('viewOrder', 'View Order')}
              </Button>
            ) : isActive ? (
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/auctions/${bid.auctionId}`, { state: navState }) }}
                style={{
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  borderRadius: 12,
                  fontWeight: 600,
                  height: 44,
                  padding: '0 24px'
                }}
              >
                {t('quickBid', 'Quick Bid')}
              </Button>
            ) : null}
            <Button
              size="large"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/auctions/${bid.auctionId}`, { state: navState }) }}
              style={{
                borderRadius: 12,
                fontWeight: 600,
                height: 44,
                padding: '0 24px',
                color: 'var(--color-text-secondary)'
              }}
            >
              {t('viewDetails', 'View Details')}
            </Button>
          </div>
        </div>
      )}

      {/* Buttons for Mobile Only (since chart is hidden) */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isWon && bid.canPayNow && bid.orderId ? (
            <Button
              type="primary"
              size="large"
              block
              icon={<ThunderboltOutlined />}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/checkout/${bid.orderId}`) }}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                borderRadius: 12,
                fontWeight: 600,
                height: 48
              }}
            >
              {t('payNow', 'Pay Now')}
            </Button>
          ) : isWon && bid.orderId ? (
            <Button
              size="large"
              block
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/me/orders/${bid.orderId}`) }}
              style={{ borderRadius: 12, fontWeight: 600, height: 48 }}
            >
              {t('viewOrder', 'View Order')}
            </Button>
          ) : isActive ? (
            <Button
              type="primary"
              size="large"
              block
              icon={<ThunderboltOutlined />}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/auctions/${bid.auctionId}`, { state: navState }) }}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                borderRadius: 12,
                fontWeight: 600,
                height: 48
              }}
            >
              {t('quickBid', 'Quick Bid')}
            </Button>
          ) : null}
          <Button
            size="large"
            block
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/auctions/${bid.auctionId}`, { state: navState }) }}
            style={{ borderRadius: 12, fontWeight: 600, height: 48, color: 'var(--color-text-secondary)' }}
          >
            {t('viewDetails', 'View Details')}
          </Button>
        </div>
      )}
    </div>
  )
}

function RecentActivityLog({ localActivities = [] }: { localActivities?: any[] }) {
  const { t } = useTranslation(['auction', 'common'])
  const { data: notificationsData, isLoading } = useNotifications({ pageSize: 15 })
  const navigate = useNavigate()


  const notifications = notificationsData?.items ?? []

  // Merge local activities with server notifications, avoiding duplicates
  const allActivities = useMemo(() => {
    const merged = [...localActivities, ...notifications]
    // Simple deduplication: if a local activity has the same entityId and approximate timestamp as a notification
    // Or if they are identical (shouldn't happen with IDs)
    const unique = merged.reduce((acc: any[], curr) => {
      const exists = acc.find(a =>
        (a.id === curr.id) ||
        (a.entityId === curr.entityId && Math.abs(new Date(a.createdAt).getTime() - new Date(curr.createdAt).getTime()) < 5000)
      )
      if (!exists) acc.push(curr)
      return acc
    }, [])

    return unique
      .filter(n => n.entityType?.toLowerCase() === 'auction' || n.notificationType?.toLowerCase() === 'auction')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15)
  }, [notifications, localActivities])

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 24,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      height: 'fit-content',
      position: 'sticky',
      top: 'var(--navbar-offset-desktop)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Title level={4} style={{ margin: 0, fontFamily: SANS_FONT, fontSize: 18, fontWeight: 700 }}>
          <ClockCircleOutlined style={{ marginRight: 8, color: 'var(--color-accent)', fontSize: 16 }} />
          {t('auction:activityLog', 'Recent Activity')}
        </Title>
        <Button
          type="text"
          size="small"
          onClick={() => navigate('/me/notifications')}
          style={{ fontSize: 12, color: 'var(--color-accent)', padding: 0 }}
        >
          {t('common:action.viewAll')} <ArrowRightOutlined style={{ fontSize: 10 }} />
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading && allActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}><Spin size="small" /></div>
        ) : allActivities.length === 0 ? (
          <Text type="secondary" style={{ textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
            {t('common:notification.noNotifications')}
          </Text>
        ) : (
          allActivities.map((notif) => {
            const isOutbid = notif.eventType?.toLowerCase().includes('outbid') || notif.title.includes('vượt giá')
            return (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  gap: 12,
                  paddingBottom: 12,
                  borderBottom: '0px solid var(--color-border-light)',
                  cursor: notif.entityId ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (notif.entityId) {
                    navigate(`/auctions/${notif.entityId}`)
                  }
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: isOutbid ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: isOutbid ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--color-border-light)'
                }}>
                  {isOutbid ? (
                    <LineChartOutlined style={{ fontSize: 12, color: '#ef4444' }} />
                  ) : (
                    <ThunderboltOutlined style={{ fontSize: 12, color: 'var(--color-accent)' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8
                  }}>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {notif.title.replace('Đặt giá thành công: ', '').replace('Bid Success: ', '').replace('Bạn đã bị vượt giá!', t('bidStatusOutbid', 'Outbid'))}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: isOutbid ? '#ef4444' : 'var(--color-text-secondary)',
                    marginTop: 2,
                    lineHeight: 1.4
                  }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                    {formatDateTime(notif.createdAt)}
                  </div>
                </div>
              </div>
            )
          })
        )}
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

  // Real-time Activity Sync
  const [localActivities, setLocalActivities] = useState<any[]>([])
  const prevItemsRef = useRef<MyBidDto[]>([])

  useEffect(() => {
    const items = data?.items ?? []
    if (items.length > 0 && prevItemsRef.current.length > 0) {
      items.forEach(item => {
        const prevItem = prevItemsRef.current.find(p => p.auctionId === item.auctionId)
        if (prevItem) {
          // Detect Bid Success (Price increased)
          if (item.myLatestBidAmount > prevItem.myLatestBidAmount) {
            setLocalActivities(prev => [{
              id: `local-bid-${Date.now()}-${item.auctionId}`,
              title: item.itemTitle,
              message: t('bidSuccessMsg', 'Bạn đã đặt giá thành công: {{amount}}đ', { amount: item.myLatestBidAmount.toLocaleString() }),
              createdAt: new Date().toISOString(),
              eventType: 'AuctionBidSuccess',
              entityType: 'Auction',
              entityId: item.auctionId
            }, ...prev].slice(0, 5))
          }
          // Detect Outbid (Position changed to outbid)
          else if (item.position === 'outbid' && prevItem.position !== 'outbid') {
            setLocalActivities(prev => [{
              id: `local-outbid-${Date.now()}-${item.auctionId}`,
              title: item.itemTitle,
              message: t('outbidMsg', 'Bạn đã bị vượt giá!'),
              createdAt: new Date().toISOString(),
              eventType: 'AuctionOutbid',
              entityType: 'Auction',
              entityId: item.auctionId
            }, ...prev].slice(0, 5))
          }
          // Detect Won (Position changed to won)
          else if (item.position === 'won' && prevItem.position !== 'won') {
            setLocalActivities(prev => [{
              id: `local-won-${Date.now()}-${item.auctionId}`,
              title: item.itemTitle,
              message: t('wonMsg', 'Bạn đã thắng phiên đấu giá!'),
              createdAt: new Date().toISOString(),
              eventType: 'AuctionWon',
              entityType: 'Auction',
              entityId: item.auctionId
            }, ...prev].slice(0, 5))
          }
        }
      })
    }
    prevItemsRef.current = items
  }, [data?.items, t])

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

  return (
    <div
      style={{
        maxWidth: 1800,
        margin: '0 auto',
        padding: isMobile ? '24px 16px 80px' : '48px 32px 80px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <Title
          level={2}
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
        </Title>
        <Text style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
          {t('myBidsSubtitle', 'Track and manage your auction participation and performance')}
        </Text>
      </div>

      {/* Pending Offers */}
      {pendingOffers && pendingOffers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <Title
            level={4}
            style={{
              fontFamily: SANS_FONT,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 16,
              fontSize: 18,
            }}
          >
            <TrophyOutlined style={{ marginRight: 8, color: 'var(--color-accent)' }} />
            {t('pendingOffers', 'Pending Offers')}
          </Title>
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
        align={isMobile ? 'stretch' : 'center'}
        justify="space-between"
        vertical={isMobile}
        gap={isMobile ? 16 : 12}
        style={{ marginBottom: 24, flexWrap: 'wrap' }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: isMobile ? 4 : 0,
            msOverflowStyle: 'none'
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
                  padding: '8px 20px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: SANS_FONT,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: 38,
                  border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: isActive ? 'var(--color-accent)' : 'var(--color-bg-card)',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 0.2s ease',
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
          style={{ width: isMobile ? '100%' : 220, height: 40 }}
          className="oio-select"
          options={[
            { value: 'LastBidAt Desc', label: t('sortNewest', 'Newest First') },
            { value: 'LastBidAt Asc', label: t('sortOldest', 'Oldest First') },
            { value: 'MyLatestBidAmount Desc', label: t('sortHighest', 'Highest Bid Amount') },
            { value: 'MyLatestBidAmount Asc', label: t('sortLowest', 'Lowest Bid Amount') },
          ]}
        />
      </Flex>

      {/* Main Layout Split */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile || isTablet ? 'column' : 'row',
        gap: 32,
        alignItems: 'flex-start'
      }}>
        {/* Left Column (3/4): Bids List */}
        <div style={{ flex: 3, width: '100%', minWidth: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 80 }}>
              <Spin size="large" />
            </div>
          ) : displayItems.length === 0 ? (
            <Empty
              description={t('noBidsYet', 'You have not participated in any auctions yet')}
              style={{ padding: 80, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {displayItems.map((bid: MyBidDto) => (
                <AuctionCell key={bid.auctionId} bid={bid} />
              ))}
            </div>
          )}

          {displayItems.length > 0 && (
            <Flex justify="center" style={{ marginTop: 40 }}>
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

        {/* Right Column (1/3): Activity Log */}
        {!isMobile && (
          <div style={{ flex: 1, width: '100%', maxWidth: isTablet ? '100%' : 440 }}>
            <RecentActivityLog localActivities={localActivities} />
          </div>
        )}
      </div>

    </div>
  )
}
