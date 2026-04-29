import { useState } from 'react'
import {
  Typography, Card, Tag, Button, Space, Input, Select, Switch, Flex, Avatar, Tooltip, Badge,
} from 'antd'
import { SearchOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAdminCompletedAuctions } from '@/features/admin/api'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { AdminCompletedAuctionListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  pending_payment: 'orange',
  paid: 'green',
  payment_overdue: 'red',
}

const FULFILLMENT_STATUS_COLOR: Record<string, string> = {
  awaiting_seller_ship: 'default',
  warehouse_outbound_pending: 'blue',
  picked_up: 'cyan',
  on_delivering: 'processing',
  delivered: 'success',
  shipping_overdue: 'error',
  escalated: 'error',
}

export default function AdminCompletedAuctionsPage() {
  const { t } = useTranslation('admin')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>()
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string | undefined>()
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useAdminCompletedAuctions({
    pageNumber: page,
    pageSize,
    ...(search ? { search } : {}),
    ...(paymentStatus ? { paymentStatus: paymentStatus as import('@/types').AdminAuctionPaymentStatus } : {}),
    ...(fulfillmentStatus ? { fulfillmentStatus: fulfillmentStatus as import('@/types').AdminAuctionFulfillmentStatus } : {}),
    ...(onlyOverdue ? { onlyOverdue: true } : {}),
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
    setPaymentStatus(undefined)
    setFulfillmentStatus(undefined)
    setOnlyOverdue(false)
    setPage(1)
  }

  const columns: ColumnsType<AdminCompletedAuctionListItemDto> = [
    {
      title: t('completedAuctions.columns.item'),
      key: 'item',
      width: 240,
      render: (_, record) => (
        <Flex align="center" gap={10}>
          <Avatar
            shape="square"
            size={36}
            src={record.itemPrimaryImageUrl ?? undefined}
            style={{ flexShrink: 0, background: 'var(--color-accent-light)' }}
          />
          <Typography.Text strong style={{ fontSize: 13 }}>
            {record.itemTitle}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: t('completedAuctions.columns.winner'),
      dataIndex: 'winnerDisplayName',
      key: 'winner',
      width: 130,
      render: (name: string | null) => (
        <Typography.Text type={name ? undefined : 'secondary'} style={{ fontSize: 13 }}>
          {name ?? '—'}
        </Typography.Text>
      ),
    },
    {
      title: t('completedAuctions.columns.seller'),
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
      title: t('completedAuctions.columns.finalPrice'),
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      width: 120,
      render: (price: number) => (
        <Typography.Text strong style={{ fontSize: 13 }}>
          {formatCurrency(price)}
        </Typography.Text>
      ),
    },
    {
      title: t('completedAuctions.columns.orderNumber'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (num: string | null) => (
        <Typography.Text type={num ? undefined : 'secondary'} style={{ fontSize: 12 }}>
          {num ?? '—'}
        </Typography.Text>
      ),
    },
    {
      title: t('completedAuctions.columns.paymentStatus'),
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 150,
      render: (status: string | null) => {
        if (!status) return <Typography.Text type="secondary">—</Typography.Text>
        return (
          <Tag color={PAYMENT_STATUS_COLOR[status] ?? 'default'} style={{ fontWeight: 500 }}>
            {t(`completedAuctions.paymentStatus.${status}`, status)}
          </Tag>
        )
      },
    },
    {
      title: t('completedAuctions.columns.fulfillmentStatus'),
      dataIndex: 'fulfillmentStatus',
      key: 'fulfillmentStatus',
      width: 170,
      render: (status: string | null) => {
        if (!status) return <Typography.Text type="secondary">—</Typography.Text>
        const isOverdue = status === 'shipping_overdue' || status === 'escalated'
        return (
          <Tag color={FULFILLMENT_STATUS_COLOR[status] ?? 'default'} icon={isOverdue ? <WarningOutlined /> : undefined} style={{ fontWeight: 500 }}>
            {t(`completedAuctions.fulfillmentStatus.${status}`, status)}
          </Tag>
        )
      },
    },
    {
      title: 'Ship by',
      dataIndex: 'shipByAt',
      key: 'shipByAt',
      width: 150,
      render: (date: string | null, record) => {
        if (!date) return <Typography.Text type="secondary">—</Typography.Text>
        return (
          <Flex align="center" gap={6}>
            <Typography.Text style={{ fontSize: 12 }}>{formatDateTime(date)}</Typography.Text>
            {record.isShippingOverdue && (
              <Tooltip title="Shipping overdue">
                <Badge status="error" />
              </Tooltip>
            )}
          </Flex>
        )
      },
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 16 : 24 }}>
        <div>
          <Typography.Title level={isMobile ? 3 : 3} style={{ margin: 0, fontSize: isMobile ? 18 : undefined }}>
            <TrophyOutlined style={{ marginRight: 8 }} />
            {t('completedAuctions.title')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('completedAuctions.subtitle')}
          </Typography.Text>
        </div>
      </Flex>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} styles={{ body: { padding: isMobile ? 12 : 24 } }}>
        {isMobile ? (
          /* Mobile: vertical stacked filters */
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Input
              placeholder={t('completedAuctions.filters.search')}
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: '100%', minHeight: 44 }}
              allowClear
              onClear={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            />
            <Select
              placeholder={t('completedAuctions.filters.paymentStatus')}
              value={paymentStatus}
              onChange={(v) => { setPaymentStatus(v); setPage(1) }}
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: 'pending_payment', label: t('completedAuctions.paymentStatus.pending_payment') },
                { value: 'paid', label: t('completedAuctions.paymentStatus.paid') },
                { value: 'payment_overdue', label: t('completedAuctions.paymentStatus.payment_overdue') },
              ]}
            />
            <Select
              placeholder={t('completedAuctions.filters.fulfillmentStatus')}
              value={fulfillmentStatus}
              onChange={(v) => { setFulfillmentStatus(v); setPage(1) }}
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: 'awaiting_seller_ship', label: t('completedAuctions.fulfillmentStatus.awaiting_seller_ship') },
                { value: 'warehouse_outbound_pending', label: t('completedAuctions.fulfillmentStatus.warehouse_outbound_pending') },
                { value: 'picked_up', label: t('completedAuctions.fulfillmentStatus.picked_up') },
                { value: 'on_delivering', label: t('completedAuctions.fulfillmentStatus.on_delivering') },
                { value: 'delivered', label: t('completedAuctions.fulfillmentStatus.delivered') },
                { value: 'shipping_overdue', label: t('completedAuctions.fulfillmentStatus.shipping_overdue') },
                { value: 'escalated', label: t('completedAuctions.fulfillmentStatus.escalated') },
              ]}
            />
            <Flex align="center" gap={10} style={{ minHeight: 44 }}>
              <Switch
                checked={onlyOverdue}
                onChange={(v) => { setOnlyOverdue(v); setPage(1) }}
              />
              <Typography.Text style={{ fontSize: 14 }}>{t('completedAuctions.filters.onlyOverdue')}</Typography.Text>
            </Flex>
            <Flex gap={8}>
              <Button type="primary" onClick={handleSearch} block style={{ minHeight: 44 }}>{t('common.search', 'Search')}</Button>
              <Button onClick={handleReset} block style={{ minHeight: 44 }}>{t('common.reset', 'Reset')}</Button>
            </Flex>
          </Space>
        ) : (
          /* Desktop: horizontal filters */
          <Flex wrap="wrap" gap={12} align="center">
            <Input
              placeholder={t('completedAuctions.filters.search')}
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 220 }}
              allowClear
              onClear={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            />
            <Select
              placeholder={t('completedAuctions.filters.paymentStatus')}
              value={paymentStatus}
              onChange={(v) => { setPaymentStatus(v); setPage(1) }}
              allowClear
              style={{ width: 190 }}
              options={[
                { value: 'pending_payment', label: t('completedAuctions.paymentStatus.pending_payment') },
                { value: 'paid', label: t('completedAuctions.paymentStatus.paid') },
                { value: 'payment_overdue', label: t('completedAuctions.paymentStatus.payment_overdue') },
              ]}
            />
            <Select
              placeholder={t('completedAuctions.filters.fulfillmentStatus')}
              value={fulfillmentStatus}
              onChange={(v) => { setFulfillmentStatus(v); setPage(1) }}
              allowClear
              style={{ width: 210 }}
              options={[
                { value: 'awaiting_seller_ship', label: t('completedAuctions.fulfillmentStatus.awaiting_seller_ship') },
                { value: 'warehouse_outbound_pending', label: t('completedAuctions.fulfillmentStatus.warehouse_outbound_pending') },
                { value: 'picked_up', label: t('completedAuctions.fulfillmentStatus.picked_up') },
                { value: 'on_delivering', label: t('completedAuctions.fulfillmentStatus.on_delivering') },
                { value: 'delivered', label: t('completedAuctions.fulfillmentStatus.delivered') },
                { value: 'shipping_overdue', label: t('completedAuctions.fulfillmentStatus.shipping_overdue') },
                { value: 'escalated', label: t('completedAuctions.fulfillmentStatus.escalated') },
              ]}
            />
            <Flex align="center" gap={8}>
              <Switch
                checked={onlyOverdue}
                onChange={(v) => { setOnlyOverdue(v); setPage(1) }}
                size="small"
              />
              <Typography.Text style={{ fontSize: 13 }}>{t('completedAuctions.filters.onlyOverdue')}</Typography.Text>
            </Flex>
            <Space>
              <Button type="primary" onClick={handleSearch}>{t('common.search', 'Search')}</Button>
              <Button onClick={handleReset}>{t('common.reset', 'Reset')}</Button>
            </Space>
          </Flex>
        )}
      </Card>

      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: isMobile ? 0 : 24 } }}>
        {/* Horizontal scroll wrapper for mobile */}
        <div style={{ overflowX: 'auto' }}>
          <ResponsiveTable<AdminCompletedAuctionListItemDto>
            rowKey="auctionId"
            columns={columns}
            dataSource={items}
            loading={isLoading}
            mobileMode="list"
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps) },
              showTotal: (total) => `${total} ${t('completedAuctions.title')}`,
              showSizeChanger: !isMobile,
              pageSizeOptions: ['10', '15', '25', '50'],
              simple: isMobile,
            }}
            onRow={(record) => ({
              onClick: () => navigate(`/admin/auctions/completed/${record.auctionId}`),
              style: { cursor: 'pointer', minHeight: 56 },
            })}
          />
        </div>
      </Card>
    </div>
  )
}
