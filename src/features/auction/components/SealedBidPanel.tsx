import { useState } from 'react'
import { Card, InputNumber, Button, Typography, Alert, Flex, Tag } from 'antd'
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useSubmitSealedBid } from '@/features/auction/api'
import { formatCurrency } from '@/utils/format'
import type { SealedBidInfoDto } from '@/types'

const { Text } = Typography

interface SealedBidPanelProps {
  auctionId: string
  currency: string
  minBid: number
  bidIncrement: number
  isActive: boolean
  isTerminal: boolean
  sealedBidInfo?: SealedBidInfoDto | null
  isSeller: boolean
  canBid?: boolean
}

export function SealedBidPanel({
  auctionId,
  currency,
  minBid,
  bidIncrement,
  isActive,
  isTerminal,
  sealedBidInfo,
  isSeller,
  canBid = false,
}: SealedBidPanelProps) {
  const { t } = useTranslation('auction')
  const [amount, setAmount] = useState<number | null>(null)
  const submitSealedBid = useSubmitSealedBid()

  const hasSubmitted = sealedBidInfo?.currentUserHasSubmittedSealedBid ?? false
  const userStatus = sealedBidInfo?.currentUserSealedBidStatus
  const sealedBidCount = sealedBidInfo?.sealedBidCount ?? 0

  const handleSubmit = async () => {
    if (!amount) return
    await submitSealedBid.mutateAsync({ auctionId, amount })
    setAmount(null)
  }

  // ── Terminal state: show outcome ──
  if (isTerminal) {
    return (
      <Card
        style={{
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
        }}
      >
        <Flex vertical gap={12} align="center">
          <LockOutlined style={{ fontSize: 28, color: 'var(--color-text-secondary)' }} />
          <Text strong style={{ fontSize: 15 }}>
            {t('sealedAuctionEnded', 'Sealed Auction Ended')}
          </Text>
          {sealedBidCount > 0 && (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('sealedBidCountFinal', '{{count}} sealed bid(s) were submitted', { count: sealedBidCount })}
            </Text>
          )}
          {userStatus === 'revealed' && (
            <Alert
              type="info"
              showIcon
              icon={<CheckCircleOutlined />}
              message={t('sealedBidRevealed', 'Your sealed bid has been revealed.')}
              style={{ width: '100%', borderRadius: 8 }}
            />
          )}
          {/* Winner/loser is determined by currentUserBidState.position in the parent */}
        </Flex>
      </Card>
    )
  }

  // ── Seller view ──
  if (isSeller) {
    return (
      <Card
        style={{
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
        }}
      >
        <Flex vertical gap={8} align="center">
          <LockOutlined style={{ fontSize: 28, color: 'var(--color-accent)' }} />
          <Text strong style={{ fontSize: 15 }}>
            {t('sealedAuction', 'Sealed Auction')}
          </Text>
          <Tag color="blue" style={{ fontSize: 13 }}>
            {t('sealedBidCount', '{{count}} sealed bid(s) received', { count: sealedBidCount })}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
            {t('sealedBidsHidden', 'Sealed bids are hidden until the auction ends and bids are revealed.')}
          </Text>
        </Flex>
      </Card>
    )
  }

  // ── Already submitted ──
  if (hasSubmitted) {
    return (
      <Card
        style={{
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-surface)',
        }}
      >
        <Flex vertical gap={8} align="center">
          <CheckCircleOutlined style={{ fontSize: 28, color: 'var(--color-success, #52c41a)' }} />
          <Text strong style={{ fontSize: 15 }}>
            {t('sealedBidSubmitted', 'Your sealed bid has been submitted')}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
            {t('sealedBidSubmittedDesc', 'Your bid is encrypted and will be revealed when the auction ends. You cannot modify or withdraw your bid.')}
          </Text>
          {sealedBidCount > 1 && (
            <Tag style={{ fontSize: 12 }}>
              {t('sealedBidCount', '{{count}} sealed bid(s) received', { count: sealedBidCount })}
            </Tag>
          )}
        </Flex>
      </Card>
    )
  }

  // ── Submit form (active, not submitted) ──
  if (!isActive) return null
  if (!canBid) return null

  return (
    <Card
      style={{
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <Flex vertical gap={12}>
        <Flex align="center" gap={8}>
          <LockOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
          <Text strong style={{ fontSize: 15 }}>
            {t('submitSealedBid', 'Submit Sealed Bid')}
          </Text>
        </Flex>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('sealedBidExplainer', 'Your bid is encrypted. No one can see your bid amount until the auction ends and all bids are revealed simultaneously.')}
        </Text>

        <div>
          <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
            {t('bidAmountLabel', 'Bid Amount')}
          </Text>
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={minBid}
            step={bidIncrement}
            value={amount}
            onChange={(v) => setAmount(v)}
            addonAfter={currency}
            placeholder={t('enterBidAmount', 'Enter your bid')}
          />
          <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
            {t('minimumBid', 'Minimum')}: {formatCurrency(minBid, currency)}
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          block
          icon={<LockOutlined />}
          loading={submitSealedBid.isPending}
          disabled={!amount || amount < minBid}
          onClick={handleSubmit}
          style={{
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          {t('submitSealedBidBtn', 'Submit Sealed Bid')}
        </Button>

        {sealedBidCount > 0 && (
          <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
            {t('sealedBidCount', '{{count}} sealed bid(s) received', { count: sealedBidCount })}
          </Text>
        )}
      </Flex>
    </Card>
  )
}
