import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Descriptions, Card, Button, Space, Spin, Alert, Modal, Input, App, Table, Image } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminItemDetail, useApproveItem, useRejectItem } from '@/features/admin/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import type { ItemReviewDto } from '@/types'
import type { ColumnsType } from 'antd/es/table'

export default function AdminItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const navigate = useNavigate()

  const { data: item, isLoading, error } = useAdminItemDetail(id!)
  const approveItem = useApproveItem()
  const rejectItem = useRejectItem()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (error || !item) return <Alert type="error" message={t('common.error')} showIcon />

  const handleApprove = async () => {
    try {
      await approveItem.mutateAsync(id!)
      message.success(t('reviewQueue.approveSuccess'))
      navigate('/admin/items/review')
    } catch {
      message.error(t('common.error'))
    }
  }

  const handleReject = async () => {
    if (!rejectReason) return
    try {
      await rejectItem.mutateAsync({ id: id!, reason: rejectReason })
      message.success(t('reviewQueue.rejectSuccess'))
      setRejectModalOpen(false)
      navigate('/admin/items/review')
    } catch {
      message.error(t('common.error'))
    }
  }

  const reviewColumns: ColumnsType<ItemReviewDto> = [
    {
      title: t('itemDetail.reviewer'),
      dataIndex: 'reviewerId',
      key: 'reviewerId',
      ellipsis: true,
    },
    {
      title: t('itemDetail.action'),
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => <StatusBadge status={action} size="small" />,
    },
    {
      title: t('itemDetail.reason'),
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string | undefined) => reason ?? '-',
    },
    {
      title: t('itemDetail.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/items/review')}>
          {t('common.back')}
        </Button>
      </Space>

      <Typography.Title level={2} style={{ marginBottom: 24 }}>
        {t('itemDetail.title')}
      </Typography.Title>

      <Card title={t('itemDetail.info')} style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered>
          <Descriptions.Item label={t('common.id')}>{item.id}</Descriptions.Item>
          <Descriptions.Item label={t('reviewQueue.itemTitle')}>{item.title}</Descriptions.Item>
          <Descriptions.Item label={t('reviewQueue.seller')}>{item.sellerId}</Descriptions.Item>
          <Descriptions.Item label={t('itemDetail.condition')}>{item.condition}</Descriptions.Item>
          <Descriptions.Item label={t('itemDetail.quantity')}>{item.quantity}</Descriptions.Item>
          <Descriptions.Item label={t('verifications.status')}>
            <StatusBadge status={item.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('users.createdAt')}>{formatDateTime(item.createdAt)}</Descriptions.Item>
          {item.categoryId && (
            <Descriptions.Item label={t('itemDetail.category')}>{item.categoryId}</Descriptions.Item>
          )}
        </Descriptions>
        {item.description && (
          <div style={{ marginTop: 16 }}>
            <Typography.Text strong>Description:</Typography.Text>
            <Typography.Paragraph style={{ marginTop: 8 }}>{item.description}</Typography.Paragraph>
          </div>
        )}
        {item.images && item.images.length > 0 && (
          <Space wrap style={{ marginTop: 16 }}>
            {item.images.map((img) => (
              <Image key={img.id} src={img.url} width={120} style={{ borderRadius: 8 }} />
            ))}
          </Space>
        )}
      </Card>

      {/* Review history */}
      <Card title={t('itemDetail.reviewHistory')} style={{ marginBottom: 24 }}>
        <Table<ItemReviewDto>
          rowKey="id"
          columns={reviewColumns}
          dataSource={item.reviews ?? []}
          pagination={false}
          scroll={{ x: 600 }}
        />
      </Card>

      {/* Actions */}
      <Space>
        <Button type="primary" onClick={handleApprove} loading={approveItem.isPending}>
          {t('reviewQueue.approve')}
        </Button>
        <Button danger onClick={() => setRejectModalOpen(true)}>
          {t('reviewQueue.reject')}
        </Button>
      </Space>

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
