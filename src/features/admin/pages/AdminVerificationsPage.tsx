import { useState } from 'react'
import { Typography, Select, Space, Grid } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { usePendingVerifications } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { IdentityVerificationStatus } from '@/types/enums'
import type { VerificationDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { useBreakpoint } = Grid

export default function AdminVerificationsPage() {
  const { t } = useTranslation('admin')
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = usePendingVerifications({
    pageNumber: page,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const columns: ColumnsType<VerificationDto> = [
    {
      title: t('verifications.user', 'User'),
      dataIndex: 'userId',
      key: 'userId',
      render: (v: string | undefined) => {
        if (!v) return <Typography.Text type="secondary">—</Typography.Text>
        return <Typography.Text copyable={{ text: v }}>{v.slice(0, 8)}…</Typography.Text>
      },
    },
    {
      title: t('verifications.type', 'Type'),
      dataIndex: 'verificationType',
      key: 'verificationType',
    },
    {
      title: t('verifications.idType', 'ID type'),
      key: 'idType',
      render: (_: unknown, row: VerificationDto) => row.document?.idType ?? '-',
    },
    {
      title: t('verifications.status', 'Status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: t('verifications.submittedAt', 'Submitted'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (v?: string) => (v ? formatDateTime(v) : '-'),
    },
  ]

  const STATUS_OPTIONS = [
    { value: '', label: t('verifications.allStatuses', 'All statuses') },
    { value: IdentityVerificationStatus.Pending, label: IdentityVerificationStatus.Pending },
    { value: IdentityVerificationStatus.Submitted, label: IdentityVerificationStatus.Submitted },
    { value: IdentityVerificationStatus.UnderReview, label: IdentityVerificationStatus.UnderReview },
    { value: IdentityVerificationStatus.Approved, label: IdentityVerificationStatus.Approved },
    { value: IdentityVerificationStatus.Rejected, label: IdentityVerificationStatus.Rejected },
  ]

  return (
    <div style={{ paddingBottom: 80 }}>
      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {t('verifications.title', 'Verifications')}
      </Typography.Title>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          options={STATUS_OPTIONS}
          style={{ minWidth: 180 }}
        />
      </Space>

      <ResponsiveTable<VerificationDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
        onRow={(row) => ({
          onClick: () => navigate(`/admin/verifications/${row.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  )
}
