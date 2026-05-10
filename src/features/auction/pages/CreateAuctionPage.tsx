import { useState, useEffect } from 'react'
import {
  Typography,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
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
import { useCreateAuction, useCreateAuctionFromItem, useUpdateAuction, useSubmitAuction, useAuctionDetail } from '@/features/auction/auctionApi'
import { useCategories, useSubmitItem, useItemById } from '@/features/item/api'
import { MultiCaptureUploader } from '@/components/ui/MultiCaptureUploader'
import type { CapturedPhoto } from '@/components/ui/MultiCaptureUploader'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AuctionTimingSection } from '@/features/auction/components/AuctionTimingSection'
import { AuctionType, ItemStatus } from '@/types/enums'
import { useConditionOptions, useAuctionTypeOptions } from '@/utils/enumLabels'
import { DEFAULT_CURRENCY } from '@/utils/constants'
import type { CreateAuctionRequest } from '@/features/auction/auctionApi'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SERIF_FONT } from '@/styles/tokens'
import { htmlToPlainTextExcerpt } from '@/components/ui/SafeHtmlRenderer'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'

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
  qualificationStartAt?: string
  qualificationEndAt?: string
  startTime?: string
  endTime?: string
  autoExtend?: boolean
}

function SectionHeader({ number, title, isMobile }: { number: number; title: string, isMobile?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--color-accent)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        border: '1px solid var(--color-accent)',
        borderRadius: '50%',
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.8
      }}>
        {number}
      </div>
      <h3 style={{
        fontFamily: SERIF_FONT,
        margin: 0,
        fontSize: isMobile ? 18 : 20,
        color: 'var(--color-text-primary)',
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h3>
    </div>
  )
}

