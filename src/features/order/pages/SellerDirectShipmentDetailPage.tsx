import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Card,
  Descriptions,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Form,
  Input,
  Modal,
  App,
  QRCode,
  Flex,
  DatePicker,
  Tooltip,
  Image,
} from 'antd'
import { ArrowLeftOutlined, PrinterOutlined, CameraOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useTranslation } from 'react-i18next'
import {
  useSellerDirectShipmentById,
  useSetDirectShipmentDispatchDetails,
  useMarkDirectShipmentPickedUp,
  useAddDirectShipmentHandoverProofs,
  useOrderById,
} from '@/features/order/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { MultiCaptureUploader, type CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { PrintShipmentLabelModal } from '@/features/order/components/PrintShipmentLabelModal'

/**
 * Seller-facing detail page for a direct shipment. Renders the QR payload
 * prominently at the top, a DispatchDetailsForm that collects carrier,
 * tracking, shippedAt, package photos (mandatory) and optional handover
 * proofs, plus recipient/item context and a gated "Confirm Picked Up"
 * button that requires at least one package photo and carrier info.
 */
export default function SellerDirectShipmentDetailPage() {
  const { shipmentId = '' } = useParams<{ shipmentId: string }>()
  const { t } = useTranslation(['order', 'common'])
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { message } = App.useApp()

  const { data: shipment, isLoading, error } = useSellerDirectShipmentById(shipmentId)
  const { data: order } = useOrderById(shipment?.orderId ?? '')

  const setDispatchDetails = useSetDirectShipmentDispatchDetails()
  const markPickedUp = useMarkDirectShipmentPickedUp()
  const addHandoverProofs = useAddDirectShipmentHandoverProofs()
  const packageMediaUpload = useMediaUpload('shipment_package_photo')
  const handoverMediaUpload = useMediaUpload('shipment_handover_proof')

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [handoverModalOpen, setHandoverModalOpen] = useState(false)
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [packagePhotos, setPackagePhotos] = useState<CapturedPhoto[]>([])
  const [handoverPhotos, setHandoverPhotos] = useState<CapturedPhoto[]>([])
  const [dispatchForm] = Form.useForm<{
    carrierName: string
    trackingNumber: string
    shippedAt: Dayjs
  }>()

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !shipment) {
    return <Alert type="error" showIcon message={t('shipmentNotFound', 'Shipment not found')} />
  }

  // Locked once past carrier_booked — BE refuses dispatch updates after pickup.
  const dispatchLocked =
    shipment.status !== 'draft' && shipment.status !== 'carrier_booked'
  const carrierSet = !!shipment.externalCarrierName && !!shipment.externalTrackingCode
  const hasPackagePhotos = (shipment.sellerPackagePhotos?.length ?? 0) >= 1
  const pickupReady = hasPackagePhotos && carrierSet
  const pickupTooltip = !pickupReady
    ? !carrierSet
      ? t(
          'directShipment.pickupNeedsCarrier',
          'Set dispatch details (carrier + tracking) first',
        )
      : t(
          'directShipment.pickupNeedsPhoto',
          'Capture at least 1 package photo before confirming pickup',
        )
    : ''

  const qrPayload = shipment.qrPayload || shipment.qrCodeUrl || shipment.internalTrackingCode

  const handleDispatchSubmit = async () => {
    try {
      const values = await dispatchForm.validateFields()
      if (packagePhotos.length === 0 && !hasPackagePhotos) {
        message.warning(
          t('directShipment.packagePhotoRequired', 'Capture at least 1 package photo'),
        )
        return
      }

      // Upload any newly captured photos → media upload ids.
      const packageFiles = packagePhotos.map(
        (p, i) => new File([p.blob], `package-${i + 1}.jpg`, { type: 'image/jpeg' }),
      )
      const packageResults = packageFiles.length
        ? await packageMediaUpload.uploadMultiple(packageFiles)
        : []

      await setDispatchDetails.mutateAsync({
        orderId: shipment.orderId,
        shipmentId: shipment.id,
        carrierName: values.carrierName.trim(),
        trackingNumber: values.trackingNumber.trim(),
        shippedAt: values.shippedAt.toISOString(),
        packagePhotoMediaUploadIds: packageResults.map((r) => r.mediaUploadId),
      })
      message.success(
        t('directShipment.dispatchDetailsSaved', 'Dispatch details saved'),
      )
      setDispatchModalOpen(false)
      setPackagePhotos([])
      packageMediaUpload.reset()
      dispatchForm.resetFields()
    } catch (err) {
      if ((err as { errorFields?: unknown[] })?.errorFields === undefined) {
        message.error((err as Error)?.message ?? t('genericError', 'Something went wrong'))
      }
    }
  }

  const handoverAllowed =
    shipment.status === 'carrier_booked' ||
    shipment.status === 'picked_up' ||
    shipment.status === 'on_delivering'

  const handleHandoverSubmit = async () => {
    try {
      if (handoverPhotos.length === 0) {
        message.warning(
          t('directShipment.handoverPhotoRequired', 'Capture at least 1 handover proof'),
        )
        return
      }
      const files = handoverPhotos.map(
        (p, i) => new File([p.blob], `handover-${i + 1}.jpg`, { type: 'image/jpeg' }),
      )
      const results = await handoverMediaUpload.uploadMultiple(files)
      await addHandoverProofs.mutateAsync({
        orderId: shipment.orderId,
        shipmentId: shipment.id,
        handoverProofMediaUploadIds: results.map((r) => r.mediaUploadId),
      })
      message.success(t('directShipment.handoverProofsSaved', 'Handover proofs saved'))
      setHandoverModalOpen(false)
      setHandoverPhotos([])
      handoverMediaUpload.reset()
    } catch (err) {
      message.error((err as Error)?.message ?? t('genericError', 'Something went wrong'))
    }
  }

  const handleConfirmPickedUp = async () => {
    try {
      await markPickedUp.mutateAsync({ orderId: shipment.orderId, shipmentId: shipment.id })
      message.success(t('sellerActions.confirmPickedUp', 'Confirm Picked Up'))
    } catch (err) {
      message.error((err as Error)?.message ?? t('genericError', 'Something went wrong'))
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 12px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {tc('action.back', 'Back')}
        </Button>
        <Button icon={<PrinterOutlined />} onClick={() => setPrintModalOpen(true)}>
          {t('directShipment.labels.printLabel', 'Print Label')}
        </Button>
      </Space>

      {/* QR card — prominent at top */}
      <Card 
        style={{ 
          marginBottom: 16, 
          textAlign: 'center',
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <Flex vertical align="center" gap={12}>
          <QRCode value={qrPayload} size={220} />
          <Typography.Title level={3} className="oio-serif" style={{ margin: 0, fontWeight: 600, fontSize: 24 }}>
            #{shipment.shipmentIdDisplay}
          </Typography.Title>
          {shipment.internalTrackingCode && (
            <Typography.Text
              copyable
              style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
            >
              {shipment.internalTrackingCode}
            </Typography.Text>
          )}
          <Typography.Text
            copyable={{ text: qrPayload }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, wordBreak: 'break-all', maxWidth: 480, textAlign: 'center' }}
            type="secondary"
          >
            {qrPayload}
          </Typography.Text>
        </Flex>
      </Card>

      {/* Details card */}
      <Flex gap={16} wrap="wrap" align="flex-start">
        <Card 
          style={{ 
            flex: '1 1 420px', 
            minWidth: 320,
            background: 'var(--color-bg-container)',
            backdropFilter: 'var(--oio-blur)',
            WebkitBackdropFilter: 'var(--oio-blur)',
            borderRadius: 24,
            border: '1px solid var(--color-border)'
          }}
        >
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label={t('statusLabel', 'Status')}>
              <StatusBadge status={shipment.status} />
            </Descriptions.Item>
            <Descriptions.Item label={t('directShipment.internalTracking', 'Internal Tracking')}>
              <Typography.Text copyable style={{ fontFamily: 'var(--font-mono)' }}>
                {shipment.internalTrackingCode}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('carrierName', 'Carrier Name')}>
              {shipment.externalCarrierName ?? <Typography.Text type="secondary">—</Typography.Text>}
            </Descriptions.Item>
            <Descriptions.Item label={t('trackingNumber', 'Tracking Number')}>
              {shipment.externalTrackingCode ?? <Typography.Text type="secondary">—</Typography.Text>}
            </Descriptions.Item>
            {shipment.sellerDeclaredShippedAt && (
              <Descriptions.Item label={t('directShipment.declaredShippedAt', 'Declared Shipped')}>
                {formatDateTime(shipment.sellerDeclaredShippedAt)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('createdAt', 'Created')}>
              {formatDateTime(shipment.createdAt)}
            </Descriptions.Item>
            {shipment.deliveredAt && (
              <Descriptions.Item label={t('deliveredAt', 'Delivered')}>
                {formatDateTime(shipment.deliveredAt)}
              </Descriptions.Item>
            )}
          </Descriptions>

          {!dispatchLocked && (
            <Flex gap={8} style={{ marginTop: 12 }} wrap="wrap">
              <Button
                type="primary"
                onClick={() => {
                  dispatchForm.setFieldsValue({
                    carrierName: shipment.externalCarrierName ?? '',
                    trackingNumber: shipment.externalTrackingCode ?? '',
                    shippedAt: shipment.sellerDeclaredShippedAt
                      ? dayjs(shipment.sellerDeclaredShippedAt)
                      : dayjs(),
                  })
                  setDispatchModalOpen(true)
                }}
              >
                {carrierSet
                  ? t('directShipment.editDispatchDetails', 'Edit Dispatch Details')
                  : t('directShipment.setDispatchDetails', 'Set Dispatch Details')}
              </Button>
              <Tooltip title={pickupTooltip}>
                <Button
                  type="primary"
                  disabled={!pickupReady || shipment.status === 'picked_up'}
                  loading={markPickedUp.isPending}
                  onClick={handleConfirmPickedUp}
                >
                  {t('sellerActions.confirmPickedUp', 'Confirm Picked Up')}
                </Button>
              </Tooltip>
            </Flex>
          )}

          {shipment.manualReviewRequired && (
            <Alert
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
              message={t('directShipment.manualReviewRequired', 'Manual review required')}
              description={shipment.manualReviewReason ?? undefined}
            />
          )}
        </Card>
      </Flex>

      {/* Package photos evidence */}
      <Card
        title={
          <Flex gap={8} align="center">
            <CameraOutlined />
            <span className="oio-serif" style={{ fontWeight: 400, fontSize: 18 }}>{t('directShipment.dispatch.packagePhotos', 'Package Photos')}</span>
          </Flex>
        }
        style={{ 
          marginTop: 16,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)'
        }}
      >
        {shipment.sellerPackagePhotos && shipment.sellerPackagePhotos.length > 0 ? (
          <Flex wrap="wrap" gap={12}>
            {shipment.sellerPackagePhotos.map((p) => (
              <Image
                key={p.id}
                src={p.mediaUrl}
                alt="Package"
                width={120}
                height={120}
                style={{ objectFit: 'cover', borderRadius: 6 }}
              />
            ))}
          </Flex>
        ) : (
          <Alert
            type="info"
            showIcon
            message={t(
              'directShipment.noPackagePhotos',
              'No package photos yet — capture at least 1 via Set Dispatch Details.',
            )}
          />
        )}
      </Card>

      {/* Handover proofs */}
      <Card
        title={<span className="oio-serif" style={{ fontWeight: 400, fontSize: 18 }}>{t('directShipment.dispatch.handoverProofs', 'Handover Proofs')}</span>}
        style={{ 
          marginTop: 16,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          borderRadius: 24,
          border: '1px solid var(--color-border)'
        }}
        extra={
          handoverAllowed && (
            <Button
              type="primary"
              icon={<CameraOutlined />}
              onClick={() => setHandoverModalOpen(true)}
            >
              {t('directShipment.dispatch.addHandoverProofs', 'Add Handover Proofs')}
            </Button>
          )
        }
      >
        {shipment.sellerHandoverProofs && shipment.sellerHandoverProofs.length > 0 ? (
          <Flex wrap="wrap" gap={12}>
            {shipment.sellerHandoverProofs.map((p) => (
              <Image
                key={p.id}
                src={p.mediaUrl}
                alt="Handover proof"
                width={120}
                height={120}
                style={{ objectFit: 'cover', borderRadius: 6 }}
              />
            ))}
          </Flex>
        ) : (
          <Alert
            type="info"
            showIcon
            message={t(
              'directShipment.noHandoverProofs',
              'No handover proofs yet — capture once the carrier picks up the package.',
            )}
          />
        )}
      </Card>

      {/* Recipient */}
      {order?.shipping && (
        <Card 
          title={<span className="oio-serif" style={{ fontWeight: 400, fontSize: 18 }}>{t('recipient', 'Recipient')}</span>} 
          style={{ 
            marginTop: 16,
            background: 'var(--color-bg-container)',
            backdropFilter: 'var(--oio-blur)',
            WebkitBackdropFilter: 'var(--oio-blur)',
            borderRadius: 24,
            border: '1px solid var(--color-border)'
          }}
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('recipientName', 'Name')}>
              {order.shipping.recipientName ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('phone', 'Phone')}>
              {order.shipping.phoneNumber ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('address', 'Address')}>
              {order.shipping.composedAddress}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Item summary */}
      {order?.item && (
        <Card 
          title={<span className="oio-serif" style={{ fontWeight: 400, fontSize: 18 }}>{t('item', 'Item')}</span>} 
          style={{ 
            marginTop: 16,
            background: 'var(--color-bg-container)',
            backdropFilter: 'var(--oio-blur)',
            WebkitBackdropFilter: 'var(--oio-blur)',
            borderRadius: 24,
            border: '1px solid var(--color-border)'
          }}
        >
          <Flex gap={12} align="center">
            {order.item.primaryImageUrl && (
              <img
                src={order.item.primaryImageUrl}
                alt={order.item.itemTitle}
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
              />
            )}
            <div>
              <Typography.Text strong>{order.item.itemTitle}</Typography.Text>
              <div>
                <Typography.Text type="secondary">
                  {order.item.finalPrice.toLocaleString()} {order.item.currency}
                </Typography.Text>
              </div>
            </div>
          </Flex>
        </Card>
      )}

      {/* Dispatch details modal */}
      <Modal
        title={t('directShipment.setDispatchDetails', 'Set Dispatch Details')}
        open={dispatchModalOpen}
        onCancel={() => setDispatchModalOpen(false)}
        onOk={handleDispatchSubmit}
        confirmLoading={
          setDispatchDetails.isPending || packageMediaUpload.uploading
        }
        okText={tc('action.save', 'Save')}
        cancelText={tc('action.cancel', 'Cancel')}
        width={640}
        centered
        destroyOnHidden
      >
        <Form form={dispatchForm} layout="vertical">
          <Form.Item
            name="carrierName"
            label={t('carrierName', 'Carrier Name')}
            rules={[{ required: true, whitespace: true, message: t('carrierRequired', 'Carrier name is required') }]}
          >
            <Input placeholder={t('carrierPlaceholder', 'GHTK / Viettel Post / ...')} />
          </Form.Item>
          <Form.Item
            name="trackingNumber"
            label={t('trackingNumber', 'Tracking Number')}
            rules={[{ required: true, whitespace: true, message: t('trackingRequired', 'Tracking number is required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="shippedAt"
            label={t('directShipment.shippedAt', 'Shipped At')}
            rules={[{ required: true, message: t('directShipment.shippedAtRequired', 'Ship date is required') }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Typography.Text strong style={{ display: 'block', marginTop: 8, marginBottom: 8 }}>
            {t('directShipment.dispatch.packagePhotos', 'Package Photos')}{' '}
            <Typography.Text type="danger">*</Typography.Text>
          </Typography.Text>
          <MultiCaptureUploader
            maxPhotos={6}
            step="item_photo"
            facingMode="environment"
            onPhotosChange={setPackagePhotos}
            instruction={t(
              'directShipment.capturePackage',
              'Photograph the sealed package from multiple angles',
            )}
          />

        </Form>
      </Modal>

      {/* Handover proofs modal */}
      <Modal
        title={t('directShipment.dispatch.addHandoverProofs', 'Add Handover Proofs')}
        open={handoverModalOpen}
        onCancel={() => setHandoverModalOpen(false)}
        onOk={handleHandoverSubmit}
        confirmLoading={addHandoverProofs.isPending || handoverMediaUpload.uploading}
        okText={tc('action.save', 'Save')}
        cancelText={tc('action.cancel', 'Cancel')}
        width={640}
        centered
        destroyOnHidden
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          {t(
            'directShipment.captureHandover',
            'Photo of the carrier receipt / drop-off',
          )}
        </Typography.Text>
        <MultiCaptureUploader
          maxPhotos={4}
          step="item_photo"
          facingMode="environment"
          onPhotosChange={setHandoverPhotos}
          instruction={t(
            'directShipment.captureHandover',
            'Photo of the carrier receipt / drop-off',
          )}
        />
      </Modal>

      {/* Print label modal */}
      <PrintShipmentLabelModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        shipment={shipment}
        order={order}
      />
    </div>
  )
}
