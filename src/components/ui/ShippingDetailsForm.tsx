import { useState } from 'react'
import { Form, Input, InputNumber, Select, Row, Col, Divider, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import GhnAddressSelect from '@/components/ui/GhnAddressSelect'
import type { GhnMetadata } from '@/types'

export interface ShippingDetailsFormValues {
  senderName: string
  senderPhone: string
  senderAddress: string
  senderWard: string
  senderDistrict: string
  senderProvince: string
  senderMetadata?: GhnMetadata
  weightGrams: number
  insuranceValue: number
  providerCode?: string
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  externalTrackingNumber?: string
  externalCarrierName?: string
  notes?: string
}

interface ShippingDetailsFormProps {
  form: ReturnType<typeof Form.useForm<ShippingDetailsFormValues>>[0]
}

// Note: shipping mode labels use warehouse namespace t() calls inside the component
const SHIPPING_MODE_OPTIONS_KEYS = [
  { value: 'platform', labelKey: 'shippingModePlatform' },
  { value: 'external', labelKey: 'shippingModeExternal' },
]

export default function ShippingDetailsForm({ form }: ShippingDetailsFormProps) {
  const { t } = useTranslation('warehouse')
  const [shippingMode, setShippingMode] = useState<string>('platform')

  return (
    <Form form={form} layout="vertical" requiredMark>
      {/* Sender Info */}
      <Typography.Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
        {t('senderInfo', 'Sender Information')}
      </Typography.Text>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name="senderName" label={t('senderName', 'Sender Name')} rules={[{ required: true, message: t('senderNameRequired', 'Required') }]}>
            <Input placeholder={t('senderNamePlaceholder', 'Full name')} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="senderPhone" label={t('senderPhone', 'Phone Number')} rules={[{ required: true, message: t('senderPhoneRequired', 'Required') }]}>
            <Input placeholder={t('senderPhonePlaceholder', '0912345678')} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="senderAddress" label={t('senderAddress', 'Address')} rules={[{ required: true, message: t('senderAddressRequired', 'Required') }]}>
        <Input placeholder={t('senderAddressPlaceholder', 'Full address')} />
      </Form.Item>

      <GhnAddressSelect
        form={form}
        provinceName="senderProvince"
        districtName="senderDistrict"
        wardName="senderWard"
        metadataName="senderMetadata"
      />

      <Divider style={{ margin: '12px 0 16px' }} />

      {/* Package Info */}
      <Typography.Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
        {t('packageInfo', 'Package Information')}
      </Typography.Text>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name="weightGrams" label={t('weightGrams', 'Weight (grams)')} rules={[{ required: true, message: t('weightGramsRequired', 'Required') }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder={t('weightPlaceholder', '500')} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="insuranceValue" label={t('insuranceValueLabel', 'Insurance Value (VND)')} rules={[{ required: true, message: t('insuranceValueRequired', 'Required') }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder={t('insurancePlaceholder', '1000000')} addonAfter="VND" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="lengthCm" label={t('lengthCm', 'Length (cm)')}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="cm" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="widthCm" label={t('widthCm', 'Width (cm)')}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="cm" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="heightCm" label={t('heightCm', 'Height (cm)')}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="cm" />
          </Form.Item>
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0 16px' }} />

      {/* Shipping Method */}
      <Typography.Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
        {t('shippingMethod', 'Shipping Method')}
      </Typography.Text>

      <Form.Item label={t('shippingMode', 'Choose method')}>
        <Select
          value={shippingMode}
          onChange={(v) => {
            setShippingMode(v)
            if (v === 'platform') {
              form.setFieldsValue({ providerCode: 'ghn', externalTrackingNumber: undefined, externalCarrierName: undefined })
            } else {
              form.setFieldsValue({ providerCode: undefined })
            }
          }}
          options={SHIPPING_MODE_OPTIONS_KEYS.map((o) => ({ value: o.value, label: t(o.labelKey, o.value === 'platform' ? 'GHN (Giao Hang Nhanh)' : 'Self-delivery / Other carrier') }))}
        />
      </Form.Item>

      {shippingMode === 'platform' && (
        <Form.Item name="providerCode" label={t('providerCode', 'Carrier')} initialValue="ghn">
          <Select
            options={[
              { value: 'ghn', label: 'GHN - Giao Hàng Nhanh' },
            ]}
          />
        </Form.Item>
      )}

      {shippingMode === 'external' && (
        <>
          <Form.Item name="externalCarrierName" label={t('externalCarrierName', 'Carrier Name')} rules={[{ required: shippingMode === 'external', message: t('carrierRequired', 'Required') }]}>
            <Input placeholder={t('externalCarrierPlaceholder', 'e.g. Viettel Post, J&T, self-delivery')} />
          </Form.Item>
          <Form.Item name="externalTrackingNumber" label={t('externalTracking', 'Tracking Number')}>
            <Input placeholder={t('externalTrackingPlaceholder', 'Enter tracking number (if available)')} />
          </Form.Item>
        </>
      )}

      <Form.Item name="notes" label={t('notes', 'Notes')}>
        <Input.TextArea rows={2} placeholder={t('notesPlaceholder', 'Special instructions (optional)')} />
      </Form.Item>
    </Form>
  )
}
