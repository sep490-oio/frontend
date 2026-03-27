import { useState } from 'react'
import { Typography, Select, Space, Button, Modal, Input, App } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ShopOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminSellerProfiles, useVerifySellerProfile, useRejectSellerProfile } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { SellerProfileStatus } from '@/types/enums'
import type { SellerProfileDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const STATUS_OPTIONS = [
  { value: '', label: '' },
  { value: SellerProfileStatus.Pending, label: 'Pending' },
  { value: SellerProfileStatus.Verified, label: 'Verified' },
  { value: SellerProfileStatus.Rejected, label: 'Rejected' },
  { value: SellerProfileStatus.Suspended, label: 'Suspended' },
] as const

export default function AdminSellerProfilesPage() {
  const { t } = useTranslation('admin')
  const { message } = App.useApp()

  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useAdminSellerProfiles({
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const verifyProfile = useVerifySellerProfile()
  const rejectProfile = useRejectSellerProfile()

  const handleVerify = async (id: string) => {
    try {
      await verifyProfile.mutateAsync(id)
      message.success(t('sellers.verifySuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason) return
    try {
      await rejectProfile.mutateAsync({ id: rejectId, reason: rejectReason })
      message.success(t('sellers.rejectSuccess'))
      setRejectModalOpen(false)
      setRejectReason('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const columns: ColumnsType<SellerProfileDto> = [
    {
      title: t('sellers.storeName'),
      dataIndex: 'storeName',
      key: 'storeName',
      ellipsis: true,
    },
    {
      title: t('sellers.description'),
      dataIndex: 'storeDescription',
      key: 'storeDescription',
      ellipsis: true,
      render: (desc: string) => desc || '—',
    },
    {
      title: t('sellers.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('sellers.trustScore'),
      dataIndex: 'trustScore',
      key: 'trustScore',
      width: 120,
      render: (score: number) => (
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>
          {score != null ? score.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      title: t('sellers.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('sellers.actions'),
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          {record.status === SellerProfileStatus.Pending && (
            <>
              <Button type="link" size="small" onClick={() => handleVerify(record.id)}>
                {t('sellers.verify')}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => {
                  setRejectId(record.id)
                  setRejectModalOpen(true)
                }}
              >
                {t('sellers.reject')}
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
        <ShopOutlined /> {t('sellers.title')}
      </Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder={t('sellers.filterStatus')}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('sellers.allStatuses'),
          }))}
        />
      </Space>

      <ResponsiveTable<SellerProfileDto>
        rowKey="id"
        columns={columns}
        dataSource={data ?? []}
        loading={isLoading}
        mobileMode="list"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title={t('sellers.reject')}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        confirmLoading={rejectProfile.isPending}
      >
        <Typography.Text strong>{t('sellers.rejectReason')}</Typography.Text>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('sellers.rejectReasonPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  )
}
