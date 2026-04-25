import { useState } from 'react'
import { Row, Col, Empty, Pagination, Select, Space, Button, Switch, Tooltip, App, Flex, Typography } from 'antd'
import { HeartFilled, ShoppingOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useWatchlist, useUnwatchAuction, useUpdateWatcherPreferences } from '@/features/auction/api'
import type { WatchlistItemDto } from '@/features/auction/api'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title, Text } = Typography

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

export default function WatchlistPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')

  const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
    { value: 'endingSoon', label: t('sort.endingSoon') },
    { value: 'newest', label: t('sort.newest') },
    { value: 'priceLow', label: t('sort.priceLow') },
    { value: 'priceHigh', label: t('sort.priceHigh') },
  ]
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [sortKey, setSortKey] = useState<SortKey>('endingSoon')

  const { data, isLoading } = useWatchlist({ pageNumber: page, pageSize })
  const unwatchMutation = useUnwatchAuction()
  const prefsMutation = useUpdateWatcherPreferences()

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
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '12px 16px 80px' : '0 24px 80px' }}>
      {/* Header */}
      <Flex
        justify="space-between"
        align={isMobile ? 'stretch' : 'flex-end'}
        vertical={isMobile}
        gap={isMobile ? 24 : 16}
        style={{ marginBottom: isMobile ? 32 : 40 }}
      >
        <div>
          <Title
            level={2}
            style={{
              fontFamily: SANS_FONT,
              fontWeight: 600,
              fontSize: isMobile ? 24 : 32,
              color: 'var(--color-text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <HeartFilled style={{ color: '#ef4444' }} />
            {t('watchlist', 'Watchlist')}
            {sortedItems.length > 0 && (
              <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>
                ({data?.metadata?.totalCount ?? sortedItems.length})
              </span>
            )}
          </Title>
          <Text style={{ fontSize: 16, color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
            {t('watchlistSubtitle', 'Items you are tracking for future bids')}
          </Text>
        </div>

        {sortedItems.length > 0 && (
          <Space size={8} direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }}>
            {!isMobile && (
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>{tc('action.filter', 'SORT BY')}:</Text>
            )}
            <Select
              value={sortKey}
              onChange={setSortKey}
              style={{ width: isMobile ? '100%' : 200, height: 40 }}
              options={SORT_OPTIONS}
              className="oio-select"
            />
          </Space>
        )}
      </Flex>

      {/* Loading grid */}
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
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              fontWeight: 600,
              height: 48,
              borderRadius: 12,
              padding: '0 32px'
            }}
          >
            {t('browseAuctions', 'Browse Auctions')}
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={isMobile ? [12, 12] : [24, 24]}>
            {sortedItems.map((item) => (
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
                  {/* Image Container */}
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: 16,
                      overflow: 'hidden',
                      aspectRatio: '1',
                      marginBottom: 16,
                      background: 'var(--color-bg-surface)',
                    }}
                  >
                    {item.primaryImageUrl ? (
                      <img
                        alt={item.itemTitle}
                        src={item.primaryImageUrl}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Flex align="center" justify="center" style={{ height: '100%', color: 'var(--color-text-tertiary)' }}>
                        <ShoppingOutlined style={{ fontSize: 32 }} />
                      </Flex>
                    )}

                    {/* Quick Unwatch */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleUnwatch(item.auctionId) }}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 16,
                        zIndex: 10,
                      }}
                    >
                      <HeartFilled />
                    </button>

                    {/* Status & Timer Overlays */}
                    <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                       <StatusBadge status={item.auctionStatus} size="small" />
                       {item.endTime && (
                         <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: MONO_FONT }}>
                           <CountdownTimer endTime={item.endTime} size="small" />
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Item Content */}
                  <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3
                      style={{
                        fontWeight: 600,
                        fontSize: isMobile ? 14 : 16,
                        marginBottom: 12,
                        color: 'var(--color-text-primary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                        fontFamily: SANS_FONT,
                        lineHeight: 1.4,
                        minHeight: isMobile ? '2.8em' : '2.8em'
                      }}
                    >
                      {item.itemTitle}
                    </h3>

                    <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                       <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                          {t('currentPrice', 'Current Price')}
                       </Text>
                       <div style={{ fontSize: isMobile ? 18 : 22, color: 'var(--color-accent)', fontWeight: 700, fontFamily: MONO_FONT, marginTop: 2 }}>
                          {formatCurrency(item.currentPrice?.amount ?? 0, item.currency)}
                       </div>
                    </div>

                    {/* Settings Divider — Only for active/scheduled */}
                    {!(item.auctionStatus === 'Ended' || item.auctionStatus === 'Sold' || item.auctionStatus === 'Failed' || item.auctionStatus === 'Cancelled' || item.auctionStatus === 'Terminated') && (
                      <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 16, paddingTop: 12 }}>
                         <Flex gap={16}>
                            <Tooltip title={t('notifyOnBid', 'Notify on bids')}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                  <BellOutlined style={{ fontSize: 14, color: item.notifyOnBid ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
                                  <Switch size="small" checked={item.notifyOnBid} onChange={(v) => handleToggleNotify(item, 'notifyOnBid', v)} />
                               </div>
                            </Tooltip>
                         </Flex>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            ))}
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