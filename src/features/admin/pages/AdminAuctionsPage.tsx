import { useState, useMemo } from 'react'
import {
  Typography, Card, Tag, Input, Select, Flex, Avatar, Button, Space, Segmented,
} from 'antd'
import {
  SearchOutlined, ReloadOutlined, EyeOutlined, ControlOutlined,
  FireOutlined, ClockCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuctions } from '@/features/auction/auctionApi'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { AuctionListItemDto, AuctionFilterParams } from '@/types'
import { AuctionStatus } from '@/types/enums'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

// ── Status color mapping ──────────────────────────────────────────────
function useStatusConfig(t: (key: string, fallback: string) => string): Record<string, { color: string; label: string }> {
  return {
    draft:             { color: 'default',    label: t('auctions.statusConfig.draft', 'Draft') },
    pending:           { color: 'orange',     label: t('auctions.statusConfig.pending', 'Pending') },
    approved:          { color: 'cyan',       label: t('auctions.statusConfig.approved', 'Approved') },
    scheduled:         { color: 'blue',       label: t('auctions.statusConfig.scheduled', 'Scheduled') },
    active:            { color: 'green',      label: t('auctions.statusConfig.active', 'Active') },
    ended:             { color: 'geekblue',   label: t('auctions.statusConfig.ended', 'Ended') },
    sold:              { color: 'success',    label: t('auctions.statusConfig.sold', 'Sold') },
    completed:         { color: 'purple',     label: t('auctions.statusConfig.completed', 'Completed') },
    payment_defaulted: { color: 'warning',    label: t('auctions.statusConfig.payment_defaulted', 'Payment Defaulted') },
    cancelled:         { color: 'default',    label: t('auctions.statusConfig.cancelled', 'Cancelled') },
    failed:            { color: 'error',      label: t('auctions.statusConfig.failed', 'Failed') },
    terminated:        { color: 'volcano',    label: t('auctions.statusConfig.terminated', 'Terminated') },
  }
}

// ── Status group tabs ─────────────────────────────────────────────────
function useStatusTabs(t: (key: string, fallback: string) => string) {
  return [
    { value: '',          label: t('auctions.statusTabs.all', 'All') },
    { value: 'active',    label: t('auctions.statusTabs.active', 'Active') },
    { value: 'scheduled', label: t('auctions.statusTabs.scheduled', 'Scheduled') },
    { value: 'pending',   label: t('auctions.statusTabs.pending', 'Pending') },
    { value: 'sold',      label: t('auctions.statusTabs.sold', 'Sold') },
    { value: 'failed',    label: t('auctions.statusTabs.failedCancelled', 'Failed / Cancelled') },
  ]
}

// ── Individual status filter ──────────────────────────────────────────
const STATUS_OPTIONS = Object.entries(AuctionStatus).map(([key, value]) => ({
  value,
  label: key.replace(/([A-Z])/g, ' $1').trim(),
}))

function useSortOptions(t: (key: string, fallback: string) => string) {
  return [
    { value: 'CreatedAt Desc',    label: t('auctions.sortOptions.newestFirst', 'Newest First') },
    { value: 'CreatedAt',     label: t('auctions.sortOptions.oldestFirst', 'Oldest First') },
    { value: '-CurrentPrice', label: t('auctions.sortOptions.priceHighLow', 'Price: High → Low') },
    { value: 'CurrentPrice',  label: t('auctions.sortOptions.priceLowHigh', 'Price: Low → High') },
    { value: '-BidCount',     label: t('auctions.sortOptions.mostBids', 'Most Bids') },
    { value: 'EndTime',       label: t('auctions.sortOptions.endingSoon', 'Ending Soon') },
  ]
}

