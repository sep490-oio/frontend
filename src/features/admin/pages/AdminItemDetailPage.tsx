import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Descriptions, Card, Button, Space, Spin, Modal, Input, App, Image, Tabs, Empty, Tag } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ArrowLeftOutlined } from '@ant-design/icons'
import AdminItemQATab from '@/features/admin/components/items/AdminItemQATab'
import AdminItemLogisticsTab from '@/features/admin/components/items/AdminItemLogisticsTab'
import { useTranslation } from 'react-i18next'
import { useAdminItemDetail, useApproveItem, useRejectItem } from '@/features/admin/api'
import { useCategories } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { formatDateTime, formatCurrency } from '@/utils/format'
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
      render: (reviewerId: string, record: any) => record.reviewerName || `Admin (ID: ...${reviewerId.substring(reviewerId.length - 6)})`,
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => { navigate('/admin/items') }} style={{ minHeight: 44 }}>
          {t('common.back')}
        </Button>
      </Space>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' }}>
        <Image
          src={item.images?.[0]?.url}
          fallback="/placeholder.png"
          width={80}
          height={80}
          style={{ objectFit: 'cover', borderRadius: 8 }}
          preview={{ mask: 'View' }}
        />
        <div style={{ flex: 1, minWidth: 250 }}>
          <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
            {item.title}
          </Typography.Title>
          <Space style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
            <Button type="link" onClick={() => navigate(`/admin/users/${item.sellerId}`)} style={{ padding: 0 }}>
              {item.sellerName || `Seller (ID: ...${item.sellerId.substring(item.sellerId.length - 6)})`}
            </Button>
            <StatusBadge status={item.status} />
            {item.hasInboundShipment && <Tag color="purple">🏠 WAREHOUSE</Tag>}
          </Space>
        </div>
        <Space style={{ flexShrink: 0 }}>
          <Button type="primary" onClick={handleApprove} loading={approveItem.isPending}>
            {t('reviewQueue.approve', 'Approve')}
          </Button>
          <Button danger onClick={() => setRejectModalOpen(true)}>
            {t('reviewQueue.reject', 'Reject')}
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: t('itemDetail.overview', 'Overview'),
              children: (
                <div style={{ padding: 24 }}>
                  <Descriptions column={{ xs: 1, sm: 2 }} bordered size={isMobile ? 'small' : 'default'}>
                    <Descriptions.Item label={t('common.id')}>
                      <Typography.Text copyable={{ text: item.id }}>
                        {item.id.substring(0, 8)}...
                      </Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('itemDetail.condition')}>{item.condition}</Descriptions.Item>
                    <Descriptions.Item label={t('itemDetail.quantity')}>{item.quantity}</Descriptions.Item>
                    <Descriptions.Item label={t('users.createdAt')}>{formatDateTime(item.createdAt)}</Descriptions.Item>
                    {item.categoryId && (
                      <Descriptions.Item label={t('itemDetail.category')}>
                        {categories?.find((c) => c.id === item.categoryId)?.name ?? item.categoryId}
                      </Descriptions.Item>
                    )}
                  </Descriptions>

                  {item.description && (
                    <div style={{ marginTop: 24 }}>
                      <Typography.Text strong>Description:</Typography.Text>
                      <SafeHtmlRenderer html={item.description} style={{ marginTop: 8 }} />
                    </div>
                  )}

                  {item.images && item.images.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Gallery:</Typography.Text>
                      <Image.PreviewGroup>
                        <Space wrap size={8}>
                          {item.images.map((img) => (
                            <Image
                              key={img.id}
                              src={img.url}
                              fallback="/placeholder.png"
                              width={isMobile ? 80 : 120}
                              height={isMobile ? 80 : 120}
                              style={{ borderRadius: 8, objectFit: 'cover' }}
                            />
                          ))}
                        </Space>
                      </Image.PreviewGroup>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'qa',
              label: t('itemDetail.qa', 'Q&A'),
              children: <div style={{ padding: 24 }}><AdminItemQATab itemId={id!} /></div>,
            },
            {
              key: 'auction_history',
              label: t('itemDetail.auctionHistory', 'Auction History'),
              children: (
                <div style={{ padding: 24 }}>
                  {item.auction ? (
                    <Descriptions bordered column={1} size="small" labelStyle={{ width: 140 }}>
                      <Descriptions.Item label="Auction ID">
                        <Typography.Text copyable={{ text: item.auction.auctionId }}>
                          {item.auction.auctionId.substring(0, 8)}...
                        </Typography.Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">{item.auction.auctionStatus}</Descriptions.Item>
                      <Descriptions.Item label="Type">{item.auction.auctionType}</Descriptions.Item>
                      <Descriptions.Item label="Current Price" style={{ textAlign: 'right' }}>
                        <Typography.Text strong>
                          {typeof item.auction.currentPrice === 'object' 
                            ? formatCurrency((item.auction.currentPrice as any)?.amount, (item.auction.currentPrice as any)?.currency || item.auction.currency) 
                            : formatCurrency(Number(item.auction.currentPrice), item.auction.currency)}
                        </Typography.Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Start Time">{formatDateTime(item.auction.startTime)}</Descriptions.Item>
                      <Descriptions.Item label="End Time">{formatDateTime(item.auction.endTime)}</Descriptions.Item>
                    </Descriptions>
                  ) : (
                    <Empty description="No auction history found" />
                  )}
                </div>
              ),
            },
            {
              key: 'logistics',
              label: t('itemDetail.logistics', 'Logistics & Fulfillment'),
              children: (
                <div style={{ padding: 24 }}>
                  <AdminItemLogisticsTab itemId={id!} />
                </div>
              ),
            },
            {
              key: 'moderation',
              label: t('itemDetail.moderation', 'Moderation & Inspection'),
              children: (
                <div style={{ padding: 24 }}>
                  <ResponsiveTable<ItemReviewDto>
                    rowKey="id"
                    columns={reviewColumns}
                    dataSource={item.reviews ?? []}
                    pagination={false}
                    mobileMode="list"
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>

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
