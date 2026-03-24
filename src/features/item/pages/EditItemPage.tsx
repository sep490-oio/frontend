import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, Spin, App } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useItemById, useUpdateItem, useCategories } from '@/features/item/api'
import { ItemCondition } from '@/types/enums'
import type { CreateItemRequest } from '@/types'
import { useEffect } from 'react'

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
  const { id } = useParams<{ id: string }>()
  const [form] = Form.useForm<CreateItemRequest>()

  const { data: item, isLoading } = useItemById(id ?? '')
  const updateItem = useUpdateItem()
  const { data: categories, isLoading: categoriesLoading } = useCategories()

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
    try {
      await updateItem.mutateAsync({ id, ...values })
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
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
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

          {/* Media upload placeholder */}
          <Form.Item label={t('media', 'Media')}>
            <Card
              style={{ borderStyle: 'dashed', textAlign: 'center', padding: 24 }}
            >
              <Typography.Text type="secondary">
                {t('mediaUploadPlaceholder', 'Media upload will be available here')}
              </Typography.Text>
            </Card>
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
