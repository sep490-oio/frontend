import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App,
  Button,
  Card,
  Flex,
  Form,
  Grid,
  Image,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import {
  ArrowLeftOutlined,
  CameraOutlined,
  InboxOutlined,
  TagOutlined,
  LockOutlined,
  EyeOutlined,
} from '@ant-design/icons'
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

const allowUploadFallback = String(import.meta.env.VITE_ALLOW_UPLOAD).trim() === 'true'

// ── Photo step config ────────────────────────────────────────────────
const PHOTO_STEPS = [
  { key: 'front', icon: <CameraOutlined />, required: true },
  { key: 'label', icon: <TagOutlined />, required: false },
  { key: 'seal', icon: <LockOutlined />, required: false },
  { key: 'inside', icon: <EyeOutlined />, required: false },
] as const

export default function ReceivePackagePage() {
  const { clientOrderCode } = useParams<{ clientOrderCode: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const screens = Grid.useBreakpoint()
  // xs = < 576px (very small phones)
  const isSmallMobile = isMobile && !screens.sm

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

  // Photo state map for step rendering
  const photoMap = {
    front: { file: frontPhoto, set: setFrontPhoto, label: t('frontPhotoLabel', 'Front photo (required)') },
    label: { file: shippingLabelPhoto, set: setShippingLabelPhoto, label: t('receive.shippingLabelPhoto', 'Shipping label photo (optional)') },
    seal: { file: sealConditionPhoto, set: setSealConditionPhoto, label: t('receive.sealConditionPhoto', 'Seal/tape photo (optional)') },
    inside: { file: insideContentsPhoto, set: setInsideContentsPhoto, label: t('receive.insideContentsPhoto', 'Inside contents photo (optional)') },
  } as const

  const capturedCount = [frontPhoto, shippingLabelPhoto, sealConditionPhoto, insideContentsPhoto].filter(Boolean).length

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
  // P3: 1-column on small mobile, 2-column on mobile, auto-fit on desktop
  const uploadGridCols = isSmallMobile
    ? '1fr'
    : isMobile
      ? 'repeat(2, 1fr)'
      : 'repeat(auto-fit, minmax(220px, 1fr))'

  return (
    <div style={{
      maxWidth: 960,
      margin: '0 auto',
      padding: isMobile ? '0 4px' : undefined,
      // P1: reserve space for sticky bottom bar on mobile
      paddingBottom: isMobile && !isReceived ? 80 : undefined,
    }}>
      {/* ── P3: Redesigned Header ─────────────────────────────────── */}
      <Flex
        align="center"
        gap={12}
        style={{ marginBottom: cardMargin }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/warehouse-staff/receiving')}
          style={{ flexShrink: 0, minHeight: 40, minWidth: 40, padding: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Title
            level={isMobile ? 4 : 3}
            style={{ margin: 0, lineHeight: 1.3 }}
          >
            {t('receive.receivePackage', 'Receive Package')}
          </Typography.Title>
          <Typography.Text
            copyable
            code
            style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
          >
            {pkg.clientOrderCode}
          </Typography.Text>
        </div>
        <StatusBadge status={pkg.packageState} />
      </Flex>

      {/* ── P2: Compact Summary Card ──────────────────────────────── */}
      <Card
        size="small"
        style={{ marginBottom: cardMargin }}
        styles={{ body: { padding: isMobile ? '12px 14px' : '14px 20px' } }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: isMobile ? '8px 12px' : '8px 24px',
          }}
        >
          <MetaField
            label={t('table.provider', 'Provider')}
            value={getProviderLabel(pkg.providerCode)}
          />
          <MetaField
            label={t('table.trackingNumber', 'Tracking')}
            value={pkg.carrierTrackingNumber ?? '—'}
          />
          <MetaField
            label={t('table.itemCount', 'Items')}
            value={String(pkg.items.length)}
          />
          <MetaField
            label={t('sender', 'Sender')}
            value={pkg.senderName ?? '—'}
          />
          <MetaField
            label={t('senderPhone', 'Phone')}
            value={pkg.senderPhone ?? '—'}
          />
        </div>

        {/* Receipt photos (if already received) */}
        {pkg.receiptMedia.length > 0 && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--color-border-light)', paddingTop: 10 }}>
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
            style={{ marginTop: 8, marginBottom: 0, fontSize: isMobile ? 13 : 14 }}
          >
            {pkg.receiptNotes}
          </Typography.Paragraph>
        )}
      </Card>

      {/* ── P1: Items section BEFORE upload ───────────────────────── */}
      <Card
        title={
          <Flex align="center" gap={8}>
            <InboxOutlined />
            <span>{t('receive.itemsInPackage', 'Items in this package')}</span>
            <Tag style={{ marginLeft: 4 }}>{pkg.items.length}</Tag>
          </Flex>
        }
        size="small"
        style={{ marginBottom: cardMargin }}
        styles={{ body: { padding: isMobile ? '8px 12px' : undefined } }}
      >
        <Space direction="vertical" size={isMobile ? 10 : 'middle'} style={{ width: '100%' }}>
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
                  padding: isMobile ? '8px 0' : undefined,
                  borderBottom: '0px solid var(--color-border, #f0f0f0)',
                }}
              >
                <Flex gap={12} align="flex-start">
                  {item.itemImageUrl ? (
                    <img
                      src={item.itemImageUrl}
                      alt={item.itemTitle}
                      style={{
                        width: isMobile ? 48 : 56,
                        height: isMobile ? 48 : 56,
                        objectFit: 'cover',
                        borderRadius: 8,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: isMobile ? 48 : 56,
                        height: isMobile ? 48 : 56,
                        borderRadius: 8,
                        background: 'var(--color-bg-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <InboxOutlined style={{ fontSize: 20 }} />
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

                    {/* Action buttons */}
                    <Space
                      direction={isMobile ? 'vertical' : 'horizontal'}
                      size={isMobile ? 8 : 'small'}
                      style={{ marginTop: isMobile ? 8 : 6, width: isMobile ? '100%' : undefined }}
                    >
                      {canStore && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => setStoringItem(item)}
                          block={isMobile}
                          style={{ minHeight: isMobile ? 40 : undefined }}
                        >
                          {t('receive.storeItem', 'Store')}
                        </Button>
                      )}
                      {isStored && item.warehouseItemId && (
                        <Button
                          size="small"
                          onClick={() => navigate(`/warehouse-staff/items/${item.warehouseItemId}`)}
                          block={isMobile}
                          style={{ minHeight: isMobile ? 40 : undefined }}
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

      {/* ── P2+P3: Receive CTA with step numbers ─────────────────── */}
      {!isReceived && (
        <Card
          title={t('receive.photoEvidence', 'Photo Evidence')}
          size="small"
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

          {/* P2: Upload grid with step numbers & icons */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: uploadGridCols,
              gap: isMobile ? 10 : 12,
              marginBottom: 12,
            }}
          >
            {PHOTO_STEPS.map((step, idx) => {
              const { file, set, label } = photoMap[step.key]
              return (
                <div
                  key={step.key}
                  style={{
                    position: 'relative',
                  }}
                >
                  {/* Step number badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: -6,
                      zIndex: 2,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: file
                        ? 'var(--color-success, #52c41a)'
                        : step.required
                          ? 'var(--color-primary, #1677ff)'
                          : 'var(--color-text-tertiary, #8c8c8c)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    {file ? '✓' : idx + 1}
                  </div>
                  <SingleCaptureUploader
                    label={label}
                    required={step.required}
                    file={file}
                    onChange={set}
                    cameraAvailable={cameraAvailable}
                    allowUploadFallback={allowUploadFallback}
                  />
                </div>
              )
            })}
          </div>

          <Form layout="vertical">
            <Form.Item label={t('receive.notes', 'Notes (optional)')} style={{ marginBottom: 0 }}>
              <Input.TextArea
                rows={isMobile ? 2 : 3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                style={{ fontSize: isMobile ? 16 : 14 }}
              />
            </Form.Item>
          </Form>

          {/* Desktop-only submit button (mobile uses sticky bar) */}
          {!isMobile && (
            <Flex justify="flex-end" style={{ marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                loading={receive.isPending}
                disabled={!canSubmit}
                onClick={handleSubmit}
                style={{ minWidth: 200 }}
              >
                {t('receive.submit', 'Receive Shipment')}
              </Button>
            </Flex>
          )}
        </Card>
      )}

      {/* ── P1: Sticky bottom CTA bar (mobile only) ──────────────── */}
      {isMobile && !isReceived && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--color-bg-elevated, #141414)',
            borderTop: '1px solid var(--color-border, #303030)',
            padding: '10px 16px',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Progress indicator */}
          <Typography.Text
            style={{
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {capturedCount}/4
          </Typography.Text>
          <Button
            type="primary"
            loading={receive.isPending}
            disabled={!canSubmit}
            onClick={handleSubmit}
            block
            style={{ minHeight: 48, fontSize: 15, fontWeight: 600 }}
          >
            {t('receive.submit', 'Receive Shipment')}
          </Button>
        </div>
      )}

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

// ── Compact metadata field ────────────────────────────────────────────
function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: 1.2 }}>
        {label}
      </Typography.Text>
      <Typography.Text style={{ fontSize: 13, fontWeight: 500 }} ellipsis>
        {value}
      </Typography.Text>
    </div>
  )
}
