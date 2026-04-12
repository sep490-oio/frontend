import { useMemo, useState } from 'react'
import { Typography, Table, Avatar, Flex, Input, Segmented, Empty } from 'antd'
import { PictureOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { ColumnsType } from 'antd/es/table'
import { useWarehouseItems } from '@/features/warehouse/api'
import type { WarehouseItemDto } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SANS_FONT } from '@/styles/tokens'
import { formatDateTime } from '@/utils/format'

const STATUS_OPTIONS = ['all', 'received', 'stored', 'reserved', 'dispatched'] as const

export default function StoredItemsPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useWarehouseItems({
    pageNumber: page,
    pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search.trim() || undefined,
  })

  // Client-side fallback filter (in case BE ignores `search`)
  const rows = useMemo(() => {
    const items = data?.items ?? []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (it) =>
        (it.itemTitle ?? '').toLowerCase().includes(q) ||
        (it.sellerName ?? '').toLowerCase().includes(q) ||
        (it.inboundShipmentCode ?? '').toLowerCase().includes(q) ||
        (it.storageLocationLabel ?? '').toLowerCase().includes(q),
    )
  }, [data, search])

  const columns: ColumnsType<WarehouseItemDto> = [
    {
      title: '',
      key: 'thumb',
      width: 64,
      render: (_, record) => (
        <Avatar
          shape="square"
          size={48}
          src={record.itemImageUrl ?? undefined}
          icon={!record.itemImageUrl ? <PictureOutlined /> : undefined}
          style={{ borderRadius: 6 }}
        />
      ),
    },
    {
      title: t('storedItems.columns.title', 'Item'),
      key: 'title',
      render: (_, record) => (
        <span style={{ fontFamily: SANS_FONT, fontSize: 13, fontWeight: 500 }}>
          {record.itemTitle ?? '—'}
        </span>
      ),
    },
    {
      title: t('storedItems.columns.seller', 'Seller'),
      dataIndex: 'sellerName',
      key: 'seller',
      render: (n: string | undefined) => (
        <span style={{ fontFamily: SANS_FONT, fontSize: 13 }}>{n ?? '—'}</span>
      ),
    },
    {
      title: t('storedItems.columns.inbound', 'Inbound'),
      dataIndex: 'inboundShipmentCode',
      key: 'inbound',
      render: (c: string | undefined) => (
        <Typography.Text style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          {c ?? '—'}
        </Typography.Text>
      ),
    },
    {
      title: t('storedItems.columns.location', 'Location'),
      dataIndex: 'storageLocationLabel',
      key: 'location',
      render: (l: string | undefined) => (
        <span style={{ fontFamily: SANS_FONT, fontSize: 12 }}>{l ?? '—'}</span>
      ),
    },
    {
      title: t('storedItems.columns.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('storedItems.columns.receivedAt', 'Received'),
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      render: (d: string | undefined) => (
        <span style={{ fontFamily: SANS_FONT, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {d ? formatDateTime(d) : '—'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('storedItems.title', 'Stored Items')}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontFamily: SANS_FONT, fontSize: 13 }}>
          {t('storedItems.subtitle', 'All warehouse items currently in custody')}
        </Typography.Text>
      </div>

      <Flex gap={12} align="center" wrap="wrap" style={{ marginBottom: 16 }}>
        <Segmented
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(String(v))
            setPage(1)
          }}
          options={STATUS_OPTIONS.map((s) => ({
            label: t(`storedItems.status.${s}`, s.charAt(0).toUpperCase() + s.slice(1)),
            value: s,
          }))}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={t('storedItems.searchPlaceholder', 'Search title, seller, code, location')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          style={{ maxWidth: 320 }}
        />
      </Flex>

      <Table<WarehouseItemDto>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => navigate(`/warehouse-staff/items/${record.id}`),
          style: { cursor: 'pointer' },
        })}
        locale={{
          emptyText: <Empty description={t('storedItems.empty', 'No warehouse items')} />,
        }}
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p)
            setPageSize(ps)
          },
        }}
      />
    </div>
  )
}
