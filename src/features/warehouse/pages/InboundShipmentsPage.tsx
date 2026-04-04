import { useState, useMemo } from 'react'
import { Typography, Button, Space, Tabs, App, Tooltip, Tag, Table, Spin } from 'antd'
import { PlusOutlined, EyeOutlined, CloseCircleOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useInboundShipments, useCancelInbound } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { ShipmentStatus } from '@/types/enums'
import { formatCurrency, formatDateTime } from '@/utils/format'
import type { InboundShipmentDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_TABS = [
  { key: 'all', label: 'all' },
  { key: ShipmentStatus.AwaitingPickup, label: 'pending' },
  { key: ShipmentStatus.InTransit, label: 'inTransit' },
  { key: ShipmentStatus.SellerClaimsArrived, label: 'sellerClaimsArrived' },
  { key: ShipmentStatus.Arrived, label: 'arrived' },
  { key: ShipmentStatus.Inspected, label: 'inspected' },
  { key: ShipmentStatus.Completed, label: 'stored' },
  { key: ShipmentStatus.Cancelled, label: 'cancelled' },
] as const

interface PackageRow {
  clientOrderCode: string
  providerCode: string
  status: string
  shippingFee: number
  createdAt: string
  carrierTrackingNumber?: string
  itemCount: number
  firstShipmentId: string
}

// Expandable sub-table: fetches siblings by search param
function PackageItemsTable({ clientOrderCode }: { clientOrderCode: string }) {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()

  const { data, isLoading } = useInboundShipments({ search: clientOrderCode, pageSize: 50 })

  const columns: ColumnsType<InboundShipmentDto> = [
    { title: t('item', 'Item ID'), dataIndex: 'itemId', key: 'itemId', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 140, render: (s: string) => <StatusBadge status={s} /> },
    { title: t('weight', 'Weight'), dataIndex: 'weightGrams', key: 'weight', width: 80, render: (g: number) => `${g}g` },
    {
      title: tc('actions', 'Actions'), key: 'actions', width: 80,
      render: (_: unknown, record: InboundShipmentDto) => (
        <Tooltip title={tc('action.view', 'View')}>
          <Button type="text" size="small" icon={<EyeOutlined />}
            onClick={() => navigate(`${prefix}/warehouse/inbound/${record.id}`)} />
        </Tooltip>
      ),
    },
  ]

  if (isLoading) return <Spin size="small" style={{ padding: 16 }} />

  return (
    <Table<InboundShipmentDto>
      rowKey="id"
      columns={columns}
      dataSource={data?.items ?? []}
      pagination={false}
      size="small"
    />
  )
}

export default function InboundShipmentsPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const params = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data, isLoading } = useInboundShipments(params)
  const cancelInbound = useCancelInbound()

  // Deduplicate by ClientOrderCode — keep first occurrence per code, count siblings
  const packages = useMemo<PackageRow[]>(() => {
    const items = data?.items ?? []
    const seen = new Map<string, { row: PackageRow; count: number }>()
    for (const item of items) {
      const key = item.clientOrderCode
      if (seen.has(key)) {
        seen.get(key)!.count++
      } else {
        seen.set(key, {
          row: {
            clientOrderCode: key,
            providerCode: item.providerCode,
            status: item.status,
            shippingFee: item.shippingFee,
            createdAt: item.createdAt,
            carrierTrackingNumber: item.carrierTrackingNumber,
            itemCount: 1,
            firstShipmentId: item.id,
          },
          count: 1,
        })
      }
    }
    return Array.from(seen.values()).map(({ row, count }) => ({ ...row, itemCount: count }))
  }, [data?.items])

  const handleCancel = async (id: string) => {
    try {
      await cancelInbound.mutateAsync({ id })
      message.success(t('cancelSuccess', 'Shipment cancelled'))
    } catch {
      message.error(t('cancelError', 'Failed to cancel shipment'))
    }
  }

  const packageColumns: ColumnsType<PackageRow> = [
    {
      title: t('clientOrderCode', 'Package'),
      dataIndex: 'clientOrderCode',
      key: 'clientOrderCode',
      render: (code: string, record) => (
        <Space>
          <Button type="link" onClick={() => {
            if (record.itemCount > 1) {
              navigate(`${prefix}/warehouse/inbound?package=${encodeURIComponent(code)}`)
            } else {
              navigate(`${prefix}/warehouse/inbound/${record.firstShipmentId}`)
            }
          }} style={{ padding: 0 }}>
            {code}
          </Button>
          {record.itemCount > 1 && (
            <Tag color="blue">{record.itemCount} items</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('provider', 'Provider'),
      dataIndex: 'providerCode',
      key: 'providerCode',
      width: 150,
      render: (code: string) => getProviderLabel(code),
    },
    {
      title: t('tracking', 'Tracking'),
      dataIndex: 'carrierTrackingNumber',
      key: 'tracking',
      width: 150,
      ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('shippingFee', 'Fee'),
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      width: 110,
      render: (fee: number) => formatCurrency(fee),
    },
    {
      title: t('created', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (d: string) => formatDateTime(d),
    },
    {
      title: tc('actions', 'Actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: PackageRow) => (
        <Space size="small">
          <Tooltip title={tc('action.view', 'View')}>
            <Button type="text" size="small" icon={<EyeOutlined />}
              onClick={() => {
                if (record.itemCount > 1) {
                  navigate(`${prefix}/warehouse/inbound?package=${encodeURIComponent(record.clientOrderCode)}`)
                } else {
                  navigate(`${prefix}/warehouse/inbound/${record.firstShipmentId}`)
                }
              }} />
          </Tooltip>
          {record.status === ShipmentStatus.AwaitingPickup && (
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button type="text" size="small" danger icon={<CloseCircleOutlined />}
                loading={cancelInbound.isPending}
                onClick={() => handleCancel(record.firstShipmentId)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('inboundShipments', 'Inbound Shipments')}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`${prefix}/warehouse/inbound/book`)}>
          {t('bookInbound', 'Book Inbound')}
        </Button>
      </Space>

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => { setStatusFilter(key); setPage(1) }}
        items={STATUS_TABS.map((tab) => ({
          key: tab.key,
          label: t(`statusTab.${tab.label}`, tab.label.charAt(0).toUpperCase() + tab.label.slice(1)),
        }))}
      />

      <Table<PackageRow>
        rowKey="clientOrderCode"
        columns={packageColumns}
        dataSource={packages}
        loading={isLoading}
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
        expandable={{
          expandedRowRender: (record) => (
            <PackageItemsTable clientOrderCode={record.clientOrderCode} />
          ),
          rowExpandable: (record) => record.itemCount > 1,
          expandIcon: ({ expanded, onExpand, record }) =>
            record.itemCount > 1 ? (
              <Button type="text" size="small" icon={expanded ? <DownOutlined /> : <RightOutlined />}
                onClick={(e) => onExpand(record, e)} style={{ marginRight: 4 }} />
            ) : <span style={{ width: 32, display: 'inline-block' }} />,
        }}
      />
    </div>
  )
}
