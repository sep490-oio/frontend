import { useState } from 'react'
import { Typography, Table, Select, Space, Button, App } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { usePendingVerifications, useApproveVerification, useRejectVerification } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { IdentityVerificationStatus } from '@/types/enums'
import type { VerificationDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_OPTIONS = [
  { value: '', label: '' },
  { value: IdentityVerificationStatus.Pending, label: 'Pending' },
  { value: IdentityVerificationStatus.Approved, label: 'Approved' },
  { value: IdentityVerificationStatus.Rejected, label: 'Rejected' },
  { value: IdentityVerificationStatus.Unverified, label: 'Unverified' },
] as const

export default function AdminVerificationsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = usePendingVerifications({
    pageNumber: page,
    pageSize,
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const approveVerification = useApproveVerification()
  const rejectVerification = useRejectVerification()

  const handleApprove = async (id: string) => {
    try {
      await approveVerification.mutateAsync(id)
      message.success(t('verifications.approveSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectVerification.mutateAsync({ id, reason: 'Rejected by admin' })
      message.success(t('verifications.rejectSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const columns: ColumnsType<VerificationDto> = [
    {
      title: t('verifications.user'),
      dataIndex: 'userId',
      key: 'userId',
      ellipsis: true,
    },
    {
      title: t('verifications.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <StatusBadge status={type} size="small" />,
    },
    {
      title: t('verifications.idType'),
      dataIndex: 'idType',
      key: 'idType',
      width: 140,
    },
    {
      title: t('verifications.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('verifications.submittedAt'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      render: (date: string) => date ? formatDateTime(date) : '-',
    },
    {
      title: t('verifications.actions'),
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => navigate(`/admin/verifications/${record.id}`)}>
            {t('verifications.view')}
          </Button>
          {record.status === IdentityVerificationStatus.Pending && (
            <>
              <Button type="link" size="small" onClick={() => handleApprove(record.id)}>
                {t('verifications.approve')}
              </Button>
              <Button type="link" size="small" danger onClick={() => handleReject(record.id)}>
                {t('verifications.reject')}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        <SafetyCertificateOutlined /> {t('verifications.title')}
      </Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('verifications.filterStatus')}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('verifications.allStatuses'),
          }))}
        />
      </Space>

      <Table<VerificationDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        scroll={{ x: 800 }}
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />
    </div>
  )
}
