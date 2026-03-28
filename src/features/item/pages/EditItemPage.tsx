import { useEffect, useState, useMemo } from 'react'
import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, Spin, App } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useItemById, useUpdateItem, useCategories } from '@/features/item/api'
import { MediaUploader } from '@/components/ui/MediaUploader'
import { ItemCondition } from '@/types/enums'
import type { CreateItemRequest } from '@/types'
import type { UploadedFile } from '@/hooks/useMediaUpload'

const CONDITION_OPTIONS = Object.entries(ItemCondition).map(([label, value]) => ({
  label,
  value,
}))

export default function EditItemPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm<CreateItemRequest>()

  const { data: item, isLoading } = useItemById(id ?? '')
  const updateItem = useUpdateItem()
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const [uploadedMedia, setUploadedMedia] = useState<UploadedFile[]>([])

  // Convert existing item images to UploadedFile format for MediaUploader
  const existingFiles: UploadedFile[] = useMemo(
    () => (item?.images ?? []).map((img) => ({
      mediaUploadId: img.id,
      secureUrl: img.url,
      publicId: img.id,
      resourceType: img.type ?? 'image',
      fileName: '',
    })),
    [item?.images],
  )

  const categoryOptions = (categories ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))

  useEffect(() => {
    if (item) {
      form.setFieldsValue({
        title: item.title,
        description: item.description ?? '',
        condition: item.condition,
        categoryId: item.categoryId,
        quantity: item.quantity,
      })
    }
  }, [item, form])

  const onFinish = async (values: CreateItemRequest) => {
    if (!id) return
    // Only include newly uploaded media (not existing ones)
    const newImages = uploadedMedia
      .filter((f) => !existingFiles.some((e) => e.mediaUploadId === f.mediaUploadId))
      .map((file, i) => ({
        mediaUploadId: file.mediaUploadId,
        isPrimary: i === 0 && existingFiles.length === 0,
        sortOrder: existingFiles.length + i,
      }))
    try {
      await updateItem.mutateAsync({ id, ...values, images: newImages.length > 0 ? newImages : undefined })
      message.success(t('updateSuccess', 'Item updated successfully'))
      navigate(`${prefix}/items`)
    } catch {
      message.error(t('updateError', 'Failed to update item'))
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/items`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>{t('editItem', 'Edit Item')}</Typography.Title>

      <Card>
        <Form<CreateItemRequest>
          form={form}
          layout="vertical"
          onFinish={onFinish}
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

          {/* Media upload */}
          <Form.Item label={t('media', 'Images')}>
            <MediaUploader
              context="item_image"
              maxFiles={10}
              accept="image/jpeg,image/png,image/webp"
              onUploadComplete={setUploadedMedia}
              initialFiles={existingFiles}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={updateItem.isPending}>
                {tc('action.save', 'Save')}
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
