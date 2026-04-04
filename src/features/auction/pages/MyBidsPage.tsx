import { useState } from 'react'
import { Typography, Row, Col, Card, Button, Select, Pagination, Spin, Empty } from 'antd'
import { HistoryOutlined, EyeOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyBids, useMyPendingWinnerOffers, useRespondRunnerUpOffer } from '@/features/auction/api'
import { useUserHubStatus } from '@/features/user/contexts/UserHubContext'
import type { MyBidDto } from '@/features/auction/api'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { BidStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { WinnerOfferPanel } from '@/features/auction/components/WinnerOfferPanel'
import { useBreakpoint } from '@/hooks/useBreakpoint' //  responsive fix: import breakpoint hook

interface StatusPill {
  value: string
  label: string
}

const STATUS_PILLS: StatusPill[] = [
  { value: '', label: 'Tất cả' },
  { value: 'active', label: 'Đang dẫn đầu' },
  { value: 'outbid', label: 'Bị vượt giá' },
  { value: 'won', label: 'Đã thắng' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: BidStatus.Winning, label: 'Winning' },
]

const SANS_FONT = "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

export default function MyBidsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint() //  responsive fix

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('BidPlacedAt Desc')
  const { connected } = useUserHubStatus()

  const { data, isLoading } = useMyBids({
    pageNumber: page,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
    sortBy,
  }, connected ? undefined : { refetchInterval: 30000 })

  const { data: pendingOffers } = useMyPendingWinnerOffers()
  const respondMutation = useRespondRunnerUpOffer()

  const items = data?.items ?? []
  const totalCount = data?.metadata?.totalCount ?? 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 80px' : '24px 16px 80px' /*  responsive fix */ }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Typography.Title
          level={isMobile ? 3 : 2} //  responsive fix: smaller heading on mobile
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          <HistoryOutlined style={{ marginRight: 10 }} />
          Đấu giá của tôi
        </Typography.Title>
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          Theo dõi và quản lý các phiên đấu giá bạn đã tham gia
        </p>
      </div>

      {/* Pending Offers */}
      {pendingOffers && pendingOffers.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <Typography.Title
            level={4}
            style={{
              fontFamily: SANS_FONT,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: 12,
            }}
          >
            <TrophyOutlined style={{ marginRight: 8, color: 'var(--color-accent)' }} />
            {t('pendingOffers', 'Pending Offers')}
          </Typography.Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingOffers.map((offer) => (
              <WinnerOfferPanel
                key={offer.offerId}
                offer={offer}
                onAccept={() => respondMutation.mutate({ auctionId: offer.auctionId, accept: true })}
                onDecline={() => respondMutation.mutate({ auctionId: offer.auctionId, accept: false })}
                isAcceptLoading={respondMutation.isPending}
                isDeclineLoading={respondMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter pills + sort —  responsive fix: stack on mobile */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row', //  responsive fix
        gap: 12,
        marginBottom: 24,
      }}>
        {/*  responsive fix: horizontal scroll for pills on mobile */}
        <div style={{
          display: 'flex',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          gap: 8,
          flex: 1,
          overflowX: isMobile ? 'auto' : 'visible',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: isMobile ? 4 : 0,
          scrollbarWidth: 'none',
          width: '100%',
        }}>
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
                  padding: '6px 18px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: SANS_FONT,
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                  background: isActive ? 'var(--color-accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  transition: 'all 200ms ease',
                  flexShrink: 0, //  responsive fix
                  whiteSpace: 'nowrap',
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
          style={{ width: isMobile ? '100%' : 160 }} //  responsive fix: full width on mobile
          options={[
            { value: 'BidPlacedAt Desc', label: t('sortNewest', 'Newest') },
            { value: 'BidPlacedAt Asc', label: t('sortOldest', 'Oldest') },
            { value: 'Amount Desc', label: t('sortHighest', 'Highest') },
            { value: 'Amount Asc', label: t('sortLowest', 'Lowest') },
          ]}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : items.length === 0 ? (
        <Empty description={t('noBids', 'Bạn chưa tham gia đấu giá nào')} />
      ) : (
        <>
          <Row gutter={[16, 16]}> {/*  responsive fix: reduced gutter on mobile */}
            {items.map((bid: MyBidDto) => (
              //  responsive fix: xs={24} full width on mobile, sm={12} 2-col on tablet
              <Col key={bid.id} xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-light)',
                    transition: 'box-shadow 200ms ease',
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  {/* Image area */}
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '16 / 10',
                      background: 'var(--color-bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Placeholder */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-tertiary)',
                        fontSize: 13,
                        fontFamily: SANS_FONT,
                        gap: 4,
                      }}
                    >
                      <HistoryOutlined style={{ fontSize: 28, opacity: 0.4 }} />
                      <span>LOT {bid.auctionId.slice(0, 6).toUpperCase()}</span>
                    </div>

                    {/* Countdown overlay (bottom-left) */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 500,
                      }}
                    >
                      {formatDateTime(bid.bidPlacedAt ?? bid.createdAt)}
                    </div>

                    {/* Status badge (top-right) */}
                    <span
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        padding: '3px 10px',
                        borderRadius: 100,
                        fontSize: 10,
                        fontWeight: 700,
                        fontFamily: SANS_FONT,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: bid.isHighestBid
                          ? 'rgba(22, 163, 106, 0.12)'
                          : 'rgba(220, 38, 38, 0.12)',
                        color: bid.isHighestBid
                          ? '#16a34a'
                          : '#dc2626',
                        border: bid.isHighestBid
                          ? '1px solid rgba(22, 163, 106, 0.25)'
                          : '1px solid rgba(220, 38, 38, 0.25)',
                      }}
                    >
                      {bid.isHighestBid ? 'ĐANG DẪN ĐẦU' : 'BỊ VƯỢT GIÁ'}
                    </span>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px 16px' }}>
                    {/* Auction title */}
                    <h4
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 8px',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {bid.itemTitle}
                    </h4>

                    {/* Price */}
                    <div style={{ marginBottom: 4 }}>
                      <span
                        style={{
                          fontFamily: SANS_FONT,
                          fontSize: 11,
                          color: 'var(--color-text-tertiary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Giá hiện tại
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 18,
                        fontWeight: 600,
                        color: 'var(--color-accent)',
                        marginBottom: 14,
                      }}
                    >
                      <PriceDisplay
                        amount={bid.currentPrice?.amount ?? bid.amount.amount}
                        currency={bid.currentPrice?.currency ?? bid.amount.currency}
                        size="small"
                      />
                    </div>

                    {/* Buttons —  responsive fix: full width stacked on mobile */}
                    <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                        style={{
                          flex: isMobile ? 'unset' : '1 1 100px',
                          width: isMobile ? '100%' : undefined, //  responsive fix
                          borderRadius: 8,
                          fontFamily: SANS_FONT,
                          fontWeight: 500,
                          fontSize: 13,
                          background: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                        }}
                      >
                        Đặt giá nhanh
                      </Button>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                        style={{
                          flex: isMobile ? 'unset' : '1 1 100px',
                          width: isMobile ? '100%' : undefined, //  responsive fix
                          borderRadius: 8,
                          fontFamily: SANS_FONT,
                          fontWeight: 500,
                          fontSize: 13,
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <Pagination
              current={data?.metadata?.currentPage ?? page}
              pageSize={data?.metadata?.pageSize ?? pageSize}
              total={totalCount}
              showSizeChanger={!isMobile} //  responsive fix: hide sizeChanger on mobile
              showTotal={isMobile ? undefined : (total) => tc('pagination.total', { total })} //  responsive fix
              onChange={(p, ps) => {
                setPage(p)
                setPageSize(ps)
              }}
              size={isMobile ? 'small' : undefined} //  responsive fix
            />
          </div>
        </>
      )}
    </div>
  )
}