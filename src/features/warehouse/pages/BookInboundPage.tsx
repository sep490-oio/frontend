import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, App, Divider } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useBookInbound } from '@/features/warehouse/api'
import { useMyItems } from '@/features/item/api'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const SHIPMENT_MODE_OPTIONS = [
  { label: 'Platform Managed (GHN)', value: 'platform_managed' },
  { label: 'External Carrier', value: 'external_carrier' },
]

const PROVIDER_OPTIONS = [
  { label: 'GHN (Giao Hang Nhanh)', value: 'ghn' },
  { label: 'External Carrier', value: 'external' },
]

export default function BookInboundPage() {
  const { t } = useTranslation('warehouse')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const [form] = Form.useForm()

  const bookInbound = useBookInbound()
  const { data: itemsData, isLoading: itemsLoading } = useMyItems({ pageNumber: 1, pageSize: 100 })

  const itemOptions = (itemsData?.items ?? []).map((item) => ({
    label: item.title,
    value: item.id,
  }))

  const onFinish = async (values: {
    itemId: string
    shipmentMode: string
    externalCarrierName?: string
    senderName: string
    senderPhone: string
    senderAddress: string
    senderWard?: string
    senderDistrict?: string
    senderProvince?: string
    weight: number
    length: number
    width: number
    height: number
    insuranceValue?: number
    notes?: string
  }) => {
    const selectedItem = (itemsData?.items ?? []).find((i) => i.id === values.itemId)
    const isExternal = values.shipmentMode === 'external_carrier'
    try {
      const result = await bookInbound.mutateAsync({
        itemId: values.itemId,
        itemName: selectedItem?.title ?? 'Item',
        itemPrice: (selectedItem as any)?.price ?? 0,
        insuranceValue: values.insuranceValue ?? (selectedItem as any)?.price ?? 0,
        providerCode: isExternal ? 'external' : 'ghn',
        shipmentMode: values.shipmentMode,
        externalCarrierName: isExternal ? values.externalCarrierName : undefined,
        senderName: values.senderName,
        senderPhone: values.senderPhone,
        senderAddress: values.senderAddress,
        senderWard: values.senderWard,
        senderDistrict: values.senderDistrict,
        senderProvince: values.senderProvince,
        weightGrams: values.weight,
        lengthCm: values.length,
        widthCm: values.width,
        heightCm: values.height,
        notes: values.notes,
      })
      message.success(t('bookSuccess', 'Inbound shipment booked successfully'))
      navigate(`${prefix}/warehouse/inbound/${result.id}`)
    } catch {
      message.error(t('bookError', 'Failed to book inbound shipment'))
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/warehouse/inbound`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>{t('bookInbound', 'Book Inbound Shipment')}</Typography.Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ weight: 1, length: 10, width: 10, height: 10 }}
        >
          {/* Item Selection */}
          <Form.Item
            name="itemId"
            label={t('selectItem', 'Select Item')}
            rules={[{ required: true, message: t('itemRequired', 'Please select an item') }]}
          >
            <Select
              options={itemOptions}
              loading={itemsLoading}
              showSearch
              optionFilterProp="label"
              placeholder={t('selectItemPlaceholder', 'Search and select an item')}
            />
          </Form.Item>

          {/* Shipping Settings */}
          <Form.Item
            name="providerCode"
            label={t('provider', 'Shipping Provider')}
            rules={[{ required: true, message: t('providerRequired', 'Please select a provider') }]}
          >
            <Select
              options={PROVIDER_OPTIONS}
              placeholder={t('selectProvider', 'Select shipping provider')}
            />
          </Form.Item>

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

          <Divider>{t('senderInfo', 'Sender Information')}</Divider>

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

          <Divider>{t('dimensions', 'Package Dimensions')}</Divider>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: isMobile ? '0 12px' : '0 16px',
          }}>
            <Form.Item
              name="weight"
              label={t('weight', 'Weight (g)')}
              rules={[{ required: true, message: t('weightRequired', 'Required') }]}
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
