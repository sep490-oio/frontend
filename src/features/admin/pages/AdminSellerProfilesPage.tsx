import { useState } from 'react'
import { Typography, Table, Select, Space, Button, Modal, Input, App, Rate } from 'antd'
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
  { value: SellerProfileStatus.Approved, label: 'Approved' },
  { value: SellerProfileStatus.Rejected, label: 'Rejected' },
  { value: SellerProfileStatus.Suspended, label: 'Suspended' },
] as const

export default function AdminSellerProfilesPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useAdminSellerProfiles({
    pageNumber: page,
    pageSize,
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
      title: t('sellers.user'),
      dataIndex: 'userId',
      key: 'userId',
      ellipsis: true,
    },
    {
      title: t('sellers.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('sellers.rating'),
      dataIndex: 'rating',
      key: 'rating',
      width: 160,
      render: (rating: number) => <Rate disabled value={rating} allowHalf />,
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
          onChange={(val) => { setStatusFilter(val); setPage(1) }}
          style={{ width: 200 }}
          allowClear
          onClear={() => setStatusFilter('')}
          options={STATUS_OPTIONS.map((opt) => ({
            value: opt.value,
            label: opt.value ? opt.label : t('sellers.allStatuses'),
          }))}
        />
      </Space>

      <Table<SellerProfileDto>
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
