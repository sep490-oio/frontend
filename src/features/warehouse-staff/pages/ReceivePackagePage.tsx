import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import {
  useInboundPackage,
  useReceiveInboundPackage,
  useStorageLocations,
  useStoreWarehouseItem,
} from '@/features/warehouse/api'
import { SingleCaptureUploader } from '@/components/ui/SingleCaptureUploader'
import { StorageLocationMap } from '@/features/warehouse-staff/components/StorageLocationMap'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getProviderLabel } from '@/features/warehouse/utils/shipmentLabels'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { InboundPackageItemDto } from '@/types'

const allowUploadFallback = import.meta.env.VITE_ALLOW_UPLOAD === 'true'

export default function ReceivePackagePage() {
  const { clientOrderCode } = useParams<{ clientOrderCode: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const cameraAvailable =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  const { data: pkg, isLoading } = useInboundPackage(clientOrderCode ?? '')
  const receive = useReceiveInboundPackage()
  const storeItem = useStoreWarehouseItem()

  const [notes, setNotes] = useState('')
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null)
  const [shippingLabelPhoto, setShippingLabelPhoto] = useState<File | null>(null)
  const [sealConditionPhoto, setSealConditionPhoto] = useState<File | null>(null)
  const [insideContentsPhoto, setInsideContentsPhoto] = useState<File | null>(null)

  const [storingItem, setStoringItem] = useState<InboundPackageItemDto | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined)

  const { data: locations, isLoading: locationsLoading } = useStorageLocations({ vacantOnly: true })

  const cameraBlockedInProd = !cameraAvailable && !allowUploadFallback
  const cameraUnavailableWithFallback = !cameraAvailable && allowUploadFallback

  const isReceived = pkg && pkg.packageState !== 'pending_arrival'
  const canSubmit = Boolean(frontPhoto && !cameraBlockedInProd)

  const handleSubmit = () => {
    if (!clientOrderCode || !frontPhoto) return
    receive.mutate(
      {
        clientOrderCode,
        frontPhoto,
        shippingLabelPhoto: shippingLabelPhoto ?? undefined,
        sealConditionPhoto: sealConditionPhoto ?? undefined,
        insideContentsPhoto: insideContentsPhoto ?? undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          message.success(t('receive.receivePackageSuccess', 'Package received.'))
        },
        onError: () => message.error(t('receive.receiveError', 'Failed to receive package.')),
      },
    )
  }

  const handleStore = () => {
    if (!storingItem?.warehouseItemId || !selectedLocationId) return
    storeItem.mutate(
      { warehouseItemId: storingItem.warehouseItemId, storageLocationId: selectedLocationId },
      {
        onSuccess: () => {
          message.success(t('receive.storedSuccess', 'Item stored.'))
          setStoringItem(null)
          setSelectedLocationId(undefined)
        },
        onError: () => message.error(t('receive.storeError', 'Failed to store item.')),
      },
    )
  }

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 300 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!pkg) {
    return <Alert type="error" showIcon message={t('error.notFound', 'Package not found')} />
  }

  const cardMargin = isMobile ? 12 : 16

  return (
    <div style={{ maxWidth: 960, padding: isMobile ? '0 4px' : undefined }}>
      {/* Header */}
      <Flex
        justify="space-between"
        align={isMobile ? 'flex-start' : 'center'}
        gap={isMobile ? 8 : 0}
        style={{ marginBottom: cardMargin }}
        vertical={isMobile}
      >
        <Typography.Title
          level={isMobile ? 4 : 3}
          style={{ margin: 0, lineHeight: 1.3 }}
        >
          {t('receive.packageTitle', 'Package')}: {pkg.clientOrderCode}
        </Typography.Title>
        <Button
          onClick={() => navigate('/warehouse-staff/receiving')}
          style={{ minHeight: 44 }}
          block={isMobile}
        >
          {t('action.backToReceiving', 'Back to Receiving')}
        </Button>
      </Flex>

      {/* Summary Card */}
      <Card style={{ marginBottom: cardMargin }}>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label={t('table.provider', 'Provider')}>
            {getProviderLabel(pkg.providerCode)}
          </Descriptions.Item>
          <Descriptions.Item label={t('table.status', 'State')}>
            <StatusBadge status={pkg.packageState} />
          </Descriptions.Item>
          <Descriptions.Item label={t('table.trackingNumber', 'Tracking')}>
            {pkg.carrierTrackingNumber ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('table.itemCount', 'Items')}>
            {pkg.items.length}
          </Descriptions.Item>
          <Descriptions.Item label={t('sender', 'Sender')}>
            {pkg.senderName ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('senderPhone', 'Phone')}>
            {pkg.senderPhone ?? '—'}
          </Descriptions.Item>
        </Descriptions>
        {pkg.receiptMedia.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Typography.Text strong style={{ fontSize: isMobile ? 13 : 14 }}>
              {t('receive.receiptPhotos', 'Receipt photos')}
            </Typography.Text>
            <Image.PreviewGroup>
              <Space wrap style={{ marginTop: 8 }}>
                {pkg.receiptMedia.map((url) => (
                  <Image
                    key={url}
                    src={url}
                    width={isMobile ? 80 : 100}
                    height={isMobile ? 80 : 100}
                    style={{ objectFit: 'cover', borderRadius: 6 }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        )}
        {pkg.receiptNotes && (
          <Typography.Paragraph
            type="secondary"
            style={{ marginTop: 8, fontSize: isMobile ? 13 : 14 }}
          >
            {pkg.receiptNotes}
          </Typography.Paragraph>
        )}
      </Card>

      {/* Receive CTA */}
      {!isReceived && (
        <Card
          title={t('receive.receivePackage', 'Receive Package')}
          style={{ marginBottom: cardMargin }}
        >
          {cameraBlockedInProd && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 12 }}
              message={t('cameraBlocked', 'Camera access required')}
              description={t(
                'cameraBlockedDesc',
                'Camera is unavailable or permission was denied. Enable camera access in your browser settings to receive packages.',
              )}
            />
          )}
          {cameraUnavailableWithFallback && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 12 }}
              message={t(
                'cameraUnavailableFallback',
                'Camera unavailable — file upload fallback is enabled.',
              )}
            />
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? 'repeat(2, 1fr)'
                : 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: isMobile ? 10 : 12,
              marginBottom: 12,
            }}
          >
            <SingleCaptureUploader
              label={t('frontPhotoLabel', 'Front photo (required)')}
              required
              file={frontPhoto}
              onChange={setFrontPhoto}
              cameraAvailable={cameraAvailable}
              allowUploadFallback={allowUploadFallback}
            />
            <SingleCaptureUploader
              label={t('receive.shippingLabelPhoto', 'Shipping label photo (optional)')}
              file={shippingLabelPhoto}
              onChange={setShippingLabelPhoto}
              cameraAvailable={cameraAvailable}
              allowUploadFallback={allowUploadFallback}
            />
            <SingleCaptureUploader
              label={t('receive.sealConditionPhoto', 'Seal/tape photo (optional)')}
              file={sealConditionPhoto}
              onChange={setSealConditionPhoto}
              cameraAvailable={cameraAvailable}
              allowUploadFallback={allowUploadFallback}
            />
            <SingleCaptureUploader
              label={t('receive.insideContentsPhoto', 'Inside contents photo (optional)')}
              file={insideContentsPhoto}
              onChange={setInsideContentsPhoto}
              cameraAvailable={cameraAvailable}
              allowUploadFallback={allowUploadFallback}
            />
          </div>
          <Form layout="vertical">
            <Form.Item label={t('receive.notes', 'Notes (optional)')}>
              <Input.TextArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                style={{ fontSize: isMobile ? 16 : 14 }}
              />
            </Form.Item>
            <Button
              type="primary"
              loading={receive.isPending}
              disabled={!canSubmit}
              onClick={handleSubmit}
              block={isMobile}
              style={{ minHeight: isMobile ? 48 : 36, fontSize: isMobile ? 15 : 14 }}
            >
              {t('receive.submit', 'Receive Shipment')}
            </Button>
          </Form>
        </Card>
      )}

      {/* Items in package */}
      <Card title={t('receive.itemsInPackage', 'Items in this package')}>
        <Space direction="vertical" size={isMobile ? 12 : 'middle'} style={{ width: '100%' }}>
          {pkg.items.map((item) => {
            const isStored = item.warehouseItemStatus === 'stored'
            const isInspected =
              item.warehouseItemStatus === 'inspected' ||
              item.warehouseItemStatus === 'reserved' ||
              item.warehouseItemStatus === 'dispatched'
            const canStore =
              Boolean(item.warehouseItemId) && item.warehouseItemStatus === 'received'
            return (
              <div
                key={item.inboundShipmentId}
                style={{
                  padding: isMobile ? '10px 0' : undefined,
                  borderBottom: '1px solid var(--color-border, #f0f0f0)',
                }}
              >
                <Flex gap={12} align="flex-start">
                  {item.itemImageUrl ? (
                    <img
                      src={item.itemImageUrl}
                      alt={item.itemTitle}
                      style={{
                        width: isMobile ? 56 : 64,
                        height: isMobile ? 56 : 64,
                        objectFit: 'cover',
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: isMobile ? 56 : 64,
                        height: isMobile ? 56 : 64,
                        borderRadius: 8,
                        background: 'var(--color-bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <InboxOutlined style={{ fontSize: 24 }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text
                      strong
                      style={{ display: 'block', fontSize: isMobile ? 14 : 13 }}
                      ellipsis
                    >
                      {item.itemTitle ?? item.itemId}
                    </Typography.Text>
                    <Space size={6} wrap style={{ marginTop: 4 }}>
                      <StatusBadge status={item.inboundStatus} />
                      {item.warehouseItemStatus && <Tag>{item.warehouseItemStatus}</Tag>}
                    </Space>
                    {item.storageLocationLabel && (
                      <Typography.Text
                        type="secondary"
                        style={{ display: 'block', fontSize: 12, marginTop: 4 }}
                      >
                        {t('storingAt', 'Storing at:')} {item.storageLocationLabel}
                      </Typography.Text>
                    )}

                    {/* Action buttons — stacked vertically on mobile */}
                    <Space
                      direction={isMobile ? 'vertical' : 'horizontal'}
                      size={isMobile ? 8 : 'small'}
                      style={{ marginTop: isMobile ? 10 : 8, width: isMobile ? '100%' : undefined }}
                    >
                      {canStore && (
                        <Button
                          type="primary"
                          onClick={() => setStoringItem(item)}
                          block={isMobile}
                          style={{ minHeight: isMobile ? 44 : undefined }}
                        >
                          {t('receive.storeItem', 'Store')}
                        </Button>
                      )}
                      {isStored && item.warehouseItemId && (
                        <Button
                          onClick={() => navigate(`/warehouse-staff/items/${item.warehouseItemId}`)}
                          block={isMobile}
                          style={{ minHeight: isMobile ? 44 : undefined }}
                        >
                          {t('action.view', 'View')}
                        </Button>
                      )}
                      {isInspected && (
                        <Tag color="green" style={{ margin: 0 }}>
                          {t('receive.inspected', 'Inspected')}
                        </Tag>
                      )}
                    </Space>
                  </div>
                </Flex>
              </div>
            )
          })}
        </Space>
      </Card>

      {/* Store location picker modal */}
      <Modal
        open={Boolean(storingItem)}
        title={t('receive.pickStorageLocation', 'Pick a storage location')}
        width={isMobile ? '100%' : 720}
        style={isMobile ? { top: 0, margin: 0, padding: 0, maxWidth: '100vw' } : undefined}
        onCancel={() => {
          setStoringItem(null)
          setSelectedLocationId(undefined)
        }}
        onOk={handleStore}
        okText={t('receive.storeItem', 'Store')}
        okButtonProps={{
          disabled: !selectedLocationId,
          loading: storeItem.isPending,
          style: { minHeight: isMobile ? 44 : undefined },
        }}
      >
        <StorageLocationMap
          locations={locations ?? []}
          selectedId={selectedLocationId}
          onSelect={(id) => setSelectedLocationId(id)}
          loading={locationsLoading}
        />
      </Modal>
    </div>
  )
}