import { Row, Col, Card, Button, Space, Spin, Empty, Typography, List } from 'antd'
import {
  ThunderboltOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  SendOutlined,
  RollbackOutlined,
  WarningOutlined,
  EditOutlined,
  RightOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useMySellerProfile, useSellerDashboardStats } from '@/features/seller/api'
import { useMyAuctions } from '@/features/auction/auctionApi'
import { useWallet } from '@/features/payment/api'
import { useMyOrders } from '@/features/order/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { SellerProfileStatus } from '@/types/enums'
import type { AuctionListItemDto, OrderDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { Tabs } from 'antd'
import { SERIF_FONT as serifFont, MONO_FONT as monoFont } from '@/styles/tokens'
import { useBreakpoint } from '@/hooks/useBreakpoint'

/* ── Shared styles ───────────────────────────────────────────────────── */

const statCardStyle: React.CSSProperties = {
  background: 'var(--color-bg-container)',
  backdropFilter: 'var(--oio-blur)',
  WebkitBackdropFilter: 'var(--oio-blur)',
  border: '1px solid var(--color-border)',
  borderRadius: 24,
  height: '100%',
  boxShadow: 'var(--shadow-sm)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: serifFont,
  fontWeight: 400,
  fontSize: 18,
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function SellerDashboardPage() {
  const { t } = useTranslation('seller')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: profile, isLoading: profileLoading } = useMySellerProfile()
  const { data: wallet } = useWallet()

  // Fetch recent auctions and orders for the table
  const { data: recentAuctionsData, isLoading: auctionsLoading } = useMyAuctions({ pageNumber: 1, pageSize: 5 })
  const recentAuctions = recentAuctionsData?.items ?? []
  
  const { data: recentOrdersData, isLoading: ordersLoading } = useMyOrders({ pageNumber: 1, pageSize: 5, role: 'seller' })
  const recentOrders = recentOrdersData?.items ?? []

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: isStatsLoading } = useSellerDashboardStats()

  /* ── Derived data ────────────────────────────────────────────────── */

  const activeAuctions = dashboardStats?.activeAuctions ?? 0
  const ordersAwaitingShipment = dashboardStats?.ordersAwaitingShipment ?? 0
  const pendingReviewItems = dashboardStats?.pendingReviewItems ?? 0
  const soldAuctions = dashboardStats?.soldAuctions ?? 0

  // Action Center To-Dos
  const toDos = useMemo(() => {
    const list = []
    
    if (ordersAwaitingShipment > 0) {
      list.push({
        key: 'orders',
        icon: <SendOutlined style={{ color: 'var(--color-info)' }} />,
        title: t('dashboard.ordersAwaitingShipment', 'Orders awaiting shipment'),
        count: ordersAwaitingShipment,
        path: '/seller/orders?status=paid'
      })
    }

    if (dashboardStats?.rejectedItems && dashboardStats.rejectedItems > 0) {
      list.push({
        key: 'rejectedItems',
        icon: <WarningOutlined style={{ color: 'var(--color-error)' }} />,
        title: t('dashboard.rejectedItems', 'Rejected items need fix'),
        count: dashboardStats.rejectedItems,
        path: '/seller/items?status=rejected'
      })
    }

    if (dashboardStats?.draftAuctions && dashboardStats.draftAuctions > 0) {
      list.push({
        key: 'draftAuctions',
        icon: <EditOutlined style={{ color: 'var(--color-warning)' }} />,
        title: t('draftAuctionsNeedSubmission', { count: dashboardStats.draftAuctions }),
        count: dashboardStats.draftAuctions,
        path: '/seller/auctions?status=draft'
      })
    }

    if (dashboardStats?.activeWarehouseReturns && dashboardStats.activeWarehouseReturns > 0) {
      list.push({
        key: 'warehouseReturns',
        icon: <RollbackOutlined style={{ color: 'var(--color-error)' }} />,
        title: t('dashboard.warehouseReturns', 'Items being returned by warehouse'),
        count: dashboardStats.activeWarehouseReturns,
        path: '/seller/returns?tab=warehouse'
      })
    }

    if (dashboardStats?.orderReturns && dashboardStats.orderReturns > 0) {
      list.push({
        key: 'orderReturns',
        icon: <RollbackOutlined style={{ color: 'var(--color-error)' }} />,
        title: t('dashboard.orderReturns', 'Items buyer is returning after dispute'),
        count: dashboardStats.orderReturns,
        path: '/seller/returns?tab=order'
      })
    }

    if (list.length === 0) {
      // Return empty array to show Empty state
      return []
    }
    
    return list
  }, [ordersAwaitingShipment, dashboardStats, t])


  /* ── Loading / empty ─────────────────────────────────────────────── */

  if (profileLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 48 : 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Empty description={t('noProfile')}>
        <Button
          type="primary"
          onClick={() => navigate('/seller/register')}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', minHeight: 44 }}
        >
          {t('createProfile')}
        </Button>
      </Empty>
    )
  }

  /* ── Auction table columns ───────────────────────────────────────── */

  const auctionColumns: ColumnsType<AuctionListItemDto> = [
    {
      title: t('auctionTitle'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
      render: (text: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {record.primaryImageUrl ? (
            <img
              src={record.primaryImageUrl}
              alt=""
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--color-border-secondary)' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                background: 'var(--color-fill-tertiary)',
                flexShrink: 0
              }}
            />
          )}
          <Button
            type="link"
            onClick={() => navigate(`/auctions/${record.id}`)}
            style={{
              padding: 0,
              fontWeight: 500,
              maxWidth: '100%',
              height: 'auto',
              textAlign: isMobile ? 'right' : 'left',
              whiteSpace: 'normal',
            }}
          >
            <Typography.Text
              ellipsis
              style={{
                maxWidth: '100%',
                color: 'inherit',
                display: 'block',
              }}
            >
              {text ?? '-'}
            </Typography.Text>
          </Button>
        </div>
      ),
    },
    {
      title: t('currentPrice'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 150,
      responsive: ['sm'],
      render: (price: unknown) => {
        const money = price && typeof price === 'object' && 'amount' in price
          ? (price as { amount: number; currency: string })
          : null
        const amount = money?.amount ?? (typeof price === 'number' ? price : 0)
        const currency = money?.currency ?? 'VND'
        return (
          <span style={{ fontFamily: monoFont, fontWeight: 500, fontSize: 13 }}>
            {formatCurrency(amount, currency)}
          </span>
        )
      },
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
  ]

  const orderColumns: ColumnsType<OrderDto> = [
    {
      title: t('orderNumber', 'Order ID'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {record.item?.primaryImageUrl ? (
            <img
              src={record.item.primaryImageUrl}
              alt=""
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid var(--color-border-secondary)' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 6,
                background: 'var(--color-fill-tertiary)',
                flexShrink: 0
              }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Button
              type="link"
              onClick={() => navigate(`/seller/orders/${record.id}`)}
              style={{ padding: 0, fontWeight: 500, fontFamily: monoFont, height: 'auto', textAlign: 'left' }}
            >
              {text}
            </Button>
            {record.item?.itemTitle && (
              <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 200, lineHeight: 1.2 }}>
                {record.item.itemTitle}
              </Typography.Text>
            )}
          </div>
        </div>
      )
    },
    {
      title: t('amount', 'Amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (price: unknown) => {
        const money = price && typeof price === 'object' && 'amount' in price
          ? (price as { amount: number; currency: string })
          : null
        const amount = money?.amount ?? (typeof price === 'number' ? price : 0)
        const currency = money?.currency ?? 'VND'
        return (
          <span style={{ fontFamily: monoFont, fontWeight: 500, fontSize: 13 }}>
            {formatCurrency(amount, currency)}
          </span>
        )
      },
    },
    {
      title: t('createdAt', 'Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {formatDateTime(date)}
        </Typography.Text>
      )
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
  ]

  /* ── Dashboard content ──────────────────────────────────────────── */

  const dashboardContent = (
    <>
      {/* ── Key Metrics Row ──────────────────────────────────────────── */}
      <Spin spinning={isStatsLoading}>
        <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 20 : 32 }}>
            {[
              { icon: <WalletOutlined style={{ color: 'var(--color-primary)', fontSize: 18 }} />, label: t('dashboard.walletBalance', 'Wallet Balance'), value: formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency ?? 'VND') },
              { icon: <DollarOutlined style={{ color: 'var(--color-success)', fontSize: 18 }} />, label: t('dashboard.totalRevenue', 'Total Revenue'), value: formatCurrency(dashboardStats?.totalRevenue ?? 0, 'VND') },
              { icon: <ThunderboltOutlined style={{ color: 'var(--color-accent)', fontSize: 18 }} />, label: t('dashboard.activeAuctions', 'Active Auctions'), value: activeAuctions },
              { icon: <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 18 }} />, label: t('dashboard.soldAuctions', 'Sold Auctions'), value: soldAuctions },
              { icon: <EditOutlined style={{ color: 'var(--color-text-secondary)', fontSize: 18 }} />, label: t('dashboard.draftAuctions', 'Draft Auctions'), value: dashboardStats?.draftAuctions ?? 0 },
              { icon: <ClockCircleOutlined style={{ color: 'var(--color-warning)', fontSize: 18 }} />, label: t('dashboard.pendingReview', 'Pending Review'), value: pendingReviewItems },
              { icon: <SendOutlined style={{ color: 'var(--color-info)', fontSize: 18 }} />, label: t('dashboard.ordersAwaitingShipment', 'Pending Orders'), value: ordersAwaitingShipment },
              { icon: <EyeOutlined style={{ color: 'var(--color-warning)', fontSize: 18 }} />, label: t('dashboard.totalActiveViews', 'Total Views'), value: dashboardStats?.totalActiveViews ?? 0 },
            ].map((stat) => (
              <Col key={stat.label} xs={12} sm={8} lg={6}>
                <Card style={statCardStyle} styles={{ body: { padding: isMobile ? '12px 14px' : '20px 24px' } }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {stat.icon}
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, lineHeight: 1.3 }}>
                      {stat.label}
                    </span>
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: isMobile ? 18 : 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {stat.value}
                  </div>
                </Card>
              </Col>
            ))}
        </Row>
      </Spin>

      <Row gutter={[24, 24]}>
        {/* ── Action Center ──────────────────────────────────────────── */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={sectionTitleStyle}>{t('dashboard.actionCenter', 'Action Center')}</span>}
            style={statCardStyle}
            styles={{ body: { padding: isMobile ? '12px 16px' : '20px 24px', maxHeight: 400, overflowY: 'auto' } }}
          >
            {toDos.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                    {t('dashboard.allClear', "You're all caught up! No pending actions.")}
                  </span>
                }
                style={{ margin: '40px 0' }}
              />
            ) : (
              <List
                loading={isStatsLoading}
                itemLayout="horizontal"
                dataSource={toDos}
                renderItem={(item) => (
                  <List.Item
                    onClick={() => item.path && navigate(item.path)}
                    style={{
                      cursor: item.path ? 'pointer' : 'default',
                      padding: '12px 0',
                      borderBottom: '1px solid var(--color-border-secondary)'
                    }}
                    actions={item.path ? [<RightOutlined key="arrow" style={{ color: 'var(--color-text-secondary)' }} />] : undefined}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40, height: 40, borderRadius: 20, 
                          background: 'var(--color-fill-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18
                        }}>
                          {item.icon}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</span>
                          {item.count > 0 && (
                            <span style={{ fontFamily: monoFont, fontWeight: 600, fontSize: 16, color: 'var(--color-text-primary)' }}>
                              {item.count}
                            </span>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* ── Recent Activity ────────────────────────────────────────── */}
        <Col xs={24} lg={16}>
          <Card
            style={{ ...statCardStyle, height: '100%' }}
            styles={{ body: { padding: isMobile ? '12px 8px' : '16px 24px', overflowX: 'auto' } }}
          >
            <Tabs
              defaultActiveKey="auctions"
              items={[
                {
                  key: 'auctions',
                  label: <span style={{ fontWeight: 500 }}>{t('recentAuctions', 'Recent Auctions')}</span>,
                  children: (
                    <div style={{ marginTop: 8 }}>
                      <ResponsiveTable<AuctionListItemDto>
                        mobileMode="card"
                        rowKey="id"
                        columns={auctionColumns}
                        dataSource={recentAuctions}
                        loading={auctionsLoading}
                        pagination={false}
                        locale={{ emptyText: t('noAuctions') }}
                        scroll={{ x: 'max-content' }}
                      />
                      <div style={{ textAlign: 'right', marginTop: 12 }}>
                        <Button type="link" onClick={() => navigate('/seller/auctions')}>
                          {t('viewAll')} <RightOutlined />
                        </Button>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'orders',
                  label: <span style={{ fontWeight: 500 }}>{t('recentOrders', 'Recent Orders')}</span>,
                  children: (
                    <div style={{ marginTop: 8 }}>
                      <ResponsiveTable<OrderDto>
                        mobileMode="card"
                        rowKey="id"
                        columns={orderColumns}
                        dataSource={recentOrders}
                        loading={ordersLoading}
                        pagination={false}
                        locale={{ emptyText: t('noOrders', 'No recent orders') }}
                        scroll={{ x: 'max-content' }}
                      />
                      <div style={{ textAlign: 'right', marginTop: 12 }}>
                        <Button type="link" onClick={() => navigate('/seller/orders')}>
                          {t('viewAll')} <RightOutlined />
                        </Button>
                      </div>
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div style={{ padding: isMobile ? '0 0 24px' : undefined }}>
      {/* ── Welcome Banner + Wallet ─────────────────────────────────── */}
      <Card
        style={{
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-container)',
          backgroundImage: 'linear-gradient(to right, rgba(var(--color-primary-rgb), 0.05), rgba(var(--color-bg-container-rgb), 1))',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-sm)',
          marginBottom: isMobile ? 20 : 32
        }}
        styles={{ body: { padding: isMobile ? '20px 16px' : '24px 32px' } }}
      >
        <Row gutter={[isMobile ? 24 : 0, isMobile ? 24 : 0]} align="middle" justify="space-between">
          {/* Left: Welcome */}
          <Col xs={24} md={12}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: serifFont,
                  fontWeight: 400,
                  fontSize: isMobile ? 24 : 32,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                {profile.storeName}
              </h1>
              {profile.status === SellerProfileStatus.Verified ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'var(--color-success)',
                    color: '#fff',
                    borderRadius: 100,
                    padding: '3px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    lineHeight: '18px',
                  }}
                >
                  <CheckCircleOutlined style={{ fontSize: 13 }} />
                  {t('verified')}
                </span>
              ) : (
                <StatusBadge status={profile.status} />
              )}
            </div>
            {profile.storeDescription && (
              <div style={{ marginTop: 8 }}>
                <SafeHtmlRenderer html={profile.storeDescription} />
              </div>
            )}
          </Col>

          {/* Right: Wallet summary */}
          <Col xs={24} md={12}>
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'center', 
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              gap: 24
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <WalletOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
                  <span style={{ fontFamily: serifFont, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                    {t('dashboard.walletBalance')}
                  </span>
                </div>
                <div style={{ fontFamily: monoFont, fontSize: isMobile ? 24 : 28, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '--'}
                </div>
                {wallet && wallet.pendingBalance > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: monoFont, marginTop: 4 }}>
                    {t('pendingBalance')}: {formatCurrency(wallet.pendingBalance, wallet.currency)}
                  </div>
                )}
              </div>
              <Space size={12} direction={isMobile ? 'horizontal' : 'vertical'}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => navigate('/seller/wallet/withdraw')}
                  style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500, borderRadius: 8, height: 40 }}
                >
                  {t('dashboard.withdraw')}
                </Button>
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => navigate('/seller/wallet')}
                  style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontWeight: 500, borderRadius: 8, height: 40 }}
                >
                  {t('dashboard.history')}
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── Dashboard Content ───────────────────────────────────────── */}
      {dashboardContent}
    </div>
  )
}
