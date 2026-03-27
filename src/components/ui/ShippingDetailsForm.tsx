import { Form, Input, InputNumber } from 'antd'
import { useTranslation } from 'react-i18next'

export interface ShippingDetailsFormValues {
  senderName: string
  senderPhone: string
  senderAddress: string
  senderWard: string
  senderDistrict: string
  senderProvince: string
  weightGrams: number
  insuranceValue: number
}

interface ShippingDetailsFormProps {
  form: ReturnType<typeof Form.useForm<ShippingDetailsFormValues>>[0]
}

export default function ShippingDetailsForm({ form }: ShippingDetailsFormProps) {
  const { t } = useTranslation('warehouse')

  return (
    <Form form={form} layout="vertical" requiredMark>
      <Form.Item name="senderName" label={t('senderName', 'Tên người gửi')} rules={[{ required: true, message: t('senderNameRequired', 'Vui lòng nhập tên người gửi') }]}>
        <Input placeholder={t('senderNamePlaceholder', 'Nhập tên người gửi')} />
      </Form.Item>
      <Form.Item name="senderPhone" label={t('senderPhone', 'Số điện thoại')} rules={[{ required: true, message: t('senderPhoneRequired', 'Vui lòng nhập số điện thoại') }]}>
        <Input placeholder={t('senderPhonePlaceholder', 'Nhập số điện thoại')} />
      </Form.Item>
      <Form.Item name="senderAddress" label={t('senderAddress', 'Địa chỉ')} rules={[{ required: true, message: t('senderAddressRequired', 'Vui lòng nhập địa chỉ') }]}>
        <Input placeholder={t('senderAddressPlaceholder', 'Nhập địa chỉ')} />
      </Form.Item>
      <Form.Item name="senderWard" label={t('ward', 'Phường/Xã')} rules={[{ required: true, message: t('wardRequired', 'Vui lòng nhập phường/xã') }]}>
        <Input placeholder={t('wardPlaceholder', 'Nhập phường/xã')} />
      </Form.Item>
      <Form.Item name="senderDistrict" label={t('district', 'Quận/Huyện')} rules={[{ required: true, message: t('districtRequired', 'Vui lòng nhập quận/huyện') }]}>
        <Input placeholder={t('districtPlaceholder', 'Nhập quận/huyện')} />
      </Form.Item>
      <Form.Item name="senderProvince" label={t('province', 'Tỉnh/Thành phố')} rules={[{ required: true, message: t('provinceRequired', 'Vui lòng nhập tỉnh/thành phố') }]}>
        <Input placeholder={t('provincePlaceholder', 'Nhập tỉnh/thành phố')} />
      </Form.Item>
      <Form.Item name="weightGrams" label={t('weightGrams', 'Khối lượng (gram)')} rules={[{ required: true, message: t('weightGramsRequired', 'Vui lòng nhập khối lượng') }]}>
        <InputNumber min={1} style={{ width: '100%' }} placeholder={t('weightGramsPlaceholder', 'Nhập khối lượng')} />
      </Form.Item>
      <Form.Item name="insuranceValue" label={t('insuranceValueLabel', 'Giá trị bảo hiểm')} rules={[{ required: true, message: t('insuranceValueRequired', 'Vui lòng nhập giá trị bảo hiểm') }]}>
        <InputNumber min={0} style={{ width: '100%' }} placeholder={t('insuranceValuePlaceholder', 'Nhập giá trị bảo hiểm (VND)')} />
      </Form.Item>
    </Form>
  )
}
