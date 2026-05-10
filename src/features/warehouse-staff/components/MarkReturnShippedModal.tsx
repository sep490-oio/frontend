import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  App,
  Typography,
  Flex,
  Image,
  Spin,
  Alert,
  Button,
} from 'antd'
import {
  CameraOutlined,
  SendOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import {
  useMarkWarehouseReturnShipped,
  useAddWarehouseReturnEvidenceStaff,
  useStaffPendingReturns,
} from '@/features/warehouse-staff/api'
import { ReturnQrDisplayModal } from '@/features/order/components/ReturnQrDisplayModal'
import { MultiCaptureUploader, type CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { LiveCapturedBadge } from '@/components/ui/LiveCapturedBadge'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { WarehouseReturnEvidenceCategory } from '@/types/enums'
import type { WarehouseToSellerShipmentDto } from '@/types'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'

interface FormValues {
  providerCode: string
  trackingNumber: string
  shippedAt: Dayjs
}

interface Props {
  open: boolean
  shipmentId: string | null
  onClose: () => void
}

const CARRIER_OPTIONS = [
  { value: 'ghn', label: 'GHN - Express Delivery' },
  { value: 'ghtk', label: 'GHTK - Economy Delivery' },
  { value: 'viettelpost', label: 'Viettel Post' },
  { value: 'jtexpress', label: 'J&T Express' },
  { value: 'other', label: 'Other / Manual carrier' },
] as const

export function MarkReturnShippedModal({ open, shipmentId, onClose }: Props) {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const [form] = Form.useForm<FormValues>()
  const markShipped = useMarkWarehouseReturnShipped()
  const addEvidence = useAddWarehouseReturnEvidenceStaff()
  const mediaUpload = useMediaUpload('shipment_delivery_photo')
  const uploadedBlobs = useRef<Set<Blob>>(new Set())
  const [uploading, setUploading] = useState(false)

  // ── BUG FIX: track locally uploaded count to avoid stale server data ──
  const [localUploadCount, setLocalUploadCount] = useState(0)

  const { data: pendingRows } = useStaffPendingReturns({ status: 'pending' })
  const { data: inTransitRows } = useStaffPendingReturns({ status: 'in_transit' })
  const shipment: WarehouseToSellerShipmentDto | undefined =
    (pendingRows ?? []).find((s) => s.id === shipmentId) ??
    (inTransitRows ?? []).find((s) => s.id === shipmentId)

  const pickupEvidence = (shipment?.evidence ?? []).filter(
    (e) => e.category === WarehouseReturnEvidenceCategory.PickupByWarehouseStaff,
  )
  // FIX: Use both server data AND local count
  const hasPickupEvidence = pickupEvidence.length >= 1 || localUploadCount >= 1

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)

  // ── Wizard step state ──
  const [currentStep, setCurrentStep] = useState(0)

  // Item info
  const itemTitle = shipment?.item?.itemTitle ?? shipment?.itemTitle ?? '—'
  const itemImage = shipment?.item?.primaryImageUrl ?? shipment?.itemImageUrl

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ shippedAt: dayjs() })
      uploadedBlobs.current = new Set()
      setLocalUploadCount(0)
      setCurrentStep(0)
    }
  }, [open, shipmentId, form])

  const handlePhotosChange = useCallback(
    async (photos: CapturedPhoto[]) => {
      if (!shipmentId) return
      const newPhotos = photos.filter((p) => !uploadedBlobs.current.has(p.blob))
      if (newPhotos.length === 0) return

      for (const photo of newPhotos) {
        uploadedBlobs.current.add(photo.blob)
        setUploading(true)
        try {
          const file = new File(
            [photo.blob],
            `return-pickup-${Date.now()}.jpg`,
            { type: photo.blob.type || 'image/jpeg' },
          )
          const result = await mediaUpload.upload(file)
          await addEvidence.mutateAsync({
            id: shipmentId,
            mediaUploadId: result.mediaUploadId,
            category: WarehouseReturnEvidenceCategory.PickupByWarehouseStaff,
          })
          setLocalUploadCount((c) => c + 1)
          message.success(t('staffReturns.pickupAdded', 'Pickup photo added'))
        } catch (err) {
          message.error(normalizeErrorMessage(err, t('staffReturns.uploadError', 'Photo upload failed')))
          uploadedBlobs.current.delete(photo.blob)
        } finally {
          setUploading(false)
        }
      }
    },
    [shipmentId, mediaUpload, addEvidence, message, t],
  )

  const handleOk = async () => {
    if (!shipmentId) return
    if (!hasPickupEvidence) {
      message.error(
        t(
          'staffReturns.pickupEvidenceRequired',
          'At least one pickup photo is required before shipping',
        ),
      )
      return
    }
    try {
      const values = await form.validateFields()
      const updated = await markShipped.mutateAsync({
        id: shipmentId,
        providerCode: values.providerCode,
        trackingNumber: values.trackingNumber.trim(),
        shippedAt: values.shippedAt.toISOString(),
      })
      message.success(t('staffReturns.markedShipped', 'Return marked as shipped'))
      if (updated.qrToken) {
        setQrToken(updated.qrToken)
        setCurrentStep(3) // Move to success step
      } else {
        onClose()
      }
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
        message.error(normalizeErrorMessage(err, t('staffReturns.shipError', 'Failed to mark as shipped')))
      }
    }
  }

  const handleQrClose = () => {
    setQrModalOpen(false)
    setQrToken(null)
    onClose()
  }

  const allPhotos = pickupEvidence.length + localUploadCount

  // ── Step content renderers ──
  const renderStep0 = () => (
    <div>
      {/* Item info header */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          padding: 12,
          background: 'var(--color-bg-surface, #f5f5f5)',
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        {itemImage ? (
          <Image
            src={itemImage}
            alt={itemTitle}
            width={56}
            height={56}
            style={{ objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
            preview={false}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              background: 'var(--color-bg-container, #e8e8e8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: 'var(--color-text-secondary)',
              flexShrink: 0,
            }}
          >
            <InboxOutlined />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong ellipsis style={{ display: 'block', fontSize: 14 }}>
            {itemTitle}
          </Typography.Text>
          {shipment?.rejectionReason && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Reason: {shipment.rejectionReason}
            </Typography.Text>
          )}
          {shipment?.sellerDisplayName && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              → {shipment.sellerDisplayName}
            </Typography.Text>
          )}
        </div>
      </div>

      {/* Existing uploaded photos */}
      {pickupEvidence.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
            {t('staffReturns.uploadedPickupPhotos', 'Uploaded pickup photos')} ({pickupEvidence.length})
          </Typography.Text>
          <Image.PreviewGroup>
            <Flex gap={8} wrap="wrap">
              {pickupEvidence.map((e) => (
                <div key={e.id} style={{ position: 'relative' }}>
                  <Image
                    src={e.mediaUpload?.secureUrl}
                    width={72}
                    height={72}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: '2px solid var(--color-success, #52c41a)',
                    }}
                    preview={{ src: e.mediaUpload?.secureUrl }}
                  />
                  <div style={{ position: 'absolute', top: 2, left: 2 }}>
                    <LiveCapturedBadge size="small" />
                  </div>
                </div>
              ))}
            </Flex>
          </Image.PreviewGroup>
        </div>
      )}

      {/* Alert — only show when no photos at all */}
      {!hasPickupEvidence && (
        <Alert
          type="warning"
          showIcon
          message={t(
            'staffReturns.pickupRequired',
            'At least 1 pickup photo required before shipping',
          )}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Success indicator when photos are uploaded */}
      {hasPickupEvidence && (
        <Alert
          type="success"
          showIcon
          message={t(
            'staffReturns.pickupReady',
            `${allPhotos} pickup photo(s) uploaded — ready to proceed`,
          )}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Camera / capture */}
      <div style={{ maxWidth: isMobile ? '100%' : 480 }}>
        <MultiCaptureUploader
          maxPhotos={5}
          step="item_photo"
          facingMode="environment"
          onPhotosChange={handlePhotosChange}
          instruction={t(
            'staffReturns.pickupCaptureInstruction',
            'Capture pickup photos with camera (live capture)',
          )}
        />
      </div>

      {uploading && (
        <Flex align="center" gap={8} style={{ marginTop: 8 }}>
          <Spin size="small" />
          <Typography.Text type="secondary">
            {t('staffReturns.uploading', 'Uploading photo...')}
          </Typography.Text>
        </Flex>
      )}
    </div>
  )
  const renderStep1Label = () => {
    // Parse seller address for the packing label
    let sellerAddress = ''
    try {
      if (shipment?.sellerAddressSnapshot) {
        const addr = JSON.parse(shipment.sellerAddressSnapshot)
        const str = (v: unknown): string => {
          if (!v) return ''
          if (typeof v === 'string') return v
          if (typeof v === 'object' && v !== null && 'name' in v) return String((v as { name: string }).name)
          return ''
        }
        sellerAddress = [
          str(addr.address ?? addr.streetAddress ?? addr.addressLine),
          str(addr.ward),
          str(addr.district),
          str(addr.province ?? addr.city),
        ]
          .filter(Boolean)
          .join(', ')
      }
    } catch { /* ignore parse errors */ }

    return (
      <div>
        <Alert
          type="info"
          showIcon
          message={t(
            'staffReturns.labelHint',
            'Print this label and attach it to the package before taking it to the carrier.',
          )}
          style={{ marginBottom: 16 }}
        />

        {/* Printable label */}
        <div
          className="oio-return-packing-label"
          style={{
            border: '2px dashed #999',
            borderRadius: 10,
            padding: isMobile ? 16 : 24,
            textAlign: 'center',
          }}
        >
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .oio-return-packing-label, .oio-return-packing-label * { visibility: visible !important; }
              .oio-return-packing-label {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 24px !important;
                background: #fff !important;
                border: 2px dashed #333 !important;
              }
            }
          `}</style>

          {/* QR with shipment ID for internal tracking */}
          {shipmentId && (
            <div style={{ marginBottom: 12 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shipmentId)}`}
                alt="Package QR"
                width={160}
                height={160}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}

          <Typography.Title level={5} style={{ margin: '0 0 4px' }}>
            OIO Return Shipment
          </Typography.Title>

          <Typography.Text
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, display: 'block', marginBottom: 12 }}
          >
            {shipmentId?.slice(0, 18)}…
          </Typography.Text>

          <div style={{
            textAlign: 'left',
            background: 'var(--color-bg-surface, #f9f9f9)',
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
          }}>
            <div style={{ marginBottom: 6 }}>
              <strong>{t('staffReturns.labelItem', 'Item')}:</strong> {itemTitle}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>{t('staffReturns.labelSeller', 'To')}:</strong>{' '}
              {shipment?.sellerDisplayName ?? '—'}
            </div>
            {sellerAddress && (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                {sellerAddress}
              </div>
            )}
          </div>
        </div>

        <Button
          block
          size="large"
          icon={<PrinterOutlined />}
          onClick={() => window.print()}
          style={{ marginTop: 16 }}
        >
          {t('staffReturns.printLabel', 'Print Package Label')}
        </Button>
      </div>
    )
  }

  const renderStep2Carrier = () => (
    <div>
      {/* Photos + label done summary */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--color-bg-surface, #f5f5f5)',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <CheckCircleOutlined style={{ color: 'var(--color-success, #52c41a)' }} />
        <span>
          {allPhotos} photo(s) · {t('staffReturns.labelPrinted', 'Label ready')}
        </span>
      </div>

      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
        {t(
          'staffReturns.carrierHint',
          'Enter the tracking details you received from the carrier after dropping off the package.',
        )}
      </Typography.Text>

      <Form<FormValues> form={form} layout="vertical">
        <Form.Item
          name="providerCode"
          label={t('staffReturns.providerCode', 'Carrier')}
          rules={[
            {
              required: true,
              message: t('staffReturns.providerCodeRequired', 'Choose a carrier'),
            },
          ]}
        >
          <Select
            placeholder={t('staffReturns.providerCodePlaceholder', 'Select a carrier')}
            options={CARRIER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="trackingNumber"
          label={t('staffReturns.trackingNumber', 'Tracking number')}
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('staffReturns.trackingRequired', 'Tracking number is required'),
            },
          ]}
        >
          <Input
            placeholder={t('staffReturns.trackingPlaceholder', 'Enter carrier tracking number')}
            size="large"
          />
        </Form.Item>
        <Form.Item
          name="shippedAt"
          label={t('staffReturns.shippedAt', 'Shipped at')}
          rules={[
            { required: true, message: t('staffReturns.shippedAtRequired', 'Pick the shipped date') },
          ]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            size="large"
            disabledDate={(d) => d.isAfter(dayjs().endOf('day'))}
          />
        </Form.Item>
      </Form>
    </div>
  )

  // After successful ship — show signed QR
  const renderSuccess = () => (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <CheckCircleOutlined style={{ fontSize: 48, color: 'var(--color-success, #52c41a)', marginBottom: 12 }} />
      <Typography.Title level={4} style={{ marginBottom: 8 }}>
        {t('staffReturns.shippedSuccess', 'Return shipped successfully!')}
      </Typography.Title>
      {qrToken && (
        <>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            {t('staffReturns.signedQrHint', 'Signed QR for seller verification is now available.')}
          </Typography.Text>
          <Button
            type="primary"
            size="large"
            icon={<QrcodeOutlined />}
            onClick={() => setQrModalOpen(true)}
            style={{
              background: 'var(--color-accent)',
              borderColor: 'var(--color-accent)',
              height: 48,
            }}
          >
            {t('staffReturns.viewPrintQr', 'View & Print Signed QR')}
          </Button>
        </>
      )}
    </div>
  )

  // ── Modal footer based on step ──
  const getFooter = () => {
    if (currentStep === 0) {
      return [
        <Button key="cancel" onClick={onClose}>
          {tc('action.cancel', 'Cancel')}
        </Button>,
        <Button
          key="next"
          type="primary"
          disabled={!hasPickupEvidence || uploading}
          onClick={() => setCurrentStep(1)}
          style={{
            background: hasPickupEvidence ? 'var(--color-accent)' : undefined,
            borderColor: hasPickupEvidence ? 'var(--color-accent)' : undefined,
          }}
        >
          {t('staffReturns.nextLabel', 'Next: Package Label')}
        </Button>,
      ]
    }
    if (currentStep === 1) {
      return [
        <Button key="back" onClick={() => setCurrentStep(0)}>
          {tc('action.back', 'Back')}
        </Button>,
        <Button
          key="next"
          type="primary"
          onClick={() => setCurrentStep(2)}
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
          }}
        >
          {t('staffReturns.nextCarrier', 'Next: Enter Tracking')}
        </Button>,
      ]
    }
    if (currentStep === 2) {
      return [
        <Button key="back" onClick={() => setCurrentStep(1)}>
          {tc('action.back', 'Back')}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={markShipped.isPending}
          onClick={handleOk}
          icon={<SendOutlined />}
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
          }}
        >
          {t('staffReturns.confirmShip', 'Confirm & Ship')}
        </Button>,
      ]
    }
    // Step 3 (Success)
    return [
      <Button key="done" type="primary" onClick={onClose}>
        {tc('action.done', 'Done')}
      </Button>,
    ]
  }

  return (
    <>
      <Modal
        title={null}
        open={open}
        onCancel={onClose}
        footer={getFooter()}
        centered
        destroyOnClose
        width={isMobile ? '100%' : 600}
        closable={currentStep < 3}
      >
        {/* Steps indicator — always horizontal */}
        {currentStep < 3 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            marginBottom: 20,
            paddingTop: 8,
          }}>
            {[
              { icon: <CameraOutlined />, label: t('staffReturns.stepPhotos', 'Photos') },
              { icon: <PrinterOutlined />, label: t('staffReturns.stepLabel', 'Label') },
              { icon: <SendOutlined />, label: t('staffReturns.stepCarrier', 'Shipping') },
            ].map((step, idx) => {
              const isActive = idx === currentStep
              const isDone = idx < currentStep
              const color = isActive
                ? 'var(--color-accent, #1677ff)'
                : isDone
                  ? 'var(--color-success, #52c41a)'
                  : 'var(--color-text-secondary, #999)'
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                  {idx > 0 && (
                    <div style={{
                      width: isMobile ? 24 : 40,
                      height: 2,
                      background: isDone || isActive ? color : '#e8e8e8',
                      borderRadius: 1,
                    }} />
                  )}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: isActive || isDone ? '#fff' : 'var(--color-text-secondary)',
                      background: isActive || isDone ? color : '#f0f0f0',
                      transition: 'all 0.2s',
                    }}>
                      {isDone ? <CheckCircleOutlined /> : step.icon}
                    </div>
                    {!isMobile && (
                      <span style={{
                        fontSize: 11,
                        color,
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}>
                        {step.label}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1Label()}
        {currentStep === 2 && renderStep2Carrier()}
        {currentStep === 3 && renderSuccess()}
      </Modal>

      <ReturnQrDisplayModal
        open={qrModalOpen}
        onClose={handleQrClose}
        qrToken={qrToken ?? ''}
        title={t('staffReturns.qrTitle', 'Return shipment QR')}
        subtitle={t(
          'staffReturns.qrSubtitle',
          'Attach this label to the parcel so the seller can scan on arrival',
        )}
        lines={
          form.getFieldValue('trackingNumber')
            ? [
                {
                  label: t('staffReturns.tracking', 'Tracking'),
                  value: form.getFieldValue('trackingNumber') as string,
                },
              ]
            : []
        }
      />
    </>
  )
}

