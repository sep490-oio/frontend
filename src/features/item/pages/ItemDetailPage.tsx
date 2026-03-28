import { useState } from 'react'
import {
  Typography,
  Row,
  Col,
  Card,
  Image,
  Descriptions,
  Spin,
  Empty,
  Space,
  Button,
  Modal,
  Form,
  App,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useItemById, useChooseItemShipping } from '@/features/item/api'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useCurrentUser } from '@/features/user/api'
import { ItemQA } from '@/features/item/components/ItemQA'
import ShippingDetailsForm from '@/components/ui/ShippingDetailsForm'
import type { ShippingDetailsFormValues } from '@/components/ui/ShippingDetailsForm'

export default function ItemDetailPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { isMobile } = useBreakpoint()

  const { data: item, isLoading } = useItemById(id ?? '')
  const { data: currentUser } = useCurrentUser()
  const hub = useAuctionHub(undefined, id)
  const chooseShipping = useChooseItemShipping()
  const [shippingForm] = Form.useForm<ShippingDetailsFormValues>()
  const [shippingModalOpen, setShippingModalOpen] = useState(false)

  const isSeller = currentUser?.id === item?.sellerId

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!item) {
    return <Empty description={t('notFound', 'Item not found')} />
  }

  const primaryImage = item.images?.find((img) => img.isPrimary) ?? item.images?.[0]
  const otherImages = item.images?.filter((img) => img.id !== primaryImage?.id) ?? []

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Row gutter={[24, isMobile ? 16 : 24]}>
        {/* Image Gallery */}
        <Col xs={24} xl={12}>
          <Card styles={{ body: { padding: 0 } }}>
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={item.title}
                style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
                preview
              />
            ) : (
              <Empty
                description={t('noImages', 'No images')}
                style={{ padding: 60 }}
              />
            )}
          </Card>
          {otherImages.length > 0 && (
            <Space wrap style={{ marginTop: 12 }}>
              <Image.PreviewGroup>
                {otherImages.map((img) => (
                  <Image
                    key={img.id}
                    src={img.thumbnailUrl ?? img.url}
                    alt={item.title}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                    preview={{ src: img.url }}
                  />
                ))}
              </Image.PreviewGroup>
            </Space>
          )}
        </Col>

        {/* Item Info */}
        <Col xs={24} xl={12}>
          <Typography.Title level={2} style={{ marginTop: 0 }}>{item.title}</Typography.Title>

          <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t('condition', 'Condition')}>
              <StatusBadge status={item.condition} />
            </Descriptions.Item>
            <Descriptions.Item label={t('status', 'Status')}>
              <StatusBadge status={item.status} />
            </Descriptions.Item>
            <Descriptions.Item label={t('quantity', 'Quantity')}>
              {item.quantity}
            </Descriptions.Item>
            <Descriptions.Item label={t('createdAt', 'Listed')}>
              {formatDateTime(item.createdAt)}
            </Descriptions.Item>
          </Descriptions>

          {item.description && (
            <>
              <Typography.Title level={5}>{t('description', 'Description')}</Typography.Title>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {item.description}
              </Typography.Paragraph>
            </>
          )}
        </Col>
      </Row>

      {/* Shipping Section — Seller only */}
      {isSeller && (
        <Card title="Vận chuyển" style={{ marginTop: isMobile ? 16 : 24, marginBottom: isMobile ? 16 : 24 }}>
          <Typography.Paragraph type="secondary">
            Cấu hình thông tin vận chuyển cho sản phẩm này.
          </Typography.Paragraph>
          <Button type="primary" onClick={() => { shippingForm.resetFields(); setShippingModalOpen(true) }}>
            Cấu hình vận chuyển
          </Button>
        </Card>
      )}

      {/* Shipping Modal */}
      <Modal
        title="Thông tin vận chuyển"
        open={shippingModalOpen}
        onCancel={() => setShippingModalOpen(false)}
        onOk={async () => {
          try {
            const values = await shippingForm.validateFields()
            await chooseShipping.mutateAsync({ itemId: id!, ...values })
            message.success('Đã lưu thông tin vận chuyển')
            setShippingModalOpen(false)
            shippingForm.resetFields()
          } catch { message.error('Vui lòng điền đầy đủ thông tin') }
        }}
        okText="Xác nhận"
        okButtonProps={{ loading: chooseShipping.isPending }}
        centered
        width={isMobile ? '95vw' : 520}
      >
        <ShippingDetailsForm form={shippingForm} />
      </Modal>

      {/* Q&A Section */}
      <ItemQA
        itemId={id ?? ''}
        isSeller={isSeller}
        realtimeConnected={hub.connected}
        lastSyncedAt={hub.lastSyncedAt}
      />
    </div>
  )
}
