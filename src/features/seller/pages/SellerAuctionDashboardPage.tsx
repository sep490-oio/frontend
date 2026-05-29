import { useParams, useNavigate } from 'react-router'
import { useState } from 'react'
import { Typography, Card, Row, Col, Space, Spin, Button, Statistic, Flex, Tag, Badge, Progress, Modal, Input, message } from 'antd'
import {
  ArrowLeftOutlined,
  DashboardOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { 
  useAuctionDetail,
  useSubmitAuction,
  useCancelAuction,
  useOfferRunnerUp,
  useCloseAuction,
  useProvisionWinnerOrder
} from '@/features/auction/auctionApi.ts'
import { PriceHistoryChart } from '@/features/auction/components/PriceHistoryChart'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'
import { ItemQA } from '@/features/item/components/ItemQA'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { useCurrentUser } from '@/features/user/api'
import { ParticipantsTable } from '@/features/auction/components/ParticipantsTable'
import { SellerActionBar } from '@/features/auction/components/SellerActionBar'
import { SetAuctionTimingModal } from '@/features/auction/components/SetAuctionTimingModal'

const { Title, Text } = Typography
const { Countdown } = Statistic

export default function SellerAuctionDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: currentUser } = useCurrentUser()
  const { data: detail, isLoading, error } = useAuctionDetail(id!)

  const { mutate: submitAuction, isPending: isSubmitLoading } = useSubmitAuction()
  const { mutate: cancelAuction, isPending: isCancelLoading } = useCancelAuction()
  const { mutate: offerRunnerUp, isPending: isOfferRunnerUpLoading } = useOfferRunnerUp()
  const { mutate: closeAuction, isPending: isCloseLoading } = useCloseAuction()
  const { mutate: provisionOrder, isPending: isProvisionOrderLoading } = useProvisionWinnerOrder()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const hub = useAuctionHub(detail?.auction?.id, detail?.item?.id, currentUser?.id)

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      message.error(tc('validation.required', 'Vui lòng nhập lý do'))
      return
    }
    cancelAuction(
      { auctionId: detail!.auction.id, reason: cancelReason },
      {
        onSuccess: () => {
          setIsCancelModalOpen(false)
          setCancelReason('')
          message.success(tc('success.saved', 'Thành công'))
        },
      }
    )
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 400 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (error || !detail) {
    return (
      <Flex vertical align="center" justify="center" style={{ minHeight: 400 }}>
        <Text type="danger">{tc('error.failedToLoad')}</Text>
        <Button onClick={() => { navigate(-1); }} style={{ marginTop: 16 }}>
          {tc('action.back')}
        </Button>
      </Flex>
    )
  }

  const { auction, item, recentBids, priceHistory } = detail

  const bidColumns = [
    {
      title: t('bidder', 'Bidder'),
      dataIndex: 'bidderDisplayName',
      key: 'bidder',
      render: (text: string) => {
        return (
          <Typography.Text strong ellipsis style={{ maxWidth: 120 }}>
            {text || 'Anonymous'}
          </Typography.Text>
        )
      },
    },
    {
      title: t('amount', 'Amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => formatCurrency(amount.amount, amount.currency),
    },
    {
      title: t('time', 'Time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('type', 'Type'),
      dataIndex: 'isAutoBid',
      key: 'type',
      render: (isAuto: boolean) => (
        <Tag color={isAuto ? 'blue' : 'orange'}>
          {isAuto ? t('autoBid', 'Auto') : t('manualBid', 'Manual')}
        </Tag>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px' : '24px 24px 80px' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => { navigate(-1); }}>
          {tc('action.back')}
        </Button>
      </Space>

      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 32 }}>
        <div>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0, fontFamily: SERIF_FONT }}>
            <DashboardOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
            {t('sellerDashboard.title', 'Auction Analytics')}
          </Title>
          <Flex align="center" gap={8} style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ display: 'block', maxWidth: isMobile ? '80vw' : '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </Text>
            {auction.isFeatured && <Tag color="gold">{t('featured', 'Featured')}</Tag>}
            {auction.verifyByPlatform && <Tag color="blue">{t('verified', 'Verified')}</Tag>}
          </Flex>
        </div>
        <StatusBadge status={auction.status} />
      </Flex>

      <SellerActionBar
        status={auction.status}
        verifyByPlatform={auction.verifyByPlatform}
        itemStatus={item.status}
        hasOrder={!!detail.currentBuyerOrder}
        isMobile={isMobile}
        onEdit={() => navigate(`/seller/auctions/${auction.id}/edit`)}
        onSetTiming={() => setIsTimingModalOpen(true)}
        onSubmit={() => submitAuction(auction.id, {
          onSuccess: () => message.success(tc('success.saved', 'Thành công'))
        })}
        onCancel={() => setIsCancelModalOpen(true)}
        onOfferRunnerUp={() => offerRunnerUp(auction.id, {
          onSuccess: () => message.success(tc('success.saved', 'Thành công'))
        })}
        onClose={() => closeAuction(auction.id, {
          onSuccess: () => message.success(tc('success.saved', 'Thành công'))
        })}
        onProvisionOrder={() => provisionOrder(auction.id, {
          onSuccess: () => message.success(tc('success.saved', 'Order created successfully'))
        })}
        onViewOrder={() => navigate(`/seller/orders/${detail.currentBuyerOrder?.orderId}`)}
        isSubmitLoading={isSubmitLoading}
        isCancelLoading={isCancelLoading}
        isOfferRunnerUpLoading={isOfferRunnerUpLoading}
        isCloseLoading={isCloseLoading}
        isProvisionOrderLoading={isProvisionOrderLoading}
      />

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            <Statistic
              title={t('currentPrice', 'Current Price')}
              value={auction.currentPrice.amount}
              formatter={(val) => formatCurrency(Number(val), auction.currency)}
              prefix={<DollarOutlined style={{ color: 'var(--color-success)' }} />}
            />
            {auction.reservePrice && (
              <div style={{ marginTop: 12 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('reservePrice', 'Reserve Price')}: {formatCurrency(auction.reservePrice.amount, auction.currency)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {Math.min(100, Math.round((auction.currentPrice.amount / auction.reservePrice.amount) * 100))}%
                  </Text>
                </Flex>
                <Progress 
                  percent={Math.min(100, Math.round((auction.currentPrice.amount / auction.reservePrice.amount) * 100))} 
                  size="small" 
                  showInfo={false} 
                  strokeColor={auction.currentPrice.amount >= auction.reservePrice.amount ? 'var(--color-success)' : 'var(--color-accent)'} 
                />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            {auction.status === 'active' && auction.endTime ? (
              <Countdown
                title={t('timeRemaining', 'Time Remaining')}
                value={new Date(auction.endTime).getTime()}
                format="D [days] HH:mm:ss"
                prefix={<ClockCircleOutlined style={{ color: 'var(--color-warning)' }} />}
              />
            ) : (
              <Statistic
                title={t('status', 'Status')}
                value={auction.status.toUpperCase()}
                prefix={<ClockCircleOutlined style={{ color: 'var(--color-info)' }} />}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8} lg={4}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            <Statistic
              title={t('totalBids', 'Total Bids')}
              value={auction.bidCount}
              prefix={<ThunderboltOutlined style={{ color: 'var(--color-accent)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            <Statistic
              title={t('watchers', 'Watchers')}
              value={auction.watchCount}
              prefix={<TeamOutlined style={{ color: 'var(--color-warning)' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            <Statistic
              title={t('views', 'Views')}
              value={auction.viewCount}
              prefix={<EyeOutlined style={{ color: 'var(--color-info)' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          {/* Price History Chart */}
          <Card
            title={t('priceHistory', 'Price Trends')}
            bordered={false}
            style={{ borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}
          >
            <div style={{ height: 400, marginTop: 20 }}>
              <PriceHistoryChart
                priceHistory={priceHistory}
                currency={auction.currency}
                mode="expanded"
                enableZoom
              />
            </div>
          </Card>

          {/* Bid History Table */}
          <Card
            title={
              <Flex align="center" gap={8}>
                {t('recentBids', 'Bid Activity')}
                {hub.connected && (
                  <Badge status="processing" text={<Text type="secondary" style={{ fontSize: 12 }}>Live</Text>} />
                )}
              </Flex>
            }
            bordered={false}
            style={{ borderRadius: 20, boxShadow: 'var(--shadow-sm)', marginTop: 24 }}
          >
            <ResponsiveTable
              mobileMode="card"
              dataSource={recentBids}
              columns={bidColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size={isMobile ? 'small' : 'middle'}
            />
          </Card>

          {/* Participants Table */}
          <div style={{ marginTop: 24 }}>
            <ParticipantsTable auctionId={auction.id} currency={auction.currency} />
          </div>
        </Col>

        <Col xs={24} lg={8}>
          {/* Item Summary */}
          <Card
            title={tc('item.summary', 'Item Summary')}
            bordered={false}
            style={{ borderRadius: 20, boxShadow: 'var(--shadow-sm)', marginBottom: 24 }}
          >
            <Flex gap={16}>
              {item.images?.[0] && (
                <img
                  src={item.images[0].url}
                  alt={item.title}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <Flex vertical justify="center" gap={4}>
                <Text strong>{item.title}</Text>
                <Tag color="blue" style={{ width: 'fit-content' }}>{tc(`condition.${item.condition}`, item.condition)}</Tag>
                <Text type="secondary">{tc('quantity', 'Quantity')}: {item.quantity}</Text>
              </Flex>
            </Flex>
          </Card>

          {/* Auction Info */}
          <Card
            title={t('auctionDetails', 'Auction Details')}
            bordered={false}
            style={{ borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Flex justify="space-between">
                <Text type="secondary">{t('startTime', 'Starts')}</Text>
                <Text strong>{auction.startTime ? formatDateTime(auction.startTime) : '-'}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary">{t('endTime', 'Ends')}</Text>
                <Text strong>{auction.endTime ? formatDateTime(auction.endTime) : '-'}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary">{t('startingPrice', 'Starting')}</Text>
                <Text strong>{formatCurrency(auction.startingPrice.amount, auction.currency)}</Text>
              </Flex>
              {auction.reservePrice && (
                <Flex justify="space-between">
                  <Text type="secondary">{t('reservePrice', 'Reserve')}</Text>
                  <Text strong>{formatCurrency(auction.reservePrice.amount, auction.currency)}</Text>
                </Flex>
              )}
              <Flex justify="space-between">
                <Text type="secondary">{t('buyNowPrice', 'Buy Now Price')}</Text>
                <Text strong>{auction.hasBuyNow && auction.buyNowPrice ? formatCurrency(auction.buyNowPrice.amount, auction.currency) : '-'}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary">{t('bidIncrement', 'Increment')}</Text>
                <Text strong>{formatCurrency(auction.bidIncrement.amount, auction.currency)}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary">{t('requiredDeposit', 'Required Deposit')}</Text>
                <Text strong>{formatCurrency(auction.requiredDepositAmount || 0, auction.currency)}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary">{t('autoExtend', 'Auto Extend')}</Text>
                <Text strong>{auction.autoExtend ? `${t('yes', 'Yes')} (${auction.extensionMinutes} mins)` : t('no', 'No')}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary">{t('auctionType', 'Type')}</Text>
                <Tag color="purple">{auction.auctionType}</Tag>
              </Flex>
            </Space>
          </Card>

          {/* Winning Info (if ended) */}
          {auction.status === 'sold' && (
            <Card
              title={t('results', 'Auction Results')}
              bordered={false}
              style={{ borderRadius: 20, boxShadow: 'var(--shadow-sm)', marginTop: 24, border: '1px solid var(--color-success)' }}
            >
              <Statistic
                title={t('finalPrice', 'Final Price')}
                value={auction.currentPrice.amount}
                formatter={(val) => formatCurrency(Number(val), auction.currency)}
                valueStyle={{ color: 'var(--color-success)' }}
              />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">{t('winner', 'Người thắng')}: </Text>
                <Text strong>
                  {recentBids.find((b) => b.bidderId === auction.currentWinnerId)?.bidderDisplayName ||
                    auction.currentWinnerId}
                </Text>
              </div>
            </Card>
          )}
          
          {/* Chat / Q&A Section */}
          <Card
            title={t('qna', 'Hỏi & Đáp')}
            bordered={false}
            style={{ borderRadius: 20, boxShadow: 'var(--shadow-sm)', marginTop: 24 }}
            bodyStyle={{ padding: '0 24px 24px' }}
          >
            <ItemQA
              itemId={item.id}
              isSeller={true}
              realtimeConnected={hub.connected}
              lastSyncedAt={hub.lastSyncedAt}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={t('cancelAuction', 'Hủy phiên đấu giá')}
        open={isCancelModalOpen}
        onOk={handleCancel}
        onCancel={() => {
          setIsCancelModalOpen(false)
          setCancelReason('')
        }}
        confirmLoading={isCancelLoading}
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>{t('cancelReasonPrompt', 'Vui lòng cho biết lý do hủy phiên đấu giá này:')}</Text>
          <Input.TextArea
            rows={4}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t('cancelReasonPlaceholder', 'Ví dụ: Sản phẩm bị hỏng...')}
          />
        </Space>
      </Modal>

      <SetAuctionTimingModal
        open={isTimingModalOpen}
        auctionId={auction.id}
        onClose={() => setIsTimingModalOpen(false)}
      />
    </div>
  )
}
