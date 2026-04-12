import { useState } from 'react'
import { Typography, Select, Space, Input, Segmented, Tag } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useAdminDisputesList } from '@/features/dispute/api'
import type { DisputeFilterParams } from '@/features/dispute/api'
import { DisputeStatus } from '@/types/enums'
import type { DisputeListItemDto } from '@/types'
import type { TablePaginationConfig } from 'antd/es/table'
import { useDebounce } from '@/hooks/useDebounce'
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

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: DisputeStatus.Open, label: 'Open' },
  { value: DisputeStatus.AwaitingRespondent, label: 'Awaiting Respondent' },
  { value: DisputeStatus.AwaitingEvidence, label: 'Awaiting Evidence' },
  { value: DisputeStatus.UnderReview, label: 'Under Review' },
  { value: DisputeStatus.AwaitingInternalReview, label: 'Awaiting Internal Review' },
  { value: DisputeStatus.AwaitingResolutionApproval, label: 'Awaiting Resolution Approval' },
  { value: DisputeStatus.Resolved, label: 'Resolved' },
  { value: DisputeStatus.Rejected, label: 'Rejected' },
  { value: DisputeStatus.Cancelled, label: 'Cancelled' },
]

const DOMAIN_OPTIONS = [
  { value: '', label: 'All Domains' },
  { value: 'order', label: 'Order' },
  { value: 'auction', label: 'Auction' },
  { value: 'payment', label: 'Payment' },
  { value: 'shipment', label: 'Shipment' },
  { value: 'warehouse_item', label: 'Warehouse Item' },
]

export default function AdminDisputeListPage() {
  const { t } = useTranslation('dispute')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const [filters, setFilters] = useState<DisputeFilterParams>({
    pageNumber: 1,
    pageSize: 10,
  })
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)

  const queryParams: DisputeFilterParams = {
    ...filters,
    search: debouncedSearch || undefined,
  }

  const { data, isLoading } = useAdminDisputesList(queryParams)

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setFilters((prev) => ({
      ...prev,
      pageNumber: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? 10,
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
        <Tag color={STATUS_COLOR_MAP[status] ?? 'default'}>{status}</Tag>
      ),
    },
    {
      title: t('domain', 'Domain'),
      dataIndex: 'domain',
      key: 'domain',
      width: 120,
      render: (domain: string) =>
        domain ? <Tag color={DOMAIN_COLOR_MAP[domain] ?? 'default'}>{domain}</Tag> : '-',
    },
    {
      title: t('caseType', 'Case Type'),
      dataIndex: 'caseType',
      key: 'caseType',
      width: 140,
      ellipsis: true,
      render: (v: string) => v ?? '-',
    },
    {
      title: t('title', 'Title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('complainant', 'Complainant'),
      dataIndex: 'complainantDisplayName',
      key: 'complainant',
      width: 140,
      ellipsis: true,
      render: (v: string) => v ?? '-',
    },
    {
      title: t('respondent', 'Respondent'),
      dataIndex: 'respondentDisplayName',
      key: 'respondent',
      width: 140,
      ellipsis: true,
      render: (v: string) => v ?? '-',
    },
    {
      title: t('assignedTo', 'Assigned To'),
      dataIndex: 'assignedToDisplayName',
      key: 'assignedTo',
      width: 140,
      ellipsis: true,
      render: (v: string) => v ?? '-',
    },
    {
      title: t('createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
  ]

  return (
    <div>
      <Typography.Title level={2}>{t('adminDisputes', 'Disputes')}</Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Segmented
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          value={filters.status ?? ''}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              status: (value as string) || undefined,
              pageNumber: 1,
            }))
          }
        />
        <Select
          style={{ width: 160 }}
          options={DOMAIN_OPTIONS}
          value={filters.domain ?? ''}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              domain: value || undefined,
              pageNumber: 1,
            }))
          }
          placeholder={t('filterByDomain', 'Filter by domain')}
        />
        <Input.Search
          placeholder={t('searchDisputes', 'Search disputes...')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />
      </Space>

      <ResponsiveTable<DisputeListItemDto>
        mobileMode="card"
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={isLoading}
        onRow={(record) => ({
          onClick: () => navigate(`/admin/disputes/${record.id}`),
          style: { cursor: 'pointer' },
        })}
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