export default function CreateAuctionPage() {
  const { t } = useTranslation('auction')
  const { t: tc } = useTranslation('common')
  const CONDITION_OPTIONS = useConditionOptions()
  const AUCTION_TYPE_OPTIONS = useAuctionTypeOptions()
  const navigate = useNavigate()
  const prefix = useRoutePrefix()
  const { message } = App.useApp()
  const { isMobile } = useBreakpoint()

  const [searchParams] = useSearchParams()
  const itemId = searchParams.get('itemId')
  const { id: editId } = useParams<{ id?: string }>()
  const isEditMode = !!editId && !itemId

  const { data: editAuction, isLoading: editLoading } = useAuctionDetail(editId ?? '')
  const { data: existingItem, isLoading: itemLoading, isError: itemError } = useItemById(itemId ?? '')

  const [form] = Form.useForm<FormValues>()
  const watchedAuctionType = Form.useWatch('auctionType', form)
  const watchedStartingPrice = Form.useWatch('startingPrice', form)
  const isSealed = watchedAuctionType === AuctionType.Sealed
  const createAuction = useCreateAuction()
  const createAuctionFromItem = useCreateAuctionFromItem()
  const mediaUpload = useMediaUpload('item_image')
  const { data: categories } = useCategories()
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([])
  const [requireVerification, setRequireVerification] = useState(false)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)

  const [submissionStep, setSubmissionStep] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [partialAuctionId, setPartialAuctionId] = useState<string | null>(null)

  const isFromItem = !!itemId && !!existingItem && !itemError
  const hideItemFields = isFromItem || isEditMode
  const existingItemForPreview = isEditMode ? editAuction?.item : existingItem
  // Draft-edit mode: hide "Verify by platform" toggle + "Create auction" submit button.
  // Drafts can't configure timing, so the submit-for-review flow doesn't apply here —
  // sellers should only save-draft or cancel.
  const isDraftEdit = isEditMode && editAuction?.auction?.status === 'draft'

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
    label: tc(`categories.items.${cat.name}`, cat.name),
    value: cat.id,
  }))
  const submitItemMutation = useSubmitItem()
  const updateAuction = useUpdateAuction()
  const submitAuction = useSubmitAuction()
  const [savingDraft, setSavingDraft] = useState(false)

  const hasTimingValues = (values: FormValues) =>
    !!(values.qualificationStartAt && values.qualificationEndAt && values.startTime && values.endTime)

  const applyTiming = async (auctionId: string, values: FormValues) => {
    if (!hasTimingValues(values)) return
    await updateAuction.mutateAsync({
      auctionId,
      startTime: values.startTime,
      endTime: values.endTime,
      qualificationStartAt: values.qualificationStartAt,
      qualificationEndAt: values.qualificationEndAt,
      autoExtend: values.auctionType === AuctionType.Sealed ? false : (values.autoExtend ?? false),
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

  const buildPayload = (values: FormValues, uploadedImages?: { mediaUploadId: string }[]): CreateAuctionRequest => {
    const isSealedType = values.auctionType === AuctionType.Sealed
    return {
      title: values.title,
      condition: values.condition,
      categoryId: values.categoryId,
      description: values.description,
      quantity: values.quantity,
      auctionType: values.auctionType,
      startingPrice: isSealedType ? 0 : values.startingPrice,
      bidIncrement: isSealedType ? 0 : values.bidIncrement,
      reservePrice: values.reservePrice,
      buyNowPrice: values.buyNowPrice,
      extensionMinutes: isSealedType ? undefined : values.extensionMinutes,
      currency: values.currency,
      images: uploadedImages?.map((img, i) => ({ mediaUploadId: img.mediaUploadId, isPrimary: i === 0, sortOrder: i })),
      verifyByPlatform: requireVerification,
    } as any as CreateAuctionRequest
  }

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      setSavingDraft(true)
      if (isEditMode) {
        const pricingFields = {
          auctionId: editId!,
          startingPrice: values.auctionType === AuctionType.Sealed ? 0 : values.startingPrice,
          bidIncrement: values.auctionType === AuctionType.Sealed ? 0 : values.bidIncrement,
          reservePrice: values.reservePrice,
          buyNowPrice: values.buyNowPrice,
          extensionMinutes: values.auctionType === AuctionType.Sealed ? undefined : values.extensionMinutes,
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
            startingPrice: values.auctionType === AuctionType.Sealed ? 0 : values.startingPrice,
            bidIncrement: values.auctionType === AuctionType.Sealed ? 0 : values.bidIncrement,
            reservePrice: values.reservePrice,
            buyNowPrice: values.buyNowPrice,
            extensionMinutes: values.auctionType === AuctionType.Sealed ? undefined : values.extensionMinutes,
            currency: values.currency,
            auctionType: values.auctionType,
          })
        } else {
          const uploadedImages = await uploadCapturedPhotos()
          result = await createAuction.mutateAsync(buildPayload(values, uploadedImages))
        }
        if (hasTimingValues(values)) {
          try {
            await applyTiming(result.id, values)
          } catch (err: any) {
            const detail = normalizeErrorMessage(err, t('draftSavedTimingFailed', 'Draft saved but timing not set. You can configure timing later.'))
            message.warning(detail)
            navigate(`${prefix}/auctions`)
            return
          }
        }
        message.success(t('draftSaved', 'Draft saved successfully'))
        navigate(`${prefix}/auctions`)
      }
    } catch (err: any) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(normalizeErrorMessage(err, t('createError', 'Failed to save draft')))
    } finally {
      setSavingDraft(false)
    }
  }

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
    } catch (err: any) {
      const errMsg = normalizeErrorMessage(err, t('retryFailed', 'Retry failed. Please try again or go to My Auctions.'))
      setSubmissionError(errMsg)
    }
  }

  const onFinish = async (values: FormValues) => {
    if (!hideItemFields && capturedPhotos.length === 0) {
      message.warning(t('photosRequiredError', 'Please capture at least 1 photo'))
      return
    }

    setSubmissionError(null)
    setSubmissionStep(null)
    setPartialAuctionId(null)

    try {
      if (isEditMode) {
        setSubmissionStep('updating')
        const pricingFields = {
          auctionId: editId!,
          startingPrice: values.auctionType === AuctionType.Sealed ? 0 : values.startingPrice,
          bidIncrement: values.auctionType === AuctionType.Sealed ? 0 : values.bidIncrement,
          reservePrice: values.reservePrice,
          buyNowPrice: values.buyNowPrice,
          extensionMinutes: values.auctionType === AuctionType.Sealed ? undefined : values.extensionMinutes,
          currency: values.currency,
          auctionType: values.auctionType,
        }
        await updateAuction.mutateAsync(pricingFields)
        if (hasTimingValues(values)) {
          setSubmissionStep('timing')
          try {
            await applyTiming(editId!, values)
          } catch (err: any) {
            setSubmissionStep(null)
            setSubmissionError(normalizeErrorMessage(err, t('updatedTimingFailed', 'Auction updated but timing not set. You can configure timing later.')))
            setPartialAuctionId(editId!)
            return
          }
        }
        setSubmissionStep('submitting')
        try {
          await submitAuction.mutateAsync(editId!)
          message.success(t('auctionUpdatedAndSubmitted', 'Auction updated and submitted successfully!'))
          setSubmissionStep(null)
        } catch (err: any) {
          setSubmissionStep(null)
          setSubmissionError(normalizeErrorMessage(err, t('updatedSubmitFailed', 'Auction updated but submission failed. Submit from My Auctions.')))
          setPartialAuctionId(editId!)
          return
        }
      } else if (isFromItem) {
        setSubmissionStep('creating')
        const result = await createAuctionFromItem.mutateAsync({
          itemId: itemId!,
          startingPrice: values.auctionType === AuctionType.Sealed ? 0 : values.startingPrice,
          bidIncrement: values.auctionType === AuctionType.Sealed ? 0 : values.bidIncrement,
          reservePrice: values.reservePrice,
          buyNowPrice: values.buyNowPrice,
          extensionMinutes: values.auctionType === AuctionType.Sealed ? undefined : values.extensionMinutes,
          currency: values.currency,
          auctionType: values.auctionType,
        })
        setPartialAuctionId(result.id)
        if (hasTimingValues(values)) {
          setSubmissionStep('timing')
          try {
            await applyTiming(result.id, values)
          } catch (err: any) {
            setSubmissionStep(null)
            setSubmissionError(normalizeErrorMessage(err, t('createdTimingFailed', 'Auction created but timing not set. Configure timing in My Auctions.')))
            return
          }
          setSubmissionStep('submitting')
          try {
            await submitAuction.mutateAsync(result.id)
            message.success(t('auctionScheduled', 'Auction scheduled successfully!'))
            setSubmissionStep(null)
          } catch (err: any) {
            setSubmissionStep(null)
            setSubmissionError(normalizeErrorMessage(err, t('timingSetSubmitFailed', 'Auction created with timing but submission failed. Submit from My Auctions.')))
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
        setSubmissionStep('submitting')
        try {
          await submitItemMutation.mutateAsync({
            id: result.itemId,
            verifyByPlatform: payload.verifyByPlatform ?? false,
          })
          message.success(t('itemSubmitted', 'Auction created and item submitted for review'))
          setSubmissionStep(null)
        } catch (err: any) {
          setSubmissionStep(null)
          setSubmissionError(normalizeErrorMessage(err, t('draftSavedSubmitFailed', 'Draft saved but item submission failed. You can submit from My Auctions.')))
          return
        }
      }
      navigate(`${prefix}/auctions`)
    } catch (err: any) {
      setSubmissionStep(null)
      message.error(normalizeErrorMessage(err, t('createError', 'Failed to create auction')))
    }
  }

  const isSubmitting = !!submissionStep
  const stepStatusText: Record<string, string> = {
    uploading: t('stepStatusUploading', 'Uploading photos...'),
    creating: t('stepStatusCreating', 'Creating auction...'),
    timing: t('stepStatusTiming', 'Setting timing...'),
    submitting: t('stepStatusSubmitting', 'Submitting...'),
    updating: t('stepStatusUpdating', 'Updating auction...'),
  }

  const stepsItems = hideItemFields
    ? [
        {
          title: t('stepPricing', 'Pricing & Time'),
          status: (submissionStep === 'updating' || submissionStep === 'timing' ? 'process' : 'wait') as 'process' | 'wait' | 'finish',
          icon: (submissionStep === 'updating' || submissionStep === 'timing') ? <LoadingOutlined /> : undefined,
        },
        {
          title: t('stepSubmit', 'Submit'),
          status: (submissionStep === 'submitting' ? 'process' : 'wait') as 'process' | 'wait' | 'finish',
          icon: submissionStep === 'submitting' ? <LoadingOutlined /> : undefined,
        },
      ]
    : [
        { title: t('stepItemDetails', 'Item Details'), status: 'wait' as const },
        {
          title: t('stepPhotos', 'Photos'),
          status: (submissionStep === 'uploading' ? 'process' : capturedPhotos.length > 0 ? 'finish' : 'wait') as 'process' | 'wait' | 'finish',
          icon: submissionStep === 'uploading' ? <LoadingOutlined /> : capturedPhotos.length > 0 ? <CheckCircleOutlined /> : undefined,
        },
        {
          title: t('stepPricing', 'Pricing & Time'),
          status: (submissionStep === 'timing' ? 'process' : 'wait') as 'process' | 'wait' | 'finish',
          icon: submissionStep === 'timing' ? <LoadingOutlined /> : undefined,
        },
        {
          title: t('stepSubmit', 'Submit'),
          status: (submissionStep === 'creating' || submissionStep === 'submitting' ? 'process' : 'wait') as 'process' | 'wait' | 'finish',
          icon: (submissionStep === 'creating' || submissionStep === 'submitting') ? <LoadingOutlined /> : undefined,
        },
      ]

  const pricingSectionNumber = hideItemFields ? 1 : 3

  if ((itemId && itemLoading) || (editLoading && isEditMode)) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 40, paddingInline: isMobile ? 16 : 0 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  if (itemId && itemError) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 40, paddingInline: isMobile ? 16 : 0 }}>
        <Alert
          type="error"
          showIcon
          message={t('itemLoadError', 'Failed to load item details')}
          description={t('itemLoadErrorDesc', 'Could not load the selected item. You can create an auction from scratch instead.')}
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`${prefix}/auctions`)}>
          {tc('action.back', 'Back')}
        </Button>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        paddingInline: isMobile ? 16 : 0,
        paddingBottom: isMobile ? 80 : 40,
      }}
    >
      {/* Back button */}
      <div style={{ marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`${prefix}/auctions`)}
          style={{ paddingInline: 0, color: 'var(--color-text-secondary)' }}
          className="oio-link"
        >
          {tc('action.back', 'Back to Auctions')}
        </Button>
      </div>

      <Typography.Title
        level={isMobile ? 3 : 2}
        className="oio-serif"
        style={{
          color: 'var(--color-text-primary)',
          marginBottom: 32,
          fontSize: isMobile ? 24 : 36,
        }}
      >
        {isEditMode ? t('editAuction', 'Edit Auction') : t('createAuction', 'Tạo đấu giá mới')}
      </Typography.Title>

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
        requiredMark={false}
      >
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 32,
          alignItems: 'flex-start'
        }}>
          {/* Left Column: Form Details */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Partial Failure Alert */}
            {submissionError && (
              <Alert
                type="warning"
                showIcon
                message={t('partialFailureTitle', 'Submission partially completed')}
                description={submissionError}
                style={{ marginBottom: 24, borderRadius: 8 }}
                action={
                  partialAuctionId && submissionStep === null ? (
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

      {/* Item Preview */}
      {(isFromItem || (isEditMode && existingItemForPreview)) && existingItemForPreview && (
        <div className="oio-widget" style={{ marginBottom: 24, overflow: 'hidden' }}>
          <SectionHeader number={1} title={t('selectedItem', 'Selected Item')} isMobile={isMobile} />
          <div style={{
            display: 'flex',
            gap: 20,
            alignItems: 'stretch',
            background: 'var(--color-bg-surface)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--color-border-light)'
          }}>
            {existingItemForPreview.images && existingItemForPreview.images.length > 0 && (
              <div style={{ flexShrink: 0 }} className="oio-image-zoom">
                <Image
                  src={existingItemForPreview.images[0].thumbnailUrl ?? existingItemForPreview.images[0].url}
                  width={isMobile ? 100 : 120}
                  height={isMobile ? 100 : 120}
                  style={{ objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography.Title level={5} className="oio-serif" style={{ margin: 0, fontSize: isMobile ? 16 : 18 }}>
                {existingItemForPreview.title}
              </Typography.Title>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatusBadge status={existingItemForPreview.condition} />
                {existingItemForPreview.quantity > 1 && (
                  <Tag style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                    {t('quantityLabel', 'Qty')}: {existingItemForPreview.quantity}
                  </Tag>
                )}
                {(existingItemForPreview as any).hasInboundShipment === true && (
                  <Tag icon={<SafetyCertificateOutlined />} color="blue" style={{ borderRadius: 4 }}>
                    {t('verifiedByPlatform', 'Verified')}
                  </Tag>
                )}
              </div>
              {existingItemForPreview.description && (
                <Typography.Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.5 }}
                >
                  {htmlToPlainTextExcerpt(existingItemForPreview.description)}
                </Typography.Paragraph>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="oio-widget">
          {/* Section 1: Item Info (if not from existing item) */}
          {!hideItemFields && (
            <div style={{ marginBottom: 40 }}>
              <SectionHeader number={1} title={t('itemInfo', 'Item Information')} isMobile={isMobile} />

              <Form.Item
                name="title"
                label={<span className="oio-label">{t('itemTitle', 'Title')}</span>}
                rules={[
                  { required: !hideItemFields, message: t('titleRequired', 'Please enter item title') },
                  { max: 255, message: t('titleMax', 'Title must not exceed 255 characters') },
                ]}
              >
                <Input placeholder={t('titlePlaceholder', 'Enter item title')} style={{ height: 48, fontSize: 16 }} />
              </Form.Item>

              <Form.Item
                name="condition"
                label={<span className="oio-label">{t('condition', 'Condition')}</span>}
                rules={[{ required: !hideItemFields, message: t('conditionRequired', 'Please select condition') }]}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {CONDITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedCondition(opt.value)
                        form.setFieldsValue({ condition: opt.value })
                      }}
                      className="oio-card-hover"
                      style={{
                        padding: isMobile ? '8px 16px' : '10px 24px',
                        borderRadius: 4,
                        border: `1px solid ${selectedCondition === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        background: selectedCondition === opt.value ? 'var(--color-accent)' : 'var(--color-bg-card)',
                        color: selectedCondition === opt.value ? '#fff' : 'var(--color-text-primary)',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: selectedCondition === opt.value ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Form.Item>

              <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: '100%', display: 'flex' }} size="large">
                <Form.Item name="categoryId" label={<span className="oio-label">{t('category', 'Category')}</span>} style={{ flex: 1 }} rules={[{ required: true, message: t('categoryRequired', 'Please select a category') }]}>
                  <Select
                    options={categoryOptions}
                    placeholder={t('selectCategory', 'Select category')}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    size="large"
                  />
                </Form.Item>

                <Form.Item name="quantity" label={<span className="oio-label">{t('quantity', 'Quantity')}</span>} style={{ flex: 1 }}>
                  <InputNumber style={{ width: '100%' }} size="large" min={1} />
                </Form.Item>
              </Space>

              <Form.Item name="description" label={<span className="oio-label">{t('description', 'Description')}</span>}>
                <Input.TextArea rows={4} placeholder={t('descriptionPlaceholder', 'Describe your item')} style={{ fontSize: 16 }} />
              </Form.Item>

              {/* Section 2: Photos */}
              <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '40px 0 32px', paddingTop: 40 }}>
                <SectionHeader number={2} title={t('photos', 'Item Photos')} isMobile={isMobile} />
                <Form.Item required>
                  <div style={{ marginTop: 8 }}>
                    <MultiCaptureUploader
                      maxPhotos={10}
                      step="item_photo"
                      facingMode="environment"
                      onPhotosChange={setCapturedPhotos}
                    />
                  </div>
                </Form.Item>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-light)', margin: '40px 0 32px', paddingTop: 40 }} />
            </div>
          )}

          {/* Pricing & Timing */}
          <SectionHeader number={pricingSectionNumber} title={t('pricingAndTiming', 'Pricing & Timing')} isMobile={isMobile} />

          <Form.Item
            name="auctionType"
            label={<span className="oio-label">{t('auctionType', 'Auction Type')}</span>}
            rules={[{ required: true, message: t('typeRequired', 'Please select auction type') }]}
          >
            <Select options={AUCTION_TYPE_OPTIONS} style={{ width: '100%' }} size="large" />
          </Form.Item>

          {!isSealed && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : 24 }}>
            <Form.Item
              name="startingPrice"
              label={<span className="oio-label">{t('startingPrice', 'Starting Price')}</span>}
              rules={[{
                validator: (_, value) => {
                  if (isSealed) return Promise.resolve()
                  if (value == null || value < 1000) return Promise.reject(t('startingPriceMin1000', 'Starting price must be at least 1,000'))
                  return Promise.resolve()
                },
              }]}
            >
              <InputNumber
                style={{ width: '100%', fontSize: 16 }}
                size="large"
                min={1000}
                step={1000}
                addonAfter={DEFAULT_CURRENCY}
                placeholder="0"
                formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                parser={(v) => {
                  const parsed = (v ?? '').replace(/\$\s?|(,*)/g, '')
                  return parsed ? Number(parsed) : null as any
                }}
              />
            </Form.Item>

            <Form.Item
              name="bidIncrement"
              label={<span className="oio-label">{t('bidIncrement', 'Bid Increment')}</span>}
              rules={[{
                validator: (_, value) => {
                  if (isSealed) return Promise.resolve()
                  if (value == null || value < 1000) return Promise.reject(t('bidIncrementMin1000', 'Bid increment must be at least 1,000'))
                  return Promise.resolve()
                },
              }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                min={1000}
                step={1000}
                addonAfter={DEFAULT_CURRENCY}
                formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                parser={(v) => {
                  const parsed = (v ?? '').replace(/\$\s?|(,*)/g, '')
                  return parsed ? Number(parsed) : null as any
                }}
              />
            </Form.Item>
          </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 0 : 24 }}>
            <Form.Item
              name="reservePrice"
              label={<span className="oio-label">{t('reservePrice', 'Reserve Price')}</span>}
              extra={t('reservePriceHelp', 'Auction only succeeds if this price is met.')}
              rules={[{
                validator: (_, value) => {
                  if (value == null || value === 0) return Promise.resolve()
                  if (value < 1000) return Promise.reject(t('reservePriceMin1000', 'Reserve price must be at least 1,000'))
                  const sp = watchedStartingPrice ?? 0
                  if (value < sp) return Promise.reject(t('reservePriceGteStarting', 'Reserve price must be ≥ starting price'))
                  return Promise.resolve()
                },
              }]}
            >
              <InputNumber
                style={{ width: '100%', fontSize: 16 }}
                size="large"
                min={0}
                step={1000}
                addonAfter={DEFAULT_CURRENCY}
                placeholder={t('reservePricePlaceholder', 'Optional')}
                formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                parser={(v) => {
                  const parsed = (v ?? '').replace(/\$\s?|(,*)/g, '')
                  return parsed ? Number(parsed) : null as any
                }}
              />
            </Form.Item>

            <Form.Item
              name="buyNowPrice"
              label={<span className="oio-label">{t('buyNowPrice', 'Buy Now Price')}</span>}
              extra={t('buyNowPriceHelp', 'Allows buyers to purchase instantly and end the auction.')}
              rules={[{
                validator: (_, value) => {
                  if (value == null || value === 0) return Promise.resolve()
                  if (value < 1000) return Promise.reject(t('buyNowPriceMin1000', 'Buy now price must be at least 1,000'))
                  if (!isSealed) {
                    const sp = watchedStartingPrice ?? 0
                    if (value <= sp) return Promise.reject(t('buyNowPriceGtStarting', 'Buy now price must be greater than starting price'))
                  }
                  return Promise.resolve()
                },
              }]}
            >
              <InputNumber
                style={{ width: '100%', fontSize: 16 }}
                size="large"
                min={1000}
                step={1000}
                addonAfter={DEFAULT_CURRENCY}
                placeholder={t('buyNowPricePlaceholder', 'Optional')}
                formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
                parser={(v) => {
                  const parsed = (v ?? '').replace(/\$\s?|(,*)/g, '')
                  return parsed ? Number(parsed) : null as any
                }}
              />
            </Form.Item>
          </div>

          <Form.Item name="currency" hidden>
            <Input />
          </Form.Item>

          <div style={{ marginTop: 16 }}>
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
          </div>

          {/* Verification Toggle */}
          {!isFromItem && !isDraftEdit && (
            <div style={{ marginTop: 40, padding: 24, borderRadius: 12, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--color-bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0
                  }}>
                    <SafetyCertificateOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
                      {t('verifiedByPlatformTitle', 'Platform Verification')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {t('verifiedByPlatformDesc', 'Request experts to verify the item authenticity before auction.')}
                    </div>
                  </div>
                </div>
                <Switch checked={requireVerification} onChange={setRequireVerification} />
              </div>
            </div>
          )}

          </div>
        </div>

        {/* Right Column: Sidebar */}
          <div style={{
            width: isMobile ? '100%' : 380,
            flexShrink: 0,
            position: isMobile ? 'static' : 'sticky',
            top: 100
          }}>
            {/* Steps Progress */}
            <div className="oio-widget" style={{ marginBottom: 24, padding: '20px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <span className="oio-label">{t('submissionProgress', 'Submission Progress')}</span>
              </div>
              <Steps
                size="small"
                items={stepsItems}
                direction="vertical"
              />
              {isSubmitting && submissionStep && stepStatusText[submissionStep] && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid var(--color-border-light)',
                  fontSize: 12,
                  color: 'var(--color-accent)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <LoadingOutlined />
                  {stepStatusText[submissionStep]}
                </div>
              )}
            </div>

            {/* Item Preview */}
            {(isFromItem || (isEditMode && existingItemForPreview)) && existingItemForPreview && (
              <div className="oio-widget" style={{ marginBottom: 24, overflow: 'hidden' }}>
                <div style={{ marginBottom: 16 }}>
                  <span className="oio-label">{t('selectedItem', 'Item Preview')}</span>
                </div>
                <div style={{
                  background: 'var(--color-bg-surface)',
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--color-border-light)'
                }}>
                  {existingItemForPreview.images && existingItemForPreview.images.length > 0 && (
                    <div style={{ width: '100%', aspectRatio: '1/1', marginBottom: 12 }} className="oio-image-zoom">
                      <Image
                        src={existingItemForPreview.images[0].url}
                        width="100%"
                        height="100%"
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    </div>
                  )}
                  <Typography.Title level={5} className="oio-serif" style={{ margin: 0, fontSize: 15 }}>
                    {existingItemForPreview.title}
                  </Typography.Title>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={existingItemForPreview.condition} />
                    {(existingItemForPreview as any).hasInboundShipment === true && (
                      <Tag icon={<SafetyCertificateOutlined />} color="blue" style={{ borderRadius: 4, margin: 0 }}>
                        {t('verified', 'Verified')}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Verification Toggle */}
            {!isFromItem && !isDraftEdit && (
              <div className="oio-widget" style={{ marginBottom: 24, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <SafetyCertificateOutlined style={{ fontSize: 18, color: 'var(--color-accent)' }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{t('platformVerification', 'Verification')}</span>
                  </div>
                  <Switch size="small" checked={requireVerification} onChange={setRequireVerification} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 12, marginInline: 0 }}>
                  {t('verificationHint', 'Experts will verify the item before the auction starts.')}
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="oio-widget" style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={isSubmitting}
                  style={{ width: '100%', height: 48 }}
                >
                  {isEditMode ? t('updateAuction', 'Update Auction') : tc('action.submit', 'Submit')}
                </Button>

                {!isDraftEdit && (
                  <Button
                    size="large"
                    onClick={handleSaveDraft}
                    loading={savingDraft}
                    disabled={isSubmitting}
                    style={{ width: '100%', height: 44, color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                  >
                    {t('saveDraft', 'Save Draft')}
                  </Button>
                )}

                <Button
                  type="text"
                  size="large"
                  onClick={() => navigate(`${prefix}/auctions`)}
                  style={{ width: '100%', height: 44, color: 'var(--color-text-secondary)' }}
                >
                  {tc('action.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  )
}
