import { useState } from 'react'
import { Typography, Select, Spin, Empty, Flex, Pagination, Button, Input, Tabs, Row, Col, App } from 'antd'
import { 
  HistoryOutlined, TrophyOutlined,
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
import { formatCurrency } from '@/utils/format'
import { WinnerOfferPanel } from '@/features/auction/components/WinnerOfferPanel'
import { MyBidPositionBadge, type MyBidPosition } from '@/features/auction/components/MyBidPositionBadge'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { useUserHub } from '@/features/auction/hooks/useUserHub'
import { useDebounce } from '@/hooks/useDebounce'
import { useCurrentUser } from '@/features/user/api'
import { QuickBidModal } from '@/features/auction/components/QuickBidModal'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title } = Typography

// ============================================================================
// MY BIDS COMPONENTS
// ============================================================================

export function AuctionCell({ bid }: { bid: MyParticipationDto }) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()

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
        backgroundColor: 'var(--color-bg-container)',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.04)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        flexShrink: 0,
        overflow: 'hidden',
        background: 'var(--color-bg-surface)',
      }}>
        {bid.primaryImageUrl ? (
          <img
            src={bid.primaryImageUrl}
            alt={bid.itemTitle}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: 'var(--color-text-secondary)', fontSize: 13, background: 'var(--color-bg-layout)' }}>
            {t('noImage')}
          </div>
        )}

        {hasBid && (
          <MyBidPositionBadge 
            position={position as MyBidPosition} 
            label={
              position === 'won' ? t('bidStatusWon', 'Won')
              : position === 'leading' ? t('leading', 'Leading')
              : position === 'outbid' ? t('outbid', 'Outbid')
              : t('bidStatusLost', 'Lost')
            } 
          />
        )}

        {/* Status & Timer Overlays */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
           <StatusBadge status={auctionStatus} size="small" />
           {((isActive && (auction?.endTime || bid.auctionStatus)) || (auctionStatus === AuctionStatus.Scheduled && (auction?.startTime || bid.auctionStatus))) && (
             <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 8px', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: MONO_FONT }}>
               <CountdownTimer endTime={isActive ? (auction?.endTime ?? '') : (auction?.startTime ?? '')} size="small" />
             </div>
           )}
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)', fontFamily: SANS_FONT, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {bid.itemTitle}
        </h3>
        
        {/* Pricing Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
           <div>
             <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {t('currentPrice', 'Current Price')}
             </Typography.Text>
             <div style={{ fontSize: 16, color: 'var(--color-text-primary)', fontWeight: 700, fontFamily: MONO_FONT, marginTop: 2 }}>
                <PriceDisplay amount={currentPriceAmount ?? 0} currency={currentPriceCurrency ?? 'VND'} />
             </div>
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
             {/* Deposit Status Badge */}
             {bid.depositStatus && (
               <div style={{
                 display: 'inline-flex', alignItems: 'center',
                 padding: '2px 8px', borderRadius: 4,
                 background: bid.depositStatus === 'held' ? 'rgba(59,130,246,0.1)'
                   : bid.depositStatus === 'returned' ? 'rgba(34,197,94,0.1)'
                   : bid.depositStatus === 'forfeited' ? 'rgba(239,68,68,0.1)'
                   : 'rgba(139,92,246,0.1)',
                 border: `1px solid ${bid.depositStatus === 'held' ? 'rgba(59,130,246,0.2)'
                   : bid.depositStatus === 'returned' ? 'rgba(34,197,94,0.2)'
                   : bid.depositStatus === 'forfeited' ? 'rgba(239,68,68,0.2)'
                   : 'rgba(139,92,246,0.2)'}`,
               }}>
                 <span style={{
                   fontSize: 10, fontWeight: 700, fontFamily: SANS_FONT, textTransform: 'uppercase',
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
             )}

             {/* My Bid Amount */}
             {(myLatestBidAmount || 0) > 0 && (
               <div style={{ textAlign: 'right' }}>
                 <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: isOutbid ? '#d97706' : undefined, display: 'block', marginBottom: 2 }}>
                    {t('myLatestBid', 'My Bid')}
                 </Typography.Text>
                 <div style={{ fontSize: 16, color: isOutbid ? '#d97706' : isWon ? '#22c55e' : 'var(--color-accent)', fontWeight: 700, fontFamily: MONO_FONT }}>
                    <PriceDisplay amount={myLatestBidAmount ?? 0} currency={myLatestBidCurrency ?? 'VND'} />
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Action Bar (Only show if there are primary actions like Pay Now or Bid Again) */}
        {isWon && bid.canPayNow && bid.orderId ? (
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/checkout/${bid.orderId}`) }}
              style={{ borderRadius: 8, fontWeight: 600, width: '100%', height: 36 }}
            >
              {t('payNow', 'Pay Now')}
            </Button>
          </div>
        ) : isOutbid && isActive ? (
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setBidModalOpen(true) }}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', borderRadius: 8, fontWeight: 600, width: '100%', height: 36 }}
            >
              {t('bidAgain', 'Bid Again')}
            </Button>
          </div>
        ) : null}
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
            {pendingOffers.map((offer: any) => (
              <WinnerOfferPanel
                key={offer.offerId}
                offer={offer as any}
                onAccept={(_offerId) =>
                  respondMutation.mutate(
                    { auctionId: offer.auctionId, accept: true },
                    {
                      onSuccess: (result: any) => {
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
          <Row gutter={isMobile ? [12, 12] : [24, 24]}>
            {displayItems.map((bid: MyParticipationDto) => (
              <Col xs={12} sm={12} md={8} lg={6} key={bid.auctionId}>
                <AuctionCell bid={bid} />
              </Col>
            ))}
          </Row>
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
                         <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                            {t('currentPrice', 'Current Price')}
                         </Typography.Text>
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
        <Typography.Text style={{ fontSize: 16, color: 'var(--color-text-secondary)' }}>
          {t('myAuctionsSubtitle', 'Manage your bids, deposits, and tracked items in one place.')}
        </Typography.Text>
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
