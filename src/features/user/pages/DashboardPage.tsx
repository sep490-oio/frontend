import { Card, Row, Col, Button, Space, Steps, Empty } from 'antd'
import {
  WalletOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  CommentOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useWallet } from '@/features/payment/api'
import { useMyBids } from '@/features/auction/api'
import { useMyOrders } from '@/features/order/api'
import { useDisputes } from '@/features/dispute/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const MONO_FONT = "'DM Mono', monospace"

export default function DashboardPage() {
  const { t } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  const { data: wallet } = useWallet()
  const { data: bidsData } = useMyBids({ pageNumber: 1, pageSize: 3, status: 'active' })
  const { data: ordersData } = useMyOrders({ pageNumber: 1, pageSize: 3, status: 'shipped' })
  const { data: disputesData } = useDisputes({ pageNumber: 1, pageSize: 3 })

  const activeBids = bidsData?.items ?? []
  const recentOrders = ordersData?.items ?? []
  const disputes = disputesData?.items ?? []

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '16px 12px 60px' : '24px 24px 80px' }}>
      {/* Welcome */}
      <h1
        style={{
          fontFamily: SERIF_FONT,
          fontWeight: 400,
          fontSize: isMobile ? 22 : 28,
          color: 'var(--color-text-primary)',
          marginBottom: 4,
        }}
      >
        {t('menu.home', 'Dashboard')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
        {t('status.developing', 'Overview of your auction activity')}
      </p>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--color-accent-light)', borderColor: 'var(--color-border)', borderRadius: 12, cursor: 'pointer' }} onClick={() => navigate('/me/wallet')}>
            <WalletOutlined style={{ color: 'var(--color-accent)', fontSize: 20, marginBottom: 8 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 4 }}>
              {t('menu.wallet', 'Wallet')}
            </div>
            <div style={{ fontFamily: MONO_FONT, fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '--'}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--color-accent-light)', borderColor: 'var(--color-border)', borderRadius: 12, cursor: 'pointer' }} onClick={() => navigate('/me/bids')}>
            <ThunderboltOutlined style={{ color: 'var(--color-accent)', fontSize: 20, marginBottom: 8 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 4 }}>
              {t('menu.bids', 'Active Bids')}
            </div>
            <div style={{ fontFamily: MONO_FONT, fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {activeBids.length}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--color-accent-light)', borderColor: 'var(--color-border)', borderRadius: 12, cursor: 'pointer' }} onClick={() => navigate('/me/orders')}>
            <ShoppingOutlined style={{ color: 'var(--color-accent)', fontSize: 20, marginBottom: 8 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 4 }}>
              {t('menu.myOrders', 'Orders')}
            </div>
            <div style={{ fontFamily: MONO_FONT, fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {recentOrders.length}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ background: 'var(--color-accent-light)', borderColor: 'var(--color-border)', borderRadius: 12, cursor: 'pointer' }} onClick={() => navigate('/me/disputes')}>
            <CommentOutlined style={{ color: 'var(--color-accent)', fontSize: 20, marginBottom: 8 }} />
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginBottom: 4 }}>
              Disputes
            </div>
            <div style={{ fontFamily: MONO_FONT, fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {disputes.length}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Active Bids */}
        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>Đấu giá đang tham gia</span>}
            extra={<Button type="link" onClick={() => navigate('/me/bids')} style={{ color: 'var(--color-accent)' }}>Xem tất cả</Button>}
            style={{ borderRadius: 12, marginBottom: 24 }}
          >
            {activeBids.length > 0 ? (
              <Row gutter={[16, 16]}>
                {activeBids.map((bid) => (
                  <Col xs={24} sm={12} md={8} key={bid.id}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                      style={{ borderRadius: 8 }}
                    >
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{bid.auctionTitle ?? bid.auctionId?.slice(0, 12)}</div>
                      <div style={{ fontFamily: MONO_FONT, fontSize: 16, color: 'var(--color-accent)', fontWeight: 600 }}>
                        {formatCurrency(bid.amount?.amount ?? 0, bid.amount?.currency)}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge status={bid.isHighestBid ? 'winning' : 'outbid'} size="small" />
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="Chưa có đấu giá nào" />
            )}
          </Card>

          {/* Shipment Tracking */}
          <Card
            title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>Theo dõi giao hàng</span>}
            style={{ borderRadius: 12 }}
          >
            {recentOrders.length > 0 ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    style={{ padding: 16, borderRadius: 8, border: '1px solid var(--color-border-light)', cursor: 'pointer' }}
                    onClick={() => navigate(`/me/orders/${order.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500 }}>#{order.orderNumber}</span>
                      <StatusBadge status={order.status} size="small" />
                    </div>
                    <Steps
                      size="small"
                      current={
                        order.status === 'delivered' ? 3
                          : order.status === 'shipped' ? 2
                          : order.status === 'paid' ? 1
                          : 0
                      }
                      items={[
                        { title: 'Thanh toán' },
                        { title: 'Đang giao' },
                        { title: 'Đã nhận' },
                        { title: 'Hoàn tất' },
                      ]}
                    />
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="Chưa có đơn hàng nào đang giao" />
            )}
          </Card>
        </Col>

        {/* Right sidebar */}
        <Col xs={24} lg={8}>
          {/* Disputes */}
          <Card
            title={<span style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}>Tranh chấp</span>}
            extra={<Button type="link" onClick={() => navigate('/me/disputes')} style={{ color: 'var(--color-accent)' }}>Xem tất cả</Button>}
            style={{ borderRadius: 12, marginBottom: 24 }}
          >
            {disputes.length > 0 ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    style={{ padding: 12, borderRadius: 8, background: 'var(--color-accent-light)', cursor: 'pointer' }}
                    onClick={() => navigate(`/me/disputes/${d.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <StatusBadge status={d.status} size="small" />
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {formatDateTime(d.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {d.title ?? `Dispute #${d.disputeNumber ?? d.id.slice(0, 8)}`}
                    </div>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="Không có tranh chấp" />
            )}
          </Card>

          {/* Become Seller CTA */}
          <Card style={{ borderRadius: 12, background: 'var(--color-accent-light)', textAlign: 'center', padding: '8px 0' }}>
            <ShopOutlined style={{ fontSize: 32, color: 'var(--color-accent)', marginBottom: 8 }} />
            <div style={{ fontFamily: SERIF_FONT, fontSize: 16, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Trở thành Người bán
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16, maxWidth: 240, margin: '0 auto 16px' }}>
              Bán vật phẩm của bạn trên nền tảng đấu giá hàng đầu
            </div>
            <Button
              type="primary"
              onClick={() => navigate('/seller/register')}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500 }}
            >
              Đăng ký bán hàng
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
