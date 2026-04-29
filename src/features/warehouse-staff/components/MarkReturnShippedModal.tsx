import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  App,
  Divider,
  Typography,
  Flex,
  Image,
  Spin,
  Alert,
} from 'antd'
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
  { value: 'ghn', label: 'GHN - Giao Hàng Nhanh' },
  { value: 'ghtk', label: 'GHTK - Giao Hàng Tiết Kiệm' },
  { value: 'viettelpost', label: 'Viettel Post' },
  { value: 'jtexpress', label: 'J&T Express' },
  { value: 'other', label: 'Other / Manual carrier' },
] as const

export function MarkReturnShippedModal({ open, shipmentId, onClose }: Props) {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const markShipped = useMarkWarehouseReturnShipped()
  const addEvidence = useAddWarehouseReturnEvidenceStaff()
  const mediaUpload = useMediaUpload('shipment_delivery_photo')
  const uploadedBlobs = useRef<Set<Blob>>(new Set())
  const [uploading, setUploading] = useState(false)

  const { data: pendingRows } = useStaffPendingReturns({ status: 'pending' })
  const { data: inTransitRows } = useStaffPendingReturns({ status: 'in_transit' })
  const shipment: WarehouseToSellerShipmentDto | undefined =
    (pendingRows ?? []).find((s) => s.id === shipmentId) ??
    (inTransitRows ?? []).find((s) => s.id === shipmentId)

  const pickupEvidence = (shipment?.evidence ?? []).filter(
    (e) => e.category === WarehouseReturnEvidenceCategory.PickupByWarehouseStaff,
  )
  const hasPickupEvidence = pickupEvidence.length >= 1

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrToken, setQrToken] = useState<string | null>(null)

  // Reset capture/upload tracking whenever modal opens for a new shipment.
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ shippedAt: dayjs() })
      uploadedBlobs.current = new Set()
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
          message.success(t('staffReturns.pickupAdded', 'Pickup photo added'))
        } catch (err) {
          const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          message.error(detail ?? t('staffReturns.uploadError', 'Photo upload failed'))
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
        setQrModalOpen(true)
      } else {
        onClose()
      }
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (detail) {
        message.error(detail)
      }
    }
  }

  const handleQrClose = () => {
    setQrModalOpen(false)
    setQrToken(null)
    onClose()
  }

  return (
    <>
      <Modal
        title={t('staffReturns.markShippedTitle', 'Enter carrier tracking details')}
        open={open}
        onCancel={onClose}
        onOk={handleOk}
        okText={tc('action.confirm', 'Confirm')}
        cancelText={tc('action.cancel', 'Cancel')}
        okButtonProps={{
          loading: markShipped.isPending,
          disabled: !hasPickupEvidence || uploading,
        }}
        centered
        destroyOnClose
        width={720}
      >
        {shipmentId && (
          <>
            {pickupEvidence.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {t('staffReturns.uploadedPickupPhotos', 'Uploaded pickup photos')} (
                  {pickupEvidence.length})
                </Typography.Text>
                <Image.PreviewGroup>
                  <Flex gap={8} wrap="wrap">
                    {pickupEvidence.map((e) => (
                      <div key={e.id} style={{ position: 'relative' }}>
                        <Image
                          src={e.mediaUpload.secureUrl}
                          width={80}
                          height={80}
                          style={{
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid var(--color-border-light, #d9d9d9)',
                          }}
                          preview={{ src: e.mediaUpload.secureUrl }}
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

            {uploading && (
              <Flex align="center" gap={8} style={{ marginTop: 8 }}>
                <Spin size="small" />
                <Typography.Text type="secondary">
                  {t('staffReturns.uploading', 'Uploading photo...')}
                </Typography.Text>
              </Flex>
            )}

            <Divider />
          </>
        )}
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
              disabledDate={(d) => d.isAfter(dayjs().endOf('day'))}
            />
          </Form.Item>
        </Form>
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
          shipment?.trackingNumber
            ? [
                {
                  label: t('staffReturns.tracking', 'Tracking'),
                  value: shipment.trackingNumber,
                },
              ]
            : []
        }
      />
    </>
  )
}
