import { useState } from 'react'
import { Typography, Select, Space, Button, App } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { usePendingVerifications, useApproveVerification, useRejectVerification } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { IdentityVerificationStatus } from '@/types/enums'
import type { VerificationDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function AdminVerificationsPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const STATUS_OPTIONS = [
    { value: '', label: t('verifications.allStatuses') },
    { value: IdentityVerificationStatus.Pending, label: tc('statusLabel.pending') },
    { value: IdentityVerificationStatus.Submitted, label: tc('statusLabel.submitted') },
    { value: IdentityVerificationStatus.UnderReview, label: tc('statusLabel.under_review') },
    { value: IdentityVerificationStatus.Approved, label: tc('statusLabel.approved') },
    { value: IdentityVerificationStatus.Rejected, label: tc('statusLabel.rejected') },
  ]

  const { message } = App.useApp()
  const navigate = useNavigate()

  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = usePendingVerifications({
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
      title: t('verifications.fullName', 'Full Name'),
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
      render: (name: string) => name || '-',
    },
    {
      title: t('verifications.type'),
      dataIndex: 'verificationType',
      key: 'verificationType',
      width: 140,
      render: (type: string) => <StatusBadge status={type} size="small" />,
    },
    {
      title: t('verifications.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
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
      title: t('verifications.attempts', 'Attempts'),
      dataIndex: 'attemptCount',
      key: 'attemptCount',
      width: 90,
      align: 'center' as const,
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
          {(record.status === IdentityVerificationStatus.Pending ||
            record.status === IdentityVerificationStatus.Submitted ||
            record.status === IdentityVerificationStatus.UnderReview) && (
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
          onChange={(val) => setStatusFilter(val)}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS}
        />
      </Space>

      <ResponsiveTable<VerificationDto>
        rowKey="id"
        columns={columns}
        dataSource={(data as any)?.items ?? data ?? []}
        loading={isLoading}
        mobileMode="list"
        pagination={{ pageSize: 20 }}
      />
    </div>
  )
}
