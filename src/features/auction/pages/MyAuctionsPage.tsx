import { useState } from 'react'
import { Typography, Select, Spin, Empty, Flex, Pagination, Button, Tag, Input, Tabs, Row, Col, App } from 'antd'
import { 
  HistoryOutlined, ThunderboltOutlined, TrophyOutlined, SafetyOutlined,
  HeartFilled, ShoppingOutlined, BellOutlined, SearchOutlined 
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { 
  useMyParticipations, useMyPendingWinnerOffers, useRespondRunnerUpOffer, useAuctionDetail,
  useWatchlist, useUnwatchAuction, useUpdateWatcherPreferences
} from '@/features/auction/auctionApi.ts'
import type { WatchlistItemDto } from '@/features/auction/auctionApi.ts'
import type { MyParticipationDto } from '@/types/auction'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { AuctionStatus } from '@/types/enums'
import { formatDateTime, formatCurrency } from '@/utils/format'
import { WinnerOfferPanel } from '@/features/auction/components/WinnerOfferPanel'
import { MyBidPositionBadge, type MyBidPosition } from '@/features/auction/components/MyBidPositionBadge'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { useUserHub } from '@/features/auction/hooks/useUserHub'
import { useDebounce } from '@/hooks/useDebounce'
import { useCurrentUser } from '@/features/user/api'
import { BidderPositionBlock } from '@/features/auction/components/BidderPositionBlock'
import { QuickBidModal } from '@/features/auction/components/QuickBidModal'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title, Text } = Typography

// ============================================================================
// MY BIDS COMPONENTS
// ============================================================================

