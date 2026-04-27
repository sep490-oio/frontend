import { useState } from 'react'
import { Rate, Input, Button, Flex, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface SellerRatingFormProps {
  orderId: string
  onSubmit: (data: {
    orderId: string
    overallRating: number
    communicationRating?: number
    shippingSpeedRating?: number
    itemAccuracyRating?: number
    title?: string
    comment?: string
  }) => Promise<void>
  loading?: boolean
}

export function SellerRatingForm({ orderId, onSubmit, loading }: SellerRatingFormProps) {
  const { t } = useTranslation('order')
  const { isMobile } = useBreakpoint()
  const [overall, setOverall] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = async () => {
    if (overall === 0) return
    await onSubmit({
      orderId,
      overallRating: overall,
      communicationRating: communication || undefined,
      shippingSpeedRating: shipping || undefined,
      itemAccuracyRating: accuracy || undefined,
      comment: comment.trim() || undefined,
    })
  }

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={5}>{t('rateThisSeller', 'Rate this Seller')}</Typography.Title>

      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Typography.Text strong>{t('overallRating', 'Overall')}:</Typography.Text>
        <Rate value={overall} onChange={setOverall} style={{ fontSize: isMobile ? 24 : 20 }} />
      </Flex>

      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Typography.Text type="secondary">{t('communication', 'Communication')}:</Typography.Text>
        <Rate value={communication} onChange={setCommunication} style={{ fontSize: isMobile ? 20 : 16 }} />
      </Flex>

      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Typography.Text type="secondary">{t('shippingSpeed', 'Shipping Speed')}:</Typography.Text>
        <Rate value={shipping} onChange={setShipping} style={{ fontSize: isMobile ? 20 : 16 }} />
      </Flex>

      <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
        <Typography.Text type="secondary">{t('itemAccuracy', 'Item Accuracy')}:</Typography.Text>
        <Rate value={accuracy} onChange={setAccuracy} style={{ fontSize: isMobile ? 20 : 16 }} />
      </Flex>

      <Input.TextArea
        rows={isMobile ? 4 : 3}
        size={isMobile ? 'large' : 'middle'}
        maxLength={500}
        showCount
        placeholder={t('reviewPlaceholder', 'Share your experience with this seller...')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ marginTop: 8 }}
      />

      <Button
        type="primary"
        size={isMobile ? 'large' : 'middle'}
        onClick={handleSubmit}
        loading={loading}
        disabled={overall === 0}
        style={{ height: isMobile ? 48 : undefined, borderRadius: 12, fontWeight: 600 }}
      >
        {t('submitReview', 'Submit Review')}
      </Button>
    </Flex>
  )
}
