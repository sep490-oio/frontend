import { useState } from 'react'
import { Row, Col, Empty, Pagination, Select, Space, Button, Switch, Tooltip, App, Flex } from 'antd'
import { HeartFilled, ShoppingOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useWatchlist, useUnwatchAuction, useUpdateWatcherPreferences } from '@/features/auction/api'
import type { WatchlistItemDto } from '@/features/auction/api'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { MONO_FONT, SERIF_FONT } from '@/styles/tokens'

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
    <div style={{ padding: isMobile ? '0 0 64px' : 0 }}>
      {/* Header */}
      <Flex
        justify="space-between"
        align={isMobile ? 'flex-start' : 'center'}
        vertical={isMobile}
        gap={isMobile ? 12 : 0}
        style={{ marginBottom: isMobile ? 20 : 24 }}
      >
        <h1
          style={{
            fontFamily: SERIF_FONT,
            fontWeight: 400,
            fontSize: isMobile ? 22 : 28,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {t('watchlist', 'Watchlist')}
          {sortedItems.length > 0 && (
            <span
              style={{
                marginLeft: 10,
                fontSize: isMobile ? 13 : 14,
                fontWeight: 400,
                color: 'var(--color-text-secondary)',
                fontFamily: 'inherit',
              }}
            >
              ({data?.metadata?.totalCount ?? sortedItems.length})
            </span>
          )}
        </h1>

        {sortedItems.length > 0 && (
          <Space size={8}>
            {!isMobile && (
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {tc('action.filter', 'Sort')}:
              </span>
            )}
            <Select
              value={sortKey}
              onChange={setSortKey}
              style={{ width: isMobile ? '100%' : 170 }}
              options={SORT_OPTIONS}
              size={isMobile ? 'middle' : undefined}
            />
          </Space>
        )}
      </Flex>

      {/* Loading skeleton */}
      {isLoading ? (
        <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
          {[...Array(isMobile ? 4 : 6)].map((_, i) => (
            <Col key={i} xs={12} sm={12} md={8} lg={6}>
              <div className="oio-skeleton" style={{ aspectRatio: '3/4', borderRadius: 8 }} />
            </Col>
          ))}
        </Row>
      ) : !sortedItems.length ? (
        <Empty
          description={t('emptyWatchlist', 'Your watchlist is empty')}
          style={{ padding: isMobile ? '40px 0' : '60px 0' }}
        >
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            size={isMobile ? 'middle' : 'large'}
            onClick={() => navigate('/auctions')}
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              height: isMobile ? 44 : 40,
              borderRadius: 8,
            }}
          >
            {t('browseAuctions', 'Browse Auctions')}
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={[isMobile ? 10 : 16, isMobile ? 10 : 16]}>
            {sortedItems.map((item) => (
              <Col xs={12} sm={12} md={8} lg={6} key={item.auctionId}>
                <div
                  className="oio-press group"
                  onClick={() => navigate(`/auctions/${item.auctionId}`)}
                  style={{
                    cursor: 'pointer',
                    background: 'var(--color-bg-card, #11141b)',
                    border: '1px solid var(--color-border, rgba(255,255,255,0.05))',
                    borderRadius: isMobile ? 16 : 24,
                    padding: isMobile ? 10 : 16,
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent, rgba(59, 130, 246, 0.5))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.05))';
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: isMobile ? 12 : 16,
                      overflow: 'hidden',
                      aspectRatio: isMobile ? '16/10' : '4/5',
                      marginBottom: isMobile ? 16 : 24,
                      background: 'var(--color-bg-surface, #1f2937)',
                      flexShrink: 0,
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
                          height: '100%',
                          color: 'var(--color-text-secondary)',
                          fontSize: 12,
                        }}
                      >
                        {t('noImage', 'No image')}
                      </div>
                    )}

                    {/* Unwatch button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleUnwatch(item.auctionId) }}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0, 0, 0, 0.4)',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 16,
                        transition: 'all 200ms ease',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10,
                      }}
                      title={t('removeFromWatchlist', 'Remove')}
                    >
                      <HeartFilled />
                    </button>

                    {/* Status badge & Timer */}
                    <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                      <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                        <StatusBadge status={item.auctionStatus} size="small" />
                      </div>
                      {item.endTime && (
                        <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                          <CountdownTimer endTime={item.endTime} size="small" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div onClick={(e) => e.stopPropagation()} style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3
                      onClick={() => navigate(`/auctions/${item.auctionId}`)}
                      style={{
                        fontWeight: 700,
                        fontSize: isMobile ? 14 : 18,
                        marginBottom: 16,
                        color: 'var(--color-text-primary, #f3f4f6)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        margin: 0,
                      }}
                    >
                      {item.itemTitle}
                    </h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 0 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                          {t('currentPrice', 'Current Price')}
                        </div>
                        <div className="oio-price" style={{ fontSize: 16, color: 'var(--color-accent, #3494f8)', fontWeight: 700, fontFamily: MONO_FONT }}>
                          {formatCurrency(item.currentPrice?.amount ?? 0, item.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Notification prefs */}
                    <div
                      style={{
                        display: 'flex',
                        gap: isMobile ? 8 : 12,
                        borderTop: '1px solid var(--color-border, rgba(255,255,255,0.05))',
                        paddingTop: 16,
                        marginTop: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Tooltip title={t('notifyOnBid', 'Notify on new bids')}>
                        <div style={{ gap: 6, display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <BellOutlined style={{ fontSize: 12 }} />
                          <span>{t('bids', 'Bids')}</span>
                          <Switch
                            size="small"
                            checked={item.notifyOnBid}
                            onChange={(v) => handleToggleNotify(item, 'notifyOnBid', v)}
                            loading={prefsMutation.isPending}
                          />
                        </div>
                      </Tooltip>
                      <Tooltip title={t('notifyOnEnd', 'Notify when auction ends')}>
                        <div style={{ gap: 6, display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <BellOutlined style={{ fontSize: 12 }} />
                          <span>{t('endTime', 'End')}</span>
                          <Switch
                            size="small"
                            checked={item.notifyOnEnd}
                            onChange={(v) => handleToggleNotify(item, 'notifyOnEnd', v)}
                            loading={prefsMutation.isPending}
                          />
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <Flex justify="center" style={{ marginTop: isMobile ? 24 : 32 }}>
            <Pagination
              current={data?.metadata?.currentPage ?? page}
              pageSize={data?.metadata?.pageSize ?? pageSize}
              total={data?.metadata?.totalCount ?? 0}
              showSizeChanger={!isMobile}
              showTotal={isMobile ? undefined : (total) => tc('pagination.total', { total })}
              size={isMobile ? 'small' : undefined}
              onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
            />
          </Flex>
        </>
      )}
    </div>
  )
}