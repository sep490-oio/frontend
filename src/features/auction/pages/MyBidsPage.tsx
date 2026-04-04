import { useState } from 'react'
import { Typography, Row, Col, Card, Button, Select, Space, Pagination, Spin, Empty } from 'antd'
import { HistoryOutlined, EyeOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyBids, useMyPendingWinnerOffers, useRespondRunnerUpOffer } from '@/features/auction/api'
import { useUserHubStatus } from '@/features/user/contexts/UserHubContext'
import type { MyBidDto } from '@/features/auction/api'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { BidStatus, AuctionStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { WinnerOfferPanel } from '@/features/auction/components/WinnerOfferPanel'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

interface StatusPill {
  value: string
  label: string
}

// Status pills are built inside component for i18n access

export default function MyBidsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

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
    ...(connected ? {} : { refetchInterval: 30000 }) as any,
  })

  const STATUS_PILLS: StatusPill[] = [
    { value: '', label: t('bidStatusAll', 'All') },
    { value: 'active', label: t('bidStatusActive', 'Leading') },
    { value: 'outbid', label: t('bidStatusOutbid', 'Outbid') },
    { value: 'won', label: t('bidStatusWon', 'Won') },
    { value: 'cancelled', label: t('bidStatusCancelled', 'Cancelled') },
    { value: BidStatus.Winning, label: t('bidStatusWinning', 'Winning') },
  ]

  const { data: pendingOffers } = useMyPendingWinnerOffers()
  const respondMutation = useRespondRunnerUpOffer()

  const items = data?.items ?? []
  const totalCount = data?.metadata?.totalCount ?? 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Typography.Title
          level={2}
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          <HistoryOutlined style={{ marginRight: 10 }} />
          {t('myBids', 'My Bids')}
        </Typography.Title>
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          {t('myBidsSubtitle', 'Track and manage the auctions you have participated in')}
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
                offer={offer as any}
                onAccept={(_offerId) => respondMutation.mutate(
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
                  }
                )}
                onDecline={(_offerId) => respondMutation.mutate({ auctionId: offer.auctionId, accept: false })}
                isAcceptLoading={respondMutation.isPending}
                isDeclineLoading={respondMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter pills + sort */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <Space style={{ flexWrap: 'wrap' }}>
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
                }}
              >
                {pill.label}
              </button>
            )
          })}
        </Space>
        <Select
          value={sortBy}
          onChange={(v) => { setSortBy(v); setPage(1) }}
          style={{ width: 160 }}
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
        <Empty description={t('noBidsYet', 'You have not participated in any auctions yet')} />
      ) : (
        <>
          <Row gutter={[20, 20]}>
            {items.map((bid: MyBidDto) => (
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
                        fontFamily: MONO_FONT,
                        fontWeight: 500,
                      }}
                    >
                      {formatDateTime((bid as any).bidPlacedAt)}
                    </div>

                    {/* Status badge (top-right) */}
                    {(() => {
                      const isEnded = bid.auctionStatus === AuctionStatus.Ended || bid.auctionStatus === AuctionStatus.Sold
                      const isWon = isEnded && bid.isHighestBid
                      const isLost = isEnded && !bid.isHighestBid
                      let bg: string, color: string, border: string, label: string
                      if (isWon) {
                        bg = 'rgba(180, 140, 20, 0.12)'
                        color = '#B8860B'
                        border = '1px solid rgba(180, 140, 20, 0.3)'
                        label = t('bidWon', 'WON')
                      } else if (isLost) {
                        bg = 'rgba(100, 100, 100, 0.12)'
                        color = 'var(--color-text-secondary)'
                        border = '1px solid rgba(100, 100, 100, 0.25)'
                        label = t('bidLost', 'LOST')
                      } else if (bid.isHighestBid) {
                        bg = 'rgba(22, 163, 106, 0.12)'
                        color = 'var(--color-success)'
                        border = '1px solid rgba(22, 163, 106, 0.25)'
                        label = t('bidLeading', 'LEADING')
                      } else {
                        bg = 'rgba(220, 38, 38, 0.12)'
                        color = 'var(--color-danger)'
                        border = '1px solid rgba(220, 38, 38, 0.25)'
                        label = t('bidOutbid', 'OUTBID')
                      }
                      return (
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
                            background: bg,
                            color,
                            border,
                          }}
                        >
                          {label}
                        </span>
                      )
                    })()}
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
                      {(bid as any).itemTitle}
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
                        {(bid.auctionStatus === AuctionStatus.Ended || bid.auctionStatus === AuctionStatus.Sold)
                          ? t('finalPriceLabel', 'Final Price')
                          : t('currentPriceLabel', 'Current Price')}
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: MONO_FONT,
                        fontSize: 18,
                        fontWeight: 600,
                        color: 'var(--color-accent)',
                        marginBottom: 14,
                      }}
                    >
                      <PriceDisplay
                        amount={(bid as any).currentPrice?.amount ?? bid.amount.amount}
                        currency={(bid as any).currentPrice?.currency ?? bid.amount.currency}
                        size="small"
                      />
                    </div>

                    {/* Buttons */}
                    {(() => {
                      const isEnded = bid.auctionStatus === AuctionStatus.Ended || bid.auctionStatus === AuctionStatus.Sold
                      const isWon = isEnded && bid.isHighestBid
                      return (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {isWon ? (
                            <Button
                              type="primary"
                              icon={<TrophyOutlined />}
                              onClick={() => {
                                const orderId = (bid as any).orderId
                                if (orderId) {
                                  navigate(`/orders/${orderId}`)
                                } else {
                                  navigate(`/auctions/${bid.auctionId}`)
                                }
                              }}
                              style={{
                                flex: 1,
                                borderRadius: 8,
                                fontFamily: SANS_FONT,
                                fontWeight: 500,
                                fontSize: 13,
                                background: '#B8860B',
                                borderColor: '#B8860B',
                              }}
                            >
                              {(bid as any).orderId ? t('viewOrder', 'View Order') : t('payNow', 'Pay Now')}
                            </Button>
                          ) : !isEnded ? (
                            <Button
                              type="primary"
                              icon={<ThunderboltOutlined />}
                              onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                              style={{
                                flex: 1,
                                borderRadius: 8,
                                fontFamily: SANS_FONT,
                                fontWeight: 500,
                                fontSize: 13,
                                background: 'var(--color-accent)',
                                borderColor: 'var(--color-accent)',
                              }}
                            >
                              {t('quickBid', 'Quick Bid')}
                            </Button>
                          ) : null}
                          <Button
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                            style={{
                              flex: 1,
                              borderRadius: 8,
                              fontFamily: SANS_FONT,
                              fontWeight: 500,
                              fontSize: 13,
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {t('viewDetails', 'View Details')}
                          </Button>
                        </div>
                      )
                    })()}
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
