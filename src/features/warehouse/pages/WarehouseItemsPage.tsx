import { useMemo, useState } from 'react'
import { Typography, Space, Button, Select, Input, Avatar } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useSellerWarehouseItems } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { SellerWarehouseItemListItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useDebounce } from '@/hooks/useDebounce'

export default function WarehouseItemsPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [flowStatus, setFlowStatus] = useState<string | undefined>(undefined)
  const [searchRaw, setSearchRaw] = useState('')
  const search = useDebounce(searchRaw, 350)

  const params = useMemo(
    () => ({
      pageNumber: page,
      pageSize,
      ...(flowStatus ? { warehouseFlowStatus: flowStatus } : {}),
      ...(search ? { search } : {}),
    }),
    [page, pageSize, flowStatus, search],
  )

  const { data, isLoading } = useSellerWarehouseItems(params)

  const statusOptions = [
    { value: '', label: t('flowStatus.all', 'All statuses') },
    { value: 'received', label: t('flowStatus.received', 'Received') },
    { value: 'stored', label: t('flowStatus.stored', 'Stored') },
    { value: 'awaiting_inspection', label: t('flowStatus.awaitingInspection', 'Awaiting inspection') },
    { value: 'awaiting_review', label: t('flowStatus.awaitingReview', 'Awaiting review') },
    { value: 'approved', label: t('flowStatus.approved', 'Approved') },
    { value: 'rejected', label: t('flowStatus.rejected', 'Rejected') },
    { value: 'condition_confirmation_required', label: t('flowStatus.conditionConfirmationRequired', 'Condition confirmation required') },
    { value: 'outbound_booked', label: t('flowStatus.outboundBooked', 'Outbound booked') },
    { value: 'dispatched', label: t('flowStatus.dispatched', 'Dispatched') },
  ]

  const gotoDetail = (id: string) => navigate(`/seller/warehouse/items/${id}`)

  const columns: ColumnsType<SellerWarehouseItemListItemDto> = [
    {
      title: t('item', 'Item'),
      key: 'item',
      render: (_: unknown, r) => (
        <Space>
          {r.itemImageUrl ? (
            <Avatar shape="square" size={44} src={r.itemImageUrl} />
          ) : (
            <Avatar shape="square" size={44}>{(r.itemTitle ?? '?').charAt(0).toUpperCase()}</Avatar>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, maxWidth: '100%', minWidth: 0 }}>
            <Button
              type="link"
              style={{ padding: 0, height: 'auto', textAlign: 'left', maxWidth: '100%' }}
              onClick={() => gotoDetail(r.warehouseItemId)}
            >
              <Typography.Text ellipsis style={{ maxWidth: '100%', color: 'inherit' }}>
                {r.itemTitle ?? t('untitledItem', 'Untitled item')}
              </Typography.Text>
            </Button>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {r.itemId.slice(0, 8)}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('inboundPackageCode', 'Package'),
      dataIndex: 'inboundPackageCode',
      key: 'inboundPackageCode',
      width: 170,
      render: (v?: string) => v ?? '-',
    },
    {
      title: tc('tableHeader.status', 'Status'),
      dataIndex: 'warehouseFlowStatus',
      key: 'warehouseFlowStatus',
      width: 180,
      render: (s: string) => <StatusBadge status={s} size="small" />,
    },
    {
      title: t('storageLocation', 'Location'),
      dataIndex: 'storageLocationLabel',
      key: 'storageLocationLabel',
      width: 140,
      render: (v?: string) => v ?? '-',
    },
    {
      title: t('receivedAt', 'Received'),
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 160,
      render: (d?: string) => (d ? formatDateTime(d) : '-'),
    },
    {
      title: t('updatedAt', 'Updated'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (d: string) => formatDateTime(d),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, r) => (
        <Button size="small" onClick={() => gotoDetail(r.warehouseItemId)}>
          {t('viewDetails', 'View details')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} className="oio-serif" style={{ margin: 0, fontWeight: 400 }}>
          {t('warehouseItems', 'Warehouse Items')}
        </Typography.Title>
      </Space>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          style={{ minWidth: 220 }}
          value={flowStatus ?? ''}
          options={statusOptions}
          onChange={(v) => {
            setFlowStatus(v || undefined)
            setPage(1)
          }}
        />
        <Input.Search
          allowClear
          style={{ minWidth: 260 }}
          placeholder={t('searchWarehouseItems', 'Search by title, package code, location')}
          value={searchRaw}
          onChange={(e) => {
            setSearchRaw(e.target.value)
            setPage(1)
          }}
        />
      </Space>

      <ResponsiveTable<SellerWarehouseItemListItemDto>
        mobileMode="card"
        rowKey="warehouseItemId"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        onRow={(r) => ({ onClick: () => gotoDetail(r.warehouseItemId), style: { cursor: 'pointer' } })}
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
    </div>
  )
}
