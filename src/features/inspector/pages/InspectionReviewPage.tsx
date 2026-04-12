import { useState } from 'react'
import { Typography, Card, Button, Modal, Input, Select, Space, message, Alert } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { useInspectionQueue, useReviewInspection } from '@/features/inspector/api'
import type { InspectionQueueItem } from '@/features/inspector/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { SERIF_FONT } from '@/styles/tokens'

export default function InspectionReviewPage() {
  const { t } = useTranslation('inspector')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InspectionQueueItem | null>(null)
  const [decision, setDecision] = useState<string>('')
  const [reason, setReason] = useState('')

  // Fetch inspected items that need review
  const { data, isLoading } = useInspectionQueue({ pageNumber: 1, pageSize: 50, status: 'awaiting_review' })

  const reviewMutation = useReviewInspection()

  const openReviewModal = (item: InspectionQueueItem, initialDecision: string) => {
    setSelectedItem(item)
    setDecision(initialDecision)
    setReason('')
    setReviewModalOpen(true)
  }

  const handleReview = async () => {
    if (!selectedItem || !decision) return

    try {
      await reviewMutation.mutateAsync({
        shipmentId: selectedItem.inboundShipmentId,
        decision,
        reason: reason || undefined,
      })
      message.success(`Inspection ${decision === 'approve' ? 'approved' : 'rejected'} successfully`)
      setReviewModalOpen(false)
      setSelectedItem(null)
    } catch {
      message.error('Failed to submit review')
    }
  }

  const columns = [
    {
      title: t('review.columnItem'),
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      ellipsis: true,
    },
    {
      title: t('review.columnDeclaredCondition'),
      dataIndex: 'declaredCondition',
      key: 'declaredCondition',
      width: 140,
      render: (v: string) => <StatusBadge status={v} size="small" />,
    },
    {
      title: t('review.columnActualCondition'),
      dataIndex: 'conditionOnArrival',
      key: 'conditionOnArrival',
      width: 140,
      render: (v: string) => v ? <StatusBadge status={v} size="small" /> : '-',
    },
    {
      title: t('review.columnQueueStatus'),
      dataIndex: 'queueStatus',
      key: 'queueStatus',
      width: 140,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: t('review.columnInspected'),
      dataIndex: 'inspectedAt',
      key: 'inspectedAt',
      width: 160,
      render: (date: string) => date ? formatDateTime(date) : '-',
    },
    {
      title: t('review.columnActions'),
      key: 'actions',
      width: 200,
      render: (_: unknown, record: InspectionQueueItem) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => openReviewModal(record, 'approve')}
            style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
          >
            {t('review.approve')}
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => openReviewModal(record, 'reject')}
          >
            {t('review.reject')}
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title
        level={2}
        style={{ marginBottom: 24, fontFamily: SERIF_FONT, color: 'var(--color-text-primary)' }}
      >
        {t('review.title')}
      </Typography.Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t('review.fallbackTitle')}
        description={t('review.fallbackDescription')}
      />

      <Card>
        <ResponsiveTable<InspectionQueueItem>
          mobileMode="card"
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="inboundShipmentId"
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => t('review.totalItems', { total }),
          }}
        />
      </Card>

      <Modal
        title={t('review.modalTitle')}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={handleReview}
        confirmLoading={reviewMutation.isPending}
        okText={decision === 'approve' ? t('review.approve') : t('review.reject')}
        okButtonProps={{
          danger: decision === 'reject',
          style: decision === 'approve' ? { background: 'var(--color-success)', borderColor: 'var(--color-success)' } : undefined,
        }}
      >
        {selectedItem && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Typography.Text strong>{t('review.labelItem')}:</Typography.Text>{' '}
              <Typography.Text>{selectedItem.itemTitle}</Typography.Text>
            </div>
            <div>
              <Typography.Text strong>{t('review.labelDeclared')}:</Typography.Text>{' '}
              <StatusBadge status={selectedItem.declaredCondition} size="small" />
              {selectedItem.conditionOnArrival && (
                <>
                  {' → '}
                  <Typography.Text strong>{t('review.labelActual')}:</Typography.Text>{' '}
                  <StatusBadge status={selectedItem.conditionOnArrival} size="small" />
                </>
              )}
            </div>
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                {t('review.labelDecision')}
              </Typography.Text>
              <Select
                value={decision}
                onChange={setDecision}
                options={[
                  { value: 'approve', label: t('review.approve') },
                  { value: 'reject', label: t('review.reject') },
                ]}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                {t('review.labelNotes')} {decision === 'reject' && t('review.required')}
              </Typography.Text>
              <Input.TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('review.notesPlaceholder')}
                rows={3}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}
