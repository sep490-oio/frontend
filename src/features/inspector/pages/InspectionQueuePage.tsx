import { useState } from 'react'
import { Typography, Select, Button, Space, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useInspectionQueue } from '@/features/inspector/api'
import type { InspectionQueueItem } from '@/features/inspector/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { SERIF_FONT } from '@/styles/tokens'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'awaiting_inspection', label: 'Awaiting Inspection' },
  { value: 'pending_review', label: 'Pending Review' },
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
      title: 'Declared Condition',
      dataIndex: 'declaredCondition',
      key: 'declaredCondition',
      width: 140,
      render: (v: string) => <StatusBadge status={v} size="small" />,
    },
    {
      title: 'Queue Status',
      dataIndex: 'queueStatus',
      key: 'queueStatus',
      width: 150,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Arrived',
      dataIndex: 'arrivedAt',
      key: 'arrivedAt',
      width: 160,
      render: (date: string) => date ? formatDateTime(date) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: InspectionQueueItem) => (
        <Button
          type="link"
          icon={<SearchOutlined />}
          onClick={() => navigate(`/inspector/inspections/${record.inboundShipmentId}`)}
          style={{ color: 'var(--color-accent)' }}
        >
          Inspect
        </Button>
      ),
    },
  ]

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
            style={{ width: 200 }}
            placeholder="Filter by status"
          />
        </Space>
      </Card>

      <Card>
        <ResponsiveTable<InspectionQueueItem>
          mobileMode="card"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="inboundShipmentId"
          loading={isLoading}
          pagination={{
            current: data?.metadata?.currentPage ?? page,
            pageSize: data?.metadata?.pageSize ?? pageSize,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>
    </div>
  )
}
