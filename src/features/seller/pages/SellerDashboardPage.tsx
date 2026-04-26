import { Row, Col, Card, Button, Space, Spin, Empty, Tag } from 'antd'
import {
  ShoppingOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  PlusOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useMySellerProfile, useSellerWarehouseReturns } from '@/features/seller/api'
import { useMyAuctions } from '@/features/auction/api'
import { useMyItems } from '@/features/item/api'
import { useWallet } from '@/features/payment/api'
import { useMyOrders } from '@/features/order/api'
import { WarehouseToSellerShipmentStatus, OrderReturnStatus } from '@/types/enums'
import { RollbackOutlined } from '@ant-design/icons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { SellerProfileStatus } from '@/types/enums'
import type { AuctionListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { SERIF_FONT as serifFont, MONO_FONT as monoFont } from '@/styles/tokens'
import { useBreakpoint } from '@/hooks/useBreakpoint'

/* ── Shared styles ───────────────────────────────────────────────────── */

const statCardStyle: React.CSSProperties = {
  background: 'var(--color-bg-container)',
  backdropFilter: 'var(--oio-blur)',
  WebkitBackdropFilter: 'var(--oio-blur)',
  borderColor: 'var(--color-border)',
  borderRadius: 16,
  height: '100%',
  boxShadow: 'var(--shadow-sm)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: serifFont,
  fontWeight: 400,
  fontSize: 18,
}

const outlinedBtnStyle: React.CSSProperties = {
  borderColor: 'var(--color-accent)',
  color: 'var(--color-accent)',
  fontWeight: 500,
  transition: 'all 200ms ease',
  minHeight: 44,
}

const touchBtnStyle: React.CSSProperties = {
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
}

/* ── Helper: count items by status from array ────────────────────────── */

function countByStatus<T extends { status: string }>(
  items: T[] | undefined,
  statuses: string[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const s of statuses) counts[s] = 0
  if (!items) return counts
  for (const item of items) {
    const st = item.status?.toLowerCase()
    if (st in counts) counts[st]++
  }
  return counts
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function SellerDashboardPage() {
  const { t } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: profile, isLoading: profileLoading } = useMySellerProfile()
  const { data: wallet } = useWallet()

  // Fetch all items (large page to get status counts)
  const { data: itemsData } = useMyItems({ pageNumber: 1, pageSize: 200 })
  // Fetch all auctions
  const { data: auctionsData, isLoading: auctionsLoading } = useMyAuctions({ pageNumber: 1, pageSize: 200 })

  // Returns widgets — active warehouse-returns coming back from inspection-reject,
  // and buyer-initiated order-returns currently in flight.
  const { data: warehouseReturnsAll } = useSellerWarehouseReturns({ status: 'all' })
  const activeWarehouseReturnCount = (warehouseReturnsAll ?? []).filter(
    (r) =>
      r.status === WarehouseToSellerShipmentStatus.Pending ||
      r.status === WarehouseToSellerShipmentStatus.InTransit ||
      r.status === WarehouseToSellerShipmentStatus.Delivered,
  ).length

  // Seller-visible orders include the 1:1 OrderReturn nav; filter for active.
  const { data: ordersForReturns } = useMyOrders({ pageNumber: 1, pageSize: 100 })
  const activeOrderReturnCount = (ordersForReturns?.items ?? []).filter(
    (o) =>
      o.return &&
      (o.return.status === OrderReturnStatus.Approved ||
        o.return.status === OrderReturnStatus.ReturnInTransit ||
        o.return.status === OrderReturnStatus.SellerReceived),
  ).length

  /* ── Derived data ────────────────────────────────────────────────── */

  const itemStatuses = [
    'draft',
    'pending_verify',
    'pending_review',
    'pending_condition_confirmation',
    'approved',
    'active',
    'in_auction',
    'sold',
    'rejected',
  ]
  const auctionStatuses = ['draft', 'pending', 'scheduled', 'active', 'ended', 'sold', 'cancelled']

  const itemCounts = useMemo(
    () => countByStatus(itemsData?.items, itemStatuses),
    [itemsData?.items],
  )

  const auctionCounts = useMemo(
    () => countByStatus(auctionsData?.items, auctionStatuses),
    [auctionsData?.items],
  )

  const totalItems = itemsData?.metadata?.totalCount ?? 0
  const activeAuctions = auctionCounts['active']
  const soldAuctions = auctionCounts['sold'] ?? 0
  const pendingReview =
    (itemCounts['pending_verify'] ?? 0) +
    (itemCounts['pending_review'] ?? 0) +
    (itemCounts['pending_condition_confirmation'] ?? 0)

  const recentAuctions = useMemo(
    () => (auctionsData?.items ?? []).filter(Boolean).slice(0, 5),
    [auctionsData?.items],
  )

  // Pending actions
  const draftAuctions = auctionCounts['draft'] ?? 0
  const pendingItems =
    (itemCounts['pending_verify'] ?? 0) +
    (itemCounts['pending_review'] ?? 0) +
    (itemCounts['pending_condition_confirmation'] ?? 0)
  const hasPendingActions = draftAuctions > 0 || pendingItems > 0

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
        <Button
          type="link"
          onClick={() => navigate(`/auctions/${record.id}`)}
          style={{ padding: 0, fontWeight: 500 }}
        >
          {text ?? '-'}
        </Button>
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
      title: t('bids'),
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 80,
      responsive: ['md'],
      render: (count: number) => (
        <span style={{ fontFamily: monoFont, fontSize: 13 }}>{count ?? 0}</span>
      ),
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
    {
      title: t('endTime'),
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      responsive: ['lg'],
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {date ? formatDateTime(date) : '-'}
        </span>
      ),
    },
  ]


  const statusColorMap: Record<string, string> = {
    // Item
    draft: 'default',
    pending_verify: 'gold',
    pending_review: 'orange',
    pending_condition_confirmation: 'volcano',
    approved: 'green',
    active: 'blue',
    in_auction: 'cyan',
    sold: 'purple',
    rejected: 'red',

    // Auction
    pending: 'gold',
    scheduled: 'geekblue',
    ended: 'default',
    cancelled: 'red',
  }

  /* ── Dashboard content ──────────────────────────────────────────── */

  const dashboardContent = (
    <>
      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 20 : 32 }}>
        {[
          { icon: <AppstoreOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />, label: t('dashboard.totalItems'), value: totalItems },
          { icon: <ThunderboltOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />, label: t('dashboard.activeAuctions'), value: activeAuctions },
          { icon: <ClockCircleOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />, label: t('dashboard.pendingReview'), value: pendingReview },
          { icon: <DollarOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />, label: t('dashboard.sold'), value: soldAuctions },
        ].map((stat) => (
          <Col key={stat.label} xs={12} sm={6}>
            <Card style={statCardStyle} styles={{ body: { padding: isMobile ? '12px 14px' : '20px 24px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {stat.icon}
                <span style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, lineHeight: 1.3 }}>
                  {stat.label}
                </span>
              </div>
              <div style={{ fontFamily: monoFont, fontSize: isMobile ? 20 : 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                {stat.value}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Returns Widgets (warehouse + order) ────────────────────── */}
      <Row gutter={[isMobile ? 12 : 16, isMobile ? 12 : 16]} style={{ marginBottom: isMobile ? 20 : 24 }}>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            onClick={() => navigate('/seller/returns?tab=warehouse')}
            style={{ ...statCardStyle, cursor: 'pointer' }}
            styles={{ body: { padding: isMobile ? '12px 14px' : '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <RollbackOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, lineHeight: 1.3 }}>
                {t('dashboard.warehouseReturns', 'Items being returned by warehouse')}
              </span>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: isMobile ? 20 : 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {activeWarehouseReturnCount}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            onClick={() => navigate('/seller/returns?tab=order')}
            style={{ ...statCardStyle, cursor: 'pointer' }}
            styles={{ body: { padding: isMobile ? '12px 14px' : '20px 24px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <RollbackOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 11 : 13, lineHeight: 1.3 }}>
                {t('dashboard.orderReturns', 'Items buyer is returning after dispute')}
              </span>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: isMobile ? 20 : 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {activeOrderReturnCount}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Item Status Overview ───────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('dashboard.itemOverview')}</span>}
        style={{ ...statCardStyle, marginBottom: isMobile ? 16 : 24 }}
        styles={{ body: { padding: isMobile ? '12px 16px' : '20px 24px' } }}
      >
        <Space wrap size={[8, 8]}>
          {itemStatuses.map((s) => (
            <Tag
              key={s}
              color={statusColorMap[s] || 'default'}
              style={{
                cursor: 'pointer',
                borderRadius: 100,
                padding: '4px 12px',
                fontSize: 12,
                minHeight: 28,
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onClick={() => navigate(`/seller/items?status=${s}`)}
            >
              {tc(`statusLabel.${s}`, s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}
              {': '}
              <strong style={{ marginLeft: 2 }}>{itemCounts[s] ?? 0}</strong>
            </Tag>
          ))}
        </Space>

      </Card>

      {/* ── Auction Status Overview ────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('dashboard.auctionOverview')}</span>}
        style={{ ...statCardStyle, marginBottom: isMobile ? 16 : 24 }}
        styles={{ body: { padding: isMobile ? '12px 16px' : '20px 24px' } }}
      >
        <Space wrap size={[8, 8]}>
          {auctionStatuses.map((s) => (
            <Tag
              key={s}
              color={statusColorMap[s] || 'default'}
              style={{ cursor: 'pointer', borderRadius: 100, padding: '4px 12px', fontSize: 12, minHeight: 28, display: 'inline-flex', alignItems: 'center' }}
              onClick={() => navigate(`/seller/auctions?status=${s}`)}
            >
              {tc(`statusLabel.${s}`, s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}
              {': '}
              <strong style={{ marginLeft: 2 }}>{auctionCounts[s] ?? 0}</strong>
            </Tag>
          ))}
        </Space>
      </Card>

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('dashboard.quickActions')}</span>}
        style={{ ...statCardStyle, marginBottom: isMobile ? 16 : 24 }}
        styles={{ body: { padding: isMobile ? '12px 16px' : '20px 24px' } }}
      >
        {isMobile ? (
          <Row gutter={[8, 8]}>
            {[
              { icon: <PlusOutlined />, label: t('dashboard.createItem'), onClick: () => navigate('/seller/items/create'), type: 'primary' as const },
              { icon: <ShoppingOutlined />, label: t('dashboard.manageItems'), onClick: () => navigate('/seller/items') },
              { icon: <OrderedListOutlined />, label: t('dashboard.orders'), onClick: () => navigate('/seller/orders') },
              { icon: <WalletOutlined />, label: t('dashboard.wallet'), onClick: () => navigate('/seller/wallet') },
              { icon: <SendOutlined />, label: t('dashboard.ordersAwaitingShipment'), onClick: () => navigate('/seller/orders?status=paid') },
            ].map((action) => (
              <Col key={action.label} xs={12}>
                <Button
                  type={action.type}
                  icon={action.icon}
                  block
                  onClick={action.onClick}
                  style={{
                    ...(action.type === 'primary'
                      ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500 }
                      : outlinedBtnStyle),
                    minHeight: 44,
                    fontSize: 13,
                  }}
                >
                  {action.label}
                </Button>
              </Col>
            ))}
          </Row>
        ) : (
          <Space wrap size={12}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/seller/items/create')}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                fontWeight: 500,
                ...touchBtnStyle,
              }}
            >
              {t('dashboard.createItem')}
            </Button>
            <Button icon={<ShoppingOutlined />} onClick={() => navigate('/seller/items')} style={{ ...outlinedBtnStyle, ...touchBtnStyle }}>
              {t('dashboard.manageItems')}
            </Button>
            <Button icon={<OrderedListOutlined />} onClick={() => navigate('/seller/orders')} style={{ ...outlinedBtnStyle, ...touchBtnStyle }}>
              {t('dashboard.orders')}
            </Button>
            <Button icon={<WalletOutlined />} onClick={() => navigate('/seller/wallet')} style={{ ...outlinedBtnStyle, ...touchBtnStyle }}>
              {t('dashboard.wallet')}
            </Button>
            <Button icon={<SendOutlined />} onClick={() => navigate('/seller/orders?status=paid')} style={{ ...outlinedBtnStyle, ...touchBtnStyle }}>
              {t('dashboard.ordersAwaitingShipment')}
            </Button>
          </Space>
        )}
      </Card>

      {/* ── Recent Auctions ────────────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('recentAuctions')}</span>}
        style={{ ...statCardStyle, marginBottom: hasPendingActions ? (isMobile ? 16 : 24) : 0 }}
        styles={{ body: { padding: isMobile ? '0 8px 8px' : undefined, overflowX: 'auto' } }}
      >
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
      </Card>

      {/* ── Pending Actions ────────────────────────────────────────── */}
      {hasPendingActions && (
        <Card
          title={<span style={sectionTitleStyle}>{t('pendingActions')}</span>}
          style={statCardStyle}
          styles={{ body: { padding: isMobile ? '12px 16px' : '20px 24px' } }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {pendingItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 13 : 14 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {t('itemsPendingReview', { count: pendingItems })}
                </span>
                <Button
                  type="link"
                  onClick={() => navigate('/seller/items?status=pending_review')}
                  style={{ color: 'var(--color-accent)', padding: 0, minHeight: 36 }}
                >
                  {t('viewAll')}
                </Button>
              </div>
            )}
            {draftAuctions > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 13 : 14 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {t('draftAuctionsNeedSubmission', { count: draftAuctions })}
                </span>
                <Button
                  type="link"
                  onClick={() => navigate('/seller/auctions?status=draft')}
                  style={{ color: 'var(--color-accent)', padding: 0, minHeight: 36 }}
                >
                  {t('viewAll')}
                </Button>
              </div>
            )}
          </Space>
        </Card>
      )}
    </>
  )

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div style={{ padding: isMobile ? '0 0 24px' : undefined }}>
      {/* ── Welcome Banner + Wallet ─────────────────────────────────── */}
      <Row gutter={[isMobile ? 0 : 24, isMobile ? 16 : 16]} style={{ marginBottom: isMobile ? 20 : 24 }}>
        {/* Left: Welcome */}
        <Col xs={24} md={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: serifFont,
                fontWeight: 400,
                fontSize: isMobile ? 22 : 28,
                color: 'var(--color-text-primary)',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {profile.storeName}
            </h1>
            {profile.status === SellerProfileStatus.Verified && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'var(--color-success)',
                  color: '#fff',
                  borderRadius: 100,
                  padding: '3px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  lineHeight: '18px',
                }}
              >
                <CheckCircleOutlined style={{ fontSize: 12 }} />
                {t('verified')}
              </span>
            )}
            {profile.status !== SellerProfileStatus.Verified && (
              <StatusBadge status={profile.status} />
            )}
          </div>
          {profile.description && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? 13 : 14, margin: 0 }}>
              {profile.description}
            </p>
          )}
        </Col>

        {/* Right: Wallet summary */}
        <Col xs={24} md={8}>
          <Card
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-container)',
              backdropFilter: 'var(--oio-blur)',
              WebkitBackdropFilter: 'var(--oio-blur)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-md)',
            }}
            styles={{ body: { padding: isMobile ? '14px 16px' : '16px 20px' } }}
          >
            {isMobile ? (
              // Mobile: single row layout
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <WalletOutlined style={{ color: 'var(--color-accent)', fontSize: 15 }} />
                    <span style={{ fontFamily: serifFont, fontSize: 13, color: 'var(--color-text-primary)' }}>
                      {t('dashboard.walletBalance')}
                    </span>
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '--'}
                  </div>
                  {wallet && wallet.pendingBalance > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: monoFont, marginTop: 2 }}>
                      {t('pendingBalance')}: {formatCurrency(wallet.pendingBalance, wallet.currency)}
                    </div>
                  )}
                </div>
                <Space size={8}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => navigate('/seller/wallet/withdraw')}
                    style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500, borderRadius: 6, minHeight: 36 }}
                  >
                    {t('dashboard.withdraw')}
                  </Button>
                  <Button
                    size="small"
                    icon={<HistoryOutlined />}
                    onClick={() => navigate('/seller/wallet')}
                    style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontWeight: 500, borderRadius: 6, minHeight: 36 }}
                  >
                    {t('dashboard.history')}
                  </Button>
                </Space>
              </div>
            ) : (
              // Desktop: stacked layout
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <WalletOutlined style={{ color: 'var(--color-accent)', fontSize: 18 }} />
                  <span style={{ fontFamily: serifFont, fontSize: 15, color: 'var(--color-text-primary)' }}>
                    {t('dashboard.walletBalance')}
                  </span>
                </div>
                <div style={{ fontFamily: monoFont, fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 14 }}>
                  {wallet ? formatCurrency(wallet.availableBalance, wallet.currency) : '--'}
                </div>
                {wallet && wallet.pendingBalance > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14, fontFamily: monoFont }}>
                    {t('pendingBalance')}: {formatCurrency(wallet.pendingBalance, wallet.currency)}
                  </div>
                )}
                <Space size={8}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => navigate('/seller/wallet/withdraw')}
                    style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)', fontWeight: 500, borderRadius: 6 }}
                  >
                    {t('dashboard.withdraw')}
                  </Button>
                  <Button
                    size="small"
                    icon={<HistoryOutlined />}
                    onClick={() => navigate('/seller/wallet')}
                    style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', fontWeight: 500, borderRadius: 6 }}
                  >
                    {t('dashboard.history')}
                  </Button>
                </Space>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Dashboard Content ───────────────────────────────────────── */}
      {dashboardContent}
    </div>
  )
}