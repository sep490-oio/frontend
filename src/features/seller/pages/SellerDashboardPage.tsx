import { Row, Col, Card, Table, Button, Space, Spin, Empty, Tag } from 'antd'
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
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'
import { useMySellerProfile } from '@/features/seller/api'
import { useMyAuctions } from '@/features/auction/api'
import { useMyItems } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
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
      <Empty description={t('noProfile', 'Bạn chưa tạo hồ sơ người bán')}>
        <Button
          type="primary"
          onClick={() => navigate('/seller/register')}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('createProfile', 'Tạo hồ sơ người bán')}
        </Button>
      </Empty>
    )
  }

  /* ── Auction table columns ───────────────────────────────────────── */

  const auctionColumns: ColumnsType<AuctionListItemDto> = [
    {
      title: t('auctionTitle', 'Tiêu đề'),
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
      title: t('currentPrice', 'Giá hiện tại'),
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
      title: t('bids', 'Lượt đấu'),
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 80,
      render: (count: number) => (
        <span style={{ fontFamily: monoFont, fontSize: 13 }}>{count ?? 0}</span>
      ),
    },
    {
      title: t('status', 'Trạng thái'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="small" />,
    },
    {
      title: t('endTime', 'Kết thúc'),
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

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
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
            {profile.status === 'approved' && (
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
                {t('verified', 'Đã xác minh')}
              </span>
            )}
            {profile.status !== 'approved' && (
              <StatusBadge status={profile.status} />
            )}
          </div>
          {profile.description && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, margin: 0 }}>
              {profile.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <Card style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AppstoreOutlined style={{ color: 'var(--color-accent)', fontSize: 16 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {t('totalItems', 'Tổng sản phẩm')}
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
                {t('activeAuctions', 'Phiên đấu giá')}
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
                {t('pendingReview', 'Chờ duyệt')}
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
                {t('totalSales', 'Tổng bán')}
              </span>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              0
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── Item Status Overview ───────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('itemStatusOverview', 'Tổng quan sản phẩm')}</span>}
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
        title={<span style={sectionTitleStyle}>{t('auctionStatusOverview', 'Tổng quan đấu giá')}</span>}
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
        title={<span style={sectionTitleStyle}>{t('quickActions', 'Thao tác nhanh')}</span>}
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
            {t('createAuction', 'Tạo phiên đấu giá')}
          </Button>
          <Button
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/seller/items')}
            style={outlinedBtnStyle}
          >
            {t('manageItems', 'Quản lý sản phẩm')}
          </Button>
          <Button
            icon={<OrderedListOutlined />}
            onClick={() => navigate('/seller/orders')}
            style={outlinedBtnStyle}
          >
            {t('viewOrders', 'Đơn hàng')}
          </Button>
          <Button
            icon={<WalletOutlined />}
            onClick={() => navigate('/seller/wallet')}
            style={outlinedBtnStyle}
          >
            {t('wallet', 'Ví')}
          </Button>
        </Space>
      </Card>

      {/* ── Recent Auctions ────────────────────────────────────────── */}
      <Card
        title={<span style={sectionTitleStyle}>{t('recentAuctions', 'Phiên đấu giá gần đây')}</span>}
        style={{ marginBottom: hasPendingActions ? 24 : 0 }}
      >
        <Table<AuctionListItemDto>
          rowKey="id"
          columns={auctionColumns}
          dataSource={recentAuctions}
          loading={auctionsLoading}
          pagination={false}
          locale={{ emptyText: t('noAuctions', 'Chưa có phiên đấu giá nào') }}
        />
      </Card>

      {/* ── Pending Actions ────────────────────────────────────────── */}
      {hasPendingActions && (
        <Card
          title={<span style={sectionTitleStyle}>{t('pendingActions', 'Cần xử lý')}</span>}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {pendingItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {t('itemsPendingReview', '{{count}} sản phẩm đang chờ duyệt', { count: pendingItems })}
                </span>
                <Button
                  type="link"
                  onClick={() => navigate('/seller/items?status=pending')}
                  style={{ color: 'var(--color-accent)', padding: 0 }}
                >
                  {t('viewAll', 'Xem tất cả')}
                </Button>
              </div>
            )}
            {draftAuctions > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                  <ClockCircleOutlined style={{ marginRight: 8 }} />
                  {t('draftAuctionsNeedSubmission', '{{count}} phiên đấu giá nháp cần gửi duyệt', { count: draftAuctions })}
                </span>
                <Button
                  type="link"
                  onClick={() => navigate('/seller/auctions?status=draft')}
                  style={{ color: 'var(--color-accent)', padding: 0 }}
                >
                  {t('viewAll', 'Xem tất cả')}
                </Button>
              </div>
            )}
          </Space>
        </Card>
      )}
    </div>
  )
}
