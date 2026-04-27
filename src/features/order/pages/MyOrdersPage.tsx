import { useState, useEffect } from 'react'
import { Button, Tag, Tooltip, Card, Flex, Typography, Spin, Empty, Pagination } from 'antd'
import { EyeOutlined, ClockCircleOutlined, DollarOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useMyOrders } from '@/features/order/api'
import { OrderItemSummary } from '@/features/order/components/OrderItemSummary'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { OrderStatus, OrderReturnStatus } from '@/types/enums'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime } from '@/utils/format'
import type { OrderDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title, Text } = Typography

function formatCountdown(targetDate: string, expiredLabel: string): string {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return expiredLabel
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}m`
}

function DecisionCountdown({ endsAt }: { endsAt: string }) {
  const { t } = useTranslation('order')
  const expiredLabel = t('expired')
  const [display, setDisplay] = useState(() => formatCountdown(endsAt, expiredLabel))

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(formatCountdown(endsAt, expiredLabel))
    }, 60_000)
    return () => clearInterval(interval)
  }, [endsAt, expiredLabel])

  const isExpired = new Date(endsAt).getTime() <= Date.now()

  return (
    <Tooltip title={t('decisionWindowEnds', { date: formatDateTime(endsAt) })}>
      <Tag
        icon={<ClockCircleOutlined />}
        color={isExpired ? 'default' : 'warning'}
        style={{ fontSize: 12, borderRadius: 6 }}
      >
        {display}
      </Tag>
    </Tooltip>
  )
}

export default function MyOrdersPage() {
  const { t } = useTranslation('order')
  const { t: tc } = useTranslation('common')

  const RETURNS_TAB_KEY = 'returns'

  const STATUS_TABS = [
    { key: 'all', label: 'all' },
    { key: OrderStatus.PendingPayment, label: 'pendingPayment' },
    { key: OrderStatus.Paid, label: 'paid' },
    { key: OrderStatus.OnDelivering, label: 'on_delivering' },
    { key: OrderStatus.Delivered, label: 'delivered' },
    { key: OrderStatus.Completed, label: 'completed' },
    { key: OrderStatus.Cancelled, label: 'cancelled' },
    { key: OrderStatus.Refunded, label: 'Refunded' },
    { key: OrderStatus.Disputed, label: 'Disputed' },
    { key: RETURNS_TAB_KEY, label: 'returns' },
  ]
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { user } = useAuth()
  const { isMobile } = useBreakpoint()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const isGroupedTab = statusFilter === OrderStatus.OnDelivering || statusFilter === OrderStatus.Paid
  const isReturnsTab = statusFilter === RETURNS_TAB_KEY
  const params = isReturnsTab
    ? { pageNumber: page, pageSize: Math.max(pageSize, 50) }
    : {
      pageNumber: page,
      pageSize,
      ...(statusFilter !== 'all' && !isGroupedTab ? { status: statusFilter } : {}),
    }

  const { data, isLoading } = useMyOrders(params, { refetchInterval: 30000 })

  const ACTIVE_RETURN_STATUSES = new Set<string>([
    OrderReturnStatus.Requested,
    OrderReturnStatus.Approved,
    OrderReturnStatus.ReturnInTransit,
    OrderReturnStatus.SellerReceived,
    OrderReturnStatus.BuyerFollowup,
  ])

  const ON_DELIVERING_GROUP = new Set<string>([OrderStatus.OnDelivering, OrderStatus.Shipped, OrderStatus.PickedUp])
  const PAID_GROUP = new Set<string>([OrderStatus.Paid, OrderStatus.Processing])

  const matchesTab = (orderStatus: string, tabKey: string) => {
    if (tabKey === 'all') return true
    if (tabKey === OrderStatus.OnDelivering) return ON_DELIVERING_GROUP.has(orderStatus as OrderStatus)
    if (tabKey === OrderStatus.Paid) return PAID_GROUP.has(orderStatus as OrderStatus)
    return orderStatus === tabKey
  }

  const items = (data?.items ?? []).filter((order: OrderDto) => !user?.id || order.buyerId === user.id)

  const displayItems = isReturnsTab
    ? items.filter((o) => o.return && ACTIVE_RETURN_STATUSES.has(o.return.status))
    : items.filter((o) => matchesTab(o.status, statusFilter))

  const columns: ColumnsType<OrderDto> = [
    {
      title: t('product', 'Product'),
      key: 'product',
      render: (_: unknown, record: OrderDto) =>
        record.item ? (
          <OrderItemSummary item={record.item} variant="row" />
        ) : (
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>—</span>
        ),
    },
    {
      title: t('orderNumber', 'Order Number'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 160,
      render: (orderNumber: string, record) => (
        <Button
          type="link"
          onClick={() => navigate(`${prefix}/orders/${record.id}`)}
          style={{
            padding: 0,
            fontFamily: MONO_FONT,
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--color-accent)'
          }}
        >
          #{orderNumber}
        </Button>
      ),
    },
    {
      title: t('totalAmount', 'Total Amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 160,
      render: (amount: number, record) => (
        <div style={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: 15 }}>
          <PriceDisplay amount={amount} currency={record.currency} />
        </div>
      ),
    },
    {
      title: t('statusLabel', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, record) => (
        <Flex vertical gap={4} align="flex-start">
          <StatusBadge status={status} size="small" />
          {record.decisionWindowEndsAt && status === OrderStatus.Delivered && (
            <DecisionCountdown endsAt={record.decisionWindowEndsAt} />
          )}
        </Flex>
      ),
    },
    {
      title: tc('action.view', 'Actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: OrderDto) =>
        record.status === OrderStatus.PendingPayment && record.buyerId === user?.id ? (
          <Button
            type="primary"
            size="middle"
            icon={<DollarOutlined />}
            onClick={() => navigate(`/checkout/${record.id}`)}
            style={{ borderRadius: 10, fontWeight: 600, background: 'var(--color-accent)', border: 'none', height: 38 }}
          >
            {t('payNow', 'Pay')}
          </Button>
        ) : (
          <Button
            size="middle"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/me/orders/${record.id}`)}
            style={{ borderRadius: 10, fontWeight: 600, height: 38 }}
          >
            {t('viewDetail', 'View')}
          </Button>
        ),
    },
  ]

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '32px 24px 80px' }}>
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
          <ShoppingOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
          {t('myOrders', 'My Orders')}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          {t('myOrdersSubtitle', 'Track and manage your purchases')}
        </Text>
      </div>

      {/* Pill Filters */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          paddingBottom: isMobile ? 4 : 0,
          msOverflowStyle: 'none'
        }}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key)
                setPage(1)
              }}
              style={{
                padding: '8px 20px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: SANS_FONT,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 38,
                border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                background: isActive ? 'var(--color-accent)' : 'var(--color-bg-card)',
                color: isActive ? '#fff' : 'var(--color-text-secondary)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {t(`statusTab.${tab.label}`, tab.label)}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : displayItems.length === 0 ? (
        <Empty
          description={t('noOrdersYet', 'You have no orders yet')}
          style={{ padding: 80, background: 'var(--color-bg-card)', borderRadius: 24, border: '1px solid var(--color-border)' }}
        />
      ) : isMobile ? (
        /* Mobile Card View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayItems.map((record: OrderDto) => (
             <div
                key={record.id}
                onClick={() => navigate(`${prefix}/orders/${record.id}`)}
                className="oio-press"
                style={{
                   background: 'var(--color-bg-card)',
                   border: '1px solid var(--color-border)',
                   borderRadius: 24,
                   padding: 16,
                   cursor: 'pointer',
                   boxShadow: 'var(--shadow-sm)'
                }}
             >
                <Flex vertical gap={16}>
                   {record.item && <OrderItemSummary item={record.item} variant="row" />}
                   
                   <Flex justify="space-between" align="center" style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 12 }}>
                      <Text style={{ fontFamily: MONO_FONT, fontWeight: 700, color: 'var(--color-accent)', fontSize: 13 }}>#{record.orderNumber}</Text>
                      <StatusBadge status={record.status} size="small" />
                   </Flex>

                   <Flex justify="space-between" align="baseline">
                      <div style={{ fontFamily: MONO_FONT, fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)' }}>
                         <PriceDisplay amount={record.totalAmount} currency={record.currency} />
                      </div>
                      <Text style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {formatDateTime(record.createdAt)}
                      </Text>
                   </Flex>

                   {record.status === OrderStatus.PendingPayment && record.buyerId === user?.id && (
                      <Button
                        type="primary"
                        block
                        icon={<DollarOutlined />}
                        onClick={(e) => { e.stopPropagation(); navigate(`/checkout/${record.id}`) }}
                        style={{ background: 'var(--color-accent)', fontWeight: 700, height: 44, borderRadius: 12, marginTop: 4 }}
                      >
                        {t('payNow', 'Pay Now')}
                      </Button>
                   )}
                </Flex>
             </div>
          ))}
          <Flex justify="center" style={{ marginTop: 32 }}>
             <Pagination
                current={page}
                pageSize={pageSize}
                total={data?.metadata?.totalCount ?? 0}
                onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
             />
          </Flex>
        </div>
      ) : (
        /* Desktop Table View */
        <Card
          styles={{ body: { padding: 0 } }}
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <ResponsiveTable<OrderDto>
            mobileMode="card"
            rowKey="id"
            columns={columns}
            dataSource={displayItems}
            pagination={{
              current: data?.metadata?.currentPage ?? page,
              pageSize: data?.metadata?.pageSize ?? pageSize,
              total: data?.metadata?.totalCount ?? 0,
              showSizeChanger: !isMobile,
              showTotal: (total) => tc('pagination.total', { total }),
              size: isMobile ? 'small' : undefined,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              },
            }}
          />
        </Card>
      )}
    </div>
  )
}
