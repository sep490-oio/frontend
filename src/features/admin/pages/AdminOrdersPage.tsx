import { useState } from 'react'
import {
  Typography, Card, Tag, Input, Select, Flex, Avatar, DatePicker,
  Button, Space,
} from 'antd'
import { SearchOutlined, ShoppingCartOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAdminOrders } from '@/features/admin/api'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { AdminOrderListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'orange',
  paid: 'green',
  processing: 'blue',
  picked_up: 'cyan',
  on_delivering: 'geekblue',
  shipped: 'geekblue',
  delivered: 'lime',
  completed: 'success',
  cancelled: 'default',
  refunded: 'warning',
  disputed: 'error',
}

function useStatusOptions() {
  const { t } = useTranslation('admin')
  return [
    { value: 'pending_payment', label: t('orders.statusOptions.pendingPayment', 'Pending Payment') },
    { value: 'paid', label: t('orders.statusOptions.paid', 'Paid') },
    { value: 'processing', label: t('orders.statusOptions.processing', 'Processing') },
    { value: 'picked_up', label: t('orders.statusOptions.pickedUp', 'Picked Up') },
    { value: 'on_delivering', label: t('orders.statusOptions.onDelivering', 'On Delivering') },
    { value: 'delivered', label: t('orders.statusOptions.delivered', 'Delivered') },
    { value: 'completed', label: t('orders.statusOptions.completed', 'Completed') },
    { value: 'cancelled', label: t('orders.statusOptions.cancelled', 'Cancelled') },
    { value: 'refunded', label: t('orders.statusOptions.refunded', 'Refunded') },
    { value: 'disputed', label: t('orders.statusOptions.disputed', 'Disputed') },
  ]
}

export default function AdminOrdersPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const statusOptions = useStatusOptions()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const { data, isLoading, refetch } = useAdminOrders({
    pageNumber: page,
    pageSize,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(dateRange?.[0] ? { fromDate: dateRange[0].startOf('day').toISOString() } : {}),
    ...(dateRange?.[1] ? { toDate: dateRange[1].endOf('day').toISOString() } : {}),
  })

  const items = data?.items ?? []
  const total = data?.metadata?.totalCount ?? 0

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleReset = () => {
    setSearchInput('')
    setSearch('')
    setStatus(undefined)
    setDateRange(null)
    setPage(1)
  }

  const columns: ColumnsType<AdminOrderListItemDto> = [
    {
      title: t('orders.columns.orderNumber', 'Order #'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 130,
      render: (num: string) => (
        <Typography.Text strong style={{ fontSize: 13, color: 'var(--color-accent)' }}>
          {num}
        </Typography.Text>
      ),
    },
    {
      title: t('orders.columns.item', 'Item'),
      key: 'item',
      width: 220,
      render: (_, record) => (
        <Flex align="center" gap={10}>
          <Avatar
            shape="square"
            size={36}
            src={record.itemPrimaryImageUrl ?? undefined}
            style={{ flexShrink: 0, background: 'var(--color-accent-light)' }}
          />
          <Typography.Text ellipsis style={{ fontSize: 13, maxWidth: 160 }}>
            {record.itemTitle ?? '—'}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: t('orders.columns.buyer', 'Buyer'),
      dataIndex: 'buyerDisplayName',
      key: 'buyer',
      width: 130,
      render: (name: string | null) => (
        <Typography.Text type={name ? undefined : 'secondary'} style={{ fontSize: 13 }}>
          {name ?? '—'}
        </Typography.Text>
      ),
    },
    {
      title: t('orders.columns.seller', 'Seller'),
      dataIndex: 'sellerDisplayName',
      key: 'seller',
      width: 130,
      render: (name: string | null) => (
        <Typography.Text type={name ? undefined : 'secondary'} style={{ fontSize: 13 }}>
          {name ?? '—'}
        </Typography.Text>
      ),
    },
    {
      title: t('orders.columns.amount', 'Amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (amount: number) => (
        <Typography.Text strong style={{ fontSize: 13 }}>
          {formatCurrency(amount)}
        </Typography.Text>
      ),
    },
    {
      title: t('orders.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => (
        <Tag color={STATUS_COLOR[s] ?? 'default'} style={{ fontWeight: 500 }}>
          {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </Tag>
      ),
    },
    {
      title: t('orders.columns.created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => (
        <Typography.Text style={{ fontSize: 12 }}>{formatDateTime(date)}</Typography.Text>
      ),
    },
    {
      title: t('orders.columns.action', 'Action'),
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${record.id}`) }}
          style={{ padding: 0 }}
        >
          {t('common:action.viewDetail', 'View Detail')}
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 16 : 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0, fontSize: isMobile ? 18 : undefined }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} />
            {t('orders.title', 'Orders')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('orders.subtitle', 'All platform orders')}
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
      </Flex>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} styles={{ body: { padding: isMobile ? 12 : 24 } }}>
        {isMobile ? (
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Input
              placeholder={t('orders.filters.search', 'Search by order # or ID...')}
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: '100%', minHeight: 44 }}
              allowClear
              onClear={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            />
            <Select
              placeholder={t('orders.filters.status', 'Status')}
              value={status}
              onChange={(v) => { setStatus(v); setPage(1) }}
              allowClear
              style={{ width: '100%' }}
              options={statusOptions}
            />
            <RangePicker
              value={dateRange}
              onChange={(v) => { setDateRange(v); setPage(1) }}
              style={{ width: '100%' }}
            />
            <Flex gap={8}>
              <Button type="primary" onClick={handleSearch} block style={{ minHeight: 44 }}>
                {tc('action.search', 'Search')}
              </Button>
              <Button onClick={handleReset} block style={{ minHeight: 44 }}>
                {tc('action.reset', 'Reset')}
              </Button>
            </Flex>
          </Space>
        ) : (
          <Flex wrap="wrap" gap={12} align="center">
            <Input
              placeholder={t('orders.filters.search', 'Search by order # or ID...')}
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 220 }}
              allowClear
              onClear={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            />
            <Select
              placeholder={t('orders.filters.status', 'Status')}
              value={status}
              onChange={(v) => { setStatus(v); setPage(1) }}
              allowClear
              style={{ width: 180 }}
              options={statusOptions}
            />
            <RangePicker
              value={dateRange}
              onChange={(v) => { setDateRange(v); setPage(1) }}
              style={{ width: 280 }}
            />
            <Space>
              <Button type="primary" onClick={handleSearch}>{tc('action.search', 'Search')}</Button>
              <Button onClick={handleReset}>{tc('action.reset', 'Reset')}</Button>
            </Space>
          </Flex>
        )}
      </Card>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: isMobile ? 0 : 24 } }}>
        <div style={{ overflowX: 'auto' }}>
          <ResponsiveTable<AdminOrderListItemDto>
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={isLoading}
            mobileMode="list"
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps) },
              showTotal: (total) => t('orders.pagination.total', '{{count}} orders', { count: total }),
              showSizeChanger: !isMobile,
              pageSizeOptions: ['10', '15', '25', '50'],
              simple: isMobile,
            }}
            onRow={(record) => ({
              onClick: () => navigate(`/admin/orders/${record.id}`),
              style: { cursor: 'pointer', minHeight: 56 },
            })}
          />
        </div>
      </Card>
    </div>
  )
}
