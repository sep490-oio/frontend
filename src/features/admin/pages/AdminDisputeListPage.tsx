import { useState } from 'react'
import { Typography, Select, Space, Input, Tag, Button, Drawer } from 'antd'
import { FilterOutlined } from '@ant-design/icons'
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
import { useBreakpoint } from '@/hooks/useBreakpoint'

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

export default function AdminDisputeListPage() {
  const { t } = useTranslation('dispute')
  const { t: tc } = useTranslation('common')
  const { t: ta } = useTranslation('admin')
  const { isMobile } = useBreakpoint()
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const STATUS_OPTIONS = [
    { value: '', label: ta('disputeList.allStatuses') },
    { value: DisputeStatus.Open, label: tc('statusLabel.open') },
    { value: DisputeStatus.AwaitingRespondent, label: ta('disputeList.statusLabel.awaitingRespondent') },
    { value: DisputeStatus.AwaitingEvidence, label: ta('disputeList.statusLabel.awaitingEvidence') },
    { value: DisputeStatus.UnderReview, label: tc('statusLabel.under_review') },
    { value: DisputeStatus.AwaitingInternalReview, label: ta('disputeList.statusLabel.awaitingInternalReview') },
    { value: DisputeStatus.AwaitingResolutionApproval, label: ta('disputeList.statusLabel.awaitingResolutionApproval') },
    { value: DisputeStatus.Resolved, label: tc('statusLabel.resolved') },
    { value: DisputeStatus.Rejected, label: tc('statusLabel.rejected') },
    { value: DisputeStatus.Cancelled, label: tc('statusLabel.cancelled') },
  ]

  const DOMAIN_OPTIONS = [
    { value: '', label: ta('disputeList.allDomains') },
    { value: 'order', label: ta('disputeList.domainLabel.order') },
    { value: 'auction', label: ta('disputeList.domainLabel.auction') },
    { value: 'payment', label: ta('disputeList.domainLabel.payment') },
    { value: 'shipment', label: ta('disputeList.domainLabel.shipment') },
    { value: 'warehouse_item', label: ta('disputeList.domainLabel.warehouseItem') },
  ]
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
      width: 150,
    },
    {
      title: t('status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      width: 260,
      render: (status: string) => (
        <Tag color={STATUS_COLOR_MAP[status] ?? 'default'}>{t(`statusLabel.${status}`, status)}</Tag>
      ),
    },
    {
      title: t('domain', 'Domain'),
      dataIndex: 'domain',
      key: 'domain',
      width: 150,
      render: (domain: string) =>
        domain ? <Tag color={DOMAIN_COLOR_MAP[domain] ?? 'default'}>{t(`domainLabel.${domain}`, domain)}</Tag> : '-',
    },
    {
      title: t('caseType', 'Case Type'),
      dataIndex: 'caseType',
      key: 'caseType',
      width: 180,
      ellipsis: true,
      render: (v: string) => (v ? t(`caseTypeLabel.${v}`, v) : '-'),
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
      width: 160,
      ellipsis: true,
      render: (v: string) => v ?? '-',
    },
    {
      title: t('respondent', 'Respondent'),
      dataIndex: 'respondentDisplayName',
      key: 'respondent',
      width: 160,
      ellipsis: true,
      render: (v: string) => v ?? '-',
    },
    {
      title: t('assignedTo', 'Assigned To'),
      dataIndex: 'assignedToDisplayName',
      key: 'assignedTo',
      width: 160,
      ellipsis: true,
      render: (v: string) => v ?? '-',
    },
    {
      title: t('createdAt', 'Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
  ]

  const activeFiltersCount = [filters.status, filters.domain].filter(Boolean).length

  const filterContent = (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('status', 'Status')}</Typography.Text>
        <Select
          style={{ width: '100%' }}
          options={STATUS_OPTIONS}
          value={filters.status ?? ''}
          onChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              status: (value as string) || undefined,
              pageNumber: 1,
            }))
          }
          placeholder={t('filterByStatus', 'Filter by status')}
        />
      </div>
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>{t('domain', 'Domain')}</Typography.Text>
        <Select
          style={{ width: '100%' }}
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
      </div>
    </Space>
  )

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 12 : 24 }}>
        {t('adminDisputes', 'Disputes')}
      </Typography.Title>

      {isMobile ? (
        /* Mobile: search bar + filter button */
        <Space style={{ width: '100%', marginBottom: 16 }} direction="vertical" size={10}>
          <Space.Compact style={{ width: '100%' }}>
            <Input.Search
              placeholder={t('searchDisputes', 'Search disputes...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              allowClear
              style={{ flex: 1, minHeight: 44 }}
            />
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerOpen(true)}
              style={{ minHeight: 44, minWidth: 60, position: 'relative' }}
            >
              {activeFiltersCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4, right: 4,
                  background: 'var(--color-accent, #1677ff)',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: 10,
                  width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </Space.Compact>
          {/* Active filter chips */}
          {activeFiltersCount > 0 && (
            <Space wrap size={6}>
              {filters.status && (
                <Tag closable onClose={() => setFilters((p) => ({ ...p, status: undefined, pageNumber: 1 }))}>
                  {STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? filters.status}
                </Tag>
              )}
              {filters.domain && (
                <Tag closable onClose={() => setFilters((p) => ({ ...p, domain: undefined, pageNumber: 1 }))}>
                  {DOMAIN_OPTIONS.find((o) => o.value === filters.domain)?.label ?? filters.domain}
                </Tag>
              )}
            </Space>
          )}
        </Space>
      ) : (
        /* Desktop: horizontal filters */
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            style={{ width: 200 }}
            options={STATUS_OPTIONS}
            value={filters.status ?? ''}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: (value as string) || undefined,
                pageNumber: 1,
              }))
            }
            placeholder={t('filterByStatus', 'Filter by status')}
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
      )}

      {/* Mobile filter drawer */}
      <Drawer
        title={t('filters', 'Filters')}
        placement="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        height="auto"
        styles={{ body: { paddingBottom: 32 } }}
        extra={
          <Button
            type="link"
            onClick={() => {
              setFilters((p) => ({ ...p, status: undefined, domain: undefined, pageNumber: 1 }))
              setFilterDrawerOpen(false)
            }}
          >
            {t('clearAll', 'Clear all')}
          </Button>
        }
      >
        {filterContent}
        <Button
          type="primary"
          block
          style={{ marginTop: 16, minHeight: 44 }}
          onClick={() => setFilterDrawerOpen(false)}
        >
          {t('applyFilters', 'Apply Filters')}
        </Button>
      </Drawer>

      <div style={{ overflowX: 'auto' }}>
        <ResponsiveTable<DisputeListItemDto>
          mobileMode="card"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="id"
          loading={isLoading}
          onRow={(record) => ({
            onClick: () => navigate(`/admin/disputes/${record.id}`),
            style: { cursor: 'pointer', minHeight: 56 },
          })}
          pagination={{
            current: data?.metadata?.currentPage ?? 1,
            pageSize: data?.metadata?.pageSize ?? 10,
            total: data?.metadata?.totalCount ?? 0,
            showSizeChanger: !isMobile,
            showTotal: (total) => tc('pagination.total', { total }),
            simple: isMobile,
          }}
          onChange={handleTableChange}
        />
      </div>
    </div>
  )
}