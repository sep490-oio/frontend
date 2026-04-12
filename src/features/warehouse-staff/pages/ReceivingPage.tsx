import { useState } from 'react'
import { Typography, Tabs, Table, Button, Tooltip } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInboundPackages } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { formatDateTime } from '@/utils/format'
import type { InboundPackageDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function ReceivingPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(20)

  const { data, isLoading } = useInboundPackages({
    packageState: activeTab === 'all' ? undefined : activeTab,
    pageNumber,
    pageSize,
  })

  const columns: ColumnsType<InboundPackageDto> = [
    {
      title: t('table.clientOrderCode', 'Package'),
      dataIndex: 'clientOrderCode',
      key: 'clientOrderCode',
      render: (code: string, record) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(code)}`)}
        >
          {code} {record.carrierTrackingNumber ? ` · ${record.carrierTrackingNumber}` : ''}
        </Button>
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
      title: t('sender', 'Sender'),
      dataIndex: 'senderName',
      key: 'senderName',
      width: 180,
      ellipsis: true,
      render: (v?: string) => v || '—',
    },
    {
      title: t('table.itemCount', 'Items'),
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 90,
    },
    {
      title: t('table.status', 'State'),
      dataIndex: 'packageState',
      key: 'packageState',
      width: 150,
      render: (state: string) => <StatusBadge status={state} />,
    },
    {
      title: t('table.expectedArrival', 'Expected'),
      dataIndex: 'expectedArrivalAt',
      key: 'expectedArrivalAt',
      width: 150,
      render: (val?: string) => (val ? formatDateTime(val) : '—'),
    },
    {
      title: t('table.actions', 'Actions'),
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title={t('action.view', 'View')}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(record.clientOrderCode)}`)
            }
          />
        </Tooltip>
      ),
    },
  ]

  const tabItems = [
    { key: 'all', label: t('tab.all', 'All') },
    { key: 'pending_arrival', label: t('tab.pendingArrival', 'Pending arrival') },
    { key: 'received', label: t('tab.received', 'Received') },
    { key: 'stored', label: t('tab.stored', 'Stored') },
    { key: 'inspected', label: t('tab.inspected', 'Inspected') },
  ]

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 24 }}>
        {t('receiving.title', 'Receiving Queue')}
      </Typography.Title>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key)
          setPageNumber(1)
        }}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <Table<InboundPackageDto>
        rowKey="clientOrderCode"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        pagination={{
          current: pageNumber,
          pageSize,
          total: data?.metadata?.totalCount ?? 0,
          onChange: (p) => setPageNumber(p),
          showSizeChanger: false,
        }}
        onRow={(record) => ({
          onClick: () =>
            navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(record.clientOrderCode)}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
