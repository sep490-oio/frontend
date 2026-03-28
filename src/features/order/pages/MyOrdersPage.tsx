import { useState, useEffect } from 'react'
import { Button, Tabs, Tag, Tooltip, Card, List, Flex } from 'antd'
import { EyeOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useMyOrders } from '@/features/order/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { OrderStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { OrderDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_TABS = [
  { key: 'all', label: 'all' },
  { key: OrderStatus.PendingPayment, label: 'pendingPayment' },
  { key: OrderStatus.Paid, label: 'paid' },
  { key: OrderStatus.Shipped, label: 'shipped' },
  { key: OrderStatus.Delivered, label: 'delivered' },
  { key: OrderStatus.Completed, label: 'completed' },
  { key: OrderStatus.Cancelled, label: 'cancelled' },
  { key: OrderStatus.Refunded, label: 'Refunded' },
  { key: OrderStatus.Disputed, label: 'Disputed' },
] as const

function formatCountdown(targetDate: string): string {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  return `${hours}h ${minutes}m`
}

function DecisionCountdown({ endsAt }: { endsAt: string }) {
  const [display, setDisplay] = useState(() => formatCountdown(endsAt))

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(formatCountdown(endsAt))
    }, 60_000)
    return () => clearInterval(interval)
  }, [endsAt])

  const isExpired = new Date(endsAt).getTime() <= Date.now()

  return (
    <Tooltip title={`Decision window ends: ${formatDateTime(endsAt)}`}>
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
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { isMobile } = useBreakpoint()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const params = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data, isLoading } = useMyOrders(params, { refetchInterval: 30000 })

  const columns: ColumnsType<OrderDto> = [
    {
      title: t('orderNumber', 'Order Number'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
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
      width: 120,
      render: (_: unknown, record: OrderDto) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`${prefix}/orders/${record.id}`)}
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
          fontFamily: "'DM Serif Display', Georgia, serif",
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
          dataSource={data?.items ?? []}
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
                    <Button
                      type="default"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`${prefix}/orders/${record.id}`)}
                    >
                      {t('viewDetail', 'View Detail')}
                    </Button>
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
          dataSource={data?.items ?? []}
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
