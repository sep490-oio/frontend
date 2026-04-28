import { useState } from 'react'
import { Typography, Form, Input, Select, InputNumber, Button, Card, Space, App, Switch, Row, Col, Flex } from 'antd'
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
import { AuctionType } from '@/types/enums'
import type { CreateItemRequest } from '@/types'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useConditionOptions, useAuctionTypeOptions } from '@/utils/enumLabels'

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
  const CONDITION_OPTIONS = useConditionOptions()
  const AUCTION_TYPE_OPTIONS = useAuctionTypeOptions()
  const mediaUpload = useMediaUpload('item_image')
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Optional auction toggle
  const [includeAuction, setIncludeAuction] = useState(false)
  // Platform verification toggle
  const [verifyByPlatform, setVerifyByPlatform] = useState(false)

  const categoryOptions = (categories ?? []).map((cat) => ({
    label: tc(`categories.items.${cat.name}`, cat.name),
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
        const auctionResult = await createAuction.mutateAsync({
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

        if (mode === 'submit') {
          await submitItem.mutateAsync({ id: auctionResult.itemId, verifyByPlatform })
          message.success(t('createWithAuctionSuccess', 'Item and auction created and submitted'))
        } else {
          message.success(t('draftSaved', 'Item and auction saved as draft'))
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
      if (err?.errorFields) return // form validation error
      message.error(err?.response?.data?.detail ?? t('createError', 'Failed to create item'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: isMobile ? '16px 12px 100px' : '32px 24px 100px', position: 'relative' }}>
      <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/items`)} />
        <Typography.Title level={2} style={{ margin: 0 }}>{t('createItem', 'Create Item')}</Typography.Title>
      </Flex>

      <Form<CreateItemRequest & AuctionFields>
        form={form}
        layout="vertical"
        initialValues={{ quantity: 1, auctionType: AuctionType.Regular, bidIncrement: 10000, extensionMinutes: 5 }}
      >
        {/* Basic Info */}
        <Card
          title={<span style={{ fontSize: 16 }}>{t('basicInfo', 'Basic Info')}</span>}
          style={{ marginBottom: 24, borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          styles={{ header: { borderBottom: '1px solid var(--color-border)' } }}
        >
          <Form.Item
            name="title"
            label={t('title', 'Title')}
            rules={[{ required: true, message: t('titleRequired', 'Please enter a title') }]}
          >
            <Input size="large" maxLength={200} showCount placeholder={t('titlePlaceholder', 'Enter item title')} />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="categoryId"
                label={t('category', 'Category')}
              >
                <Select
                  size="large"
                  options={categoryOptions}
                  loading={categoriesLoading}
                  placeholder={t('categoryPlaceholder', 'Select category')}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="condition"
                label={t('condition', 'Condition')}
                rules={[{ required: true, message: t('conditionRequired', 'Please select condition') }]}
              >
                <Select
                  size="large"
                  options={CONDITION_OPTIONS}
                  placeholder={t('conditionPlaceholder', 'Select condition')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="quantity"
                label={t('quantity', 'Quantity')}
                rules={[{ required: true, message: t('quantityRequired', 'Please enter quantity') }]}
              >
                <InputNumber size="large" min={1} max={9999} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Description */}
        <Card
          title={<span style={{ fontSize: 16 }}>{t('description', 'Description')}</span>}
          style={{ marginBottom: 24, borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          styles={{ header: { borderBottom: '1px solid var(--color-border)' } }}
        >
          <Form.Item
            name="description"
            style={{ margin: 0 }}
          >
            <RichTextEditor
              placeholder={t('descriptionPlaceholder', 'Describe your item in detail')}
              maxLength={5000}
            />
          </Form.Item>
        </Card>

        {/* Photos */}
        <Card
          title={<span style={{ fontSize: 16 }}>{t('media', 'Photos')}</span>}
          style={{ marginBottom: 24, borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          styles={{ header: { borderBottom: '1px solid var(--color-border)' } }}
        >
          <Form.Item
            required
            style={{ margin: 0 }}
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
        <Card style={{ marginBottom: 24, borderRadius: 12, border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Flex justify="space-between" align="center" gap={16}>
            <div>
              <Typography.Text strong style={{ fontSize: 16 }}>
                {t('verifyByPlatform', 'Platform Verification')}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {t('verifyByPlatformDesc', 'Ship item to our warehouse for professional inspection and authentication.')}
              </Typography.Text>
            </div>
            <Switch checked={verifyByPlatform} onChange={setVerifyByPlatform} />
          </Flex>
        </Card>

        {/* Optional Auction Section */}
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 12,
            border: includeAuction ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
            boxShadow: includeAuction ? '0 4px 12px rgba(196, 146, 61, 0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.3s'
          }}
          styles={{ body: { padding: includeAuction ? '20px 24px' : '20px 24px' } }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: includeAuction ? 20 : 0 }}>
            <Space size={16}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: 'rgba(196, 146, 61, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ThunderboltOutlined style={{ color: 'var(--color-accent)', fontSize: 20 }} />
              </div>
              <div>
                <Typography.Text strong style={{ fontSize: 16, display: 'block', lineHeight: 1.2 }}>
                  {t('auctionSection', 'Auction Settings')}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {t('auctionSectionOptional', 'Optional — set up auction details now')}
                </Typography.Text>
              </div>
            </Space>
            <Switch checked={includeAuction} onChange={setIncludeAuction} />
          </Flex>

          {includeAuction && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 20 }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="auctionType"
                    label={ta('auctionType', 'Auction Type')}
                  >
                    <Select size="large" options={AUCTION_TYPE_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="extensionMinutes"
                    label={ta('autoExtend', 'Auto-Extend (minutes)')}
                  >
                    <InputNumber size="large" min={1} max={60} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="startingPrice"
                    label={ta('startingPrice', 'Starting Price')}
                    rules={[{ required: true, message: ta('startingPriceRequired', 'Please enter starting price') }]}
                  >
                    <InputNumber
                      size="large"
                      min={0}
                      step={1000}
                      style={{ width: '100%' }}
                      addonAfter="VND"
                      placeholder="100,000"
                      formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                      parser={(v) => (v ?? '').replace(/\$\s?|(,*)/g, '') as any}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="bidIncrement"
                    label={ta('bidIncrement', 'Bid Increment')}
                    rules={[{ required: true, message: ta('bidIncrementRequired', 'Please enter bid increment') }]}
                  >
                    <InputNumber
                      size="large"
                      min={1000}
                      step={1000}
                      style={{ width: '100%' }}
                      addonAfter="VND"
                      placeholder="10,000"
                      formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                      parser={(v) => (v ?? '').replace(/\$\s?|(,*)/g, '') as any}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="reservePrice"
                    label={ta('reservePrice', 'Reserve Price')}
                    help={ta('reservePriceHelp', 'Auction only succeeds if this price is met.')}
                  >
                    <InputNumber
                      size="large"
                      min={0}
                      step={1000}
                      style={{ width: '100%' }}
                      addonAfter="VND"
                      placeholder={ta('reservePricePlaceholder', 'Optional - minimum price to sell')}
                      formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                      parser={(v) => (v ?? '').replace(/\$\s?|(,*)/g, '') as any}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="buyNowPrice"
                    label={ta('buyNowPrice', 'Buy Now Price')}
                    help={ta('buyNowPriceHelp', 'Allows buyers to purchase instantly and end the auction.')}
                  >
                    <InputNumber
                      size="large"
                      min={0}
                      step={1000}
                      style={{ width: '100%' }}
                      addonAfter="VND"
                      placeholder={ta('buyNowPricePlaceholder', 'Optional - instant purchase price')}
                      formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                      parser={(v) => (v ?? '').replace(/\$\s?|(,*)/g, '') as any}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}
        </Card>

        {/* Sticky Action Footer */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: 'var(--color-bg-primary)',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
          borderTop: '1px solid var(--color-border)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Flex
            justify="flex-end"
            gap={8}
            wrap={false}
            style={{ width: '100%', maxWidth: 880, overflowX: 'auto', paddingBottom: 4 }}
          >
            <Button size="large" onClick={() => navigate(`${prefix}/items`)} disabled={submitting}>
              {tc('action.cancel', 'Cancel')}
            </Button>
            <Button
              size="large"
              loading={submitting}
              onClick={() => handleSubmit('draft')}
            >
              {t('saveDraft', 'Save Draft')}
            </Button>
            <Button
              type="primary"
              size="large"
              loading={submitting}
              onClick={() => handleSubmit('submit')}
              style={{
                background: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
                fontWeight: 600
              }}
            >
              {includeAuction
                ? t('createAndSubmitWithAuction', 'Create & Submit with Auction')
                : t('createAndSubmit', 'Create & Submit')}
            </Button>
          </Flex>
        </div>
      </Form>
    </div>
  )
}
