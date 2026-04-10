import { useState } from 'react'
import { Typography, Row, Col, Card, Button, Select, Pagination, Spin, Empty, Flex } from 'antd'
import { HistoryOutlined, EyeOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMyBids, useMyPendingWinnerOffers, useRespondRunnerUpOffer } from '@/features/auction/api'
import { useUserHubStatus } from '@/features/user/contexts/UserHubContext'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { MyBidDto } from '@/features/auction/api'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { AuctionStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import { WinnerOfferPanel } from '@/features/auction/components/WinnerOfferPanel'
import { MyBidPositionBadge } from '@/features/auction/components/MyBidPositionBadge'
import type { MyBidPosition } from '@/features/auction/components/MyBidPositionBadge'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

interface StatusPill {
  value: string
  label: string
}

export default function MyBidsPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile, isTablet } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('LastBidAt Desc')
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
    { value: 'leading', label: t('bidStatusLeading', 'Leading') },
    { value: 'outbid', label: t('bidStatusOutbid', 'Outbid') },
    { value: 'won', label: t('bidStatusWon', 'Won') },
    { value: 'lost', label: t('bidStatusLost', 'Lost') },
  ]

  const { data: pendingOffers } = useMyPendingWinnerOffers()
  const respondMutation = useRespondRunnerUpOffer()

  const items = data?.items ?? []
  const totalCount = data?.metadata?.totalCount ?? 0
  const isNarrow = isMobile || isTablet

  return (
    <div
      style={{
        maxWidth: 1200,
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
            fontSize: isMobile ? 20 : undefined,
          }}
        >
          <HistoryOutlined style={{ marginRight: 10 }} />
          {t('myBids', 'My Bids')}
        </Typography.Title>
        <p
          style={{
            fontFamily: SANS_FONT,
            fontSize: isMobile ? 13 : 14,
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          {t('myBidsSubtitle', 'Track and manage the auctions you have participated in')}
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
        style={{ marginBottom: isMobile ? 16 : 24 }}
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
                  background: isActive ? 'var(--color-accent)' : 'transparent',
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
          style={{ width: isMobile ? '100%' : 160, flexShrink: 0 }}
          options={[
            { value: 'LastBidAt Desc', label: t('sortNewest', 'Newest') },
            { value: 'LastBidAt Asc', label: t('sortOldest', 'Oldest') },
            { value: 'MyLatestBidAmount Desc', label: t('sortHighest', 'Highest') },
            { value: 'MyLatestBidAmount Asc', label: t('sortLowest', 'Lowest') },
          ]}
        />
      </Flex>

      {/* Content */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: isMobile ? 48 : 80 }}>
          <Spin size="large" />
        </div>
      ) : items.length === 0 ? (
        <Empty
          description={t('noBidsYet', 'You have not participated in any auctions yet')}
          style={{ padding: isMobile ? '40px 0' : '60px 0' }}
        />
      ) : (
        <>
          <Row gutter={[isMobile ? 10 : 20, isMobile ? 10 : 20]}>
            {items.map((bid: MyBidDto) => (
              <Col key={bid.auctionId} xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-light)',
                    transition: 'box-shadow 200ms ease',
                    height: '100%',
                  }}
                  styles={{ body: { padding: 0 } }}
                >
                  {/* Image */}
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '16/9',
                      overflow: 'hidden',
                      background: 'var(--color-bg-surface)',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      navigate(`/auctions/${bid.auctionId}`, {
                        state: {
                          knownPosition: bid.position,
                          returnTo: '/me/bids',
                          returnLabel: t('myBids', 'My Bids'),
                        },
                      })
                    }
                  >
                    {bid.primaryImageUrl ? (
                      <img
                        src={bid.primaryImageUrl}
                        alt={bid.itemTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                        No image
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 8, left: 8 }}>
                      <MyBidPositionBadge position={bid.position as MyBidPosition} label={''}/>
                    </div>
                    <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.55)',
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: 11,
                          padding: '2px 8px',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {formatDateTime(bid.lastBidAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: isMobile ? '12px 14px' : '14px 16px' }}>
                    <h4
                      style={{
                        fontFamily: SANS_FONT,
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        marginBottom: 8,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {bid.itemTitle}
                    </h4>

                    {/* Prices row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginBottom: 12,
                        gap: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: SANS_FONT,
                            fontSize: 10,
                            color: 'var(--color-text-tertiary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 2,
                          }}
                        >
                          {bid.auctionStatus === AuctionStatus.Ended || bid.auctionStatus === AuctionStatus.Sold
                            ? t('finalPriceLabel', 'Final Price')
                            : t('currentPriceLabel', 'Current Price')}
                        </div>
                        <div
                          style={{
                            fontFamily: MONO_FONT,
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: 600,
                            color: 'var(--color-accent)',
                          }}
                        >
                          <PriceDisplay
                            amount={bid.currentPrice.amount}
                            currency={bid.currentPrice.currency}
                            size="small"
                          />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--color-text-tertiary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 2,
                          }}
                        >
                          {t('myBidLabel', 'My bid')}
                        </div>
                        <div style={{ fontSize: isMobile ? 12 : 13, color: 'var(--color-text-secondary)', fontFamily: SANS_FONT }}>
                          <PriceDisplay
                            amount={bid.myLatestBidAmount.amount}
                            currency={bid.myLatestBidAmount.currency}
                            size="small"
                          />
                          {bid.bidCountForUser > 1 && (
                            <span style={{ marginLeft: 4, opacity: 0.7 }}>
                              ({bid.bidCountForUser} {t('bids', 'bids')})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    {(() => {
                      const isActive = bid.auctionStatus === AuctionStatus.Active
                      const isWon = bid.position === 'won'
                      const navState = {
                        knownPosition: bid.position,
                        returnTo: '/me/bids',
                        returnLabel: t('myBids', 'My Bids'),
                      }
                      const goDetail = () => navigate(`/auctions/${bid.auctionId}`, { state: navState })
                      const btnStyle = {
                        borderRadius: 8,
                        fontFamily: SANS_FONT,
                        fontWeight: 500,
                        fontSize: 13,
                        height: 40,
                      }

                      if (isWon) {
                        if (bid.canPayNow && bid.orderId) {
                          return (
                            <Button
                              block
                              type="primary"
                              icon={<ThunderboltOutlined />}
                              onClick={() => navigate(`/checkout/${bid.orderId}`)}
                              style={{ ...btnStyle, background: '#B8860B', borderColor: '#B8860B' }}
                            >
                              {t('payNow', 'Pay Now')}
                            </Button>
                          )
                        }
                        if (bid.orderId) {
                          return (
                            <Button
                              block
                              type="primary"
                              icon={<EyeOutlined />}
                              onClick={() => navigate(`/me/orders/${bid.orderId}`)}
                              style={{ ...btnStyle, background: '#B8860B', borderColor: '#B8860B' }}
                            >
                              {t('viewOrder', 'View Order')}
                            </Button>
                          )
                        }
                        return (
                          <Button
                            block
                            type="primary"
                            icon={<TrophyOutlined />}
                            onClick={goDetail}
                            style={{ ...btnStyle, background: '#B8860B', borderColor: '#B8860B' }}
                          >
                            {t('viewAuction', 'View Auction')}
                          </Button>
                        )
                      }
                      if (isActive) {
                        return (
                          <Button
                            block
                            type="primary"
                            icon={<ThunderboltOutlined />}
                            onClick={goDetail}
                            style={{ ...btnStyle, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                          >
                            {t('quickBid', 'Quick Bid')}
                          </Button>
                        )
                      }
                      return (
                        <Button
                          block
                          icon={<EyeOutlined />}
                          onClick={goDetail}
                          style={{ ...btnStyle, borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                        >
                          {t('viewDetails', 'View Details')}
                        </Button>
                      )
                    })()}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <Flex justify="center" style={{ marginTop: isMobile ? 24 : 40 }}>
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
              }}
            />
          </Flex>
        </>
      )}
    </div>
  )
}