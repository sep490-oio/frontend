import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Descriptions, Card, Button, Space, Spin, Modal, Input, App, Image } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAdminItemDetail, useApproveItem, useRejectItem } from '@/features/admin/api'
import { useCategories } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { formatDateTime } from '@/utils/format'
import type { ItemReviewDto } from '@/types'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import type { ColumnsType } from 'antd/es/table'
import { useBreakpoint } from '@/hooks/useBreakpoint'

export default function AdminItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('admin')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const { data: item, isLoading, error, refetch } = useAdminItemDetail(id!)
  const approveItem = useApproveItem()
  const rejectItem = useRejectItem()
  const { data: categories } = useCategories()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
  if (error || !item) return <AdminErrorState message={t('common.error')} onRetry={refetch} backPath="/admin/items/review" />

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
      width: 110,
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
      width: 150,
      render: (date: string) => formatDateTime(date),
    },
  ]

  return (
    <div style={{ padding: isMobile ? '0 0 100px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/items/review')} style={{ minHeight: 44 }}>
          {t('common.back')}
        </Button>
      </Space>

      <Typography.Title level={isMobile ? 3 : 2} style={{ marginBottom: isMobile ? 16 : 24 }}>
        {t('itemDetail.title')}
      </Typography.Title>

      <Card title={t('itemDetail.info')} style={{ marginBottom: 16, borderRadius: 12 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size={isMobile ? 'small' : 'default'}>
          <Descriptions.Item label={t('common.id')}>
            <Typography.Text copyable style={{ fontSize: isMobile ? 12 : 14 }}>{item.id}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('reviewQueue.itemTitle')}>{item.title}</Descriptions.Item>
          <Descriptions.Item label={t('reviewQueue.seller')}>
            <Typography.Text ellipsis style={{ maxWidth: isMobile ? 160 : undefined }}>{item.sellerId}</Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('itemDetail.condition')}>{item.condition}</Descriptions.Item>
          <Descriptions.Item label={t('itemDetail.quantity')}>{item.quantity}</Descriptions.Item>
          <Descriptions.Item label={t('verifications.status')}>
            <StatusBadge status={item.status} />
          </Descriptions.Item>
          <Descriptions.Item label={t('users.createdAt')}>{formatDateTime(item.createdAt)}</Descriptions.Item>
          {item.categoryId && (
            <Descriptions.Item label={t('itemDetail.category')}>
              {categories?.find((c) => c.id === item.categoryId)?.name ?? item.categoryId}
            </Descriptions.Item>
          )}
        </Descriptions>

        {item.description && (
          <div style={{ marginTop: 16 }}>
            <Typography.Text strong>Description:</Typography.Text>
            <SafeHtmlRenderer html={item.description} style={{ marginTop: 8 }} />
          </div>
        )}

        {item.images && item.images.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Image.PreviewGroup>
              <Space wrap size={8}>
                {item.images.map((img) => (
                  <Image
                    key={img.id}
                    src={img.url}
                    width={isMobile ? 80 : 120}
                    height={isMobile ? 80 : 120}
                    style={{ borderRadius: 8, objectFit: 'cover' }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        )}
      </Card>

      {/* Review history */}
      <Card title={t('itemDetail.reviewHistory')} style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ overflowX: 'auto' }}>
          <ResponsiveTable<ItemReviewDto>
            rowKey="id"
            columns={reviewColumns}
            dataSource={item.reviews ?? []}
            pagination={false}
            mobileMode="list"
          />
        </div>
      </Card>

      {/* Actions — sticky on mobile */}
      {isMobile ? (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px 16px',
            background: 'var(--color-bg-primary, #fff)',
            borderTop: '1px solid var(--color-border, #f0f0f0)',
            zIndex: 100,
            display: 'flex',
            gap: 12,
          }}
        >
          <Button
            type="primary"
            onClick={handleApprove}
            loading={approveItem.isPending}
            style={{ flex: 1, minHeight: 48 }}
          >
            {t('reviewQueue.approve')}
          </Button>
          <Button
            danger
            onClick={() => setRejectModalOpen(true)}
            style={{ flex: 1, minHeight: 48 }}
          >
            {t('reviewQueue.reject')}
          </Button>
        </div>
      ) : (
        <Space>
          <Button type="primary" onClick={handleApprove} loading={approveItem.isPending}>
            {t('reviewQueue.approve')}
          </Button>
          <Button danger onClick={() => setRejectModalOpen(true)}>
            {t('reviewQueue.reject')}
          </Button>
        </Space>
      )}

      <Modal
        title={t('reviewQueue.reject')}
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setRejectReason('') }}
        confirmLoading={rejectItem.isPending}
        centered={isMobile}
        style={isMobile ? { top: 'auto', bottom: 0, margin: 0, paddingBottom: 0 } : undefined}
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