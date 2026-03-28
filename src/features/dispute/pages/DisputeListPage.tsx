import { useState } from 'react'
import { Typography, Tag, Select, Space, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useDisputes } from '@/features/dispute/api'
import type { DisputeFilterParams } from '@/features/dispute/api'
import { DisputeStatus } from '@/types/enums'
import type { DisputeDto } from '@/types'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'

const STATUS_COLOR_MAP: Record<string, string> = {
  [DisputeStatus.Draft]: 'default',
  [DisputeStatus.Open]: 'blue',
  [DisputeStatus.UnderReview]: 'orange',
  [DisputeStatus.AwaitingResponse]: 'gold',
  [DisputeStatus.Escalated]: 'red',
  [DisputeStatus.Resolved]: 'green',
  [DisputeStatus.Closed]: 'default',
  [DisputeStatus.Cancelled]: 'default',
}

const PRIORITY_COLOR_MAP: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  critical: 'red',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: DisputeStatus.Draft, label: 'Draft' },
  { value: DisputeStatus.Open, label: 'Open' },
  { value: DisputeStatus.UnderReview, label: 'Under Review' },
  { value: DisputeStatus.AwaitingResponse, label: 'Awaiting Response' },
  { value: DisputeStatus.Escalated, label: 'Escalated' },
  { value: DisputeStatus.Resolved, label: 'Resolved' },
  { value: DisputeStatus.Closed, label: 'Closed' },
  { value: DisputeStatus.Cancelled, label: 'Cancelled' },
]

export default function DisputeListPage() {
  const { t } = useTranslation('dispute')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const [filters, setFilters] = useState<DisputeFilterParams>({
    pageNumber: 1,
    pageSize: 10,
  })

  const { data, isLoading } = useDisputes(filters, { refetchInterval: 30000 })

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFilters((prev) => ({
      ...prev,
      pageNumber: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
    }))
  }

  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value || undefined,
      pageNumber: 1,
    }))
  }

  const columns: ColumnsType<DisputeDto> = [
    {
      title: t('id', 'ID'),
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Typography.Text copyable style={{ fontSize: 12 }}>
          {id.slice(0, 8)}...
        </Typography.Text>
      ),
    },
    {
      title: t('title', 'Title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={STATUS_COLOR_MAP[status] ?? 'default'}>{t(`statusLabel.${status}`, status)}</Tag>
      ),
    },
    {
      title: t('priority', 'Priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority: string) => (
        <Tag color={PRIORITY_COLOR_MAP[priority] ?? 'default'}>{t(`priorityLabel.${priority}`, priority)}</Tag>
      ),
    },
    {
      title: t('createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('disputeNumber', 'Number'),
      dataIndex: 'disputeNumber',
      key: 'disputeNumber',
      width: 140,
    },
    {
      title: tc('action.view', 'Actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: DisputeDto) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/me/disputes/${record.id}`)}>
          {tc('action.view', 'View')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2}>{t('disputes', 'Disputes')}</Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200 }}
          options={STATUS_OPTIONS.map((opt) => ({
            ...opt,
            label: opt.value ? t(`statusLabel.${opt.value}`, opt.label) : t('filter.all', opt.label),
          }))}
          value={filters.status ?? ''}
          onChange={handleStatusFilter}
          placeholder={t('filterByStatus', 'Filter by status')}
        />
      </Space>

      <ResponsiveTable<DisputeDto>
        mobileMode="card"
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: data?.metadata?.currentPage ?? 1,
          pageSize: data?.metadata?.pageSize ?? 10,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
        }}
        onChange={handleTableChange}
      />
    </div>
  )
}
