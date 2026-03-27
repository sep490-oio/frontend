import { useState } from 'react'
import { Row, Col, Empty, Pagination, Select, Space, Button, Switch, Tooltip, App } from 'antd'
import { HeartFilled, ShoppingOutlined, BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useWatchlist, useUnwatchAuction, useUpdateWatcherPreferences } from '@/features/auction/api'
import type { WatchlistItemDto } from '@/features/auction/api'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/format'

type SortKey = 'endingSoon' | 'newest' | 'priceLow' | 'priceHigh'

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'priceLow', label: 'Price Low→High' },
  { value: 'priceHigh', label: 'Price High→Low' },
]

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

const MONO_FONT = "'DM Mono', monospace"
const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export default function WatchlistPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: SERIF_FONT, fontWeight: 400, fontSize: 28, color: 'var(--color-text-primary)', margin: 0 }}>
          {t('watchlist', 'Watchlist')}
        </h1>
        {sortedItems.length > 0 && (
          <Space>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {tc('action.filter', 'Sort')}:
            </span>
            <Select value={sortKey} onChange={setSortKey} style={{ width: 180 }} options={SORT_OPTIONS} />
          </Space>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="oio-skeleton" style={{ aspectRatio: '3/4', borderRadius: 4 }} />
          ))}
        </div>
      ) : !sortedItems.length ? (
        <Empty description={t('emptyWatchlist', 'Your watchlist is empty')}>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/auctions')}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            {t('browseAuctions', 'Browse Auctions')}
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {sortedItems.map((item) => (
              <Col xs={24} sm={12} lg={6} key={item.auctionId}>
                <div
                  style={{
                    background: 'var(--color-bg-card)',
                    borderRadius: 4,
                    border: '1px solid var(--color-border-light)',
                    overflow: 'hidden',
                    transition: 'transform 200ms ease, box-shadow 200ms ease',
                  }}
                  className="oio-card-hover"
                >
                  {/* Image */}
                  <div
                    onClick={() => navigate(`/auctions/${item.auctionId}`)}
                    style={{ cursor: 'pointer', position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: 'var(--color-bg-surface)' }}
                    className="oio-image-zoom"
                  >
                    {item.primaryImageUrl ? (
                      <img
                        alt={item.itemTitle}
                        src={item.primaryImageUrl}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                        {t('noImage', 'No image')}
                      </div>
                    )}
                    {/* Unwatch button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleUnwatch(item.auctionId) }}
                      style={{
                        position: 'absolute', top: 8, right: 8, zIndex: 10,
                        width: 32, height: 32, borderRadius: '50%', border: 'none',
                        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                      }}
                      title={t('removeFromWatchlist', 'Remove')}
                    >
                      <HeartFilled style={{ color: 'var(--color-danger)', fontSize: 14 }} />
                    </button>
                    {/* Status */}
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <StatusBadge status={item.auctionStatus} size="small" />
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: 12 }}>
                    <div
                      onClick={() => navigate(`/auctions/${item.auctionId}`)}
                      style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {item.itemTitle}
                    </div>

                    <div style={{ fontFamily: MONO_FONT, fontSize: 16, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 4 }}>
                      {formatCurrency(item.currentPrice?.amount ?? 0, item.currency)}
                    </div>

                    {item.endTime && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                        <CountdownTimer endTime={item.endTime} size="small" />
                      </div>
                    )}

                    {/* Notification preferences */}
                    <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--color-border-light)', paddingTop: 8 }}>
                      <Tooltip title={t('notifyOnBid', 'Notify on new bids')}>
                        <Space size={4} style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          <BellOutlined style={{ fontSize: 12 }} />
                          <span>{t('bids', 'Bids')}</span>
                          <Switch
                            size="small"
                            checked={item.notifyOnBid}
                            onChange={(v) => handleToggleNotify(item, 'notifyOnBid', v)}
                            loading={prefsMutation.isPending}
                          />
                        </Space>
                      </Tooltip>
                      <Tooltip title={t('notifyOnEnd', 'Notify when auction ends')}>
                        <Space size={4} style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                          <BellOutlined style={{ fontSize: 12 }} />
                          <span>{t('endTime', 'End')}</span>
                          <Switch
                            size="small"
                            checked={item.notifyOnEnd}
                            onChange={(v) => handleToggleNotify(item, 'notifyOnEnd', v)}
                            loading={prefsMutation.isPending}
                          />
                        </Space>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={data?.metadata?.currentPage ?? page}
              pageSize={data?.metadata?.pageSize ?? pageSize}
              total={data?.metadata?.totalCount ?? 0}
              showSizeChanger
              showTotal={(total) => tc('pagination.total', { total })}
              onChange={(p, ps) => { setPage(p); setPageSize(ps) }}
            />
          </div>
        </>
      )}
    </div>
  )
}
