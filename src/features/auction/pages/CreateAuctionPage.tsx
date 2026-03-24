import {
  Typography,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  Card,
  Space,
  App,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useCreateAuction } from '@/features/auction/api'
import { useCategories } from '@/features/item/api'
import { AuctionType, ItemCondition } from '@/types/enums'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import type { CreateAuctionRequest } from '@/features/auction/api'

interface FormValues {
  title: string
  condition: string
  categoryId?: string
  description?: string
  quantity: number
  auctionType: string
  startingPrice: number
  bidIncrement: number
  reservePrice?: number
  buyNowPrice?: number
  extensionMinutes: number
  currency: string
}

const AUCTION_TYPE_OPTIONS = Object.entries(AuctionType).map(([label, value]) => ({
  label,
  value,
}))

const CONDITION_OPTIONS = Object.entries(ItemCondition).map(([label, value]) => ({
  label,
  value,
}))

export default function CreateAuctionPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()

  const [form] = Form.useForm<FormValues>()
  const createAuction = useCreateAuction()
  const { data: categories } = useCategories()

  const categoryOptions = (categories ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))

  const onFinish = async (values: FormValues) => {
    const payload: CreateAuctionRequest = {
      title: values.title,
      condition: values.condition,
      categoryId: values.categoryId,
      description: values.description,
      quantity: values.quantity,
      auctionType: values.auctionType,
      startingPrice: values.startingPrice,
      bidIncrement: values.bidIncrement,
      reservePrice: values.reservePrice,
      buyNowPrice: values.buyNowPrice,
      extensionMinutes: values.extensionMinutes,
      currency: values.currency,
    }

    try {
      await createAuction.mutateAsync(payload)
      message.success(t('createSuccess', 'Auction created successfully'))
      navigate(`${prefix}/auctions`)
    } catch {
      message.error(t('createError', 'Failed to create auction'))
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/auctions`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title level={2}>{t('createAuction', 'Create Auction')}</Typography.Title>

      <Card>
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            auctionType: AuctionType.Regular,
            bidIncrement: 10000,
            extensionMinutes: 5,
            quantity: 1,
            currency: DEFAULT_CURRENCY,
          }}
        >
          {/* ── Item Fields ── */}
          <Typography.Title level={4}>{t('itemInfo', 'Item Information')}</Typography.Title>

          <Form.Item
            name="title"
            label={t('itemTitle', 'Title')}
            rules={[{ required: true, message: t('titleRequired', 'Please enter item title') }]}
          >
            <Input placeholder={t('titlePlaceholder', 'Enter item title')} />
          </Form.Item>

          <Form.Item
            name="condition"
            label={t('condition', 'Condition')}
            rules={[{ required: true, message: t('conditionRequired', 'Please select condition') }]}
          >
            <Select options={CONDITION_OPTIONS} placeholder={t('selectCondition', 'Select condition')} />
          </Form.Item>

          <Form.Item name="categoryId" label={t('category', 'Category')}>
            <Select
              options={categoryOptions}
              placeholder={t('selectCategory', 'Select category')}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item name="description" label={t('description', 'Description')}>
            <Input.TextArea rows={4} placeholder={t('descriptionPlaceholder', 'Describe your item')} />
          </Form.Item>

          <Form.Item name="quantity" label={t('quantity', 'Quantity')}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>

          {/* ── Auction Fields ── */}
          <Typography.Title level={4} style={{ marginTop: 24 }}>
            {t('auctionSettings', 'Auction Settings')}
          </Typography.Title>

          <Form.Item
            name="auctionType"
            label={t('auctionType', 'Auction Type')}
            rules={[{ required: true, message: t('typeRequired', 'Please select auction type') }]}
          >
            <Select options={AUCTION_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="startingPrice"
            label={t('startingPrice', 'Starting Price')}
            rules={[{ required: true, message: t('startingPriceRequired', 'Please enter starting price') }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              addonAfter={DEFAULT_CURRENCY}
              placeholder="0"
            />
          </Form.Item>

          <Form.Item
            name="bidIncrement"
            label={t('bidIncrement', 'Bid Increment')}
            rules={[{ required: true, message: t('bidIncrementRequired', 'Please enter bid increment') }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              step={1000}
              addonAfter={DEFAULT_CURRENCY}
            />
          </Form.Item>

          <Form.Item name="reservePrice" label={t('reservePrice', 'Reserve Price')}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              addonAfter={DEFAULT_CURRENCY}
              placeholder={t('reservePricePlaceholder', 'Optional - minimum price to sell')}
            />
          </Form.Item>

          <Form.Item name="buyNowPrice" label={t('buyNowPrice', 'Buy Now Price')}>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              addonAfter={DEFAULT_CURRENCY}
              placeholder={t('buyNowPricePlaceholder', 'Optional - instant purchase price')}
            />
          </Form.Item>

          <Form.Item name="extensionMinutes" label={t('extensionMinutes', 'Extension Minutes')}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Form.Item name="currency" label={t('currency', 'Currency')}>
            <Input />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createAuction.isPending}>
                {tc('action.create', 'Create')}
              </Button>
              <Button onClick={() => navigate(`${prefix}/auctions`)}>
                {tc('action.cancel', 'Cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