export default function AdminAuctionsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const STATUS_CONFIG = useStatusConfig(t)
  const STATUS_TABS = useStatusTabs(t)
  const SORT_OPTIONS = useSortOptions(t)

  // ── Filter state ──
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusGroup, setStatusGroup] = useState<string>('')
  const [exactStatus, setExactStatus] = useState<string | undefined>()
  const [sortBy, setSortBy] = useState<string | undefined>('CreatedAt Desc')

  // ── Build query params ──
  const params = useMemo<AuctionFilterParams>(() => ({
    pageNumber: page,
    pageSize,
    ...(search ? { search } : {}),
    ...(exactStatus ? { status: exactStatus as AuctionFilterParams['status'] } : {}),
    ...(!exactStatus && statusGroup ? { statusGroup: statusGroup as AuctionFilterParams['statusGroup'] } : {}),
    ...(sortBy ? { sortBy } : {}),
  }), [page, pageSize, search, statusGroup, exactStatus, sortBy])

  const { data, isLoading, refetch } = useAuctions(params)

  const items = data?.items ?? []
  const total = data?.metadata?.totalCount ?? 0

  const handleSearch = () => { setSearch(searchInput); setPage(1) }
  const handleReset = () => {
    setSearchInput(''); setSearch('')
    setStatusGroup(''); setExactStatus(undefined)
    setSortBy('CreatedAt Desc'); setPage(1)
  }

  // ── Table columns ──
  const columns: ColumnsType<AuctionListItemDto> = [
    {
      title: t('auctions.columns.item', 'Item'),
      key: 'item',
      width: 260,
      render: (_, record) => (
        <Flex align="center" gap={10}>
          <Avatar
            shape="square"
            size={40}
            src={record.primaryImageUrl ?? undefined}
            style={{ flexShrink: 0, background: 'var(--color-accent-light)', borderRadius: 6 }}
          />
          <div style={{ minWidth: 0 }}>
            <Typography.Text ellipsis style={{ fontSize: 13, fontWeight: 500, display: 'block', maxWidth: 190 }}>
              {record.itemTitle ?? '—'}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {record.auctionType === 'sealed' ? t('auctions.typeIcons.sealed', '🔒 Sealed') : t('auctions.typeIcons.regular', '🔨 Regular')}
            </Typography.Text>
          </div>
        </Flex>
      ),
    },
    {
      title: t('auctions.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => {
        const cfg = STATUS_CONFIG[s] ?? { color: 'default', label: s }
        return <Tag color={cfg.color} style={{ fontWeight: 500 }}>{cfg.label}</Tag>
      },
    },
    {
      title: t('auctions.columns.price', 'Price'),
      key: 'price',
      width: 130,
      align: 'right' as const,
      render: (_, record) => (
        <div>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {formatCurrency(record.currentPrice?.amount ?? 0)}
          </Typography.Text>
          {record.buyNowPrice && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {t('auctions.bin', 'BIN')}: {formatCurrency(record.buyNowPrice.amount)}
              </Typography.Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: t('auctions.columns.bids', 'Bids'),
      key: 'bids',
      width: 80,
      align: 'center' as const,
      render: (_, record) => (
        <Flex vertical align="center" gap={2}>
          <Typography.Text strong style={{ fontSize: 13 }}>{record.bidCount}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            {record.watchCount} 👁
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: t('auctions.columns.time', 'Time'),
      key: 'time',
      width: 170,
      render: (_, record) => {
        if (record.status === 'active' && record.remainingTime) {
          return (
            <Flex align="center" gap={4}>
              <ClockCircleOutlined style={{ color: record.isEndingSoon ? 'var(--color-error)' : 'var(--color-accent)' }} />
              <Typography.Text style={{ fontSize: 12, color: record.isEndingSoon ? 'var(--color-error)' : undefined }}>
                {record.remainingTime}
              </Typography.Text>
            </Flex>
          )
        }
        return (
          <div>
            {record.startTime && (
              <Typography.Text style={{ fontSize: 11, display: 'block' }}>
                {t('auctions.timeStart', 'Start')}: {formatDateTime(record.startTime)}
              </Typography.Text>
            )}
            {record.endTime && (
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                {t('auctions.timeEnd', 'End')}: {formatDateTime(record.endTime)}
              </Typography.Text>
            )}
          </div>
        )
      },
    },
    {
      title: t('auctions.columns.flags', 'Flags'),
      key: 'flags',
      width: 80,
      render: (_, record) => (
        <Space size={4}>
          {record.isFeatured && <FireOutlined style={{ color: '#fa8c16', fontSize: 14 }} title={t('auctions.flags.featured', 'Featured')} />}
          {record.isEndingSoon && <ThunderboltOutlined style={{ color: '#f5222d', fontSize: 14 }} title={t('auctions.flags.endingSoon', 'Ending Soon')} />}
        </Space>
      ),
    },
    {
      title: t('auctions.columns.actions', 'Actions'),
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<ControlOutlined />}
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/auctions/${record.id}`) }}
            title={t('auctions.actionTitles.adminControl', 'Admin Control')}
          />
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); window.open(`/auctions/${record.id}`, '_blank') }}
            title={t('auctions.actionTitles.viewPublic', 'View Public')}
          />
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: isMobile ? 16 : 24 }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0, fontSize: isMobile ? 18 : undefined }}>
            <ControlOutlined style={{ marginRight: 8 }} />
            {t('auctions.title', 'Auctions')}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('auctions.subtitle', 'All platform auctions — every status')}
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
      </Flex>

      {/* Status group tabs */}
      <div style={{ marginBottom: 16, overflowX: 'auto' }}>
        <Segmented
          value={statusGroup}
          onChange={(v) => { setStatusGroup(v as string); setExactStatus(undefined); setPage(1) }}
          options={STATUS_TABS}
          style={{ background: 'var(--color-bg-card)' }}
        />
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }} styles={{ body: { padding: isMobile ? 12 : 24 } }}>
        {isMobile ? (
          <Space direction="vertical" style={{ width: '100%' }} size={10}>
            <Input
              placeholder={t('auctions.filters.search', 'Search by title or ID...')}
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: '100%', minHeight: 44 }}
              allowClear
              onClear={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            />
            <Select
              placeholder={t('auctions.filters.exactStatus', 'Exact Status')}
              value={exactStatus}
              onChange={(v) => { setExactStatus(v); setStatusGroup(''); setPage(1) }}
              allowClear
              style={{ width: '100%' }}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder={t('auctions.filters.sortBy', 'Sort By')}
              value={sortBy}
              onChange={(v) => { setSortBy(v); setPage(1) }}
              style={{ width: '100%' }}
              options={SORT_OPTIONS}
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
              placeholder={t('auctions.filters.search', 'Search by title or ID...')}
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 240 }}
              allowClear
              onClear={() => { setSearchInput(''); setSearch(''); setPage(1) }}
            />
            <Select
              placeholder={t('auctions.filters.exactStatus', 'Exact Status')}
              value={exactStatus}
              onChange={(v) => { setExactStatus(v); setStatusGroup(''); setPage(1) }}
              allowClear
              style={{ width: 180 }}
              options={STATUS_OPTIONS}
            />
            <Select
              placeholder={t('auctions.filters.sortBy', 'Sort By')}
              value={sortBy}
              onChange={(v) => { setSortBy(v); setPage(1) }}
              style={{ width: 180 }}
              options={SORT_OPTIONS}
            />
            <Space>
              <Button type="primary" onClick={handleSearch}>{tc('action.search', 'Search')}</Button>
              <Button onClick={handleReset}>{tc('action.reset', 'Reset')}</Button>
            </Space>
          </Flex>
        )}
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: isMobile ? 0 : 24 } }}>
        <div style={{ overflowX: 'auto' }}>
          <ResponsiveTable<AuctionListItemDto>
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
              showTotal: (total) => t('auctions.pagination.total', '{{count}} auctions', { count: total }),
              showSizeChanger: !isMobile,
              pageSizeOptions: ['10', '15', '25', '50'],
              simple: isMobile,
            }}
            onRow={(record) => ({
              onClick: () => navigate(`/admin/auctions/${record.id}`),
              style: { cursor: 'pointer', minHeight: 56 },
            })}
          />
        </div>
      </Card>
    </div>
  )
}