function AuctionCell({ bid }: { bid: MyParticipationDto }) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id

  const hasBid = !!bid.bidPosition

  const { data: detailData, refetch } = useAuctionDetail(bid.auctionId, userId)
  useAuctionHub(bid.auctionId, undefined, userId)
  useUserHub(bid.auctionId, userId)

  const [bidModalOpen, setBidModalOpen] = useState(false)

  const auction = detailData?.auction
  const bidState = detailData?.currentUserBidState

  const currentPriceAmount = auction?.currentPrice?.amount ?? bid.currentPrice?.amount
  const currentPriceCurrency = auction?.currentPrice?.currency ?? bid.currentPrice?.currency
  const position = bidState?.position ?? bid.bidPosition
  const auctionStatus = (auction?.status ?? bid.auctionStatus) as AuctionStatus
  const myLatestBidAmount = bidState?.latestBidAmount ?? bid.myLatestBidAmount?.amount
  const myLatestBidCurrency = bid.myLatestBidAmount?.currency

  const isActive = auctionStatus === AuctionStatus.Active
  const isWon = position === 'won'
  const isOutbid = position === 'outbid'

  const navState = {
    knownPosition: position,
    returnTo: '/me/auctions',
    returnLabel: t('myAuctionActivity', 'My Auction Activity'),
  }

  return (
    <>
    <div
      className="oio-press group"
      onClick={() => navigate(`/auctions/${bid.auctionId}`, { state: navState })}
      tabIndex={0}
      role="link"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid rgba(0,0,0,0.03)', // Softer border
        marginBottom: 20, // Increased margin
        borderRadius: 28, // Softer corners
        overflow: 'hidden',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)', // Softer, more diffuse shadow
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{
        position: 'relative',
        width: isMobile ? '100%' : 260, // Slightly wider image
        height: isMobile ? 240 : 'auto',
        minHeight: 220,
        flexShrink: 0,
        background: isMobile ? 'var(--color-bg-surface)' : 'transparent',
        padding: isMobile ? 0 : 16, // Add padding around image on desktop
      }}>
        {bid.primaryImageUrl ? (
          <img
            src={bid.primaryImageUrl}
            alt={bid.itemTitle}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              display: 'block',
              borderRadius: isMobile ? '28px 28px 0 0' : 20 // Soft rounded image inside
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--color-text-secondary)', fontSize: 13, borderRadius: isMobile ? '28px 28px 0 0' : 20, background: 'var(--color-bg-layout)' }}>
            {t('noImage')}
          </div>
        )}
      </div>

      <div style={{ flex: 1, padding: isMobile ? '24px' : '32px 32px 32px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header: Title & Statuses */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Flex gap={10} align="center" wrap="wrap" style={{ marginBottom: 12 }}>
              <StatusBadge status={auctionStatus} size="small" />
              <MyBidPositionBadge position={position as MyBidPosition} label="" />
            </Flex>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--color-text-primary)', fontFamily: SANS_FONT, lineHeight: 1.3 }}>
              {bid.itemTitle}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', margin: 0, fontFamily: MONO_FONT, letterSpacing: '0.02em' }}>
              #{bid.auctionId.slice(0, 8).toUpperCase()}
            </p>
          </div>
          
          {/* Prominent Timer - Softer style */}
          <div style={{ 
            background: isActive ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)' : 'var(--color-bg-surface)', 
            padding: '14px 20px', 
            borderRadius: 20, // Softer corners
            minWidth: 160,
            textAlign: isMobile ? 'left' : 'right',
            border: 'none', // Remove border
          }}>
            {((isActive && (auction?.endTime || bid.auctionStatus)) || (auctionStatus === AuctionStatus.Scheduled && (auction?.startTime || bid.auctionStatus))) ? (
              <>
                <div style={{ fontSize: 12, color: isActive ? '#ef4444' : '#fb923c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {isActive ? t('endsIn', 'Ends in') : t('startsIn', 'Starts in')}
                </div>
                <div style={{ fontFamily: MONO_FONT, color: isActive ? '#ef4444' : '#fb923c', fontSize: 20, fontWeight: 700 }}>
                  <CountdownTimer endTime={isActive ? (auction?.endTime ?? '') : (auction?.startTime ?? '')} />
                </div>
              </>
            ) : auction?.endTime ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {t('endedOn', 'Ended on')}
                </div>
                <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {formatDateTime(auction.endTime)}
                </div>
              </>
            ) : <div />}
          </div>
        </div>

        {/* Pricing & Deposit - Softer block */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 24, 
          background: isOutbid ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)' : 'var(--color-bg-layout)', 
          border: 'none',
          padding: '20px 24px', 
          borderRadius: 20,
          alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontWeight: 600 }}>
              {t('currentPrice', 'Current Price')}
            </p>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: MONO_FONT }}>
              <PriceDisplay amount={currentPriceAmount ?? 0} currency={currentPriceCurrency ?? 'VND'} />
            </div>
          </div>

          {(myLatestBidAmount || 0) > 0 && (
            <>
              <div style={{ width: 1, height: 40, background: 'var(--color-border)', margin: '0 8px', opacity: 0.6 }} />
              <div>
                <p style={{ fontSize: 12, color: isOutbid ? '#d97706' : 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontWeight: 600 }}>
                  {t('myLatestBid', 'My Bid')}
                </p>
                <div style={{ 
                  fontSize: 24, 
                  fontWeight: 700, 
                  color: isOutbid ? '#d97706' : isWon ? '#22c55e' : 'var(--color-accent)',
                  fontFamily: MONO_FONT
                }}>
                  <PriceDisplay amount={myLatestBidAmount ?? 0} currency={myLatestBidCurrency ?? 'VND'} />
                </div>
              </div>
            </>
          )}

          <div style={{ marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : 'auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 100,
              background: bid.depositStatus === 'held' ? 'rgba(59,130,246,0.08)'
                : bid.depositStatus === 'returned' ? 'rgba(34,197,94,0.08)'
                : bid.depositStatus === 'forfeited' ? 'rgba(239,68,68,0.08)'
                : 'rgba(139,92,246,0.08)',
            }}>
              <SafetyOutlined style={{
                fontSize: 14,
                color: bid.depositStatus === 'held' ? '#3b82f6'
                  : bid.depositStatus === 'returned' ? '#22c55e'
                  : bid.depositStatus === 'forfeited' ? '#ef4444'
                  : '#8b5cf6',
              }} />
              <span style={{
                fontSize: 13, fontWeight: 700, fontFamily: SANS_FONT,
                letterSpacing: '0.02em',
                color: bid.depositStatus === 'held' ? '#3b82f6'
                  : bid.depositStatus === 'returned' ? '#22c55e'
                  : bid.depositStatus === 'forfeited' ? '#ef4444'
                  : '#8b5cf6',
              }}>
                {bid.depositStatus === 'held' ? t('depositHeld', 'Held')
                  : bid.depositStatus === 'returned' ? t('depositReturned', 'Refunded')
                  : bid.depositStatus === 'forfeited' ? t('depositForfeited', 'Forfeited')
                  : t('depositApplied', 'Applied')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
           <div style={{ alignSelf: isMobile ? 'flex-start' : 'center' }}>
              {isActive && hasBid && (position === 'leading' || position === 'outbid') && (
                <BidderPositionBlock position={position as any} />
              )}
              {!hasBid && isActive && (
                <Tag color="orange" style={{ fontSize: 13, fontWeight: 600, borderRadius: 100, padding: '6px 16px', margin: 0, border: 'none', background: 'rgba(245, 158, 11, 0.1)' }}>
                  {t('depositOnly', 'Deposit Only')} — {t('placeBid', 'Place a Bid')}!
                </Tag>
              )}
           </div>

           <div style={{ display: 'flex', gap: 12, width: isMobile ? '100%' : 'auto' }}>
              {isWon && bid.canPayNow && bid.orderId ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/checkout/${bid.orderId}`) }}
                  style={{ borderRadius: 100, fontWeight: 600, padding: '0 32px', height: 44, width: isMobile ? '100%' : 'auto', boxShadow: '0 4px 12px rgba(22, 119, 255, 0.2)' }}
                >
                  {t('payNow', 'Pay Now')}
                </Button>
              ) : isOutbid && isActive ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setBidModalOpen(true) }}
                  style={{ background: '#f59e0b', borderColor: '#f59e0b', borderRadius: 100, fontWeight: 600, padding: '0 32px', height: 44, width: isMobile ? '100%' : 'auto', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
                >
                  {t('bidAgain', 'Bid Again')}
                </Button>
              ) : (
                <Button
                  size="large"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/auctions/${bid.auctionId}`, { state: navState }) }}
                  style={{ borderRadius: 100, fontWeight: 600, color: 'var(--color-text-secondary)', padding: '0 32px', height: 44, width: isMobile ? '100%' : 'auto', border: 'none', background: 'var(--color-bg-layout)' }}
                >
                  {t('viewDetails', 'View Details')}
                </Button>
              )}
           </div>
        </div>
      </div>
    </div>
    <QuickBidModal 
      open={bidModalOpen} 
      onCancel={() => setBidModalOpen(false)} 
      detailData={detailData} 
      auctionId={bid.auctionId}
      onSuccess={() => refetch()}
    />
    </>
  )
}

