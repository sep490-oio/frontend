import { useEffect } from 'react'
import { Form, Select, Row, Col, Input } from 'antd'
import type { FormInstance } from 'antd'
import { useProvinces, useDistricts, useWards } from '@/features/address/api'
import { useTranslation } from 'react-i18next'

interface GhnAddressSelectProps {
  form: FormInstance
  provinceName?: string | string[]
  districtName?: string | string[]
  wardName?: string | string[]
  metadataName?: string | string[]
  layout?: 'vertical' | 'horizontal'
}

export default function GhnAddressSelect({
  form,
  provinceName = 'senderProvince',
  districtName = 'senderDistrict',
  wardName = 'senderWard',
  metadataName = 'senderMetadata',
}: GhnAddressSelectProps) {
  const { t } = useTranslation('warehouse')

  // Watch for currently selected province and district names
  const currentProvince = Form.useWatch(provinceName, form)
  const currentDistrict = Form.useWatch(districtName, form)
  const currentWard = Form.useWatch(wardName, form)

  const { data: provinces, isLoading: loadingP } = useProvinces()

  // We find the internal IDs based on the currently selected string names
  const matchedProvince = provinces?.find((p) => p.provinceName === currentProvince)
  const provinceId = matchedProvince?.provinceId

  const { data: districts, isLoading: loadingD } = useDistricts(provinceId)
  const matchedDistrict = districts?.find((d) => d.districtName === currentDistrict)
  const districtId = matchedDistrict?.districtId

  const { data: wards, isLoading: loadingW } = useWards(districtId)

  // Clear downstream fields when a higher level field changes
  const handleProvinceChange = () => {
    form.setFieldValue(districtName, undefined)
    form.setFieldValue(wardName, undefined)
    form.setFieldValue(metadataName, undefined)
  }

  const handleDistrictChange = () => {
    form.setFieldValue(wardName, undefined)
    form.setFieldValue(metadataName, undefined)
  }

  const handleWardChange = (val: string) => {
    const ward = wards?.find((w) => w.wardName === val)
    if (ward && districtId) {
      form.setFieldValue(metadataName, {
        Id: districtId,
        Code: ward.wardCode,
      })
    } else {
      form.setFieldValue(metadataName, undefined)
    }
  }

  // Effect to re-evaluate metadata if the form was pre-filled externally
  useEffect(() => {
    if (districtId && currentWard && wards) {
      const ward = wards.find((w) => w.wardName === currentWard)
      const existingMetadata = form.getFieldValue(metadataName)
      if (ward && (!existingMetadata || existingMetadata.Code !== ward.wardCode)) {
        form.setFieldValue(metadataName, {
          Id: districtId,
          Code: ward.wardCode,
        })
      }
    }
  }, [districtId, currentWard, wards, form, metadataName])

  // Optional: auto-convert "Hồ Chí Minh" -> exact matched if exact matching fails due to slight prefix issues?
  // We'll trust exact match for now as long as we use this picker everywhere.

  return (
    <Row gutter={12}>
      <Col span={8}>
        <Form.Item
          name={provinceName}
          label={t('province', 'Province')}
          rules={[{ required: true, message: t('provinceRequired', 'Required') }]}
        >
          <Select
            showSearch
            loading={loadingP}
            options={provinces?.map((p) => ({ label: p.provinceName, value: p.provinceName }))}
            onChange={handleProvinceChange}
            placeholder={t('provincePlaceholder', 'Select province')}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          name={districtName}
          label={t('district', 'District')}
          rules={[{ required: true, message: t('districtRequired', 'Required') }]}
        >
          <Select
            showSearch
            loading={loadingD}
            disabled={!provinceId}
            options={districts?.map((d) => ({ label: d.districtName, value: d.districtName }))}
            onChange={handleDistrictChange}
            placeholder={t('districtPlaceholder', 'Select district')}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item
          name={wardName}
          label={t('ward', 'Ward')}
          rules={[{ required: true, message: t('wardRequired', 'Required') }]}
        >
          <Select
            showSearch
            loading={loadingW}
            disabled={!districtId}
            options={wards?.map((w) => ({ label: w.wardName, value: w.wardName }))}
            onChange={handleWardChange}
            placeholder={t('wardPlaceholder', 'Select ward')}
          />
        </Form.Item>
      </Col>
      <Form.Item name={metadataName} hidden>
        <Input />
      </Form.Item>
    </Row>
  )
}
