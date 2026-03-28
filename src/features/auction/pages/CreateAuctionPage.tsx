import { useState, useEffect } from 'react'
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
  Switch,
  Skeleton,
  Alert,
  Image,
  Tag,
} from 'antd'
import { ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams, useParams } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useCreateAuction, useCreateAuctionFromItem, useUpdateAuction, useSubmitAuction, useAuctionDetail } from '@/features/auction/api'
import { useCategories, useSubmitItem, useItemById } from '@/features/item/api'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AuctionTimingSection } from '@/features/auction/components/AuctionTimingSection'
import { AuctionType, ItemCondition } from '@/types/enums'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import type { CreateAuctionRequest } from '@/features/auction/api'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

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
  // Timing fields (optional — from AuctionTimingSection)
  qualificationStartAt?: string
  qualificationEndAt?: string
  startTime?: string
  endTime?: string
  autoExtend?: boolean
}

const AUCTION_TYPE_OPTIONS = Object.entries(AuctionType).map(([label, value]) => ({
  label,
  value,
}))

const CONDITION_OPTIONS = Object.entries(ItemCondition).map(([label, value]) => ({
  label,
  value,
}))

function SectionHeader({ number, title }: { number: number; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {number}
      </span>
      <h3 style={{ fontFamily: SERIF_FONT, margin: 0, fontSize: 18, color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
    </div>
  )
}

export default function CreateAuctionPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()

  const [searchParams] = useSearchParams()
  const itemId = searchParams.get('itemId')
  const { id: editId } = useParams<{ id?: string }>()
  const isEditMode = !!editId && !itemId

  const { data: editAuction, isLoading: editLoading } = useAuctionDetail(editId ?? '')

  const { data: existingItem, isLoading: itemLoading, isError: itemError } = useItemById(itemId ?? '')

  const [form] = Form.useForm<FormValues>()
  const createAuction = useCreateAuction()
  const createAuctionFromItem = useCreateAuctionFromItem()
  const { data: categories } = useCategories()
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [requireVerification, setRequireVerification] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)

  const isFromItem = !!itemId && !!existingItem && !itemError
  const hideItemFields = isFromItem || isEditMode
  const existingItemForPreview = isEditMode ? editAuction?.item : existingItem

  useEffect(() => {
    if (isEditMode && editAuction?.auction) {
      const a = editAuction.auction
      form.setFieldsValue({
        auctionType: a.auctionType,
        startingPrice: a.startingPrice?.amount,
        bidIncrement: a.bidIncrement?.amount,
        reservePrice: a.reservePrice?.amount,
        buyNowPrice: a.buyNowPrice?.amount,
        extensionMinutes: a.extensionMinutes ?? 5,
        currency: a.currency,
      })
      setRequireVerification(a.verifyByPlatform ?? false)
    }
  }, [isEditMode, editAuction, form])

  const categoryOptions = (categories ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }))

  const submitItemMutation = useSubmitItem()
  const updateAuction = useUpdateAuction()
  const submitAuction = useSubmitAuction()
  const [savingDraft, setSavingDraft] = useState(false)

  // Helper: check if timing fields are filled
  const hasTimingValues = (values: FormValues) =>
    !!(values.qualificationStartAt && values.qualificationEndAt && values.startTime && values.endTime)

  // Helper: update auction with timing after creation
  const applyTiming = async (auctionId: string, values: FormValues) => {
    if (!hasTimingValues(values)) return
    await updateAuction.mutateAsync({
      auctionId,
      startTime: values.startTime,
      endTime: values.endTime,
      qualificationStartAt: values.qualificationStartAt,
      qualificationEndAt: values.qualificationEndAt,
      autoExtend: values.autoExtend ?? true,
      extensionMinutes: values.extensionMinutes ?? 5,
    })
  }

  const buildPayload = (values: FormValues): CreateAuctionRequest => ({
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
    capturedPhotos: capturedPhotos.map((photo, index) => ({
      blob: photo.blob,
      metadata: photo.metadata,
      isPrimary: index === 0,
      sortOrder: index,
    })),
    verifyByPlatform: requireVerification,
  }) as any as CreateAuctionRequest

  // Save Draft: create auction as draft, optionally set timing
  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      setSavingDraft(true)
      if (isEditMode) {
        const pricingFields = {
          auctionId: editId!,
          startingPrice: values.startingPrice,
          bidIncrement: values.bidIncrement,
          reservePrice: values.reservePrice,
          buyNowPrice: values.buyNowPrice,
          extensionMinutes: values.extensionMinutes,
          currency: values.currency,
          auctionType: values.auctionType,
        }
        await updateAuction.mutateAsync(pricingFields)
        message.success(t('draftSaved', 'Draft saved successfully'))
        navigate(`${prefix}/auctions`)
      } else {
        let result
        if (isFromItem) {
          result = await createAuctionFromItem.mutateAsync({
            itemId: itemId!,
            startingPrice: values.startingPrice,
            bidIncrement: values.bidIncrement,
            reservePrice: values.reservePrice,
            buyNowPrice: values.buyNowPrice,
            extensionMinutes: values.extensionMinutes,
            currency: values.currency,
            auctionType: values.auctionType,
          })
        } else {
          result = await createAuction.mutateAsync(buildPayload(values))
        }
        // Chain: set timing if provided
        if (hasTimingValues(values)) {
          try {
            await applyTiming(result.id, values)
          } catch {
            message.warning(t('draftSavedTimingFailed', 'Draft saved but timing not set. You can configure timing later.'))
            navigate(`${prefix}/auctions`)
            return
          }
        }
        message.success(t('draftSaved', 'Draft saved successfully'))
        navigate(`${prefix}/auctions`)
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(t('createError', 'Failed to save draft'))
    } finally {
      setSavingDraft(false)
    }
  }

  // Continue: create auction, set timing, submit item/auction
  const onFinish = async (values: FormValues) => {
    if (!hideItemFields && capturedPhotos.length === 0) {
      message.warning(t('photosRequiredError', 'Please capture at least 1 photo'))
      return
    }

    try {
      if (isEditMode) {
        const pricingFields = {
          auctionId: editId!,
          startingPrice: values.startingPrice,
          bidIncrement: values.bidIncrement,
          reservePrice: values.reservePrice,
          buyNowPrice: values.buyNowPrice,
          extensionMinutes: values.extensionMinutes,
          currency: values.currency,
          auctionType: values.auctionType,
        }
        await updateAuction.mutateAsync(pricingFields)
        // Apply timing if provided
        if (hasTimingValues(values)) {
          try {
            await applyTiming(editId!, values)
          } catch {
            message.warning(t('updatedTimingFailed', 'Auction updated but timing not set. You can configure timing later.'))
            navigate(`${prefix}/auctions`)
            return
          }
        }
        try {
          await submitAuction.mutateAsync(editId!)
          message.success(t('auctionUpdatedAndSubmitted', 'Auction updated and submitted successfully!'))
        } catch {
          message.warning(t('updatedSubmitFailed', 'Auction updated but submission failed. Submit from My Auctions.'))
        }
      } else if (isFromItem) {
        const result = await createAuctionFromItem.mutateAsync({
          itemId: itemId!,
          startingPrice: values.startingPrice,
          bidIncrement: values.bidIncrement,
          reservePrice: values.reservePrice,
          buyNowPrice: values.buyNowPrice,
          extensionMinutes: values.extensionMinutes,
          currency: values.currency,
          auctionType: values.auctionType,
        })
        // Chain: timing → submit auction (item already approved → goes to Scheduled)
        if (hasTimingValues(values)) {
          try {
            await applyTiming(result.id, values)
            try {
              await submitAuction.mutateAsync(result.id)
              message.success(t('auctionScheduled', 'Auction scheduled successfully!'))
            } catch {
              message.warning(t('timingSetSubmitFailed', 'Auction created with timing but submission failed. Submit from My Auctions.'))
            }
          } catch {
            message.warning(t('createdTimingFailed', 'Auction created but timing not set. Configure timing in My Auctions.'))
          }
        } else {
          message.success(t('auctionCreated', 'Auction created successfully'))
        }
      } else {
        const payload = buildPayload(values)
        const result = await createAuction.mutateAsync(payload)
        // Auto-submit item for admin review
        try {
          await submitItemMutation.mutateAsync({
            id: result.itemId,
            verifyByPlatform: payload.verifyByPlatform ?? false,
          })
          message.success(t('itemSubmitted', 'Auction created and item submitted for review'))
        } catch {
          // Draft saved but submission failed — warn but don't block
          message.warning(t('draftSavedSubmitFailed', 'Draft saved but item submission failed. You can submit from My Auctions.'))
        }
      }
      navigate(`${prefix}/auctions`)
    } catch {
      message.error(t('createError', 'Failed to create auction'))
    }
  }

  if ((itemId && itemLoading) || (editLoading && isEditMode)) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 40 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  if (itemId && itemError) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 40 }}>
        <Alert
          type="error"
          showIcon
          message={t('itemLoadError', 'Failed to load item details')}
          description={t('itemLoadErrorDesc', 'Could not load the selected item. You can create an auction from scratch instead.')}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`${prefix}/auctions`)}
        >
          {tc('action.back', 'Back')}
        </Button>
      </div>
    )
  }

  const pricingSectionNumber = hideItemFields ? 1 : 3

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/auctions`)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Typography.Title
        level={2}
        style={{ fontFamily: SERIF_FONT, color: 'var(--color-text-primary)', marginBottom: 24 }}
      >
        {isEditMode ? t('editAuction', 'Edit Auction') : t('createAuction', 'Tạo đấu giá mới')}
      </Typography.Title>

      {/* ══════════════ Item Preview (from existing item or edit mode) ══════════════ */}
      {(isFromItem || (isEditMode && existingItemForPreview)) && existingItemForPreview && (
        <Card
          style={{ borderRadius: 12, border: '1px solid var(--color-border)', marginBottom: 16 }}
        >
          <SectionHeader number={1} title="Vật phẩm đã chọn" />
          <div style={{ display: 'flex', gap: 16 }}>
            {existingItemForPreview.images && existingItemForPreview.images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Image.PreviewGroup>
                  {existingItemForPreview.images.slice(0, 4).map((img: any) => (
                    <Image
                      key={img.id}
                      src={img.thumbnailUrl ?? img.url}
                      width={64}
                      height={64}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Typography.Title level={5} style={{ margin: 0, fontFamily: SERIF_FONT }}>
                {existingItemForPreview.title}
              </Typography.Title>
              <div style={{ marginTop: 4, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatusBadge status={existingItemForPreview.condition} />
                {existingItemForPreview.quantity > 1 && (
                  <Tag>{t('quantityLabel', 'Qty')}: {existingItemForPreview.quantity}</Tag>
                )}
              </div>
              {existingItemForPreview.description && (
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ margin: '8px 0 0', fontSize: 13 }}
                >
                  {existingItemForPreview.description}
                </Typography.Paragraph>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card style={{ borderRadius: 12, border: '1px solid var(--color-border)' }}>
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
          {/* ══════════════ Section 1: Item Info (hidden when using existing item or editing) ══════════════ */}
          {!hideItemFields && (
            <>
              <SectionHeader number={1} title="Thông tin vật phẩm" />

              <Form.Item
                name="title"
                label={t('itemTitle', 'Title')}
                rules={[
                  { required: !hideItemFields, message: t('titleRequired', 'Please enter item title') },
                  { max: 255, message: t('titleMax', 'Title must not exceed 255 characters') },
                ]}
              >
                <Input placeholder={t('titlePlaceholder', 'Enter item title')} />
              </Form.Item>

              {/* Condition as pill/segmented toggle */}
              <Form.Item
                name="condition"
                label={t('condition', 'Condition')}
                rules={[{ required: !hideItemFields, message: t('conditionRequired', 'Please select condition') }]}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedCondition(opt.value)
                        form.setFieldsValue({ condition: opt.value })
                      }}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 20,
                        border: `1.5px solid ${selectedCondition === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selectedCondition === opt.value ? 'var(--color-accent)' : 'var(--color-bg-card)',
                        color: selectedCondition === opt.value ? '#fff' : 'var(--color-text-secondary)',
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
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

              {/* ══════════════ Section 2: Photos ══════════════ */}
              <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '24px 0', paddingTop: 24 }}>
                <SectionHeader number={2} title="Hình ảnh" />
              </div>

              <Form.Item label={t('photos', 'Photos')} required>
                <MultiCaptureUploader
                  maxPhotos={10}
                  step="item_photo"
                  facingMode="environment"
                  onPhotosChange={setCapturedPhotos}
                />
              </Form.Item>
            </>
          )}

          {/* ══════════════ Section: Pricing & Time ══════════════ */}
          {!hideItemFields && (
            <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '24px 0', paddingTop: 24 }} />
          )}
          <SectionHeader number={pricingSectionNumber} title="Giá & Thời gian" />

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
            rules={[
              { required: true, message: t('startingPriceRequired', 'Please enter starting price') },
              { type: 'number', min: 0, message: t('startingPriceMin', 'Starting price must be >= 0') },
            ]}
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
            rules={[
              { required: true, message: t('bidIncrementRequired', 'Please enter bid increment') },
              { type: 'number', min: 1, message: t('bidIncrementMin', 'Bid increment must be > 0') },
            ]}
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

          <Form.Item name="currency" label={t('currency', 'Currency')}>
            <Input />
          </Form.Item>

          {/* ── Timing Section (collapsible) ── */}
          <AuctionTimingSection form={form} />

          {/* ── Verification Toggle ── */}
          <div
            style={{
              borderTop: '1px solid var(--color-border-light)',
              margin: '24px 0 20px',
              paddingTop: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 12,
                background: 'var(--color-accent-light)',
                border: '1px solid var(--color-border-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <SafetyCertificateOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                    Xác thực bởi Nền tảng
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    Yêu cầu chuyên gia oio.vn kiểm định vật phẩm trước khi đấu giá.
                  </div>
                </div>
              </div>
              <Switch
                checked={requireVerification}
                onChange={setRequireVerification}
              />
            </div>
          </div>

          {/* ── Submit Buttons ── */}
          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Button
                size="large"
                onClick={() => navigate(`${prefix}/auctions`)}
                style={{
                  borderRadius: 8,
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {tc('action.cancel', 'Cancel')}
              </Button>
              <Button
                size="large"
                onClick={handleSaveDraft}
                loading={savingDraft && (createAuction.isPending || createAuctionFromItem.isPending || updateAuction.isPending)}
                disabled={(!hideItemFields && capturedPhotos.length === 0) || createAuction.isPending || createAuctionFromItem.isPending || submitItemMutation.isPending || updateAuction.isPending || submitAuction.isPending}
                style={{
                  borderRadius: 8,
                  borderColor: 'var(--color-accent)',
                  color: 'var(--color-accent)',
                }}
              >
                {t('saveDraft', 'Lưu bản nháp')}
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={!savingDraft && (createAuction.isPending || createAuctionFromItem.isPending || submitItemMutation.isPending || updateAuction.isPending || submitAuction.isPending)}
                disabled={(!hideItemFields && capturedPhotos.length === 0) || createAuction.isPending || createAuctionFromItem.isPending || submitItemMutation.isPending || updateAuction.isPending || submitAuction.isPending}
                style={{
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                {t('create', 'Tạo phiên đấu giá')}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
