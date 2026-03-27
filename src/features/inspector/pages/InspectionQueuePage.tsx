import { useState } from 'react'
import { Typography, Select, Button, Space, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useInspectionQueue } from '@/features/inspector/api'
import type { InspectionQueueItem } from '@/features/inspector/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { TablePaginationConfig } from 'antd'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export default function InspectionQueuePage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  const { data, isLoading } = useInspectionQueue({
    pageNumber: page,
    pageSize,
    status: statusFilter || undefined,
  })

  const columns = [
    {
      title: 'Item',
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
    },
    {
      title: 'Seller',
      dataIndex: 'sellerName',
      key: 'sellerName',
    },
    {
      title: 'Provider',
      dataIndex: 'providerCode',
      key: 'providerCode',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Arrived',
      dataIndex: 'arrivedAt',
      key: 'arrivedAt',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: InspectionQueueItem) => (
        <Button
          type="link"
          icon={<SearchOutlined />}
          onClick={() => navigate(`/inspector/inspections/${record.id}`)}
          style={{ color: 'var(--color-accent)' }}
        >
          Inspect
        </Button>
      ),
    },
  ]

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1)
    setPageSize(pagination.pageSize ?? 12)
  }

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ marginBottom: 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)' }}
      >
        Inspection Queue
      </Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            style={{ width: 180 }}
            placeholder="Filter by status"
          />
        </Space>
      </Card>

      <Card>
        <ResponsiveTable<InspectionQueueItem>
          mobileMode="card"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            current: page,
            pageSize,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>
    </div>
  )
}
