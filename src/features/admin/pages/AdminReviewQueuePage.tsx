import { useState } from 'react'
import { Typography, Space, Button, Modal, Input, App, Drawer, Image } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { FileSearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useReviewQueue, useApproveItem, useRejectItem, useAssignReviewer } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { ReviewQueueItemDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function AdminReviewQueuePage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assignItemId, setAssignItemId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [rejectDrawerOpen, setRejectDrawerOpen] = useState(false)
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
      setRejectDrawerOpen(false)
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
      title: '',
      dataIndex: 'primaryImageUrl',
      key: 'image',
      width: 64,
      render: (url: string | null | undefined) => (
        <div style={{
          width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
          background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {url ? (
            <Image
              src={url}
              width={44}
              height={44}
              style={{ objectFit: 'cover', display: 'block' }}
              preview={{ mask: false }}
            />
          ) : (
            <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>—</span>
          )}
        </div>
      ),
    },
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
      width: 150,
    },
    {
      title: t('reviewQueue.submittedAt'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('reviewQueue.assignedTo'),
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 130,
      render: (val: string | undefined) => val ?? '-',
    },
    {
      title: t('reviewQueue.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('reviewQueue.actions'),
      key: 'actions',
      width: isMobile ? 80 : 240,
      render: (_, record) => {
        if (isMobile) {
          // On mobile: single "View" button — full actions available on detail page
          return (
            <Button
              size="small"
              type="link"
              onClick={() => navigate(`/admin/items/${record.itemId}`)}
              style={{ padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              {t('reviewQueue.view')}
            </Button>
          )
        }
        return (
          <Space size={4} wrap>
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
                  onClick={() => { setRejectItemId(record.itemId); setRejectDrawerOpen(true) }}
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
        )
      },
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 80px' : undefined }}>
      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        <FileSearchOutlined /> {t('reviewQueue.title')}
      </Typography.Title>

      <ResponsiveTable<ReviewQueueItemDto>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        mobileMode="list"
        onRow={(record) => ({
          onClick: isMobile ? () => navigate(`/admin/items/${record.itemId}`) : undefined,
          style: isMobile ? { cursor: 'pointer', minHeight: 56 } : undefined,
        })}
        pagination={{
          current: data?.metadata?.currentPage ?? page,
          pageSize: data?.metadata?.pageSize ?? pageSize,
          total: data?.metadata?.totalCount ?? 0,
          showSizeChanger: !isMobile,
          showTotal: (total) => tc('pagination.total', { total }),
          simple: isMobile,
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
        centered={isMobile}
      >
        <Typography.Text strong>{t('reviewQueue.reviewerId')}</Typography.Text>
        <Input
          value={reviewerId}
          onChange={(e) => setReviewerId(e.target.value)}
          placeholder={t('reviewQueue.reviewerIdPlaceholder')}
          style={{ marginTop: 8, minHeight: 44 }}
        />
      </Modal>

      {/* Reject — Drawer on mobile, Modal on desktop */}
      {isMobile ? (
        <Drawer
          title={t('reviewQueue.reject')}
          placement="bottom"
          open={rejectDrawerOpen}
          onClose={() => { setRejectDrawerOpen(false); setRejectReason('') }}
          height="auto"
          styles={{ body: { paddingBottom: 32 } }}
          extra={
            <Button
              type="primary"
              danger
              onClick={handleReject}
              loading={rejectItem.isPending}
              disabled={!rejectReason}
            >
              {t('reviewQueue.reject')}
            </Button>
          }
        >
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            {t('itemDetail.rejectReason')}
          </Typography.Text>
          <Input.TextArea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('itemDetail.rejectReasonPlaceholder')}
          />
        </Drawer>
      ) : (
        <Modal
          title={t('reviewQueue.reject')}
          open={rejectDrawerOpen}
          onOk={handleReject}
          onCancel={() => { setRejectDrawerOpen(false); setRejectReason('') }}
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
      )}
    </div>
  )
}
