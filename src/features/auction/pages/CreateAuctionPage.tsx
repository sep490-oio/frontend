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
  Steps,
} from 'antd'
import {
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams, useParams } from 'react-router'
import { useRoutePrefix } from '@/hooks/useRoutePrefix'
import { useTranslation } from 'react-i18next'
import { useCreateAuction, useCreateAuctionFromItem, useUpdateAuction, useSubmitAuction, useAuctionDetail } from '@/features/auction/api'
import { useCategories, useSubmitItem, useItemById } from '@/features/item/api'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AuctionTimingSection } from '@/features/auction/components/AuctionTimingSection'
import { AuctionType, ItemCondition, ItemStatus } from '@/types/enums'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import type { CreateAuctionRequest } from '@/features/auction/api'
import { SERIF_FONT } from '@/styles/tokens'
import { htmlToPlainTextExcerpt } from '@/components/ui/SafeHtmlRenderer'

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
  const mediaUpload = useMediaUpload('item_image')
  const { data: categories } = useCategories()
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [requireVerification, setRequireVerification] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)

  // Submission state for partial failure recovery
  const [submissionStep, setSubmissionStep] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [partialAuctionId, setPartialAuctionId] = useState<string | null>(null)

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
      autoExtend: values.autoExtend ?? false,
      extensionMinutes: values.extensionMinutes ?? 5,
    })
  }

  const uploadCapturedPhotos = async () => {
    if (capturedPhotos.length === 0) return []
    const files = capturedPhotos.map((photo, i) =>
      new File([photo.blob], `auction-item-photo-${i + 1}.jpg`, { type: 'image/jpeg' })
    )
    return mediaUpload.uploadMultiple(files)
  }

  const buildPayload = (values: FormValues, uploadedImages?: { mediaUploadId: string }[]): CreateAuctionRequest => ({
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
    images: uploadedImages?.map((img, i) => ({
      mediaUploadId: img.mediaUploadId,
      isPrimary: i === 0,
      sortOrder: i,
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
          const uploadedImages = await uploadCapturedPhotos()
          result = await createAuction.mutateAsync(buildPayload(values, uploadedImages))
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

  // Retry from the last failed step
  const handleRetry = async () => {
    if (!partialAuctionId || !submissionStep) return
    setSubmissionError(null)
    try {
      const values = form.getFieldsValue()
      if (submissionStep === 'timing') {
        setSubmissionStep('timing')
        await applyTiming(partialAuctionId, values)
        setSubmissionStep('submitting')
        await submitAuction.mutateAsync(partialAuctionId)
        message.success(t('auctionScheduled', 'Auction scheduled successfully!'))
        setSubmissionStep(null)
        navigate(`${prefix}/auctions`)
      } else if (submissionStep === 'submit') {
        setSubmissionStep('submitting')
        await submitAuction.mutateAsync(partialAuctionId)
        message.success(t('auctionScheduled', 'Auction scheduled successfully!'))
        setSubmissionStep(null)
        navigate(`${prefix}/auctions`)
      }
    } catch {
      setSubmissionError(t('retryFailed', 'Retry failed. Please try again or go to My Auctions.'))
    }
  }

  // Continue: create auction, set timing, submit item/auction
  const onFinish = async (values: FormValues) => {
    if (!hideItemFields && capturedPhotos.length === 0) {
      message.warning(t('photosRequiredError', 'Please capture at least 1 photo'))
      return
    }

    // Clear previous partial failure state
    setSubmissionError(null)
    setSubmissionStep(null)
    setPartialAuctionId(null)

    try {
      if (isEditMode) {
        setSubmissionStep('updating')
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
          setSubmissionStep('timing')
          try {
            await applyTiming(editId!, values)
          } catch {
            setSubmissionStep(null)
            setSubmissionError(t('updatedTimingFailed', 'Auction updated but timing not set. You can configure timing later.'))
            setPartialAuctionId(editId!)
            return
          }
        }
        setSubmissionStep('submitting')
        try {
          await submitAuction.mutateAsync(editId!)
          message.success(t('auctionUpdatedAndSubmitted', 'Auction updated and submitted successfully!'))
          setSubmissionStep(null)
        } catch {
          setSubmissionStep(null)
          setSubmissionError(t('updatedSubmitFailed', 'Auction updated but submission failed. Submit from My Auctions.'))
          setPartialAuctionId(editId!)
          return
        }
      } else if (isFromItem) {
        setSubmissionStep('creating')
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
        setPartialAuctionId(result.id)
        // Chain: timing → submit auction (item already approved → goes to Scheduled)
        if (hasTimingValues(values)) {
          setSubmissionStep('timing')
          try {
            await applyTiming(result.id, values)
          } catch {
            setSubmissionStep(null)
            setSubmissionError(t('createdTimingFailed', 'Auction created but timing not set. Configure timing in My Auctions.'))
            return
          }
          setSubmissionStep('submitting')
          try {
            await submitAuction.mutateAsync(result.id)
            message.success(t('auctionScheduled', 'Auction scheduled successfully!'))
            setSubmissionStep(null)
          } catch {
            setSubmissionStep(null)
            setSubmissionError(t('timingSetSubmitFailed', 'Auction created with timing but submission failed. Submit from My Auctions.'))
            return
          }
        } else {
          message.success(t('auctionCreated', 'Auction created successfully'))
          setSubmissionStep(null)
        }
      } else {
        setSubmissionStep('uploading')
        const uploadedImages2 = await uploadCapturedPhotos()
        setSubmissionStep('creating')
        const payload = buildPayload(values, uploadedImages2)
        const result = await createAuction.mutateAsync(payload)
        setPartialAuctionId(result.id)
        // Auto-submit item for admin review
        setSubmissionStep('submitting')
        try {
          await submitItemMutation.mutateAsync({
            id: result.itemId,
            verifyByPlatform: payload.verifyByPlatform ?? false,
          })
          message.success(t('itemSubmitted', 'Auction created and item submitted for review'))
          setSubmissionStep(null)
        } catch {
          // Draft saved but submission failed — stay on page, show retry
          setSubmissionStep(null)
          setSubmissionError(t('draftSavedSubmitFailed', 'Draft saved but item submission failed. You can submit from My Auctions.'))
          return
        }
      }
      navigate(`${prefix}/auctions`)
    } catch {
      setSubmissionStep(null)
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

  // Steps config
  const isSubmitting = !!submissionStep
  const stepsItems = hideItemFields
    ? [
        {
          title: t('stepPricing', 'Pricing & Time'),
          status: (submissionStep === 'updating' || submissionStep === 'timing'
            ? 'process'
            : 'wait') as 'process' | 'wait' | 'finish',
          icon: (submissionStep === 'updating' || submissionStep === 'timing') ? <LoadingOutlined /> : undefined,
        },
        {
          title: t('stepSubmit', 'Submit'),
          status: (submissionStep === 'submitting'
            ? 'process'
            : submissionStep === null && !submissionError
              ? 'wait'
              : 'wait') as 'process' | 'wait' | 'finish',
          icon: submissionStep === 'submitting' ? <LoadingOutlined /> : undefined,
        },
      ]
    : [
        {
          title: t('stepItemDetails', 'Item Details'),
          status: 'wait' as const,
        },
        {
          title: t('stepPhotos', 'Photos'),
          status: (submissionStep === 'uploading'
            ? 'process'
            : capturedPhotos.length > 0
              ? 'finish'
              : 'wait') as 'process' | 'wait' | 'finish',
          icon: submissionStep === 'uploading' ? <LoadingOutlined /> : capturedPhotos.length > 0 ? <CheckCircleOutlined /> : undefined,
        },
        {
          title: t('stepPricing', 'Pricing & Time'),
          status: (submissionStep === 'timing'
            ? 'process'
            : 'wait') as 'process' | 'wait' | 'finish',
          icon: submissionStep === 'timing' ? <LoadingOutlined /> : undefined,
        },
        {
          title: t('stepSubmit', 'Submit'),
          status: (submissionStep === 'creating' || submissionStep === 'submitting'
            ? 'process'
            : 'wait') as 'process' | 'wait' | 'finish',
          icon: (submissionStep === 'creating' || submissionStep === 'submitting') ? <LoadingOutlined /> : undefined,
        },
      ]

  // Step label while submitting
  const stepStatusText: Record<string, string> = {
    uploading: t('stepStatusUploading', 'Uploading photos...'),
    creating: t('stepStatusCreating', 'Creating auction...'),
    timing: t('stepStatusTiming', 'Setting timing...'),
    submitting: t('stepStatusSubmitting', 'Submitting...'),
    updating: t('stepStatusUpdating', 'Updating auction...'),
  }

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

      {/* ══════════════ Steps Progress Indicator ══════════════ */}
      <Card style={{ borderRadius: 12, border: '1px solid var(--color-border)', marginBottom: 16 }}>
        <Steps
          size="small"
          items={stepsItems}
          style={{ padding: '4px 0' }}
        />
        {isSubmitting && submissionStep && stepStatusText[submissionStep] && (
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {stepStatusText[submissionStep]}
          </div>
        )}
      </Card>

      {/* ══════════════ Partial Failure Alert ══════════════ */}
      {submissionError && (
        <Alert
          type="warning"
          showIcon
          message={t('partialFailureTitle', 'Submission partially completed')}
          description={submissionError}
          style={{ marginBottom: 16, borderRadius: 8 }}
          action={
            partialAuctionId && (submissionStep === null) ? (
              <Space direction="vertical" size={4}>
                <Button size="small" type="primary" onClick={handleRetry} style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
                  {t('retry', 'Retry')}
                </Button>
                <Button size="small" onClick={() => navigate(`${prefix}/auctions`)}>
                  {t('goToMyAuctions', 'Go to My Auctions')}
                </Button>
              </Space>
            ) : (
              <Button size="small" onClick={() => navigate(`${prefix}/auctions`)}>
                {t('goToMyAuctions', 'Go to My Auctions')}
              </Button>
            )
          }
        />
      )}

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
                {(existingItemForPreview as any).requiresPlatformInspection === true && (
                  <Tag icon={<SafetyCertificateOutlined />} color="blue">
                    {t('verifiedByPlatform', 'Verified by platform')}
                  </Tag>
                )}
              </div>
              {existingItemForPreview.description && (
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ margin: '8px 0 0', fontSize: 13 }}
                >
                  {htmlToPlainTextExcerpt(existingItemForPreview.description)}
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

          <Form.Item name="currency" hidden>
            <Input />
          </Form.Item>

          {/* ── Timing Section ── */}
          <AuctionTimingSection
            form={form}
            itemApproved={
              isEditMode
                ? true
                : isFromItem
                  ? existingItem?.status === ItemStatus.Approved ||
                    existingItem?.status === ItemStatus.Active ||
                    existingItem?.status === ItemStatus.InAuction
                  : true
            }
          />

          {/* ── Verification Toggle (hidden when creating from an existing item) ── */}
          {!isFromItem && (
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
          )}

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
