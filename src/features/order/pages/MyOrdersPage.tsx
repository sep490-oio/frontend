import { useState, useEffect } from 'react'
import { Button, Tabs, Tag, Tooltip, Card, List, Flex } from 'antd'
import { EyeOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons'
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
import { SERIF_FONT } from '@/styles/tokens'

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
        style={{ fontSize: 12 }}
      >
        {display}
      </Tag>
    </Tooltip>
  )
}

const RETURN_STATUS_COLORS: Record<string, string> = {
  requested: 'orange',
  approved: 'blue',
  rejected: 'red',
  shipped: 'cyan',
  received: 'geekblue',
  completed: 'green',
  cancelled: 'default',
}

export default function MyOrdersPage() {
  const { t } = useTranslation('order')
  const { t: tc } = useTranslation('common')

  // Synthetic tab keys beyond OrderStatus: "returns" = client-side filter that
  // shows only orders with an active (non-terminal) OrderReturn.
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

  // The "Returns" tab is a client-side filter: we pull a wider page (no BE
  // status param) and filter by the presence of an active OrderReturn.
  const isReturnsTab = statusFilter === RETURNS_TAB_KEY
  const params = isReturnsTab
    ? { pageNumber: page, pageSize: Math.max(pageSize, 50) }
    : {
        pageNumber: page,
        pageSize,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }

  const { data, isLoading } = useMyOrders(params, { refetchInterval: 30000 })

  const ACTIVE_RETURN_STATUSES = new Set<string>([
    OrderReturnStatus.Requested,
    OrderReturnStatus.Approved,
    OrderReturnStatus.ReturnInTransit,
    OrderReturnStatus.SellerReceived,
    OrderReturnStatus.BuyerFollowup,
  ])

  // Filter out orders that the user is selling (outbound). /me/orders should strictly be for purchases.
  const items = (data?.items ?? []).filter((order: OrderDto) => order.buyerId === user?.id)
  const displayItems = isReturnsTab
    ? items.filter((o) => o.return && ACTIVE_RETURN_STATUSES.has(o.return.status))
    : items

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
            fontFamily: "var(--font-mono)",
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: '-0.01em',
          }}
        >
          {orderNumber}
        </Button>
      ),
    },
    {
      title: t('totalAmount', 'Total Amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 160,
      render: (amount: number, record) => (
        <PriceDisplay amount={amount} currency={record.currency} size="small" />
      ),
    },
    {
      title: t('statusLabel', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StatusBadge status={status} />
          {record.decisionWindowEndsAt && status === OrderStatus.Delivered && (
            <DecisionCountdown endsAt={record.decisionWindowEndsAt} />
          )}
        </div>
      ),
    },
    {
      title: t('returnStatus', 'Return'),
      key: 'return',
      width: 120,
      render: (_: unknown, record: OrderDto) => {
        if (!record.return) return null
        const color = RETURN_STATUS_COLORS[record.return.status] ?? 'default'
        return (
          <Tag color={color} style={{ fontSize: 12 }}>
            {t(`returnStatus.${record.return.status}`, record.return.status)}
          </Tag>
        )
      },
    },
    {
      title: t('createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {formatDateTime(date)}
        </span>
      ),
    },
    {
      title: tc('action.view', 'Actions'),
      key: 'actions',
      width: 140,
      render: (_: unknown, record: OrderDto) =>
        record.status === OrderStatus.PendingPayment && record.buyerId === user?.id ? (
          <Button
            type="primary"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => navigate(`/checkout/${record.id}`)}
          >
            {t('payNow', 'Pay Now')}
          </Button>
        ) : (
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/me/orders/${record.id}`)}
            style={{ transition: 'color 200ms ease' }}
          >
            {t('viewDetail', 'View Detail')}
          </Button>
        ),
    },
  ]

  return (
    <div>
      {/* Serif heading */}
      <h1
        style={{
          fontFamily: SERIF_FONT,
          fontWeight: 400,
          fontSize: 28,
          color: 'var(--color-text-primary)',
          marginBottom: 4,
          letterSpacing: '-0.01em',
        }}
      >
        {t('myOrders', 'My Orders')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
        {t('myOrdersSubtitle', 'Track and manage your purchases')}
      </p>

      {/* Status tabs styled as pills */}
      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key)
          setPage(1)
        }}
        items={STATUS_TABS.map((tab) => ({
          key: tab.key,
          label: (
            <span
              style={{
                padding: '4px 14px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 200ms ease',
                ...(statusFilter === tab.key
                  ? {
                      background: 'var(--color-accent)',
                      color: '#fff',
                    }
                  : {
                      background: 'transparent',
                      color: 'var(--color-text-secondary)',
                    }),
              }}
            >
              {t(`statusTab.${tab.label}`, tab.label)}
            </span>
          ),
        }))}
        style={{ marginBottom: 16 }}
      />

      {isMobile ? (
        /* Mobile card view */
        <List
          dataSource={displayItems}
          loading={isLoading}
          pagination={{
            current: data?.metadata?.currentPage ?? page,
            pageSize: data?.metadata?.pageSize ?? pageSize,
            total: data?.metadata?.totalCount ?? 0,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          renderItem={(record: OrderDto) => (
            <List.Item style={{ padding: '8px 0', border: 'none' }}>
              <Card
                size="small"
                style={{ width: '100%', borderRadius: 10 }}
                styles={{ body: { padding: '12px 16px' } }}
              >
                <Flex vertical gap={8}>
                  {record.item && <OrderItemSummary item={record.item} variant="row" />}
                  <Flex justify="space-between" align="center">
                    <Button
                      type="link"
                      style={{
                        padding: 0,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                      onClick={() => navigate(`${prefix}/orders/${record.id}`)}
                    >
                      {record.orderNumber}
                    </Button>
                    <Flex gap={4} align="center">
                      <StatusBadge status={record.status} />
                      {record.decisionWindowEndsAt && record.status === OrderStatus.Delivered && (
                        <DecisionCountdown endsAt={record.decisionWindowEndsAt} />
                      )}
                    </Flex>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      {t('totalAmount', 'Total Amount')}
                    </span>
                    <PriceDisplay amount={record.totalAmount} currency={record.currency} size="small" />
                  </Flex>
                  {record.return && (
                    <Flex justify="space-between" align="center">
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
                        {t('returnStatus', 'Return')}
                      </span>
                      <Tag color={RETURN_STATUS_COLORS[record.return.status] ?? 'default'} style={{ fontSize: 12 }}>
                        {t(`returnStatus.${record.return.status}`, record.return.status)}
                      </Tag>
                    </Flex>
                  )}
                  <Flex justify="space-between" align="center">
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                      {formatDateTime(record.createdAt)}
                    </span>
                    {record.status === OrderStatus.PendingPayment && record.buyerId === user?.id ? (
                      <Button
                        type="primary"
                        size="small"
                        icon={<DollarOutlined />}
                        onClick={() => navigate(`/checkout/${record.id}`)}
                      >
                        {t('payNow', 'Pay Now')}
                      </Button>
                    ) : (
                      <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/me/orders/${record.id}`)}
                      >
                        {t('viewDetail', 'View Detail')}
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <ResponsiveTable<OrderDto>
          mobileMode="card"
          rowKey="id"
          columns={columns}
          dataSource={displayItems}
          loading={isLoading}
          pagination={{
            current: data?.metadata?.currentPage ?? page,
            pageSize: data?.metadata?.pageSize ?? pageSize,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => tc('pagination.total', { total }),
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
        />
      )}
    </div>
  )
}
