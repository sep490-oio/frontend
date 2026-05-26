import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Typography, Descriptions, Card, Button, Space, Spin, Modal, Input, App, Image, Tabs, Tag, Timeline } from 'antd'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { ArrowLeftOutlined } from '@ant-design/icons'
import AdminItemQATab from '@/features/admin/components/items/AdminItemQATab'
import AdminItemLogisticsTab from '@/features/admin/components/items/AdminItemLogisticsTab'
import { useTranslation } from 'react-i18next'
import { useAdminItemDetail, useApproveItem, useRejectItem, useAdminItemAuctions, useAdminUserDetail } from '@/features/admin/api'
import { useCategories } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Popconfirm, Flex } from 'antd'
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { formatDateTime, formatCurrency, formatEnumText } from '@/utils/format'
import type { ItemReviewDto } from '@/types'
import { ItemStatus } from '@/types'
import { AdminErrorState } from '@/features/admin/components/AdminErrorState'
import { useBreakpoint } from '@/hooks/useBreakpoint'

function ModerationTimelineNode({ review, sellerId }: { review: ItemReviewDto, sellerId: string }) {
  const { data: user } = useAdminUserDetail(review.reviewerId)
  const isSeller = review.reviewerId === sellerId
  const name = user?.profile?.fullName || user?.userName || (review as any).reviewerName || (review as any).adminName || 'System'

  return (
    <div>
      <Flex gap={8} align="baseline" wrap="wrap">
        <Typography.Text strong>
          {name} {isSeller ? <Tag color="green" style={{ marginLeft: 4 }}>Seller</Tag> : <Tag color="blue" style={{ marginLeft: 4 }}>Admin/Inspector</Tag>}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {formatDateTime(review.createdAt)}
        </Typography.Text>
      </Flex>
      <div style={{ marginTop: 4 }}>
        <Space wrap>
          <Typography.Text>Performed action:</Typography.Text>
          <StatusBadge status={review.action} size="small" />
        </Space>
      </div>
      {review.reason && (
        <div style={{ background: 'var(--color-bg-layout)', marginTop: 8, padding: '8px 12px', borderRadius: 6 }}>
          <Typography.Text type="secondary">{review.reason}</Typography.Text>
        </div>
      )}
    </div>
  )
}

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
  const { data: auctions, isLoading: isLoadingAuctions } = useAdminItemAuctions(id!)
  const { data: seller } = useAdminUserDetail(item?.sellerId ?? '')

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

  const timelineItems = item.reviews?.map(review => {
    const isSeller = review.reviewerId === item.sellerId
    const color = isSeller ? 'green' : (review.action === 'Rejected' ? 'red' : 'blue')
    return {
      color,
      children: <ModerationTimelineNode review={review} sellerId={item.sellerId} />,
    }
  }) || []

  return (
    <div style={{ padding: isMobile ? '0 0 100px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => { navigate('/admin/items') }} style={{ minHeight: 44 }}>
          {t('common.back')}
        </Button>
      </Space>

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Flex gap={16} align="flex-start" wrap="wrap">
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
                {seller?.profile?.fullName || seller?.userName || item.sellerName || 'Unknown Seller'}
              </Button>
              <StatusBadge status={item.status} />
              {item.hasInboundShipment && <Tag color="purple">🏠 WAREHOUSE</Tag>}
            </Space>
          </div>
          {item.status === ItemStatus.PendingReview && (
            <Space style={{ flexShrink: 0 }}>
              <Popconfirm
                title={t('reviewQueue.confirmApprove', 'Are you sure you want to approve this item?')}
                onConfirm={handleApprove}
                okText={t('common.yes', 'Yes')}
                cancelText={t('common.no', 'No')}
              >
                <Button type="primary" loading={approveItem.isPending}>
                  {t('reviewQueue.approve', 'Approve')}
                </Button>
              </Popconfirm>
              <Button danger onClick={() => setRejectModalOpen(true)}>
                {t('reviewQueue.reject', 'Reject')}
              </Button>
            </Space>
          )}
        </Flex>
      </Card>

      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: t('itemDetail.overview', 'Overview'),
              children: (
                <div style={{ padding: 24 }}>
                  <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size={isMobile ? 'small' : 'middle'} layout="vertical">
                    <Descriptions.Item label={t('common.id')}>
                      <Typography.Text copyable={{ text: item.id }}>
                        {item.id.substring(0, 8)}...
                      </Typography.Text>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('itemDetail.condition')}>
                      <Tag color="blue">{formatEnumText(item.condition)}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('itemDetail.quantity')}>{item.quantity}</Descriptions.Item>
                    <Descriptions.Item label={t('itemDetail.category')}>
                      {item.categoryId ? (categories?.find((c) => c.id === item.categoryId)?.name ?? item.categoryId) : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('users.createdAt')}>{formatDateTime(item.createdAt)}</Descriptions.Item>
                  </Descriptions>

                  {item.description && (
                    <div style={{ marginTop: 24 }}>
                      <Typography.Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>{t('itemDetail.description', 'Description')}</Typography.Text>
                      <Card size="small" variant="borderless" style={{ background: 'var(--color-bg-layout)', borderRadius: 8 }}>
                        <SafeHtmlRenderer html={item.description} />
                      </Card>
                    </div>
                  )}

                  {item.images && item.images.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Typography.Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12 }}>{t('itemDetail.gallery', 'Gallery')}</Typography.Text>
                      <Image.PreviewGroup>
                        <Space wrap size="middle">
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
                  <ResponsiveTable
                    rowKey="id"
                    loading={isLoadingAuctions}
                    columns={[
                      {
                        title: 'ID',
                        dataIndex: 'id',
                        key: 'id',
                        render: (id) => (
                          <Space size="small">
                            <Button type="link" onClick={() => navigate(`/admin/auctions/${id}`)} style={{ padding: 0 }}>
                              {id.substring(0, 8)}...
                            </Button>
                            <Typography.Text copyable={{ text: id }} />
                          </Space>
                        ),
                      },
                      {
                        title: 'Type',
                        dataIndex: 'auctionType',
                        key: 'auctionType',
                        render: (type) => formatEnumText(type),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => <StatusBadge status={status} size="small" />,
                      },
                      {
                        title: 'Starting Price',
                        dataIndex: 'startingPrice',
                        key: 'startingPrice',
                        align: 'right',
                        render: (price: any, record: any) => (
                          <Typography.Text>
                            {formatCurrency(price?.amount ?? Number(price), price?.currency ?? record.currency)}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: 'Current Price',
                        dataIndex: 'currentPrice',
                        key: 'currentPrice',
                        align: 'right',
                        render: (price: any, record: any) => (
                          <Typography.Text strong style={{ color: '#1677ff' }}>
                            {formatCurrency(price?.amount ?? Number(price), price?.currency ?? record.currency)}
                          </Typography.Text>
                        ),
                      },
                      {
                        title: 'Bids',
                        dataIndex: 'bidCount',
                        key: 'bidCount',
                        align: 'center',
                        render: (val) => val ?? 0,
                      },
                      {
                        title: 'Start Time',
                        dataIndex: 'startTime',
                        key: 'startTime',
                        render: (val) => formatDateTime(val),
                      },
                      {
                        title: 'End Time',
                        dataIndex: 'endTime',
                        key: 'endTime',
                        render: (val) => formatDateTime(val),
                      },
                    ]}
                    dataSource={auctions ?? []}
                    pagination={false}
                    mobileMode="list"
                  />
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
                <div style={{ padding: 24, paddingTop: 32 }}>
                  {timelineItems.length > 0 ? (
                    <Timeline items={timelineItems} />
                  ) : (
                    <Typography.Text type="secondary">No moderation history available.</Typography.Text>
                  )}
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
