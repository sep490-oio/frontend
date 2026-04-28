import { useParams, useNavigate } from 'react-router'
import { Typography, Card, Row, Col, Space, Spin, Button, Statistic, Flex, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  DashboardOutlined,
  EyeOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuctionDetail } from '@/features/auction/api'
import { PriceHistoryChart } from '@/features/auction/components/PriceHistoryChart'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'
import { ItemQA } from '@/features/item/components/ItemQA'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { useCurrentUser } from '@/features/user/api'


const { Title, Text } = Typography

export default function SellerAuctionDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: currentUser } = useCurrentUser()
  const { data: detail, isLoading, error } = useAuctionDetail(id!)

  const hub = useAuctionHub(detail?.auction?.id, detail?.item?.id, currentUser?.id)

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
        <Button onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
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
      render: (text: string) => (
        <Typography.Text strong ellipsis style={{ maxWidth: 120 }}>
          {text || 'Anonymous'}
        </Typography.Text>
      ),
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {tc('action.back')}
        </Button>
      </Space>

      <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 32 }}>
        <div>
          <Title level={isMobile ? 3 : 2} style={{ margin: 0, fontFamily: SERIF_FONT }}>
            <DashboardOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
            {t('sellerDashboard.title', 'Auction Analytics')}
          </Title>
          <Text type="secondary" style={{ display: 'block', maxWidth: isMobile ? '80vw' : '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.title}
          </Text>
        </div>
        <StatusBadge status={auction.status} />
      </Flex>

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
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            <Statistic
              title={t('totalBids', 'Total Bids')}
              value={auction.bidCount}
              prefix={<ThunderboltOutlined style={{ color: 'var(--color-accent)' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            <Statistic
              title={t('views', 'Total Views')}
              value={auction.viewCount}
              prefix={<EyeOutlined style={{ color: 'var(--color-info)' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="oio-glass" style={{ borderRadius: 16 }}>
            <Statistic
              title={t('watchers', 'Watchers')}
              value={auction.watchCount}
              prefix={<TeamOutlined style={{ color: 'var(--color-warning)' }} />}
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
            title={t('recentBids', 'Bid Activity')}
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
        </Col>

        <Col xs={24} lg={8}>
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
                <Text type="secondary">{t('bidIncrement', 'Increment')}</Text>
                <Text strong>{formatCurrency(auction.bidIncrement.amount, auction.currency)}</Text>
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

    </div>
  )
}
