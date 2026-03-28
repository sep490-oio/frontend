import { useState } from 'react'
import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, App } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreateItem, useCategories } from '@/features/item/api'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { ItemCondition } from '@/types/enums'
import type { CreateItemRequest } from '@/types'

const CONDITION_OPTIONS = Object.entries(ItemCondition).map(([label, value]) => ({
  label,
  value,
}))

export default function CreateItemPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const [form] = Form.useForm<CreateItemRequest>()

  const createItem = useCreateItem()
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])

  const categoryOptions = (categories ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))

  const onFinish = async (values: CreateItemRequest) => {
    if (capturedPhotos.length === 0) {
      message.warning(t('captureRequiredError', 'Please capture at least 1 photo'))
      return
    }

    try {
      const images = capturedPhotos.map((photo, i) => ({
        blob: photo.blob,
        metadata: photo.metadata,
        isPrimary: i === 0,
        sortOrder: i,
      }))

      await createItem.mutateAsync({
        ...values,
        images: images as any,
      })
      message.success(t('createSuccess', 'Item created successfully'))
      navigate(`${prefix}/items`)
    } catch {
      message.error(t('createError', 'Failed to create item'))
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/items`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>{t('createItem', 'Create Item')}</Typography.Title>

      <Card>
        <Form<CreateItemRequest>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ quantity: 1 }}
        >
          <Form.Item
            name="title"
            label={t('title', 'Title')}
            rules={[{ required: true, message: t('titleRequired', 'Please enter a title') }]}
          >
            <Input maxLength={200} showCount placeholder={t('titlePlaceholder', 'Enter item title')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('description', 'Description')}
          >
            <Input.TextArea
              rows={6}
              maxLength={5000}
              showCount
              placeholder={t('descriptionPlaceholder', 'Describe your item in detail')}
            />
          </Form.Item>

          <Form.Item
            name="condition"
            label={t('condition', 'Condition')}
            rules={[{ required: true, message: t('conditionRequired', 'Please select condition') }]}
          >
            <Select
              options={CONDITION_OPTIONS}
              placeholder={t('conditionPlaceholder', 'Select condition')}
            />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label={t('category', 'Category')}
          >
            <Select
              options={categoryOptions}
              loading={categoriesLoading}
              placeholder={t('categoryPlaceholder', 'Select category')}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label={t('quantity', 'Quantity')}
            rules={[{ required: true, message: t('quantityRequired', 'Please enter quantity') }]}
          >
            <InputNumber min={1} max={9999} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label={t('media', 'Photos')}
            required
            validateStatus={capturedPhotos.length === 0 ? 'warning' : undefined}
            help={capturedPhotos.length === 0 ? t('mediaHint', 'Capture at least 1 photo using your camera') : undefined}
          >
            <MultiCaptureUploader
              maxPhotos={10}
              step="item_photo"
              facingMode="environment"
              onPhotosChange={setCapturedPhotos}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createItem.isPending}>
                {tc('action.create', 'Create')}
              </Button>
              <Button onClick={() => navigate(`${prefix}/items`)}>
                {tc('action.cancel', 'Cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
