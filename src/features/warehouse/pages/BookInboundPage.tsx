import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, App, Divider, Alert } from 'antd'
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

const GHN_HANDLING_OPTIONS = [
  { label: 'Cho thử hàng', value: 'CHOTHUHANG' },
  { label: 'Cho xem hàng không thử', value: 'CHOXEMHANGKHONGTHU' },
  { label: 'Không cho xem hàng', value: 'KHONGCHOXEMHANG' },
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

  const allItems = itemsData?.items ?? []
  const itemOptions = allItems.map((item) => ({
    label: item.title,
    value: item.id,
  }))

  const shipmentMode = Form.useWatch('shipmentMode', form)
  const isExternal = shipmentMode === 'external_carrier'

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
    weight: number
    length: number
    width: number
    height: number
    insuranceValue?: number
    notes?: string
    ghnHandlingNote?: string
  }) => {
    const isExt = values.shipmentMode === 'external_carrier'

    const items = values.itemIds.map((itemId) => {
      const item = allItems.find((i) => i.id === itemId)
      return {
        itemId,
        itemPrice: (item as any)?.price ?? 0,
        weightGrams: values.weight,
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
        lengthCm: values.length,
        widthCm: values.width,
        heightCm: values.height,
        notes: values.notes,
        ghnHandlingNote: isExt ? undefined : values.ghnHandlingNote,
      })
      message.success(t('bookSuccess', 'Inbound shipment booked successfully'))
      const firstResult = results[0]
      navigate(`${prefix}/warehouse/inbound/${firstResult.id}`)
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
          initialValues={{ weight: 1, length: 10, width: 10, height: 10, shipmentMode: 'platform_managed' }}
        >
          {/* Item Selection — multi-select */}
          <Form.Item
            name="itemIds"
            label={t('selectItems', 'Select Items')}
            rules={[{ required: true, message: t('itemRequired', 'Please select at least one item') }]}
          >
            <Select
              mode="multiple"
              options={itemOptions}
              loading={itemsLoading}
              showSearch
              optionFilterProp="label"
              placeholder={t('selectItemsPlaceholder', 'Search and select items to ship')}
            />
          </Form.Item>

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
            name="insuranceValue"
            label={t('insuranceValue', 'Insurance Value (VND)')}
            help={t('insuranceHelp', 'Leave empty to use total item price')}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>

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
