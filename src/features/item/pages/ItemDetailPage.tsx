import { useState } from 'react'
import {
  Typography,
  Row,
  Col,
  Card,
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
import { SafeHtmlRenderer } from '@/components/ui/SafeHtmlRenderer'
import { ImageGallery } from '@/components/ui/ImageGallery'
import { formatDateTime } from '@/utils/format'
import { useCurrentUser } from '@/features/user/api'
import { ItemQA } from '@/features/item/components/ItemQA'
import { ItemStatus } from '@/types/enums'
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
    return <Empty description={t('notFound')} />
  }

  const galleryImages = (item.images ?? []).map((img) => ({
    url: img.url,
    thumbnailUrl: img.thumbnailUrl,
    isPrimary: img.isPrimary,
  }))

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
          <ImageGallery images={galleryImages} alt={item.title} />
        </Col>

        {/* Item Info */}
        <Col xs={24} xl={12}>
          <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 16 }}>{item.title}</Typography.Title>

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
            {item.categoryId && (
              <Descriptions.Item label={t('category', 'Category')}>
                {item.categoryId}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('createdAt', 'Listed')}>
              {formatDateTime(item.createdAt)}
            </Descriptions.Item>
          </Descriptions>

          {/* Shipping — Seller only, pending_verify status only */}
          {isSeller && item.status === ItemStatus.PendingVerify && (
            <Button
              type="primary"
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
              onClick={() => { shippingForm.resetFields(); setShippingModalOpen(true) }}
            >
              {t('configShipping', 'Configure Shipping')}
            </Button>
          )}
        </Col>
      </Row>

      {/* Description — full width below image+info */}
      {item.description && (
        <Card
          style={{ marginTop: isMobile ? 16 : 24 }}
          styles={{ body: { padding: isMobile ? 16 : 24 } }}
        >
          <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
            {t('description', 'Description')}
          </Typography.Title>
          <SafeHtmlRenderer html={item.description} />
        </Card>
      )}

      {/* Shipping Modal */}
      <Modal
        title={t('shippingDetails', 'Shipping Details')}
        open={shippingModalOpen}
        onCancel={() => setShippingModalOpen(false)}
        onOk={async () => {
          try {
            const values = await shippingForm.validateFields()
            await chooseShipping.mutateAsync({ itemId: id!, ...values })
            message.success(t('shippingSaved', 'Shipping details saved'))
            setShippingModalOpen(false)
            shippingForm.resetFields()
          } catch { message.error(t('shippingError', 'Please fill in all required fields')) }
        }}
        okText={tc('action.confirm', 'Confirm')}
        okButtonProps={{ loading: chooseShipping.isPending }}
        centered
        width={isMobile ? '95vw' : 560}
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
