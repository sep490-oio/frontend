import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Typography,
  Card,
  Button,
  Space,
  Alert,
  Form,
  Input,
  InputNumber,
  Divider,
  Skeleton,
  Segmented,
  Select,
  App,
} from 'antd'
import { ArrowLeftOutlined, PictureOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import { useWarehouseStaffOutboundOrder, useBookOutbound } from '@/features/warehouse/api'
import type { BookOutboundRequest } from '@/features/warehouse/api'
import { formatCurrency } from '@/utils/format'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'

const GHN_HANDLING_KEYS = [
  { value: 'CHOTHUHANG', key: 'tryItem' },
  { value: 'CHOXEMHANGKHONGTHU', key: 'viewOnly' },
  { value: 'KHONGCHOXEMHANG', key: 'noView' },
] as const

/**
 * Canonical warehouse-staff outbound booking screen.
 * Fetches a single WarehouseStaffOutboundOrderDetailDto and prefills every
 * shippable field so staff only has to confirm and click Book.
 */
export default function OutboundDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const { data: detail, isLoading, isError } = useWarehouseStaffOutboundOrder(orderId)

  const [form] = Form.useForm<BookOutboundRequest>()
  const bookOutboundMutation = useBookOutbound()
  const packagePhotoUpload = useMediaUpload('shipment_package_photo')
  const handoverPhotoUpload = useMediaUpload('shipment_handover_proof')
  const [packagePhotos, setPackagePhotos] = useState<CapturedPhoto[]>([])
  const [handoverPhotos, setHandoverPhotos] = useState<CapturedPhoto[]>([])

  const shipmentMode = Form.useWatch('shipmentMode', form) ?? 'platform_managed'
  const isExternal = shipmentMode === 'external_carrier'

  // Prefill whenever detail arrives / changes.
  useEffect(() => {
    if (!detail) return
    form.setFieldsValue({
      orderId: detail.orderId,
      warehouseItemId: detail.warehouseItemId,
      itemName: detail.itemTitle ?? '',
      itemPrice: detail.itemPriceDefault ?? 0,
      recipientName: detail.recipientName ?? '',
      recipientPhone: detail.recipientPhone ?? '',
      recipientAddress: detail.street ?? '',
      recipientWard: detail.ward ?? '',
      recipientDistrict: detail.district ?? '',
      recipientProvince: detail.province ?? '',
      weightGrams: detail.weightGrams,
      lengthCm: detail.lengthCm,
      widthCm: detail.widthCm,
      heightCm: detail.heightCm,
      insuranceValue: detail.insuranceValueDefault,
      codAmount: detail.codAmountDefault,
      shipmentMode: 'external_carrier',
    } as BookOutboundRequest)
  }, [detail, form])

  const onFinish = async (values: BookOutboundRequest) => {
    if (packagePhotos.length === 0) {
      message.error(t('packagePhotosRequired', 'At least one package photo is required'))
      return
    }
    try {
      const pkgFiles = packagePhotos.map(
        (p, i) => new File([p.blob], `package-${i + 1}.jpg`, { type: 'image/jpeg' }),
      )
      const pkgResults = await packagePhotoUpload.uploadMultiple(pkgFiles)

      let handoverIds: string[] | undefined
      if (handoverPhotos.length > 0) {
        const hvFiles = handoverPhotos.map(
          (p, i) => new File([p.blob], `handover-${i + 1}.jpg`, { type: 'image/jpeg' }),
        )
        const hvResults = await handoverPhotoUpload.uploadMultiple(hvFiles)
        handoverIds = hvResults.map((r) => r.mediaUploadId)
      }

      const mode = values.shipmentMode ?? 'platform_managed'
      const isExt = mode === 'external_carrier'
      const payload: BookOutboundRequest = {
        ...values,
        shipmentMode: mode,
        externalCarrierName: isExt ? values.externalCarrierName : undefined,
        carrierTrackingNumber: isExt ? values.carrierTrackingNumber : undefined,
        ghnHandlingNote: isExt ? undefined : values.ghnHandlingNote,
        shippingMethod: isExt ? undefined : values.shippingMethod,
        packagePhotoMediaUploadIds: pkgResults.map((r) => r.mediaUploadId),
        handoverPhotoMediaUploadIds: handoverIds,
      }
      const created = await bookOutboundMutation.mutateAsync(payload)
      message.success(t('bookSuccess', 'Outbound shipment booked'))
      if (created?.id) {
        navigate(`/warehouse-staff/outbound/shipments/${created.id}`)
      } else {
        navigate('/warehouse-staff/outbound')
      }
    } catch (err) {
      message.error(normalizeErrorMessage(err, t('bookError', 'Failed to book shipment')))
    }
  }

  const handleBack = () => navigate('/warehouse-staff/outbound')

  if (isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
        <Card>
          <Skeleton active />
        </Card>
      </div>
    )
  }

  if (isError || !detail) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
        <Space style={{ marginBottom: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            {tc('action.back', 'Back')}
          </Button>
        </Space>
        <Alert
          type="error"
          showIcon
          message={t('staffOutboundQueue.notFound', 'This order is not available for outbound booking.')}
        />
      </div>
    )
  }

  const imgUrl = detail.itemPrimaryImageUrl ?? undefined

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>
        {t('staffOutboundQueue.bookOutbound', 'Book Outbound')}
      </Typography.Title>

      <Card>
        <Form<BookOutboundRequest>
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          {/* Hidden fields — passed through to backend unchanged */}
          <Form.Item name="orderId" hidden><Input /></Form.Item>
          <Form.Item name="warehouseItemId" hidden><Input /></Form.Item>
          <Form.Item name="itemName" hidden><Input /></Form.Item>
          <Form.Item name="itemPrice" hidden><InputNumber /></Form.Item>

          {/* Item summary block — mirrors BookInboundPage's selected-items preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 8,
              border: '1px solid var(--color-border-light, #eee)',
              background: 'var(--color-bg-secondary, #fafafa)',
              marginBottom: 24,
            }}
          >
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={detail.itemTitle ?? ''}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 6,
                  objectFit: 'cover',
                  flexShrink: 0,
                  background: '#f0f0f0',
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-tertiary, #bbb)',
                  fontSize: 22,
                }}
              >
                <PictureOutlined />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <Typography.Text
                ellipsis={{ tooltip: detail.itemTitle ?? '' }}
                style={{ display: 'block', fontWeight: 500, fontSize: 14 }}
              >
                {detail.itemTitle}
              </Typography.Text>
              {detail.orderNumber && (
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  {t('staffOutboundQueue.columns.orderNumber', 'Order')}: {detail.orderNumber}
                </Typography.Text>
              )}
              {detail.storageLocationLabel && (
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  {t('staffOutboundQueue.columns.location', 'Storage')}: {detail.storageLocationLabel}
                </Typography.Text>
              )}
              {detail.sellerDisplayName && (
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  {t('staffOutboundQueue.columns.seller', 'Seller')}: {detail.sellerDisplayName}
                </Typography.Text>
              )}
              {detail.orderStatus && (
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  {t('staffOutboundQueue.columns.status', 'Status')}: {detail.orderStatus}
                </Typography.Text>
              )}
              <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                {t('staffOutboundQueue.itemPrice', 'Item price')}:{' '}
                {formatCurrency(detail.itemPriceDefault ?? 0)}
              </Typography.Text>
            </div>
          </div>

          <Divider>{t('shipmentMode', 'Shipment Mode')}</Divider>

          <Form.Item
            name="shipmentMode"
            rules={[{ required: true, message: t('modeRequired', 'Please select shipment mode') }]}
          >
            <Segmented
              block
              options={[
                {
                  label: t('shipmentModeExternal', 'External Carrier'),
                  value: 'external_carrier',
                },
                {
                  label: t('shipmentModePlatform', 'Platform Managed'),
                  value: 'platform_managed',
                },
              ]}
            />
          </Form.Item>
          <Typography.Text
            type="secondary"
            style={{ display: 'block', marginBottom: 16, fontSize: 12 }}
          >
            {isExternal
              ? t(
                  'shipmentModeExternalHint',
                  'You will book directly with a third-party carrier and enter the tracking number manually.',
                )
              : detail.defaultProviderLabel ??
                t('shipmentModePlatformHint', 'Integrated carrier (GHN)')}
          </Typography.Text>

          <Divider>{t('recipientInfo', 'Recipient Information')}</Divider>

          <Typography.Text
            style={{
              display: 'block',
              marginBottom: 12,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
            }}
          >
            {t(
              'recipientPrefilledHint',
              "Pre-filled from the buyer's shipping info. You can edit before booking.",
            )}
          </Typography.Text>

          <Form.Item
            name="recipientName"
            label={t('recipientName', 'Recipient Name')}
            rules={[{ required: true, whitespace: true, message: t('recipientNameRequired', 'Please enter recipient name') }]}
          >
            <Input placeholder={t('recipientNamePlaceholder', 'Full name')} />
          </Form.Item>

          <Form.Item
            name="recipientPhone"
            label={t('phone', 'Phone Number')}
            rules={[{ required: true, whitespace: true, message: t('recipientPhoneRequired', 'Please enter phone number') }]}
          >
            <Input placeholder={t('recipientPhonePlaceholder', 'e.g. 0912345678')} />
          </Form.Item>

          <Form.Item
            name="recipientAddress"
            label={t('streetAddress', 'Address')}
            rules={[{ required: true, whitespace: true, message: t('recipientAddressRequired', 'Please enter address') }]}
          >
            <Input.TextArea rows={3} placeholder={t('recipientAddressPlaceholder', 'Full address')} />
          </Form.Item>

          <Form.Item
            name="recipientWard"
            label={t('ward', 'Ward')}
            rules={[{ required: true, whitespace: true, message: t('wardRequired', 'Please enter ward') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="recipientDistrict"
            label={t('district', 'District')}
            rules={[{ required: true, whitespace: true, message: t('districtRequired', 'Please enter district') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="recipientProvince"
            label={t('province', 'Province/City')}
            rules={[{ required: true, whitespace: true, message: t('provinceRequired', 'Please enter province/city') }]}
          >
            <Input />
          </Form.Item>

          <Divider>{t('dimensions', 'Package Dimensions')}</Divider>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: isMobile ? '0 12px' : '0 16px',
            }}
          >
            <Form.Item
              name="weightGrams"
              label={t('totalPackageWeight', 'Total package weight (g)')}
              help={t('totalPackageWeightHelp', 'Applies to the whole parcel')}
              rules={[
                { required: true, message: t('weightRequired', 'Required') },
                { type: 'number', min: 1, message: t('weightMustBePositive', 'Weight must be greater than 0') },
              ]}
            >
              <InputNumber min={1} max={50000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="lengthCm"
              label={t('length', 'Length (cm)')}
              rules={[
                { required: true, message: t('lengthRequired', 'Required') },
                { type: 'number', min: 1, message: t('lengthMin', 'Must be at least 1') },
              ]}
            >
              <InputNumber min={1} max={200} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="widthCm"
              label={t('width', 'Width (cm)')}
              rules={[
                { required: true, message: t('widthRequired', 'Required') },
                { type: 'number', min: 1, message: t('widthMin', 'Must be at least 1') },
              ]}
            >
              <InputNumber min={1} max={200} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="heightCm"
              label={t('height', 'Height (cm)')}
              rules={[
                { required: true, message: t('heightRequired', 'Required') },
                { type: 'number', min: 1, message: t('heightMin', 'Must be at least 1') },
              ]}
            >
              <InputNumber min={1} max={200} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '0 16px',
            }}
          >
            <Form.Item
              name="insuranceValue"
              label={t('insuranceValue', 'Insurance Value (VND)')}
              help={t('insuranceHelp', 'Leave empty to use item price')}
              rules={[{ type: 'number', min: 0, message: t('insuranceMin', 'Must be 0 or greater') }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>

            <Form.Item
              name="codAmount"
              label={t('codAmount', 'COD Amount (VND)')}
              help={t('codAmountHelp', 'Usually 0 — order is already paid')}
              rules={[{ type: 'number', min: 0, message: t('codMin', 'Must be 0 or greater') }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </div>

          <Divider>{t('shippingOptions', 'Shipping Options')}</Divider>

          {!isExternal && (
            <>
              <Form.Item
                name="shippingMethod"
                label={t('shippingMethod', 'Shipping Method')}
              >
                <Input placeholder={t('shippingMethodPlaceholder', 'Optional — carrier-specific')} />
              </Form.Item>

              <Form.Item
                name="ghnHandlingNote"
                label={t('ghnHandlingNote', 'GHN Handling Note')}
              >
                <Select
                  options={GHN_HANDLING_KEYS.map((opt) => ({
                    value: opt.value,
                    label: t(`handlingOption.${opt.key}`, opt.key),
                  }))}
                  placeholder={t('ghnHandlingPlaceholder', 'Select handling preference (optional)')}
                  allowClear
                />
              </Form.Item>
            </>
          )}

          {isExternal && (
            <>
              <Form.Item
                name="externalCarrierName"
                label={t('externalCarrierName', 'Carrier Name')}
                rules={[{ required: true, whitespace: true, message: t('carrierNameRequired', 'Please enter the carrier name') }]}
              >
                <Input placeholder={t('carrierNamePlaceholder', 'e.g. DHL, FedEx, Viettel Post')} />
              </Form.Item>

              <Form.Item
                name="carrierTrackingNumber"
                label={t('carrierTrackingNumber', 'Tracking Number')}
                rules={[{ required: true, whitespace: true, message: t('carrierTrackingNumberRequired', 'Please enter the tracking number') }]}
              >
                <Input placeholder={t('carrierTrackingNumberPlaceholder', 'Carrier-provided tracking number')} />
              </Form.Item>
            </>
          )}

          <Divider>{t('evidencePhotos', 'Evidence Photos')}</Divider>

          <Form.Item
            label={
              <span>
                {t('packagePhotos', 'Package Photos (required)')}
                <span style={{ color: 'var(--color-error, #ff4d4f)' }}> *</span>
              </span>
            }
            help={t('packagePhotosHelp', 'At least 1 photo of the package before dispatch is required.')}
          >
            <MultiCaptureUploader
              maxPhotos={6}
              step="item_photo"
              facingMode="environment"
              onPhotosChange={setPackagePhotos}
              instruction={t('capturePackage', 'Photograph the sealed package before dispatch')}
            />
            {packagePhotoUpload.error && (
              <Alert type="error" message={packagePhotoUpload.error} style={{ marginTop: 8 }} />
            )}
          </Form.Item>

          <Form.Item
            label={t('handoverPhotos', 'Handover Photos (optional)')}
            help={t('handoverPhotosHelp', 'Optional: photos of the handover to the carrier.')}
          >
            <MultiCaptureUploader
              maxPhotos={4}
              step="item_photo"
              facingMode="environment"
              onPhotosChange={setHandoverPhotos}
              instruction={t('captureHandover', 'Photo of the carrier receipt / handover')}
            />
            {handoverPhotoUpload.error && (
              <Alert type="error" message={handoverPhotoUpload.error} style={{ marginTop: 8 }} />
            )}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                disabled={packagePhotos.length === 0}
                loading={bookOutboundMutation.isPending || packagePhotoUpload.uploading || handoverPhotoUpload.uploading}
              >
                {t('staffOutboundQueue.bookOutbound', 'Book Outbound')}
              </Button>
              <Button onClick={handleBack}>
                {tc('action.cancel', 'Cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
