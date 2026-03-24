import { useState } from 'react'
import { Typography, Row, Col, Empty, Spin, Pagination, Select, Space, Button, message } from 'antd'
import { HeartFilled, ShoppingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useWatchlist, useUnwatchAuction } from '@/features/auction/api'
import { AuctionCard } from '@/components/ui/AuctionCard'
import type { AuctionListItemDto } from '@/types'

type SortKey = 'endingSoon' | 'newest' | 'priceLow' | 'priceHigh'

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'priceLow', label: 'Price Low\u2192High' },
  { value: 'priceHigh', label: 'Price High\u2192Low' },
]

function sortItems(items: AuctionListItemDto[], sortKey: SortKey): AuctionListItemDto[] {
  const copy = [...items]
  switch (sortKey) {
    case 'endingSoon':
      return copy.sort((a, b) => new Date(a.endTime ?? '').getTime() - new Date(b.endTime ?? '').getTime())
    case 'newest':
      return copy.sort((a, b) => new Date(b.startTime ?? '').getTime() - new Date(a.startTime ?? '').getTime())
    case 'priceLow':
      return copy.sort((a, b) => a.currentPrice.amount - b.currentPrice.amount)
    case 'priceHigh':
      return copy.sort((a, b) => b.currentPrice.amount - a.currentPrice.amount)
    default:
      return copy
  }
}

export default function WatchlistPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [sortKey, setSortKey] = useState<SortKey>('endingSoon')

  const { data, isLoading } = useWatchlist({ pageNumber: page, pageSize })
  const unwatchMutation = useUnwatchAuction()

  const handleUnwatch = (auctionId: string) => {
    unwatchMutation.mutate(auctionId, {
      onSuccess: () => {
        message.success(t('removedFromWatchlist', 'Removed from watchlist'))
      },
    })
  }

  const sortedItems = data?.items ? sortItems(data.items, sortKey) : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('watchlist', 'Watchlist')}
        </Typography.Title>
        {sortedItems.length > 0 && (
          <Space>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {tc('sort.label', 'Sort by')}:
            </span>
            <Select
              value={sortKey}
              onChange={setSortKey}
              style={{ width: 180 }}
              options={SORT_OPTIONS}
            />
          </Space>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : !sortedItems.length ? (
        <Empty description={t('emptyWatchlist', 'Your watchlist is empty')}>
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/auctions')}
          >
            {t('browseAuctions', 'Browse Auctions')}
          </Button>
        </Empty>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {sortedItems.map((auction) => (
              <Col xs={24} sm={12} md={6} key={auction.id}>
                <div style={{ position: 'relative' }}>
                  <AuctionCard auction={auction} />
                  <button
                    type="button"
                    onClick={() => handleUnwatch(auction.id)}
                    disabled={unwatchMutation.isPending}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: 10,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(4px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 200ms ease, box-shadow 200ms ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                    }}
                    title={t('removeFromWatchlist', 'Remove from watchlist')}
                  >
                    <HeartFilled style={{ color: 'var(--color-accent, #c45)', fontSize: 16 }} />
                  </button>
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
              onChange={(p, ps) => {
                setPage(p)
                setPageSize(ps)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
