import { Modal, Typography, Flex, Divider, Alert, message, InputNumber } from 'antd'
import { ThunderboltOutlined, WalletOutlined, RobotOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import BidForm from './BidForm'
import { BidderPositionBlock } from './BidderPositionBlock'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { formatCurrency } from '@/utils/format'
import { normalizeErrorMessage } from '@/lib/errorNormalizer'
import { usePlaceBid, useConfigureAutoBid, usePauseAutoBid, useResumeAutoBid, useCancelAutoBid, useMyAutoBid } from '@/features/auction/auctionApi'
import { useWallet } from '@/features/payment/api'
import { MONO_FONT } from '@/styles/tokens'
import type { AuctionDetailDto } from '@/types'

const { Text } = Typography

interface QuickBidModalProps {
  open: boolean
  onCancel: () => void
  detailData?: AuctionDetailDto
  auctionId: string
  onSuccess?: () => void
}

export function QuickBidModal({ open, onCancel, detailData, auctionId, onSuccess }: QuickBidModalProps) {
  const { t } = useTranslation('auction')
  const { data: walletData } = useWallet({ enabled: open })
  const walletBalance = walletData?.availableBalance ?? 0

  const { data: myAutoBid } = useMyAutoBid(auctionId)

  const [bidAmount, setBidAmount] = useState<number | null>(null)
  const [autoBidModalOpen, setAutoBidModalOpen] = useState(false)
  const [autoBidMax, setAutoBidMax] = useState<number | null>(null)

  const placeBidMutation = usePlaceBid()
  const autoBidMutation = useConfigureAutoBid()
  const pauseAutoBidMutation = usePauseAutoBid()
  const resumeAutoBidMutation = useResumeAutoBid()
  const cancelAutoBidMutation = useCancelAutoBid()

  if (!detailData) return null

  const { auction, item, currentUserBidState, priceHistory } = detailData
  const currentPrice = auction?.currentPrice?.amount ?? 0
  const currency = auction?.currency ?? 'VND'
  const bidIncrement = auction?.bidIncrement?.amount ?? 50000
  const minBid = currentPrice + bidIncrement
  const insufficientBalance = walletBalance < minBid

  const handlePlaceBid = async () => {
    if (!bidAmount) return
    try {
      await placeBidMutation.mutateAsync({
        auctionId,
        amount: bidAmount,
        currency
      })
      message.success(t('bidPlaced', 'Bid placed successfully'))
      setBidAmount(null)
      onSuccess?.()
      onCancel()
    } catch (err: any) {
      message.error(normalizeErrorMessage(err, t('bidError', 'Failed to place bid')))
    }
  }

  const handleAutoBid = async () => {
    if (!autoBidMax) return
    try {
      await autoBidMutation.mutateAsync({
        auctionId,
        maxAmount: autoBidMax,
        currency
      })
      message.success(t('autoBidConfigured', 'Auto-bid configured'))
      setAutoBidModalOpen(false)
      onSuccess?.()
    } catch {
      message.error(t('autoBidError', 'Failed to configure auto-bid'))
    }
  }

  return (
    <>
      <Modal
        title={
          <Flex align="center" gap={12}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--color-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ThunderboltOutlined style={{ color: 'var(--color-accent)', fontSize: 20 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ fontSize: 16, display: 'block' }}>{t('quickBid', 'Quick Bid')}</Text>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item?.title}</Text>
            </div>
          </Flex>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        width={500}
        centered
        style={{ borderRadius: 24 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <div style={{ padding: '0' }}>
          {/* Price Summary */}
          <Flex justify="space-between" align="flex-end" style={{ marginBottom: 20 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {t('currentPrice', 'Current Price')}
              </Text>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: MONO_FONT, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
                <PriceDisplay amount={currentPrice} currency={currency} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontWeight: 600 }}>
                <WalletOutlined /> {t('walletBalance', 'Balance')}
              </Text>
              <div style={{ fontSize: 14, fontWeight: 600, color: insufficientBalance ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {formatCurrency(walletBalance, currency)}
              </div>
            </div>
          </Flex>

          {currentUserBidState && currentUserBidState.position !== 'none' && (
            <div style={{ marginBottom: 16 }}>
              <BidderPositionBlock position={currentUserBidState.position} currency={currency} />
            </div>
          )}

          <Divider style={{ margin: '16px 0' }} />

          <BidForm
            currentPrice={currentPrice}
            minBid={minBid}
            bidIncrement={bidIncrement}
            currency={currency}
            walletBalance={walletBalance}
            bidAmount={bidAmount}
            onBidAmountChange={setBidAmount}
            onPlaceBid={handlePlaceBid}
            isPlacingBid={placeBidMutation.isPending}
            insufficientBalance={insufficientBalance}
            myAutoBid={myAutoBid}
            onAutoBidClick={() => {
              setAutoBidMax(myAutoBid?.maxAmount?.amount ?? null)
              setAutoBidModalOpen(true)
            }}
            onPauseAutoBid={() => pauseAutoBidMutation.mutateAsync(auctionId)}
            onResumeAutoBid={() => resumeAutoBidMutation.mutateAsync(auctionId)}
            onModifyAutoBid={() => {
              setAutoBidMax(myAutoBid?.maxAmount?.amount ?? null)
              setAutoBidModalOpen(true)
            }}
            onCancelAutoBid={() => cancelAutoBidMutation.mutateAsync(auctionId)}
            isPauseLoading={pauseAutoBidMutation.isPending}
            isResumeLoading={resumeAutoBidMutation.isPending}
            isCancelLoading={cancelAutoBidMutation.isPending}
            priceHistory={priceHistory}
            canBid={true}
          />
        </div>
      </Modal>

      {/* Auto-bid Modal */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <RobotOutlined style={{ color: 'var(--color-accent)' }} />
            {t('configureAutoBid', 'Configure Auto-Bid')}
          </Flex>
        }
        open={autoBidModalOpen}
        onCancel={() => setAutoBidModalOpen(false)}
        onOk={handleAutoBid}
        confirmLoading={autoBidMutation.isPending}
        okText={t('confirmAutoBid', 'Confirm Auto-Bid')}
        okButtonProps={{ 
          disabled: !autoBidMax || autoBidMax <= currentPrice || autoBidMax > walletBalance,
          style: { borderRadius: 8, background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        centered
        style={{ borderRadius: 20 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('autoBidExplain', 'The system will automatically place bids on your behalf up to your maximum amount when you are outbid.')}
          </Text>
          <Alert
            type="warning"
            showIcon
            message={t('autoBidCascadeWarning', 'In competitive situations, multiple auto-bids may fire rapidly.')}
            style={{ fontSize: 12, borderRadius: 8 }}
          />
          <div style={{ marginTop: 4 }}>
            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>{t('maxAmount', 'Maximum Amount')}</Text>
            <InputNumber
              style={{ width: '100%', height: 44, borderRadius: 8 }}
              size="large"
              min={minBid}
              max={walletBalance > 0 ? walletBalance : undefined}
              step={bidIncrement}
              value={autoBidMax}
              onChange={(v) => setAutoBidMax(v)}
              addonAfter={currency}
              status={autoBidMax && autoBidMax > walletBalance ? 'error' : undefined}
              placeholder={formatCurrency(minBid, currency)}
              formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
              parser={(v) => {
                const parsed = (v ?? '').replace(/\$\s?|(,*)/g, '')
                return parsed ? Number(parsed) : (null as any)
              }}
            />
            <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
              {t('mustBeHigherThan', 'Must be higher than current price')}: {formatCurrency(currentPrice, currency)}
            </Text>
            {autoBidMax != null && autoBidMax > walletBalance && (
              <Text type="danger" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                {t('autoBidExceedsBalance', 'Maximum amount cannot exceed your wallet balance')} ({formatCurrency(walletBalance, currency)})
              </Text>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
