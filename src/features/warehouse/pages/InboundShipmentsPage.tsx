import { useState } from 'react'
import { Typography, Button, Space, Tabs, App, Tooltip } from 'antd'
import { PlusOutlined, EyeOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useInboundShipments, useCancelInbound } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ShipmentStatus } from '@/types/enums'
import { formatCurrency } from '@/utils/format'
import type { InboundShipmentDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_TABS = [
  { key: 'all', label: 'all' },
  { key: ShipmentStatus.AwaitingPickup, label: 'pending' },
  { key: ShipmentStatus.InTransit, label: 'inTransit' },
  { key: ShipmentStatus.Arrived, label: 'arrived' },
  { key: ShipmentStatus.Inspected, label: 'inspected' },
  { key: ShipmentStatus.Completed, label: 'stored' },
  { key: ShipmentStatus.Cancelled, label: 'cancelled' },
] as const

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

  const handleCancel = async (id: string) => {
    try {
      await cancelInbound.mutateAsync(id)
      message.success(t('cancelSuccess', 'Shipment cancelled'))
    } catch {
      message.error(t('cancelError', 'Failed to cancel shipment'))
    }
  }

  const columns: ColumnsType<InboundShipmentDto> = [
    {
      title: t('clientOrderCode', 'Order Code'),
      dataIndex: 'clientOrderCode',
      key: 'clientOrderCode',
      ellipsis: true,
      render: (code: string, record) => (
        <Button type="link" onClick={() => navigate(`${prefix}/warehouse/inbound/${record.id}`)} style={{ padding: 0 }}>
          {code}
        </Button>
      ),
    },
    {
      title: t('item', 'Item'),
      dataIndex: 'itemId',
      key: 'itemId',
      ellipsis: true,
      width: 120,
    },
    {
      title: t('provider', 'Provider'),
      dataIndex: 'providerCode',
      key: 'providerCode',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('shippingFee', 'Shipping Fee'),
      dataIndex: 'shippingFee',
      key: 'shippingFee',
      width: 130,
      render: (fee: number) => formatCurrency(fee),
    },
    {
      title: t('trackingEvents', 'Events'),
      dataIndex: 'trackingEvents',
      key: 'trackingEvents',
      width: 80,
      render: (events: unknown[]) => events?.length ?? 0,
    },
    {
      title: tc('actions', 'Actions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: InboundShipmentDto) => (
        <Space size="small">
          <Tooltip title={tc('action.view', 'View')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`${prefix}/warehouse/inbound/${record.id}`)}
            />
          </Tooltip>
          {(record.status === ShipmentStatus.AwaitingPickup) && (
            <Tooltip title={tc('action.cancel', 'Cancel')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                loading={cancelInbound.isPending}
                onClick={() => handleCancel(record.id)}
              />
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
        onChange={(key) => {
          setStatusFilter(key)
          setPage(1)
        }}
        items={STATUS_TABS.map((tab) => ({
          key: tab.key,
          label: t(`statusTab.${tab.label}`, tab.label.charAt(0).toUpperCase() + tab.label.slice(1)),
        }))}
      />

      <ResponsiveTable<InboundShipmentDto>
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
