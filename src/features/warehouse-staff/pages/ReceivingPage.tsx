import { useState, useMemo } from 'react'
import { Typography, Tabs, Table, Button, Tag, Space, Tooltip, Spin } from 'antd'
import { EyeOutlined, DownOutlined, RightOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInboundShipments } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { formatDateTime } from '@/utils/format'
import type { InboundShipmentDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

interface PackageRow {
  clientOrderCode: string
  providerCode: string
  status: string
  carrierTrackingNumber?: string
  expectedArrivalAt?: string
  itemCount: number
  firstShipmentId: string
}

// Lazy sub-table: fetches siblings when expanded
function PackageItemsTable({ clientOrderCode }: { clientOrderCode: string }) {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const { data, isLoading } = useInboundShipments({ search: clientOrderCode, pageSize: 50 })

  const columns: ColumnsType<InboundShipmentDto> = [
    { title: t('table.itemId', 'Item ID'), dataIndex: 'itemId', key: 'itemId', ellipsis: true },
    { title: t('table.status', 'Status'), dataIndex: 'status', key: 'status', width: 140, render: (s: string) => <StatusBadge status={s} /> },
    { title: t('table.weight', 'Weight'), dataIndex: 'weightGrams', key: 'weight', width: 80, render: (g: number) => `${g}g` },
    {
      title: t('table.actions', 'Actions'), key: 'actions', width: 80,
      render: (_: unknown, record: InboundShipmentDto) => (
        <Button type="text" size="small" icon={<EyeOutlined />}
          onClick={() => navigate(`/warehouse-staff/shipments/${record.id}`)} />
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

export default function ReceivingPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(20)

  const { data, isLoading } = useInboundShipments({
    status: activeTab === 'all' ? undefined : activeTab,
    pageNumber,
    pageSize,
  })

  // Deduplicate by ClientOrderCode
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
            carrierTrackingNumber: item.carrierTrackingNumber,
            expectedArrivalAt: item.expectedArrivalAt,
            itemCount: 1,
            firstShipmentId: item.id,
          },
          count: 1,
        })
      }
    }
    return Array.from(seen.values()).map(({ row, count }) => ({ ...row, itemCount: count }))
  }, [data?.items])

  const columns: ColumnsType<PackageRow> = [
    {
      title: t('table.clientOrderCode', 'Package'),
      dataIndex: 'clientOrderCode',
      key: 'clientOrderCode',
      render: (code: string, record) => (
        <Space>
          <Button type="link" style={{ padding: 0 }}
            onClick={() => navigate(`/warehouse-staff/shipments/${record.firstShipmentId}`)}>
            {code}
          </Button>
          {record.itemCount > 1 && <Tag color="blue">{record.itemCount} items</Tag>}
        </Space>
      ),
    },
    {
      title: t('table.provider', 'Provider'),
      dataIndex: 'providerCode',
      key: 'providerCode',
      width: 150,
      render: (code: string) => getProviderLabel(code),
    },
    {
      title: t('table.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('table.trackingNumber', 'Tracking'),
      dataIndex: 'carrierTrackingNumber',
      key: 'tracking',
      width: 150,
      ellipsis: true,
      render: (val: string) => val || '—',
    },
    {
      title: t('table.expectedArrival', 'Expected'),
      dataIndex: 'expectedArrivalAt',
      key: 'expectedArrivalAt',
      width: 150,
      render: (val: string) => val ? formatDateTime(val) : '—',
    },
    {
      title: t('table.actions', 'Actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: PackageRow) => (
        <Tooltip title={t('action.view', 'View')}>
          <Button type="text" size="small" icon={<EyeOutlined />}
            onClick={() => navigate(`/warehouse-staff/shipments/${record.firstShipmentId}`)} />
        </Tooltip>
      ),
    },
  ]

  const tabItems = [
    { key: 'all', label: t('tab.all', 'All') },
    { key: 'in_transit', label: t('tab.inTransit', 'In Transit') },
    { key: 'seller_claims_arrived', label: t('tab.pendingConfirmation', 'Pending Confirmation') },
    { key: 'arrived', label: t('tab.arrived', 'Arrived') },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        {t('receiving.title', 'Receiving Queue')}
      </Typography.Title>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setPageNumber(1) }}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <Table<PackageRow>
        rowKey="clientOrderCode"
        columns={columns}
        dataSource={packages}
        loading={isLoading}
        pagination={{
          current: pageNumber,
          pageSize,
          total: data?.metadata?.totalCount ?? data?.totalCount ?? 0,
          onChange: (p) => setPageNumber(p),
          showSizeChanger: false,
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
