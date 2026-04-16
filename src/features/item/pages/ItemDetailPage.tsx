import { useState } from 'react'
import {
  Row,
  Col,
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
import { useItemById, useChooseItemShipping, useCategories } from '@/features/item/api'
import { useAuctionHub } from '@/features/auction/hooks/useAuctionHub'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ImageGallery } from '@/components/ui/ImageGallery'
import { useCurrentUser } from '@/features/user/api'
import { AuctionDetailTabs } from '@/features/auction/components/AuctionDetailTabs'
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
  const { data: categories } = useCategories()
  const { data: currentUser } = useCurrentUser()
  const hub = useAuctionHub(undefined, id)
  const chooseShipping = useChooseItemShipping()
  const [shippingForm] = Form.useForm<ShippingDetailsFormValues>()
  const [shippingModalOpen, setShippingModalOpen] = useState(false)

  const isSeller = currentUser?.id === item?.sellerId

  const categoryName = categories?.find((c) => c.id === item?.categoryId)?.name ?? item?.categoryId

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

      <Row gutter={isMobile ? [0, 24] : [48, 32]}>
        {/* ══ LEFT COLUMN ══════════════════════════════════ */}
        <Col xs={24} lg={14} className="space-y-8" data-purpose="product-display">
          {/* Image Gallery */}
          <div className="glass-card overflow-hidden aspect-square flex flex-col p-8" style={{ marginBottom: 32 }}>
            <ImageGallery images={galleryImages} alt={item.title} />
          </div>

        </Col>

        {/* ══ RIGHT COLUMN ═════════════════════════════════ */}
        <Col xs={24} lg={10} className="oio-fade-in oio-fade-in-delay-1 space-y-6">
          {/* Title & Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusBadge status={item.status} />
              {item.condition && <StatusBadge status={item.condition} />}
            </div>
            <h1 className="oio-serif" style={{ fontSize: isMobile ? 32 : 36, lineHeight: 1.2, margin: 0, fontWeight: 700 }}>
              {item.title}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
              {t('itemCode', 'Mã vật phẩm')}: <strong style={{ color: 'var(--color-text-primary)' }}>#{item.id?.substring(0, 6).toUpperCase()}</strong>
            </p>
          </div>

          {/* Description & Specs & Q&A via Tabs */}
          <div className="glass-card p-8" data-purpose="product-info-tabs" style={{ marginBottom: 24 }}>
            <AuctionDetailTabs
              item={item}
              isSeller={isSeller}
              categoryName={categoryName}
              qaConnected={hub.connected}
              qaLastSyncedAt={hub.lastSyncedAt}
            />
          </div>

          {/* Shipping Config — Seller only */}
          {isSeller && item.status === ItemStatus.PendingVerify && (
            <div className="glass-card p-8 space-y-6">
              <h3 style={{
                color: 'var(--color-text-primary)',
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: '0.04em',
                marginBottom: 16,
                textTransform: 'uppercase',
              }}>
                {t('sellerActions', 'Hành động của người bán')}
              </h3>
              <Button
                block
                type="primary"
                style={{
                  height: 48,
                  borderRadius: 8,
                  fontWeight: 600,
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)'
                }}
                onClick={() => { shippingForm.resetFields(); setShippingModalOpen(true) }}
              >
                {t('configShipping', 'Configure Shipping')}
              </Button>
            </div>
          )}
        </Col>
      </Row>
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
    </div>
  )
}
