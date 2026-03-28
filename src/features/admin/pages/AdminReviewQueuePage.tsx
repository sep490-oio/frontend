import { useState } from 'react'
import { Typography, Space, Button, Modal, Input, App } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { FileSearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useReviewQueue, useApproveItem, useRejectItem, useAssignReviewer } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { ReviewQueueItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function AdminReviewQueuePage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignItemId, setAssignItemId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectItemId, setRejectItemId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useReviewQueue({ pageNumber: page, pageSize })
  const approveItem = useApproveItem()
  const rejectItem = useRejectItem()
  const assignReviewer = useAssignReviewer()

  const handleApprove = async (id: string) => {
    try {
      await approveItem.mutateAsync(id)
      message.success(t('reviewQueue.approveSuccess'))
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason) return
    try {
      await rejectItem.mutateAsync({ id: rejectItemId, reason: rejectReason })
      message.success(t('reviewQueue.rejectSuccess'))
      setRejectModalOpen(false)
      setRejectReason('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleAssign = async () => {
    if (!reviewerId) return
    try {
      await assignReviewer.mutateAsync({ itemId: assignItemId, adminId: reviewerId })
      message.success(t('reviewQueue.assignSuccess'))
      setAssignModalOpen(false)
      setReviewerId('')
    } catch {
      message.error(t('common.error'))
    }
  }

  const columns: ColumnsType<ReviewQueueItemDto> = [
    {
      title: t('reviewQueue.itemTitle'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: t('reviewQueue.seller'),
      dataIndex: 'sellerName',
      key: 'sellerName',
      width: 160,
    },
    {
      title: t('reviewQueue.submittedAt'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('reviewQueue.assignedTo'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 140,
      render: (val: string | undefined) => val ?? '-',
    },
    {
      title: t('reviewQueue.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('reviewQueue.actions'),
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => navigate(`/admin/items/${record.itemId}`)}>
            {t('reviewQueue.view')}
          </Button>
          {record.status === 'pending_review' && (
            <>
              <Button type="link" size="small" onClick={() => handleApprove(record.itemId)}>
                {t('reviewQueue.approve')}
              </Button>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => { setRejectItemId(record.itemId); setRejectModalOpen(true) }}
              >
                {t('reviewQueue.reject')}
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => { setAssignItemId(record.itemId); setAssignModalOpen(true) }}
              >
                {t('reviewQueue.assign')}
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
        <FileSearchOutlined /> {t('reviewQueue.title')}
      </Typography.Title>

      <ResponsiveTable<ReviewQueueItemDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        mobileMode="list"
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (p, ps) => { setPage(p); setPageSize(ps) },
        }}
      />

      {/* Assign reviewer modal */}
      <Modal
        title={t('reviewQueue.assignReviewer')}
        open={assignModalOpen}
        onOk={handleAssign}
        onCancel={() => { setAssignModalOpen(false); setReviewerId('') }}
        confirmLoading={assignReviewer.isPending}
      >
        <Typography.Text strong>{t('reviewQueue.reviewerId')}</Typography.Text>
        <Input
          value={reviewerId}
          onChange={(e) => setReviewerId(e.target.value)}
          placeholder={t('reviewQueue.reviewerIdPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* Reject modal */}
      <Modal
        title={t('reviewQueue.reject')}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        confirmLoading={rejectItem.isPending}
      >
        <Typography.Text strong>{t('itemDetail.rejectReason')}</Typography.Text>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder={t('itemDetail.rejectReasonPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  )
}
