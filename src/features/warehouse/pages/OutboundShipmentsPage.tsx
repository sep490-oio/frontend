import { useState } from 'react'
import { Typography, Space, Tabs } from 'antd'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useOutboundShipments } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ShipmentStatus } from '@/types/enums'
import { formatDateTime } from '@/utils/format'
import type { OutboundShipmentDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_TABS = [
  { key: 'all', label: 'all' },
  { key: ShipmentStatus.AwaitingPickup, label: 'pending' },
  { key: ShipmentStatus.InTransit, label: 'inTransit' },
  { key: ShipmentStatus.Arrived, label: 'arrived' },
  { key: ShipmentStatus.Completed, label: 'completed' },
  { key: ShipmentStatus.Cancelled, label: 'cancelled' },
] as const

export default function OutboundShipmentsPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const params = {
    pageNumber: page,
    pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  }

  const { data, isLoading } = useOutboundShipments(params)

  const columns: ColumnsType<OutboundShipmentDto> = [
    {
      title: t('orderId', 'Order'),
      dataIndex: 'orderId',
      key: 'orderId',
      ellipsis: true,
      width: 150,
    },
    {
      title: t('recipientAddress', 'Recipient'),
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      ellipsis: true,
    },
    {
      title: t('provider', 'Provider'),
      dataIndex: 'shippingProvider',
      key: 'shippingProvider',
      width: 120,
    },
    {
      title: t('trackingNumber', 'Tracking Number'),
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 160,
      render: (val: string) => val || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('shippedAt', 'Shipped'),
      dataIndex: 'shippedAt',
      key: 'shippedAt',
      width: 150,
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
    {
      title: t('deliveredAt', 'Delivered'),
      dataIndex: 'deliveredAt',
      key: 'deliveredAt',
      width: 150,
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('outboundShipments', 'Outbound Shipments')}
        </Typography.Title>
      </Space>

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key)
          setPage(1)
        }}
        items={STATUS_TABS.map((tab) => ({
          key: tab.key,
          label: t(`statusTab.${tab.label}`, tab.label.charAt(0).toUpperCase() + tab.label.slice(1)),
        }))}
      />

      <ResponsiveTable<OutboundShipmentDto>
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
    </div>
  )
}
