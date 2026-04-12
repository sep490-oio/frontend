import { useState } from 'react'
import { Typography, Tag, Select, Space, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useMyDisputes } from '@/features/dispute/api'
import type { DisputeFilterParams } from '@/features/dispute/api'
import { DisputeStatus } from '@/types/enums'
import type { DisputeListItemDto } from '@/types'
import type { TablePaginationConfig } from 'antd/es/table'
import { formatDateTime } from '@/utils/format'

const STATUS_COLOR_MAP: Record<string, string> = {
  [DisputeStatus.Open]: 'blue',
  [DisputeStatus.AwaitingRespondent]: 'gold',
  [DisputeStatus.AwaitingEvidence]: 'gold',
  [DisputeStatus.UnderReview]: 'orange',
  [DisputeStatus.AwaitingInternalReview]: 'orange',
  [DisputeStatus.AwaitingResolutionApproval]: 'purple',
  [DisputeStatus.Resolved]: 'green',
  [DisputeStatus.Rejected]: 'red',
  [DisputeStatus.Cancelled]: 'default',
}

const DOMAIN_COLOR_MAP: Record<string, string> = {
  order: 'blue',
  auction: 'purple',
  payment: 'gold',
  shipment: 'cyan',
  warehouse_item: 'orange',
}

export default function MyDisputesPage() {
  const { t } = useTranslation('dispute')
  const { t: tc } = useTranslation('common')

  const STATUS_OPTIONS = [
    { value: '', label: t('filter.all') },
    { value: DisputeStatus.Open, label: t('statusLabel.open') },
    { value: DisputeStatus.AwaitingRespondent, label: t('statusLabel.awaiting_respondent') },
    { value: DisputeStatus.AwaitingEvidence, label: t('statusLabel.awaiting_evidence') },
    { value: DisputeStatus.UnderReview, label: t('statusLabel.under_review') },
    { value: DisputeStatus.AwaitingInternalReview, label: t('statusLabel.awaiting_internal_review') },
    { value: DisputeStatus.AwaitingResolutionApproval, label: t('statusLabel.awaiting_resolution_approval') },
    { value: DisputeStatus.Resolved, label: t('statusLabel.resolved') },
    { value: DisputeStatus.Rejected, label: t('statusLabel.rejected') },
    { value: DisputeStatus.Cancelled, label: t('statusLabel.cancelled') },
  ]
  const navigate = useNavigate()

  const [filters, setFilters] = useState<DisputeFilterParams>({
    pageNumber: 1,
    pageSize: 10,
  })

  const { data, isLoading } = useMyDisputes(filters)

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

  const columns = [
    {
      title: t('disputeNumber', 'Number'),
      dataIndex: 'disputeNumber',
      key: 'disputeNumber',
      width: 130,
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
      title: t('domain', 'Domain'),
      dataIndex: 'domain',
      key: 'domain',
      width: 120,
      render: (domain: string) =>
        domain ? <Tag color={DOMAIN_COLOR_MAP[domain] ?? 'default'}>{t(`domainLabel.${domain}`, domain)}</Tag> : '-',
    },
    {
      title: t('title', 'Title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: tc('action.view', 'Actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: DisputeListItemDto) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/me/disputes/${record.id}`)}>
          {tc('action.view', 'View')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2}>{t('myDisputes', 'My Disputes')}</Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 200 }}
          options={STATUS_OPTIONS}
          value={filters.status ?? ''}
          onChange={handleStatusFilter}
          placeholder={t('filterByStatus', 'Filter by status')}
        />
      </Space>

      <ResponsiveTable<DisputeListItemDto>
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
