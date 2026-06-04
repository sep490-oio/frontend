import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, App, Divider, Alert } from 'antd'
import { ArrowLeftOutlined, PictureOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useBookInbound } from '@/features/warehouse/api'
import { useMyItems } from '@/features/item/api'
import { useAddresses, useCurrentUser, useCurrentUserProfile } from '@/features/user/api'
import { useMySellerProfile } from '@/features/seller/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useEffect, useMemo, useRef } from 'react'
import GhnAddressSelect from '@/components/ui/GhnAddressSelect'
import type { GhnMetadata } from '@/types'

export default function BookInboundPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')

  const SHIPMENT_MODE_OPTIONS = [
    { label: t('shipmentModeOption.platformManaged', 'Platform Managed (GHN)'), value: 'platform_managed' },
    { label: t('shipmentModeOption.externalCarrier', 'External Carrier'), value: 'external_carrier' },
  ]

  const GHN_HANDLING_OPTIONS = [
    { label: t('handlingOption.tryItem', 'Allow trying the item'), value: 'CHOTHUHANG' },
    { label: t('handlingOption.viewOnly', 'Allow viewing but not trying'), value: 'CHOXEMHANGKHONGTHU' },
    { label: t('handlingOption.noView', 'Do not allow viewing the item'), value: 'KHONGCHOXEMHANG' },
  ]

  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const [form] = Form.useForm()

  const bookInbound = useBookInbound()

  // Sender autofill sources — mirror the precedence used on CheckoutPage:
  //   1. seller's default address (or first address)
  //   2. seller profile store name / current profile name
  //   3. current user phone
  const { data: addresses, isSuccess: isAddressesSuccess } = useAddresses()
  const { data: currentUser } = useCurrentUser()
  const { data: currentProfile } = useCurrentUserProfile()
  const { data: mySellerProfile } = useMySellerProfile()
  // Only show items that are actually waiting to be shipped in for platform
  // verification. The picker uses three server-side conditions ANDed together:
  //   - status === 'pending_verify'
  //   - RequiresPlatformInspection === true (canonical Item flag, not Auction)
  //   - hasActiveInbound === false (item not currently in transit; cancelled/failed
  //     prior shipments do not block re-attempts)
  // The backend BookInboundShipmentCommandHandler enforces the same rules as a
  // last-line guard.
  const { data: itemsData, isLoading: itemsLoading } = useMyItems({
    pageNumber: 1,
    pageSize: 100,
    sortBy: 'CreatedAt Desc',
    status: 'pending_verify',
    hasActiveInbound: false,
  })

  const allItems = itemsData?.items ?? []
  const itemOptions = allItems.map((item) => ({
    label: item.title,
    value: item.id,
  }))
  const hasEligibleItems = allItems.length > 0

  const shipmentMode = Form.useWatch('shipmentMode', form)
  const isExternal = shipmentMode === 'external_carrier'

  // Selected item preview — reflects current Select value in selection order.
  const selectedItemIds: string[] = Form.useWatch('itemIds', form) ?? []
  const selectedItems = selectedItemIds
    .map((sid) => allItems.find((i) => i.id === sid))
    .filter((x): x is NonNullable<typeof x> => !!x)

  const getPrimaryImageUrl = (item: (typeof allItems)[number]): string | undefined => {
    const images = item.images ?? []
    const primary = images.find((img) => img.isPrimary) ?? images[0]
    return primary?.thumbnailUrl ?? primary?.url
  }

  // Build the sender autofill payload. Default address wins; otherwise fall
  // back to profile/user identity with empty address fields.
  const autofillSenderValues = useMemo(() => {
    const list = addresses ?? []
    const defaultAddress = list.find((a) => a.isDefault) ?? list[0]

    if (defaultAddress) {
      return {
        senderName: defaultAddress.recipientName ?? '',
        senderPhone: defaultAddress.phoneNumber ?? '',
        senderAddress: defaultAddress.street ?? '',
        senderWard: defaultAddress.ward ?? '',
        senderDistrict: defaultAddress.district ?? '',
        senderProvince: defaultAddress.city ?? '',
        senderMetadata: defaultAddress.metadata as any,
        _fromDefaultAddress: true as const,
      }
    }

    const fallbackName =
      mySellerProfile?.storeName?.trim() ||
      currentProfile?.fullName?.trim() ||
      [currentProfile?.firstName, currentProfile?.lastName].filter(Boolean).join(' ').trim() ||
      currentProfile?.displayName ||
      currentUser?.userName ||
      ''

    if (!fallbackName && !currentUser?.phoneNumber) {
      return null
    }

    return {
      senderName: fallbackName,
      senderPhone: currentUser?.phoneNumber ?? '',
      senderAddress: '',
      senderWard: '',
      senderDistrict: '',
      senderProvince: '',
      senderMetadata: undefined,
      _fromDefaultAddress: false as const,
    }
  }, [addresses, currentUser, currentProfile, mySellerProfile])

  // Only auto-fill on first mount when the user has not touched sender fields
  // yet. Avoid clobbering manual edits; avoid re-running when items/mode change.
  const senderAutofilledRef = useRef(false)
  useEffect(() => {
    if (senderAutofilledRef.current) return
    if (!isAddressesSuccess) return
    if (!autofillSenderValues) return
    const current = form.getFieldsValue([
      'senderName',
      'senderPhone',
      'senderAddress',
      'senderWard',
      'senderDistrict',
      'senderProvince',
    ]) as Record<string, string | undefined>
    const hasAnyValue = Object.values(current).some((v) => v && v.trim().length > 0)
    if (hasAnyValue) {
      senderAutofilledRef.current = true
      return
    }
    const { _fromDefaultAddress: _omit, ...values } = autofillSenderValues
    form.setFieldsValue({
      ...values,
      senderAddressId: addresses?.find((a) => a.isDefault)?.id,
    })
    senderAutofilledRef.current = true
  }, [autofillSenderValues, form, isAddressesSuccess, addresses])



  const onFinish = async (values: {
    itemIds: string[]
    shipmentMode: string
    externalCarrierName?: string
    senderName: string
    senderPhone: string
    senderAddress: string
    senderWard?: string
    senderDistrict?: string
    senderProvince?: string
    senderMetadata?: GhnMetadata
    weight: number
    length: number
    width: number
    height: number
    insuranceValue?: number
    notes?: string
    ghnHandlingNote?: string
  }) => {
    const isExt = values.shipmentMode === 'external_carrier'

    // Per-item weightGrams is intentionally omitted — the backend treats the
    // top-level weight as the single source of truth for the whole parcel and
    // distributes weight internally when carrier metadata needs per-item values.
    const items = values.itemIds.map((itemId) => {
      const item = allItems.find((i) => i.id === itemId)
      return {
        itemId,
        itemPrice: (item as any)?.price ?? 0,
      }
    })

    const totalInsurance = values.insuranceValue ?? items.reduce((sum, i) => sum + (i.itemPrice ?? 0), 0)

    try {
      const results = await bookInbound.mutateAsync({
        items,
        weightGrams: values.weight,
        insuranceValue: totalInsurance,
        providerCode: isExt ? 'external' : 'ghn',
        shipmentMode: values.shipmentMode,
        externalCarrierName: isExt ? values.externalCarrierName : undefined,
        senderName: values.senderName,
        senderPhone: values.senderPhone,
        senderAddress: values.senderAddress,
        senderWard: values.senderWard,
        senderDistrict: values.senderDistrict,
        senderProvince: values.senderProvince,
        senderMetadata: values.senderMetadata,
        lengthCm: values.length,
        widthCm: values.width,
        heightCm: values.height,
        notes: values.notes,
        ghnHandlingNote: isExt ? undefined : values.ghnHandlingNote,
      })
      message.success(t('bookSuccess', 'Inbound package booked successfully'))
      const firstResult = results[0]
      navigate(`${prefix}/warehouse/inbound/packages/${encodeURIComponent(firstResult.clientOrderCode)}`)
    } catch (err: any) {
      const apiError = err.response?.data
      if (err.response?.status === 409 && apiError?.code === 'InboundShipment.AlreadyExists') {
        message.error(t('alreadyExistsError', 'This item already has an active shipping request. Please check your history.'))
      } else {
        message.error(t('bookError', 'Failed to book inbound shipment'))
      }
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/warehouse/inbound`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2} className="oio-serif" style={{ fontWeight: 400, fontSize: isMobile ? 24 : 32 }}>{t('bookInbound', 'Book Inbound Shipment')}</Typography.Title>

      <Card
        style={{
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ weight: 1, length: 10, width: 10, height: 10, shipmentMode: 'external_carrier' }}
        >
          {/* Item Selection — multi-select. Only items currently awaiting
              platform verification are listed: status = pending_verify AND
              Item.RequiresPlatformInspection = true AND no active inbound
              shipment (cancelled/failed prior attempts don't block). */}
          {!itemsLoading && !hasEligibleItems && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={t('noEligibleInboundItemsTitle', 'No items are waiting for platform inspection')}
              description={t(
                'noEligibleInboundItemsDesc',
                'Only items in status "pending_verify" that were submitted for platform verification and do not already have an active inbound shipment can be shipped in. Submit an item for platform verification first.',
              )}
            />
          )}
          <Form.Item
            name="itemIds"
            label={t('selectItem', 'Select Items')}
            rules={[{ required: true, message: t('itemRequired', 'Please select at least one item') }]}
          >
            <Select
              mode="multiple"
              options={itemOptions}
              loading={itemsLoading}
              showSearch
              disabled={!hasEligibleItems}
              optionFilterProp="label"
              placeholder={
                hasEligibleItems
                  ? t('selectItemPlaceholder', 'Search and select items to ship')
                  : t('noEligibleInboundItemsPlaceholder', 'No eligible items to ship')
              }
            />
          </Form.Item>

          {/* Selected items preview — compact cards for each chosen item */}
          {selectedItems.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Text
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                }}
              >
                {t('selectedItems', 'Selected Items')} ({selectedItems.length})
              </Typography.Text>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {selectedItems.map((item) => {
                  const imgUrl = getPrimaryImageUrl(item)
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 8,
                        borderRadius: 8,
                        border: '1px solid var(--color-border-light, #eee)',
                        background: 'var(--color-bg-secondary, #fafafa)',
                      }}
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.title}
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
                          ellipsis={{ tooltip: item.title }}
                          style={{ display: 'block', fontWeight: 500, fontSize: 13 }}
                        >
                          {item.title}
                        </Typography.Text>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Shipment Mode */}
          <Form.Item
            name="shipmentMode"
            label={t('shipmentMode', 'Shipment Mode')}
            rules={[{ required: true, message: t('modeRequired', 'Please select shipment mode') }]}
          >
            <Select
              options={SHIPMENT_MODE_OPTIONS}
              placeholder={t('selectMode', 'Select shipment mode')}
            />
          </Form.Item>

          {/* External Carrier Name — only when external */}
          {isExternal && (
            <Form.Item
              name="externalCarrierName"
              label={t('externalCarrierName', 'Carrier Name')}
              rules={[{ required: true, message: t('carrierNameRequired', 'Please enter the carrier name') }]}
            >
              <Input placeholder={t('carrierNamePlaceholder', 'e.g. DHL, FedEx, Viettel Post')} />
            </Form.Item>
          )}

          {/* GHN Handling Note — only when platform managed */}
          {!isExternal && (
            <Form.Item
              name="ghnHandlingNote"
              label={t('ghnHandlingNote', 'GHN Handling Note')}
            >
              <Select
                options={GHN_HANDLING_OPTIONS}
                placeholder={t('ghnHandlingPlaceholder', 'Select handling preference (optional)')}
                allowClear
              />
            </Form.Item>
          )}

          <Divider>{t('senderInfo', 'Sender Information')}</Divider>

          <Form.Item name="senderAddressId" label={t('selectAddress', 'Select Saved Address')}>
            <Select
              allowClear
              placeholder={t('manualAddress', 'Enter manually...')}
              options={(addresses ?? []).map((a) => ({
                label: `${a.recipientName} - ${a.phoneNumber} - ${a.street}, ${a.ward}, ${a.district}, ${a.city}`,
                value: a.id,
              }))}
              onChange={(val) => {
                if (!val) {
                  form.setFieldsValue({
                    senderName: '',
                    senderPhone: '',
                    senderAddress: '',
                    senderWard: '',
                    senderDistrict: '',
                    senderProvince: '',
                    senderMetadata: undefined,
                  })
                } else {
                  const addr = addresses?.find((a) => a.id === val)
                  if (addr) {
                    form.setFieldsValue({
                      senderName: addr.recipientName ?? '',
                      senderPhone: addr.phoneNumber ?? '',
                      senderAddress: addr.street ?? '',
                      senderWard: addr.ward ?? '',
                      senderDistrict: addr.district ?? '',
                      senderProvince: addr.city ?? '',
                      senderMetadata: addr.metadata,
                    })
                  }
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="senderName"
            label={t('senderName', 'Sender Name')}
            rules={[{ required: true, message: t('senderNameRequired', 'Please enter sender name') }]}
          >
            <Input placeholder={t('senderNamePlaceholder', 'Full name')} />
          </Form.Item>

          <Form.Item
            name="senderPhone"
            label={t('senderPhone', 'Phone Number')}
            rules={[{ required: true, message: t('senderPhoneRequired', 'Please enter phone number') }]}
          >
            <Input placeholder={t('senderPhonePlaceholder', 'e.g. 0912345678')} />
          </Form.Item>

          <Form.Item
            name="senderAddress"
            label={t('senderAddress', 'Address')}
            rules={[{ required: true, message: t('senderAddressRequired', 'Please enter address') }]}
          >
            <Input.TextArea rows={3} placeholder={t('senderAddressPlaceholder', 'Full address')} />
          </Form.Item>

          <GhnAddressSelect
            form={form}
            provinceName="senderProvince"
            districtName="senderDistrict"
            wardName="senderWard"
            metadataName="senderMetadata"
          />

          <Divider>{t('dimensions', 'Package Dimensions')}</Divider>

          {isExternal && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={t('externalDimensionsNote', 'Enter the total package dimensions for all items.')}
            />
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? '0 12px' : '0 16px',
          }}>
            <Form.Item
              name="weight"
              label={t('totalPackageWeight', 'Total package weight (g)')}
              help={t('totalPackageWeightHelp', 'Applies to the whole parcel for all selected items')}
              rules={[
                { required: true, message: t('weightRequired', 'Required') },
                {
                  validator: async (_, value) => {
                    if (value == null) return
                    if (value <= 0) throw new Error(t('weightMustBePositive', 'Weight must be greater than 0'))
                    const count = (form.getFieldValue('itemIds') as string[] | undefined)?.length ?? 0
                    if (count > 0 && value < count) {
                      throw new Error(
                        t('weightMinPerItem', 'Total weight must be at least {{count}}g (1g per selected item).', { count }),
                      )
                    }
                  },
                },
              ]}
            >
              <InputNumber min={1} max={50000} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="length"
              label={t('length', 'Length (cm)')}
              rules={[{ required: true, message: t('lengthRequired', 'Required') }]}
            >
              <InputNumber min={1} max={200} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="width"
              label={t('width', 'Width (cm)')}
              rules={[{ required: true, message: t('widthRequired', 'Required') }]}
            >
              <InputNumber min={1} max={200} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="height"
              label={t('height', 'Height (cm)')}
              rules={[{ required: true, message: t('heightRequired', 'Required') }]}
            >
              <InputNumber min={1} max={200} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          {!isExternal && (
            <Form.Item
              name="insuranceValue"
              label={t('insuranceValue', 'Insurance Value (VND)')}
              help={t('insuranceHelp', 'Leave empty to use total item price')}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          )}

          <Form.Item
            name="notes"
            label={t('notes', 'Notes')}
          >
            <Input.TextArea rows={3} maxLength={500} showCount placeholder={t('notesPlaceholder', 'Optional notes')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={bookInbound.isPending}>
                {t('bookInbound', 'Book Inbound')}
              </Button>
              <Button onClick={() => navigate(`${prefix}/warehouse/inbound`)}>
                {tc('action.cancel', 'Cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
