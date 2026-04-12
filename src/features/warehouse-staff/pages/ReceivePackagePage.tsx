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
import type { InboundPackageItemDto } from '@/types'

const allowUploadFallback = import.meta.env.VITE_ALLOW_UPLOAD === 'true'

export default function ReceivePackagePage() {
  const { clientOrderCode } = useParams<{ clientOrderCode: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
  const { message } = App.useApp()

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

  return (
    <div style={{ maxWidth: 960 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('receive.packageTitle', 'Package')}: {pkg.clientOrderCode}
        </Typography.Title>
        <Button onClick={() => navigate('/warehouse-staff/receiving')}>
          {t('action.backToReceiving', 'Back to Receiving')}
        </Button>
      </Flex>

      {/* Summary */}
      <Card style={{ marginBottom: 16 }}>
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
          <Descriptions.Item label={t('table.itemCount', 'Items')}>{pkg.items.length}</Descriptions.Item>
          <Descriptions.Item label={t('sender', 'Sender')}>{pkg.senderName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label={t('senderPhone', 'Phone')}>{pkg.senderPhone ?? '—'}</Descriptions.Item>
        </Descriptions>
        {pkg.receiptMedia.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Typography.Text strong>{t('receive.receiptPhotos', 'Receipt photos')}</Typography.Text>
            <Image.PreviewGroup>
              <Space wrap style={{ marginTop: 8 }}>
                {pkg.receiptMedia.map((url) => (
                  <Image key={url} src={url} width={100} height={100} style={{ objectFit: 'cover', borderRadius: 6 }} />
                ))}
              </Space>
            </Image.PreviewGroup>
          </div>
        )}
        {pkg.receiptNotes && (
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            {pkg.receiptNotes}
          </Typography.Paragraph>
        )}
      </Card>

      {/* Receive CTA */}
      {!isReceived && (
        <Card title={t('receive.receivePackage', 'Receive Package')} style={{ marginBottom: 16 }}>
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
              message={t('cameraUnavailableFallback', 'Camera unavailable — file upload fallback is enabled.')}
            />
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
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
              />
            </Form.Item>
            <Button type="primary" loading={receive.isPending} disabled={!canSubmit} onClick={handleSubmit}>
              {t('receive.submit', 'Receive Shipment')}
            </Button>
          </Form>
        </Card>
      )}

      {/* Items */}
      <Card title={t('receive.itemsInPackage', 'Items in this package')}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {pkg.items.map((item) => {
            const isStored = item.warehouseItemStatus === 'stored'
            const isInspected =
              item.warehouseItemStatus === 'inspected' ||
              item.warehouseItemStatus === 'reserved' ||
              item.warehouseItemStatus === 'dispatched'
            const canStore =
              Boolean(item.warehouseItemId) && item.warehouseItemStatus === 'received'
            return (
              <Flex key={item.inboundShipmentId} gap={12} align="center">
                {item.itemImageUrl ? (
                  <img
                    src={item.itemImageUrl}
                    alt={item.itemTitle}
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 6,
                      background: 'var(--color-bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <InboxOutlined style={{ fontSize: 24 }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Text strong style={{ display: 'block' }} ellipsis>
                    {item.itemTitle ?? item.itemId}
                  </Typography.Text>
                  <Space size={8} wrap>
                    <StatusBadge status={item.inboundStatus} />
                    {item.warehouseItemStatus && <Tag>{item.warehouseItemStatus}</Tag>}
                    {item.storageLocationLabel && (
                      <Typography.Text type="secondary">
                        {t('storingAt', 'Storing at:')} {item.storageLocationLabel}
                      </Typography.Text>
                    )}
                  </Space>
                </div>
                <Space>
                  {canStore && (
                    <Button type="primary" onClick={() => setStoringItem(item)}>
                      {t('receive.storeItem', 'Store')}
                    </Button>
                  )}
                  {isStored && item.warehouseItemId && (
                    <Button onClick={() => navigate(`/warehouse-staff/items/${item.warehouseItemId}`)}>
                      {t('action.view', 'View')}
                    </Button>
                  )}
                  {isInspected && <Tag color="green">{t('receive.inspected', 'Inspected')}</Tag>}
                </Space>
              </Flex>
            )
          })}
        </Space>
      </Card>

      {/* Store location picker modal */}
      <Modal
        open={Boolean(storingItem)}
        title={t('receive.pickStorageLocation', 'Pick a storage location')}
        width={720}
        onCancel={() => {
          setStoringItem(null)
          setSelectedLocationId(undefined)
        }}
        onOk={handleStore}
        okText={t('receive.storeItem', 'Store')}
        okButtonProps={{ disabled: !selectedLocationId, loading: storeItem.isPending }}
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
