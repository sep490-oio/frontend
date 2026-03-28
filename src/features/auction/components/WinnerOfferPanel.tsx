import { useState, useEffect } from 'react'
import { Card, Button, Typography, Flex, Popconfirm } from 'antd'
import { TrophyOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'

interface WinnerOfferPanelProps {
  offer: {
    offerId: string
    auctionId: string
    auctionTitle: string
    offerAmount: number
    currency: string
    status: string
    expiresAt?: string
    createdAt: string
  }
  onAccept?: (offerId: string) => void
  onDecline?: (offerId: string) => void
  isAcceptLoading?: boolean
  isDeclineLoading?: boolean
}

export function WinnerOfferPanel({ offer, onAccept, onDecline, isAcceptLoading, isDeclineLoading }: WinnerOfferPanelProps) {
  const { t } = useTranslation('auction')

  const isPending = offer.status === 'pending'

  const [isExpired, setIsExpired] = useState(
    () => !!offer.expiresAt && new Date(offer.expiresAt).getTime() < Date.now()
  )
  useEffect(() => {
    if (!offer.expiresAt || isExpired) return
    const check = () => {
      if (new Date(offer.expiresAt!).getTime() < Date.now()) setIsExpired(true)
    }
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [offer.expiresAt, isExpired])

  return (
    <Card
      size="small"
      style={{
        borderColor: isPending ? 'rgba(196, 146, 61, 0.3)' : 'var(--color-border)',
        background: isPending ? 'rgba(196, 146, 61, 0.04)' : undefined,
      }}
    >
      <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
        <TrophyOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />
        <div style={{ flex: 1 }}>
          <Typography.Text strong style={{ fontSize: 14, display: 'block' }}>
            {t('winnerOffer', 'Winner Offer')}
          </Typography.Text>
          <Typography.Text style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {offer.auctionTitle}
          </Typography.Text>
        </div>
        <StatusBadge status={offer.status} size="small" />
      </Flex>

      <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
        <div>
          {t('offerAmount', 'Amount')}: <strong style={{ color: 'var(--color-accent)', fontFamily: "'DM Mono', monospace" }}>{formatCurrency(offer.offerAmount, offer.currency)}</strong>
        </div>
        {offer.expiresAt && !isExpired && (
          <div>
            {t('expiresIn', 'Expires in')}: <CountdownTimer endTime={offer.expiresAt} size="small" />
          </div>
        )}
        <div>{t('offeredAt', 'Offered')}: {formatDateTime(offer.createdAt)}</div>
      </div>

      {isPending && !isExpired && (
        <Flex gap={8} style={{ marginTop: 12 }}>
          <Popconfirm
            title={t('acceptOfferConfirm', 'Accept this offer? An order will be created.')}
            onConfirm={() => onAccept?.(offer.offerId)}
            okText={t('accept', 'Accept')}
            cancelText={t('cancel', 'Cancel')}
          >
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={isAcceptLoading}
              style={{ flex: 1, background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
            >
              {t('acceptOffer', 'Accept Offer')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('declineOfferConfirm', 'Decline this offer? It cannot be undone.')}
            onConfirm={() => onDecline?.(offer.offerId)}
            okText={t('decline', 'Decline')}
            cancelText={t('cancel', 'Cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<CloseOutlined />}
              loading={isDeclineLoading}
              danger
              style={{ flex: 1 }}
            >
              {t('declineOffer', 'Decline')}
            </Button>
          </Popconfirm>
        </Flex>
      )}

      {isExpired && (
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          {t('offerExpired', 'This offer has expired.')}
        </Typography.Text>
      )}
    </Card>
  )
}
