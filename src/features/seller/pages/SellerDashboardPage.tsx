import { Row, Col, Card, Button, Space, Spin, Empty, Tag, Tabs } from 'antd'
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
import { useMySellerProfile } from '@/features/seller/api'
import { useMyAuctions } from '@/features/auction/api'
import { useMyItems } from '@/features/item/api'
import { useWallet } from '@/features/payment/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { SellerProfileStatus } from '@/types/enums'
import type { AuctionListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

/* ── Shared styles ───────────────────────────────────────────────────── */

const serifFont = "'DM Serif Display', Georgia, serif"
const monoFont = "'DM Mono', monospace"

const statCardStyle: React.CSSProperties = {
  background: 'var(--color-accent-light)',
  borderColor: 'var(--color-border)',
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
  const navigate = useNavigate()

  const { data: profile, isLoading: profileLoading } = useMySellerProfile()
  const { data: wallet } = useWallet()

  // Fetch all items (large page to get status counts)
  const { data: itemsData } = useMyItems({ pageNumber: 1, pageSize: 200 })
  // Fetch all auctions
  const { data: auctionsData, isLoading: auctionsLoading } = useMyAuctions({ pageNumber: 1, pageSize: 200 })

  /* ── Derived data ────────────────────────────────────────────────── */

  const itemStatuses = ['draft', 'pending', 'submitted', 'approved', 'active', 'in_auction', 'sold', 'rejected']
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
    (itemCounts['pending'] ?? 0) +
    (itemCounts['submitted'] ?? 0)

  const recentAuctions = useMemo(
    () => (auctionsData?.items ?? []).slice(0, 5),
    [auctionsData?.items],
  )

  // Pending actions
  const draftAuctions = auctionCounts['draft'] ?? 0
  const pendingItems = (itemCounts['pending'] ?? 0) + (itemCounts['submitted'] ?? 0)
  const hasPendingActions = draftAuctions > 0 || pendingItems > 0

  /* ── Loading / empty ─────────────────────────────────────────────── */

  if (profileLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Empty description={t('noProfile', 'Ban chua tao ho so nguoi ban')}>
        <Button
          type="primary"
          onClick={() => navigate('/seller/register')}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('createProfile', 'Tao ho so nguoi ban')}
        </Button>
      </Empty>
    )
  }

  /* ── Auction table columns ───────────────────────────────────────── */

  const auctionColumns: ColumnsType<AuctionListItemDto> = [
    {
      title: t('auctionTitle', 'Tieu de'),
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
      title: t('currentPrice', 'Gia hien tai'),
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 150,
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
      title: t('bids', 'Luot dau'),
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 80,
      render: (count: number) => (
        <span style={{ fontFamily: monoFont, fontSize: 13 }}>{count ?? 0}</span>
      ),
    },
    {
      title: t('status', 'Trang thai'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
    {
      title: t('endTime', 'Ket thuc'),
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {date ? formatDateTime(date) : '-'}
        </span>
      ),
    },
  ]

  /* ── Tab navigation handler ──────────────────────────────────────── */

  const handleTabChange = (key: string) => {
    switch (key) {
      case 'overview':
        break // stay on current page
      case 'auctions':
        navigate('/seller/auctions')
        break
      case 'items':
        navigate('/seller/items')
        break
      case 'orders':
        navigate('/seller/orders')
        break
      case 'disputes':
        navigate('/seller/disputes')
        break
    }
  }

  /* ── Dashboard content (Tong quan tab) ──────────────────────────── */

  const dashboardContent = (
    <>
      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <Card style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AppstoreOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('totalItems', 'Tong san pham')}
              </span>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {totalItems}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ThunderboltOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('activeAuctions', 'Phien dau gia')}
              </span>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {activeAuctions}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ClockCircleOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('pendingReview', 'Cho duyet')}
              </span>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {pendingReview}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <DollarOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('totalSold', 'Da ban')}
              </span>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {soldAuctions}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Item Status Overview ───────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('itemStatusOverview', 'Tong quan san pham')}</span>}
        style={{ marginBottom: 24 }}
      >
        <Space wrap size={[8, 8]}>
          {itemStatuses.map((s) => (
            <Tag
              key={s}
              style={{ cursor: 'pointer', borderRadius: 100, padding: '2px 12px', fontSize: 12 }}
              onClick={() => navigate(`/seller/items?status=${s}`)}
            >
              {t(`statusLabel.${s}`, s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}
              {': '}
              <strong>{itemCounts[s] ?? 0}</strong>
            </Tag>
          ))}
        </Space>
      </Card>

      {/* ── Auction Status Overview ────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('auctionStatusOverview', 'Tong quan dau gia')}</span>}
        style={{ marginBottom: 24 }}
      >
        <Space wrap size={[8, 8]}>
          {auctionStatuses.map((s) => (
            <Tag
              key={s}
              style={{ cursor: 'pointer', borderRadius: 100, padding: '2px 12px', fontSize: 12 }}
              onClick={() => navigate(`/seller/auctions?status=${s}`)}
            >
              {t(`statusLabel.${s}`, s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))}
              {': '}
              <strong>{auctionCounts[s] ?? 0}</strong>
            </Tag>
          ))}
        </Space>
      </Card>

      {/* ── Quick Actions ──────────────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('quickActions', 'Thao tac nhanh')}</span>}
        style={{ marginBottom: 24 }}
      >
        <Space wrap size={12}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/seller/auctions/create')}
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              fontWeight: 500,
            }}
          >
            {t('createAuction', 'Tao phien dau gia')}
          </Button>
          <Button
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/seller/items')}
            style={outlinedBtnStyle}
          >
            {t('manageItems', 'Quan ly san pham')}
          </Button>
          <Button
            icon={<OrderedListOutlined />}
            onClick={() => navigate('/seller/orders')}
            style={outlinedBtnStyle}
          >
            {t('viewOrders', 'Don hang')}
          </Button>
          <Button
            icon={<WalletOutlined />}
            onClick={() => navigate('/seller/wallet')}
            style={outlinedBtnStyle}
          >
            {t('wallet', 'Vi')}
          </Button>
        </Space>
      </Card>

      {/* ── Recent Auctions ────────────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('recentAuctions', 'Phien dau gia gan day')}</span>}
        style={{ marginBottom: hasPendingActions ? 24 : 0 }}
      >
        <ResponsiveTable<AuctionListItemDto>
          mobileMode="card"
          rowKey="id"
          columns={auctionColumns}
          dataSource={recentAuctions}
          loading={auctionsLoading}
          pagination={false}
          locale={{ emptyText: t('noAuctions', 'Chua co phien dau gia nao') }}
        />
      </Card>

      {/* ── Pending Actions ────────────────────────────────────────── */}
      {hasPendingActions && (
        <Card
          title={<span style={sectionTitleStyle}>{t('pendingActions', 'Can xu ly')}</span>}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {pendingItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {t('itemsPendingReview', '{{count}} san pham dang cho duyet', { count: pendingItems })}
                </span>
                <Button
                  type="link"
                  onClick={() => navigate('/seller/items?status=pending')}
                  style={{ color: 'var(--color-accent)', padding: 0 }}
                >
                  {t('viewAll', 'Xem tat ca')}
                </Button>
              </div>
            )}
            {draftAuctions > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {t('draftAuctionsNeedSubmission', '{{count}} phien dau gia nhap can gui duyet', { count: draftAuctions })}
                </span>
                <Button
                  type="link"
                  onClick={() => navigate('/seller/auctions?status=draft')}
                  style={{ color: 'var(--color-accent)', padding: 0 }}
                >
                  {t('viewAll', 'Xem tat ca')}
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
    <div>
      {/* ── Welcome Banner + Wallet ─────────────────────────────────── */}
      <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
        {/* Left: Welcome */}
        <Col xs={24} md={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1
              style={{
                fontFamily: serifFont,
                fontWeight: 400,
                fontSize: 28,
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
                {t('verified', 'Da xac minh')}
              </span>
            )}
            {profile.status !== SellerProfileStatus.Verified && (
              <StatusBadge status={profile.status} />
            )}
          </div>
          {profile.description && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
              {profile.description}
            </p>
          )}
        </Col>

        {/* Right: Wallet summary */}
        <Col xs={24} md={8}>
          <Card
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-accent-light)',
              borderRadius: 12,
            }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <WalletOutlined style={{ color: 'var(--color-accent)', fontSize: 18 }} />
              <span style={{ fontFamily: serifFont, fontSize: 15, color: 'var(--color-text-primary)' }}>
                {t('walletBalance', 'So du vi')}
              </span>
            </div>
            <div
              style={{
                fontFamily: monoFont,
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: 14,
              }}
            >
              {wallet
                ? formatCurrency(wallet.availableBalance, wallet.currency)
                : '--'}
            </div>
            {wallet && wallet.pendingBalance > 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 14,
                  fontFamily: monoFont,
                }}
              >
                {t('pendingBalance', 'Dang cho')}: {formatCurrency(wallet.pendingBalance, wallet.currency)}
              </div>
            )}
            <Space size={8}>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => navigate('/seller/wallet/withdraw')}
                style={{
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  fontWeight: 500,
                  borderRadius: 6,
                }}
              >
                {t('withdraw', 'Rut tien')}
              </Button>
              <Button
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => navigate('/seller/wallet')}
                style={{
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                  borderRadius: 6,
                }}
              >
                {t('history', 'Lich su')}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ── Tab Bar ─────────────────────────────────────────────────── */}
      <Tabs
        defaultActiveKey="overview"
        onChange={handleTabChange}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: 'overview',
            label: t('tabOverview', 'Tong quan'),
            children: dashboardContent,
          },
          {
            key: 'auctions',
            label: t('tabAuctions', 'Dau gia dang tham gia'),
            children: null,
          },
          {
            key: 'items',
            label: t('tabItems', 'Vat pham'),
            children: null,
          },
          {
            key: 'orders',
            label: t('tabOrders', 'Giao hang'),
            children: null,
          },
          {
            key: 'disputes',
            label: t('tabDisputes', 'Tranh chap'),
            children: null,
          },
        ]}
      />
    </div>
  )
}
