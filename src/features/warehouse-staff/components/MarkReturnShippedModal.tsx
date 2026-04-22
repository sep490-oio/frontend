import { useEffect, useState } from 'react'
import { Modal, Form, Select, Input, DatePicker, App, Divider } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import {
  useMarkWarehouseReturnShipped,
  useAddWarehouseReturnEvidenceStaff,
  useStaffPendingReturns,
} from '@/features/warehouse-staff/api'
import { ReturnEvidenceUploader } from '@/features/order/components/ReturnEvidenceUploader'
import { ReturnQrDisplayModal } from '@/features/order/components/ReturnQrDisplayModal'
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

// Carrier options mirror the external-carrier values already surfaced on the
// seller ship-return modal (`OrderDetailPage.tsx` placeholder: "ghn, ghtk,
// viettelpost") and the existing warehouse provider list (GHN the primary).
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

  // Pull the shipment row out of the already-loaded staff list so we can
  // read its evidence + (post-ship) qrToken without a dedicated detail hook.
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

  // Reset the form whenever the modal is reopened for a different shipment.
  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ shippedAt: dayjs() })
    }
  }, [open, shipmentId, form])

  const handleUploadEvidence = async (mediaUploadId: string) => {
    if (!shipmentId) return
    await addEvidence.mutateAsync({
      id: shipmentId,
      mediaUploadId,
      category: WarehouseReturnEvidenceCategory.PickupByWarehouseStaff,
    })
  }

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
      // Surface the QR for printing if BE returned one.
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
      // Otherwise antd Form validation error — inline messages already shown.
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
          disabled: !hasPickupEvidence,
        }}
        centered
        destroyOnClose
      >
        {shipmentId && (
          <>
            <ReturnEvidenceUploader
              existingEvidence={pickupEvidence.map((e) => ({
                id: e.id,
                mediaUpload: { secureUrl: e.mediaUpload.secureUrl },
              }))}
              category={WarehouseReturnEvidenceCategory.PickupByWarehouseStaff}
              minRequired={1}
              maxPhotos={5}
              disabled={addEvidence.isPending || markShipped.isPending}
              onUpload={handleUploadEvidence}
            />
            <Divider />
          </>
        )}
        <Form<FormValues> form={form} layout="vertical">
          <Form.Item
            name="providerCode"
            label={t('staffReturns.providerCode', 'Carrier')}
            rules={[{ required: true, message: t('staffReturns.providerCodeRequired', 'Choose a carrier') }]}
          >
            <Select
              placeholder={t('staffReturns.providerCodePlaceholder', 'Select a carrier')}
              options={CARRIER_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </Form.Item>
          <Form.Item
            name="trackingNumber"
            label={t('staffReturns.trackingNumber', 'Tracking number')}
            rules={[{ required: true, whitespace: true, message: t('staffReturns.trackingRequired', 'Tracking number is required') }]}
          >
            <Input placeholder={t('staffReturns.trackingPlaceholder', 'Enter carrier tracking number')} />
          </Form.Item>
          <Form.Item
            name="shippedAt"
            label={t('staffReturns.shippedAt', 'Shipped at')}
            rules={[{ required: true, message: t('staffReturns.shippedAtRequired', 'Pick the shipped date') }]}
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
