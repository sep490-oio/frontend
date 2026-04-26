import { useState } from 'react'
import { Typography, Space, Tabs, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
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
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

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
      title: t('shipmentId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 160,
      render: (id: string) => (
        <Button
          type="link"
          style={{
            padding: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '-0.01em',
          }}
          onClick={() => navigate(`/seller/warehouse/outbound/${id}`)}
        >
          {id.slice(0, 8)}…
        </Button>
      ),
    },
    {
      title: t('orderId'),
      dataIndex: 'orderId',
      key: 'orderId',
      ellipsis: true,
      width: 150,
    },
    {
      title: t('recipientAddress'),
      dataIndex: 'recipientAddress',
      key: 'recipientAddress',
      ellipsis: true,
    },
    {
      title: t('provider'),
      dataIndex: 'providerCode',
      key: 'providerCode',
      width: 120,
    },
    {
      title: t('trackingNumber'),
      dataIndex: 'carrierTrackingNumber',
      key: 'carrierTrackingNumber',
      width: 160,
      render: (val: string) => val || '-',
    },
    {
      title: t('statusTab.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('dispatchedAt'),
      dataIndex: 'dispatchedAt',
      key: 'dispatchedAt',
      width: 150,
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
    {
      title: t('deliveredAt'),
      dataIndex: 'deliveredAt',
      key: 'deliveredAt',
      width: 150,
      render: (date: string) => (date ? formatDateTime(date) : '-'),
    },
    {
      title: tc('action.view'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: OutboundShipmentDto) => (
        <Button
          type="default"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/seller/warehouse/outbound/${record.id}`)}
        >
          {tc('action.view')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={2} className="oio-serif" style={{ margin: 0, fontWeight: 400, fontSize: isMobile ? 24 : 32 }}>
          {t('outboundShipments')}
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
          label: t(`statusTab.${tab.label}`),
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
