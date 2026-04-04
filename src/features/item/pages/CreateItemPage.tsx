import { useState } from 'react'
import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, App, Switch, Collapse } from 'antd'
import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreateItem, useSubmitItem, useCategories } from '@/features/item/api'
import { useCreateAuction } from '@/features/auction/api'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { ItemCondition, AuctionType } from '@/types/enums'
import type { CreateItemRequest } from '@/types'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

const CONDITION_OPTIONS = Object.entries(ItemCondition).map(([label, value]) => ({
  label,
  value,
}))

const AUCTION_TYPE_OPTIONS = Object.entries(AuctionType).map(([label, value]) => ({
  label,
  value,
}))

interface AuctionFields {
  auctionType: string
  startingPrice: number
  bidIncrement: number
  reservePrice?: number
  buyNowPrice?: number
  extensionMinutes?: number
  currency?: string
}

export default function CreateItemPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const { t: ta } = useTranslation('auction')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()
  const [form] = Form.useForm<CreateItemRequest & AuctionFields>()

  const createItem = useCreateItem()
  const submitItem = useSubmitItem()
  const createAuction = useCreateAuction()
  const mediaUpload = useMediaUpload('item_image')
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Optional auction toggle
  const [includeAuction, setIncludeAuction] = useState(false)
  // Platform verification toggle
  const [verifyByPlatform, setVerifyByPlatform] = useState(false)

  const categoryOptions = (categories ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))

  /**
   * Submit flow:
   * 1. "Save Draft" → create item only (draft status)
   * 2. "Create & Submit" without auction → create item + submit item (with verify flag)
   * 3. "Create & Submit" with auction → create item + submit item + create auction from item
   */
  const handleSubmit = async (mode: 'draft' | 'submit') => {
    try {
      const values = await form.validateFields()

      if (capturedPhotos.length === 0) {
        message.warning(t('captureRequiredError', 'Please capture at least 1 photo'))
        return
      }

      // Validate auction fields if included
      if (mode === 'submit' && includeAuction) {
        if (!values.startingPrice || values.startingPrice <= 0) {
          message.warning(ta('startingPriceRequired', 'Please enter starting price'))
          return
        }
        if (!values.bidIncrement || values.bidIncrement <= 0) {
          message.warning(ta('bidIncrementRequired', 'Please enter bid increment'))
          return
        }
      }

      setSubmitting(true)

      // Step 1: Upload photos
      const files = capturedPhotos.map((photo, i) =>
        new File([photo.blob], `item-photo-${i + 1}.jpg`, { type: 'image/jpeg' })
      )
      const uploadResults = await mediaUpload.uploadMultiple(files)
      const images = uploadResults.map((result, i) => ({
        mediaUploadId: result.mediaUploadId,
        isPrimary: i === 0,
        sortOrder: i,
      }))

      // Step 2: Create based on mode and auction toggle
      const mediaPayload = images.map((img) => ({
        mediaUploadId: img.mediaUploadId,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      }))

      if (includeAuction && values.startingPrice) {
        // Use POST /auctions — creates both item + auction in one call
        await createAuction.mutateAsync({
          title: values.title,
          condition: values.condition,
          categoryId: values.categoryId,
          description: values.description,
          quantity: values.quantity,
          media: mediaPayload,
          startingPrice: values.startingPrice,
          bidIncrement: values.bidIncrement ?? 10000,
          reservePrice: values.reservePrice,
          buyNowPrice: values.buyNowPrice,
          extensionMinutes: values.extensionMinutes,
          currency: values.currency,
          auctionType: values.auctionType,
        })

        if (mode === 'draft') {
          message.success(t('draftSaved', 'Item and auction saved as draft'))
        } else {
          message.success(t('createWithAuctionSuccess', 'Item and auction created successfully'))
        }
      } else {
        // Item only — POST /items
        const item = await createItem.mutateAsync({
          title: values.title,
          description: values.description,
          condition: values.condition,
          categoryId: values.categoryId,
          quantity: values.quantity,
          images,
        })

        if (mode === 'submit') {
          // Submit item with verify flag
          await submitItem.mutateAsync({ id: item.id, verifyByPlatform })
          message.success(t('createAndSubmitSuccess', 'Item created and submitted for review'))
        } else {
          message.success(t('draftSaved', 'Item saved as draft'))
        }
      }

      navigate(`${prefix}/items`)
    } catch (err: any) {
      if (err?.errorFields) return // form validation error, antd shows inline
      message.error(t('createError', 'Failed to create item'))
    } finally {
      setSubmitting(false)
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

      <Form<CreateItemRequest & AuctionFields>
        form={form}
        layout="vertical"
        initialValues={{ quantity: 1, auctionType: AuctionType.Regular, bidIncrement: 10000, extensionMinutes: 5 }}
      >
        {/* Item Details */}
        <Card title={t('itemDetails', 'Item Details')} style={{ marginBottom: 24 }}>
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
            <RichTextEditor
              placeholder={t('descriptionPlaceholder', 'Describe your item in detail')}
              maxLength={5000}
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
        </Card>

        {/* Platform Verification */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography.Text strong>
                {t('verifyByPlatform', 'Platform Verification')}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('verifyByPlatformDesc', 'Ship item to our warehouse for professional inspection and authentication.')}
              </Typography.Text>
            </div>
            <Switch checked={verifyByPlatform} onChange={setVerifyByPlatform} />
          </div>
        </Card>

        {/* Optional Auction Section */}
        <Collapse
          style={{ marginBottom: 24 }}
          activeKey={includeAuction ? ['auction'] : []}
          onChange={(keys) => setIncludeAuction(keys.includes('auction'))}
          items={[{
            key: 'auction',
            label: (
              <Space>
                <ThunderboltOutlined style={{ color: 'var(--color-accent)' }} />
                <Typography.Text strong>
                  {t('auctionSection', 'Auction Settings')}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  ({t('auctionSectionOptional', 'Optional — set up auction details now')})
                </Typography.Text>
              </Space>
            ),
            children: (
              <>
                <Form.Item
                  name="auctionType"
                  label={ta('auctionType', 'Auction Type')}
                >
                  <Select options={AUCTION_TYPE_OPTIONS} />
                </Form.Item>

                <Form.Item
                  name="startingPrice"
                  label={ta('startingPrice', 'Starting Price')}
                  rules={includeAuction ? [{ required: true, message: ta('startingPriceRequired', 'Please enter starting price') }] : []}
                >
                  <InputNumber
                    min={0}
                    step={1000}
                    style={{ width: '100%' }}
                    addonAfter="VND"
                    placeholder="100,000"
                  />
                </Form.Item>

                <Form.Item
                  name="bidIncrement"
                  label={ta('bidIncrement', 'Bid Increment')}
                  rules={includeAuction ? [{ required: true, message: ta('bidIncrementRequired', 'Please enter bid increment') }] : []}
                >
                  <InputNumber
                    min={1000}
                    step={1000}
                    style={{ width: '100%' }}
                    addonAfter="VND"
                    placeholder="10,000"
                  />
                </Form.Item>

                <Form.Item
                  name="reservePrice"
                  label={ta('reservePrice', 'Reserve Price')}
                >
                  <InputNumber
                    min={0}
                    step={1000}
                    style={{ width: '100%' }}
                    addonAfter="VND"
                    placeholder={ta('reservePricePlaceholder', 'Optional - minimum price to sell')}
                  />
                </Form.Item>

                <Form.Item
                  name="buyNowPrice"
                  label={ta('buyNowPrice', 'Buy Now Price')}
                >
                  <InputNumber
                    min={0}
                    step={1000}
                    style={{ width: '100%' }}
                    addonAfter="VND"
                    placeholder={ta('buyNowPricePlaceholder', 'Optional - instant purchase price')}
                  />
                </Form.Item>

                <Form.Item
                  name="extensionMinutes"
                  label={ta('autoExtend', 'Auto-Extend (minutes)')}
                >
                  <InputNumber min={1} max={60} style={{ width: '100%' }} />
                </Form.Item>
              </>
            ),
          }]}
        />

        {/* Action Buttons */}
        <Card>
          <Space wrap>
            <Button
              type="primary"
              loading={submitting}
              onClick={() => handleSubmit('submit')}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {includeAuction
                ? t('createAndSubmitWithAuction', 'Create & Submit with Auction')
                : t('createAndSubmit', 'Create & Submit')}
            </Button>
            <Button
              loading={submitting}
              onClick={() => handleSubmit('draft')}
            >
              {t('saveDraft', 'Save as Draft')}
            </Button>
            <Button onClick={() => navigate(`${prefix}/items`)}>
              {tc('action.cancel', 'Cancel')}
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  )
}
