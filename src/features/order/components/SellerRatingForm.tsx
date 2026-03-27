import { useState } from 'react'
import { Rate, Input, Button, Flex, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

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

      <Flex align="center" gap={12}>
        <Typography.Text>{t('overallRating', 'Overall')}:</Typography.Text>
        <Rate value={overall} onChange={setOverall} />
      </Flex>

      <Flex align="center" gap={12}>
        <Typography.Text type="secondary">{t('communication', 'Communication')}:</Typography.Text>
        <Rate value={communication} onChange={setCommunication} />
      </Flex>

      <Flex align="center" gap={12}>
        <Typography.Text type="secondary">{t('shippingSpeed', 'Shipping Speed')}:</Typography.Text>
        <Rate value={shipping} onChange={setShipping} />
      </Flex>

      <Flex align="center" gap={12}>
        <Typography.Text type="secondary">{t('itemAccuracy', 'Item Accuracy')}:</Typography.Text>
        <Rate value={accuracy} onChange={setAccuracy} />
      </Flex>

      <Input.TextArea
        rows={3}
        maxLength={500}
        showCount
        placeholder={t('reviewPlaceholder', 'Share your experience with this seller...')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button
        type="primary"
        onClick={handleSubmit}
        loading={loading}
        disabled={overall === 0}
      >
        {t('submitReview', 'Submit Review')}
      </Button>
    </Flex>
  )
}
