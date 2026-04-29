import { Card, Row, Col, Button, Steps, Empty, Typography, Flex } from 'antd'
import {
  WalletOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  CommentOutlined,
  ShopOutlined,
  DashboardOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useWallet } from '@/features/payment/api'
import { useMyBids, useWatchlist } from '@/features/auction/auctionApi.ts'
import { useMyOrders } from '@/features/order/api'
import { useMyDisputes } from '@/features/dispute/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title, Text } = Typography

export default function DashboardPage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  const { data: wallet } = useWallet()
  
  // Stats queries with minimal page size just for totalCount
  // Attempt to filter by active status using both common parameter names
  const { data: bidsData } = useMyBids({ 
    pageNumber: 1, 
    pageSize: 50, // Fetch more to allow accurate client-side filtering if backend filter fails
    status: 'active',
    statusGroup: 'active'
  } as any)
  const { data: ordersData } = useMyOrders({ pageNumber: 1, pageSize: 3 }) // Removed status filter for total count
  const { data: disputesData } = useMyDisputes({ pageNumber: 1, pageSize: 3 })
  const { data: watchlistData } = useWatchlist({ pageNumber: 1, pageSize: 3 })

  // Client-side filter to ensure only active ones are shown in the 'Recent' list and accurate count
  const activeBidsItems = (bidsData?.items ?? []).filter(item => item.auctionStatus === 'active')
  const activeBids = activeBidsItems.slice(0, 3)
  
  // Use backend totalCount if it seems to be filtered, otherwise use client-filtered length
  const activeBidsCount = (bidsData?.metadata?.totalCount !== undefined && bidsData?.metadata?.totalCount <= activeBidsItems.length)
    ? bidsData.metadata.totalCount
    : activeBidsItems.length

  const watchlist = watchlistData?.items ?? []
  const recentOrders = ordersData?.items ?? []
  const disputes = disputesData?.items ?? []

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '48px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
        <Title
          level={2}
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          <DashboardOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
          {t('dashboard.title', 'User Dashboard')}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          {t('dashboard.subtitle', 'Welcome back! Here is what is happening with your account.')}
        </Text>
      </div>

      {/* Stats Row - Premium Glassy Cards */}
      <Row gutter={isMobile ? [12, 12] : [20, 20]} style={{ marginBottom: isMobile ? 32 : 48 }}>
        {[
          { 
            label: t('dashboard.wallet', 'Wallet'), 
            value: wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '--', 
            pending: wallet?.pendingBalance && wallet.pendingBalance > 0 ? formatCurrency(wallet.pendingBalance, wallet.currency) : null,
            icon: <WalletOutlined />, 
            path: '/me/wallet', 
            color: 'var(--color-success)' 
          },
          { 
            label: t('dashboard.activeBids', 'Active Bids'), 
            value: activeBidsCount, 
            icon: <ThunderboltOutlined />, 
            path: '/me/bids', 
            color: 'var(--color-accent)' 
          },
          { 
            label: t('dashboard.orders', 'Orders'), 
            value: ordersData?.metadata?.totalCount ?? 0, 
            icon: <ShoppingOutlined />, 
            path: '/me/orders', 
            color: 'var(--color-warning)' 
          },
          { 
            label: t('dashboard.disputes', 'Disputes'), 
            value: disputesData?.metadata?.totalCount ?? 0, 
            icon: <CommentOutlined />, 
            path: '/me/disputes', 
            color: 'var(--color-danger)' 
          },
        ].map((stat, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <div
              className="oio-press"
              onClick={() => navigate(stat.path)}
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 24,
                padding: '24px',
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Flex align="center" gap={16}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'var(--color-bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: stat.color,
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
                }}>
                  {stat.icon}
                </div>
                <div>
                  <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    {stat.label}
                  </Text>
                  <div style={{ fontFamily: MONO_FONT, fontSize: isMobile ? 22 : 26, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>
                    {stat.value}
                  </div>
                  {(stat as any).pending && (
                    <div style={{ fontSize: 11, color: 'var(--color-warning)', fontWeight: 600, marginTop: 2 }}>
                      {t('dashboard.pendingRefund', 'Pending/Held')}: {(stat as any).pending}
                    </div>
                  )}
                </div>
              </Flex>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={isMobile ? [24, 24] : [32, 32]}>
        {/* Main Content Area */}
        <Col xs={24} lg={16}>
          {/* Active Bids Section */}
          <div style={{ marginBottom: 40 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, fontFamily: SANS_FONT, fontWeight: 600, fontSize: 18 }}>
                {t('dashboard.activeBidsTitle', 'Active Bids')}
              </Title>
              <Button type="link" onClick={() => navigate('/me/bids')} style={{ color: 'var(--color-accent)', fontWeight: 600, paddingRight: 0 }}>
                {t('dashboard.viewAll', 'View All')} <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            </Flex>

            {activeBids.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeBids.map((bid) => (
                  <div
                    key={bid.auctionId}
                    onClick={() => navigate(`/auctions/${bid.auctionId}`)}
                    className="oio-press"
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 20,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      gap: isMobile ? 12 : 16,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <Flex align="center" gap={16} style={{ flex: 1, minWidth: 0, width: '100%' }}>
                      <div style={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: 10, 
                        background: 'var(--color-bg-surface)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <ThunderboltOutlined style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {bid.itemTitle}
                      </div>
                      <StatusBadge status={bid.position} size="small" />
                    </Flex>
                    <div style={{ textAlign: isMobile ? 'left' : 'right', minWidth: isMobile ? undefined : 120 }}>
                      <div style={{ fontFamily: MONO_FONT, color: 'var(--color-accent)', fontWeight: 700, fontSize: 18 }}>
                        {formatCurrency(bid.myLatestBidAmount?.amount ?? 0, bid.myLatestBidAmount?.currency)}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{t('dashboard.myBid', 'My Bid')}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty 
                description={t('dashboard.noBids', 'No active bids found')} 
                style={{ padding: 60, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }} 
              />
            )}
          </div>
          
          {/* Watchlist Section */}
          <div style={{ marginBottom: 40 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, fontFamily: SANS_FONT, fontWeight: 600, fontSize: 18 }}>
                {t('dashboard.watchlistTitle', 'Watchlist')}
              </Title>
              <Button type="link" onClick={() => navigate('/me/watchlist')} style={{ color: 'var(--color-accent)', fontWeight: 600, paddingRight: 0 }}>
                {t('dashboard.viewAll', 'View All')} <RightOutlined style={{ fontSize: 10 }} />
              </Button>
            </Flex>

            {watchlist.length > 0 ? (
              <Row gutter={[16, 16]}>
                    {watchlist.map((item) => {
                      const isEnded = item.auctionStatus !== 'Active' && item.auctionStatus !== 'active'
                      const remainingTimeStr = item.remainingTime?.startsWith('-') ? t('dashboard.ended', 'Ended') : item.remainingTime

                      return (
                        <Col xs={24} sm={12} key={item.auctionId}>
                          <div
                            onClick={() => navigate(`/auctions/${item.auctionId}`)}
                            className="oio-press"
                            style={{
                              background: 'var(--color-bg-card)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 24,
                              padding: '16px',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: 16,
                              transition: 'all 0.2s ease',
                              boxShadow: 'var(--shadow-sm)',
                              height: '100%',
                              alignItems: 'center'
                            }}
                          >
                            <img
                              src={item.primaryImageUrl || '/placeholder-item.png'}
                              alt={item.itemTitle}
                              style={{
                                width: 88,
                                height: 88,
                                objectFit: 'cover',
                                borderRadius: 16,
                                background: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border-light)'
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontWeight: 600,
                                color: 'var(--color-text-primary)',
                                fontSize: 15,
                                marginBottom: 6,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {item.itemTitle}
                              </div>

                              <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                                <StatusBadge status={item.auctionStatus} size="small" />
                                <div style={{
                                  fontSize: 12,
                                  padding: '2px 10px',
                                  borderRadius: 100,
                                  background: 'var(--color-bg-surface)',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-text-secondary)',
                                  fontWeight: 600
                                }}>
                                  {item.bidCount} {t('dashboard.bids', 'bids')}
                                </div>
                              </Flex>

                              <div style={{
                                fontSize: 13,
                                color: isEnded ? 'var(--color-text-tertiary)' : 'var(--color-warning)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontWeight: 600,
                                marginBottom: 4
                              }}>
                                <ThunderboltOutlined style={{ fontSize: 12 }} />
                                {isEnded ? t('dashboard.ended', 'Ended') : remainingTimeStr || '--'}
                              </div>

                              <div style={{ 
                                fontSize: 12, 
                                color: 'var(--color-text-tertiary)',
                                fontFamily: MONO_FONT 
                              }}>
                                {t('dashboard.currentPrice', 'Current')}: <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatCurrency(item.currentPrice?.amount ?? 0, item.currentPrice?.currency ?? item.currency ?? 'VND')}</span>
                              </div>
                            </div>
                          </div>
                        </Col>
                      )
                    })}
              </Row>
            ) : (
              <Empty 
                description={t('dashboard.noWatchlist', 'No watched auctions found')} 
                style={{ padding: 40, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }} 
              />
            )}
          </div>

          {/* Shipment Tracking Section */}
          <div>
            <Title level={4} style={{ marginBottom: 20, fontFamily: SANS_FONT, fontWeight: 600, fontSize: 18 }}>
              {t('dashboard.shipmentTracking', 'Order Status')}
            </Title>
            {recentOrders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentOrders.map((order) => (
                  <Card
                    key={order.id}
                    onClick={() => navigate(`/me/orders/${order.id}`)}
                    className="oio-press"
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 24,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    styles={{ body: { padding: isMobile ? '20px' : '24px' } }}
                  >
                    <Flex vertical gap={16}>
                      <Flex justify="space-between" align="center">
                        <div>
                          <Text strong style={{ fontSize: 15, fontFamily: MONO_FONT, color: 'var(--color-accent)' }}>#{order.orderNumber}</Text>
                          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{formatDateTime(order.createdAt)}</div>
                        </div>
                        <StatusBadge status={order.status} />
                      </Flex>

                      {order.item && (
                        <div style={{ padding: '12px', background: 'var(--color-bg-surface)', borderRadius: 16, border: '1px solid var(--color-border-light)' }}>
                          <OrderItemSummary item={order.item} variant="row" />
                        </div>
                      )}

                      <Steps
                      size="small"
                      direction={isMobile ? 'vertical' : 'horizontal'}
                      current={
                        order.status === 'delivered' ? 3
                          : order.status === 'shipped' ? 2
                          : order.status === 'paid' ? 1
                          : 0
                      }
                      items={[
                        { title: t('dashboard.stepPayment', 'Payment') },
                        { title: t('dashboard.stepShipping', 'Shipping') },
                        { title: t('dashboard.stepReceived', 'Delivery') },
                        { title: t('dashboard.stepCompleted', 'Done') },
                      ]}
                    />
                    </Flex>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty 
                description={t('dashboard.noShipments', 'No active shipments found')} 
                style={{ padding: 60, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }} 
              />
            )}
          </div>
        </Col>

        {/* Sidebar Content */}
        <Col xs={24} lg={8}>
          {/* Recent Disputes */}
          <div style={{ marginBottom: 40 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, fontFamily: SANS_FONT, fontWeight: 600, fontSize: 18 }}>
                {t('dashboard.disputesTitle', 'Recent Disputes')}
              </Title>
              <Button type="link" onClick={() => navigate('/me/disputes')} style={{ color: 'var(--color-accent)', fontWeight: 600, paddingRight: 0 }}>
                {t('dashboard.viewAll', 'View All')}
              </Button>
            </Flex>

            {disputes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {disputes.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/me/disputes/${d.id}`)}
                    className="oio-press"
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                      <StatusBadge status={d.status} size="small" />
                      <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{formatDateTime(d.createdAt)}</Text>
                    </Flex>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {d.title ?? `Dispute #${d.disputeNumber ?? d.id.slice(0, 8)}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty 
                description={t('dashboard.noDisputes', 'No active disputes found')} 
                style={{ padding: 32, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }} 
              />
            )}
          </div>

          {/* Become Seller Banner */}
          <div style={{
            borderRadius: 32,
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #0c5299 100%)',
            padding: isMobile ? 32 : 40,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(59, 130, 246, 0.25)'
          }}>
             <div style={{ position: 'absolute', top: -30, right: -30, fontSize: 160, opacity: 0.1, color: '#fff', transform: 'rotate(-15deg)' }}>
                <ShopOutlined />
             </div>
             <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', backdropFilter: 'blur(10px)' }}>
                  <ShopOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <Title level={3} style={{ color: '#fff', margin: '0 0 12px 0', fontFamily: SANS_FONT, fontWeight: 700 }}>
                    {t('dashboard.becomeSellerTitle', 'Start Selling on OIO')}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', display: 'block', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
                    {t('dashboard.becomeSellerDesc', 'Turn your items into profit. Join our professional seller community today.')}
                </Text>
                <Button
                    size="large"
                    onClick={() => navigate('/seller/register')}
                    style={{
                      background: '#fff',
                      color: 'var(--color-accent)',
                      border: 'none',
                      fontWeight: 700,
                      borderRadius: 14,
                      height: 52,
                      width: '100%',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                    }}
                >
                    {t('dashboard.becomeSellerBtn', 'Become a Seller')}
                </Button>
             </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
