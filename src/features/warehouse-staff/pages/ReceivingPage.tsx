import { useState } from 'react'
import { Typography, Tabs, Table, Button, Tooltip, List, Card, Flex, Tag, Space } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInboundPackages } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { InboundPackageDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function ReceivingPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(20)

  const { data, isLoading } = useInboundPackages({
    packageState: activeTab === 'all' ? undefined : activeTab,
    pageNumber,
    pageSize,
  })

  const tabItems = [
    { key: 'all', label: t('tab.all', 'All') },
    { key: 'pending_arrival', label: isMobile ? t('tab.pending', 'Pending') : t('tab.pendingArrival', 'Pending arrival') },
    { key: 'received', label: t('tab.received', 'Received') },
    { key: 'stored', label: t('tab.stored', 'Stored') },
    { key: 'inspected', label: t('tab.inspected', 'Inspected') },
  ]

  const handleNavigate = (code: string) =>
    navigate(`/warehouse-staff/receiving/packages/${encodeURIComponent(code)}`)

  // Mobile: card list
  if (isMobile) {
    return (
      <div>
        <Typography.Title level={4} style={{ marginBottom: 16, lineHeight: 1.3 }}>
          {t('receiving.title', 'Receiving Queue')}
        </Typography.Title>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key)
            setPageNumber(1)
          }}
          items={tabItems}
          size="small"
          style={{ marginBottom: 12 }}
        />

        <List
          loading={isLoading}
          dataSource={data?.items ?? []}
          renderItem={(record: InboundPackageDto) => (
            <Card
              style={{ marginBottom: 10, cursor: 'pointer' }}
              styles={{ body: { padding: '12px 14px' } }}
              onClick={() => handleNavigate(record.clientOrderCode)}
            >
              <Flex justify="space-between" align="flex-start" gap={8}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Text
                    strong
                    style={{ fontSize: 14, display: 'block', marginBottom: 2 }}
                    ellipsis
                  >
                    {record.clientOrderCode}
                    {record.carrierTrackingNumber
                      ? ` · ${record.carrierTrackingNumber}`
                      : ''}
                  </Typography.Text>
                  {record.senderName && (
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                      ellipsis
                    >
                      {record.senderName}
                    </Typography.Text>
                  )}
                  <Space size={6} wrap>
                    <StatusBadge status={record.packageState} />
                    <Tag style={{ margin: 0 }}>{getProviderLabel(record.providerCode)}</Tag>
                    <Tag style={{ margin: 0 }}>
                      {record.itemCount} {t('table.itemCount', 'items')}
                    </Tag>
                  </Space>
                  {record.expectedArrivalAt && (
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11, display: 'block', marginTop: 4 }}
                    >
                      {t('table.expectedArrival', 'Expected')}: {formatDateTime(record.expectedArrivalAt)}
                    </Typography.Text>
                  )}
                </div>
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNavigate(record.clientOrderCode)
                  }}
                  style={{ minWidth: 44, minHeight: 44, flexShrink: 0 }}
                />
              </Flex>
            </Card>
          )}
        />

        {/* Simple pagination indicator */}
        {(data?.metadata?.totalCount ?? 0) > pageSize && (
          <Flex justify="center" gap={8} style={{ marginTop: 12 }}>
            <Button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
              style={{ minHeight: 44, minWidth: 44 }}
            >
              ‹
            </Button>
            <Flex align="center">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {pageNumber} / {Math.ceil((data?.metadata?.totalCount ?? 0) / pageSize)}
              </Typography.Text>
            </Flex>
            <Button
              disabled={pageNumber >= Math.ceil((data?.metadata?.totalCount ?? 0) / pageSize)}
              onClick={() => setPageNumber((p) => p + 1)}
              style={{ minHeight: 44, minWidth: 44 }}
            >
              ›
            </Button>
          </Flex>
        )}
      </div>
    )
  }

  // Desktop: table view
  const columns: ColumnsType<InboundPackageDto> = [
    {
      title: t('table.clientOrderCode', 'Package'),
      dataIndex: 'clientOrderCode',
      key: 'clientOrderCode',
      render: (code: string, record) => (
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => handleNavigate(code)}
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
            onClick={() => handleNavigate(record.clientOrderCode)}
          />
        </Tooltip>
      ),
    },
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
          onClick: () => handleNavigate(record.clientOrderCode),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
