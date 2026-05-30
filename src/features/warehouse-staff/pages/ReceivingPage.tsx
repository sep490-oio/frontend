import { useState } from 'react'
import { Typography, Tabs, Table, Button, Tooltip, List, Card, Flex, Tag, Space, Input } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useInboundPackages } from '@/features/warehouse/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { formatDateTime } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { serializeSortBy } from '@/lib/sortBy'
import type { InboundPackageDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import type { SortSpec } from '@/lib/sortBy'

export type PackageSortField = 'CreatedAt' | 'ExpectedArrivalAt' | 'FirstReceivedAt'

export default function ReceivingPage() {
  const { t } = useTranslation('warehouse')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()
  
  const [activeTab, setActiveTab] = useState<string>('all')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState<string>()
  const [sorts, setSorts] = useState<SortSpec<PackageSortField>[]>([])

  const { data, isFetching } = useInboundPackages({
    packageState: activeTab === 'all' ? undefined : activeTab,
    pageNumber,
    pageSize,
    search,
    sortBy: serializeSortBy(sorts) || 'CreatedAt desc', // Default sort
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

  const handleSearch = (value: string) => {
    setSearch(value)
    setPageNumber(1)
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setPageNumber(1)
  }

  // Mobile: card list
  if (isMobile) {
    return (
      <div>
        <Typography.Title level={4} style={{ marginBottom: 16, lineHeight: 1.3 }}>
          {t('receiving.title', 'Receiving Queue')}
        </Typography.Title>

        <Input.Search
          placeholder={t('receiving.searchPlaceholder', 'Search order code, tracking, sender...')}
          allowClear
          onSearch={handleSearch}
          style={{ marginBottom: 16 }}
        />

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="small"
          style={{ marginBottom: 12 }}
        />

        <List
          loading={isFetching}
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
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11, display: 'block', marginTop: 2 }}
                  >
                    {t('table.createdAt', 'Created')}: {formatDateTime(record.createdAt)}
                  </Typography.Text>
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
      key: 'ExpectedArrivalAt' satisfies PackageSortField,
      sorter: true,
      width: 150,
      render: (val?: string) => (val ? formatDateTime(val) : '—'),
    },
    {
      title: t('table.createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'CreatedAt' satisfies PackageSortField,
      sorter: true,
      width: 150,
      render: (val: string) => formatDateTime(val),
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
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('receiving.title', 'Receiving Queue')}
        </Typography.Title>
      </Flex>

      <Card styles={{ body: { padding: 16 } }} style={{ marginBottom: 16 }}>
        <Flex gap={16} wrap>
          <Input.Search
            placeholder={t('receiving.searchPlaceholder', 'Search by code, tracking...')}
            allowClear
            onSearch={handleSearch}
            style={{ maxWidth: 400 }}
          />
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            style={{ flex: 1, minWidth: 300, marginBottom: -16 }} // negative margin to align with Input
          />
        </Flex>
      </Card>

      <Table<InboundPackageDto>
        rowKey="clientOrderCode"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isFetching}
        pagination={{
          current: pageNumber,
          pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
        }}
        onChange={(pagination, _filters, sorter) => {
          setPageNumber(pagination.current ?? 1)
          if (pagination.pageSize && pagination.pageSize !== pageSize) {
            setPageSize(pagination.pageSize)
          }

          const arr = Array.isArray(sorter) ? sorter : [sorter]
          const next = arr
            .filter(s => s.order)
            .map(s => ({
              field: (s.columnKey || s.field) as PackageSortField, // s.columnKey matches the PascalCase key defined in columns
              direction: s.order === 'descend' ? 'desc' : 'asc',
            } as SortSpec<PackageSortField>))
          
          setSorts(next)
          
          // Reset to page 1 if sorting changed, but we handled pagination above.
          // In AntD onChange, if the user clicked a sorter, pagination.current might still be old.
          // Wait, actually, if sorter changes, we should reset to page 1.
          // A simple way is to check if sorts changed (by comparing state), but here we can just do:
          if (next.length !== sorts.length || next.some((n, i) => n.field !== sorts[i]?.field || n.direction !== sorts[i]?.direction)) {
            setPageNumber(1)
          }
        }}
        onRow={(record) => ({
          onClick: () => handleNavigate(record.clientOrderCode),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