function MyBidsTab() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('DepositedAt Desc')
  const [search, setSearch] = useState<string>('')
  const debouncedSearch = useDebounce(search, 300)

  const params = {
    pageNumber: page,
    pageSize,
    sortBy,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {})
  }

  const { data, isLoading } = useMyParticipations(params)
  const { data: pendingOffers } = useMyPendingWinnerOffers()
  const respondMutation = useRespondRunnerUpOffer()

  const STATUS_PILLS = [
    { value: '', label: t('bidStatusAll', 'All') },
    { value: 'active', label: t('bidStatusActive', 'Active') },
    { value: 'won', label: t('bidStatusWon', 'Won') },
    { value: 'lost', label: t('bidStatusLost', 'Lost') },
    { value: 'deposit_only', label: t('depositOnly', 'Deposit Only') },
  ]

  const displayItems = data?.items ?? []
  const totalCount = data?.metadata?.totalCount ?? 0

  return (
    <div>
      {/* Pending Offers */}
      {pendingOffers && pendingOffers.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <Title level={4} style={{ fontFamily: SANS_FONT, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16, fontSize: 18 }}>
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

      {/* Filters */}
      <Flex align={isMobile ? 'stretch' : 'center'} justify="space-between" vertical={isMobile} gap={16} style={{ marginBottom: 24 }}>
        <Flex gap={12} align="center" vertical={isMobile}>
          <Input
            placeholder={t('search', 'Search auctions...')}
            prefix={<SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            style={{ width: isMobile ? '100%' : 280, height: 44, borderRadius: 12 }}
            allowClear
          />
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1) }}
            style={{ width: isMobile ? '100%' : 160, height: 44 }}
            className="oio-select"
            options={STATUS_PILLS}
          />
        </Flex>

        <Select
          value={sortBy}
          onChange={(v) => { setSortBy(v); setPage(1) }}
          style={{ width: isMobile ? '100%' : 220, height: 44 }}
          className="oio-select"
          options={[
            { value: 'DepositedAt Desc', label: t('sortNewest', 'Newest First') },
            { value: 'DepositedAt Asc', label: t('sortOldest', 'Oldest First') },
          ]}
        />
      </Flex>

      {/* List */}
      <div>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
        ) : displayItems.length === 0 ? (
          <Empty
            description={t('noBidsYet', 'You have not participated in any auctions yet')}
            style={{ padding: 80, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {displayItems.map((bid: MyParticipationDto) => (
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
              onChange={(p, ps) => { setPage(p); setPageSize(ps); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          </Flex>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// WATCHLIST COMPONENTS
// ============================================================================

type SortKey = 'endingSoon' | 'newest' | 'priceLow' | 'priceHigh'

function sortItems(items: WatchlistItemDto[], sortKey: SortKey): WatchlistItemDto[] {
  const copy = [...items]
  switch (sortKey) {
    case 'endingSoon':
      return copy.sort((a, b) => new Date(a.endTime ?? '').getTime() - new Date(b.endTime ?? '').getTime())
    case 'newest':
      return copy.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
    case 'priceLow':
      return copy.sort((a, b) => (a.currentPrice?.amount ?? 0) - (b.currentPrice?.amount ?? 0))
    case 'priceHigh':
      return copy.sort((a, b) => (b.currentPrice?.amount ?? 0) - (a.currentPrice?.amount ?? 0))
    default:
      return copy
  }
}

function WatchlistTab() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [sortKey, setSortKey] = useState<SortKey>('endingSoon')

  const { data, isLoading } = useWatchlist({ pageNumber: page, pageSize })
  const unwatchMutation = useUnwatchAuction()
  const prefsMutation = useUpdateWatcherPreferences()

  const SORT_OPTIONS = [
    { value: 'endingSoon', label: t('sort.endingSoon', 'Ending Soon') },
    { value: 'newest', label: t('sort.newest', 'Recently Added') },
    { value: 'priceLow', label: t('sort.priceLow', 'Price: Low to High') },
    { value: 'priceHigh', label: t('sort.priceHigh', 'Price: High to Low') },
  ]

  const handleUnwatch = (auctionId: string) => {
    unwatchMutation.mutate(auctionId, {
      onSuccess: () => message.success(t('removedFromWatchlist', 'Removed from watchlist')),
    })
  }

  const handleToggleNotify = (item: WatchlistItemDto, field: 'notifyOnBid' | 'notifyOnEnd', value: boolean) => {
    prefsMutation.mutate({
      auctionId: item.auctionId,
      [field]: value,
    })
  }

  const sortedItems = data?.items ? sortItems(data.items, sortKey) : []

  return (
    <div>
      <Flex justify="flex-end" style={{ marginBottom: 24 }}>
        {sortedItems.length > 0 && (
          <Select
            value={sortKey}
            onChange={setSortKey}
            style={{ width: isMobile ? '100%' : 220, height: 44 }}
            options={SORT_OPTIONS}
            className="oio-select"
          />
        )}
      </Flex>

      {isLoading ? (
        <Row gutter={isMobile ? [12, 12] : [24, 24]}>
          {[...Array(isMobile ? 4 : 8)].map((_, i) => (
            <Col key={i} xs={12} sm={12} md={8} lg={6}>
              <div className="oio-skeleton" style={{ height: 360, borderRadius: 24 }} />
            </Col>
          ))}
        </Row>
      ) : sortedItems.length === 0 ? (
        <Empty
          description={t('emptyWatchlist', 'Your watchlist is empty')}
          style={{ padding: 80, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }}
        >
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            size="large"
            onClick={() => navigate('/auctions')}
            style={{ borderRadius: 12, fontWeight: 600, padding: '0 32px' }}
          >
            {t('browseAuctions', 'Browse Auctions')}
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={isMobile ? [12, 12] : [24, 24]}>
            {sortedItems.map((item) => {
              const isActive = item.auctionStatus === 'Active' || item.auctionStatus === 'active' || item.auctionStatus === AuctionStatus.Active
              
              return (
              <Col xs={12} sm={12} md={8} lg={6} key={item.auctionId}>
                <div
                  className="oio-press"
                  onClick={() => navigate(`/auctions/${item.auctionId}`)}
                  style={{
                    cursor: 'pointer',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 24,
                    padding: 12,
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '1', marginBottom: 16, background: 'var(--color-bg-surface)' }}>
                    {item.primaryImageUrl ? (
                      <img alt={item.itemTitle} src={item.primaryImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Flex align="center" justify="center" style={{ height: '100%', color: 'var(--color-text-tertiary)' }}>
                        <ShoppingOutlined style={{ fontSize: 32 }} />
                      </Flex>
                    )}

                    {/* Unwatch Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleUnwatch(item.auctionId) }}
                      style={{
                        position: 'absolute', top: 10, left: 10, width: 34, height: 34,
                        borderRadius: '50%', background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 16, zIndex: 10,
                      }}
                    >
                      <HeartFilled />
                    </button>

                    {/* Notify Toggle */}
                    {isActive && (
                      <div
                        onClick={(e) => { e.stopPropagation(); handleToggleNotify(item, 'notifyOnBid', !item.notifyOnBid) }}
                        style={{
                          position: 'absolute', top: 10, right: 10, width: 34, height: 34,
                          borderRadius: '50%', 
                          background: item.notifyOnBid ? 'var(--color-accent)' : 'rgba(0, 0, 0, 0.5)', 
                          backdropFilter: 'blur(8px)',
                          border: item.notifyOnBid ? '1px solid var(--color-accent)' : '1px solid rgba(255,255,255,0.1)', 
                          color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: 16, zIndex: 10,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <BellOutlined />
                      </div>
                    )}

                    {/* Status & Timer Overlays */}
                    <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                       <StatusBadge status={item.auctionStatus} size="small" />
                       {item.endTime && isActive && (
                         <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: MONO_FONT }}>
                           <CountdownTimer endTime={item.endTime} size="small" />
                         </div>
                       )}
                    </div>
                  </div>

                  <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontWeight: 600, fontSize: isMobile ? 14 : 16, marginBottom: 8, color: 'var(--color-text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, fontFamily: SANS_FONT, lineHeight: 1.4, minHeight: isMobile ? '2.8em' : '2.8em' }}>
                      {item.itemTitle}
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 12 }}>
                       <div>
                         <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                            {t('currentPrice', 'Current Price')}
                         </Text>
                         <div style={{ fontSize: isMobile ? 18 : 22, color: 'var(--color-text-primary)', fontWeight: 700, fontFamily: MONO_FONT, marginTop: 2 }}>
                            {formatCurrency(item.currentPrice?.amount ?? 0, item.currency)}
                         </div>
                       </div>
                       
                       <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, padding: '4px 8px', background: 'var(--color-bg-surface)', borderRadius: 6 }}>
                         {item.bidCount} {t('bids', 'bids')}
                       </div>
                    </div>
                    
                    <Button 
                      type={isActive ? "primary" : "default"}
                      onClick={(e) => { e.stopPropagation(); navigate(`/auctions/${item.auctionId}`) }}
                      style={{ width: '100%', marginTop: 16, borderRadius: 10, fontWeight: 600, height: 40 }}
                    >
                      {isActive ? t('placeBid', 'Place Bid') : t('viewDetails', 'View Details')}
                    </Button>

                  </div>
                </div>
              </Col>
            )})}
          </Row>

          <Flex justify="center" style={{ marginTop: 48 }}>
            <Pagination
              current={data?.metadata?.currentPage ?? page}
              pageSize={data?.metadata?.pageSize ?? pageSize}
              total={data?.metadata?.totalCount ?? 0}
              showSizeChanger={!isMobile}
              showTotal={isMobile ? undefined : (total) => tc('pagination.total', { total })}
              size={isMobile ? 'small' : undefined}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            />
          </Flex>
        </>
      )}
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function MyAuctionsPage() {
  const { t } = useTranslation('auction')
  const { isMobile } = useBreakpoint()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const activeTab = searchParams.get('tab') || 'bids'
  
  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key })
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '48px 32px 80px' }}>
      <div style={{ marginBottom: isMobile ? 24 : 32 }}>
        <Title level={2} style={{ fontFamily: SANS_FONT, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8, fontSize: isMobile ? 24 : 32 }}>
          {t('myAuctions', 'My Auctions')}
        </Title>
        <Text style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
          {t('myAuctionsSubtitle', 'Manage your bids, deposits, and tracked items in one place.')}
        </Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange}
        size="large"
        items={[
          {
            key: 'bids',
            label: (
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                <HistoryOutlined style={{ marginRight: 8 }} />
                {t('tab.myBids', 'My Bids')}
              </span>
            ),
            children: <MyBidsTab />
          },
          {
            key: 'watchlist',
            label: (
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                <HeartFilled style={{ marginRight: 8 }} />
                {t('tab.watchlist', 'Watchlist')}
              </span>
            ),
            children: <WatchlistTab />
          }
        ]}
      />
    </div>
  )
}
