import { useEffect, useRef } from 'react'
import { Typography, Button, InputNumber, Popconfirm } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { PriceDisplay as _PriceDisplay } from '@/components/ui/PriceDisplay'
import { AutoBidDashboard } from '@/features/auction/components/AutoBidDashboard'
import { PriceHistoryChart } from '@/features/auction/components/PriceHistoryChart'
import { formatCurrency } from '@/utils/format'

interface BidFormProps {
  currentPrice: number
  minBid: number
  bidIncrement: number
  currency: string
  walletBalance: number
  bidAmount: number | null
  onBidAmountChange: (v: number | null) => void
  onPlaceBid: () => void
  isPlacingBid: boolean
  insufficientBalance: boolean
  disabled?: boolean
  // Auto-bid
  myAutoBid?: {
    isEnabled: boolean
    maxAmount?: { amount: number; currency?: string }
    remainingBudget?: { amount: number; currency?: string }
    totalAutoBids?: number
    status?: string
    incrementAmount?: { amount: number; currency?: string }
  } | null
  onAutoBidClick: () => void
  onPauseAutoBid: () => Promise<void>
  onResumeAutoBid: () => Promise<void>
  onModifyAutoBid: () => void
  onCancelAutoBid: () => Promise<void>
  isPauseLoading: boolean
  isResumeLoading: boolean
  // Price history
  priceHistory?: { price: number; timestamp: string }[]
  // Outbid mode
  outbidMode?: boolean
}

export default function BidForm({
  currentPrice,
  minBid,
  bidIncrement,
  currency,
  walletBalance,
  bidAmount,
  onBidAmountChange,
  onPlaceBid,
  isPlacingBid,
  insufficientBalance,
  disabled,
  myAutoBid,
  onAutoBidClick,
  onPauseAutoBid,
  onResumeAutoBid,
  onModifyAutoBid,
  onCancelAutoBid,
  isPauseLoading,
  isResumeLoading,
  priceHistory,
  outbidMode,
}: BidFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLElement>(null)

  // Outbid mode: auto-focus input and pre-fill with minBid
  useEffect(() => {
    if (outbidMode) {
      onBidAmountChange(minBid)
      // Focus the input after a tick so the DOM is ready
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [outbidMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const bidInc = bidIncrement

  return (
    <div style={{ marginTop: 20 }}>
      {/* Outbid warning */}
      {outbidMode && (
        <div
          style={{
            marginBottom: 12,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(255, 77, 79, 0.06)',
            border: '1px solid rgba(255, 77, 79, 0.25)',
          }}
        >
          <Typography.Text style={{ color: 'var(--color-danger)', fontWeight: 600, fontSize: 13 }}>
            {t('outbidWarning', "You've been outbid!")}
          </Typography.Text>
        </div>
      )}

      {/* 1. Insufficient balance warning */}
      {insufficientBalance && (
        <div
          style={{
            marginBottom: 12,
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(196, 147, 61, 0.06)',
            border: '1px solid rgba(196, 147, 61, 0.15)',
          }}
        >
          <Typography.Text style={{ color: 'var(--color-accent)', fontWeight: 500, fontSize: 13 }}>
            {t('insufficientBalance', 'Ban can nap them tien vao vi de dat gia')}{' '}
            <a
              onClick={() => navigate('/me/wallet')}
              style={{ color: 'var(--color-accent)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {t('goToWallet', 'Di den vi')}
            </a>
          </Typography.Text>
        </div>
      )}

      {/* 2. Price History Chart (mini) */}
      {priceHistory && priceHistory.length > 0 && (
        <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border-light)', padding: '8px 4px' }}>
          <PriceHistoryChart priceHistory={priceHistory} currency={currency} />
        </div>
      )}

      {/* 3. Quick bid increment buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {[bidInc, bidInc * 2, bidInc * 5].map((inc) => (
          <button
            key={inc}
            type="button"
            onClick={() => onBidAmountChange((bidAmount || currentPrice || 0) + inc)}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 4,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            +{formatCurrency(inc, currency)}
          </button>
        ))}
      </div>

      {/* 4. Bid amount input */}
      <label
        htmlFor="bid-amount-input"
        style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}
      >
        {t('yourBidAmount', 'Your bid amount')}
      </label>
      <InputNumber
        id="bid-amount-input"
        ref={inputRef as any}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 8,
          ...(outbidMode ? { borderColor: 'var(--color-danger)' } : {}),
        }}
        size="large"
        min={minBid}
        step={bidIncrement}
        value={bidAmount}
        onChange={(v) => onBidAmountChange(v)}
        addonAfter={currency}
        placeholder={formatCurrency(minBid, currency)}
        status={bidAmount != null && bidAmount < minBid ? 'error' : outbidMode ? 'error' : undefined}
        disabled={disabled}
      />
      {bidAmount != null && bidAmount < minBid ? (
        <Typography.Text
          style={{ fontSize: 12, color: 'var(--color-danger)', display: 'block', marginTop: 4 }}
        >
          {t('belowMinimum', 'Bid must be at least')} {formatCurrency(minBid, currency)}
        </Typography.Text>
      ) : (
        <Typography.Text
          style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginTop: 4 }}
        >
          {t('minimumBid', 'Minimum bid')}: {formatCurrency(minBid, currency)} ({t('currentPricePlusIncrement', 'current + increment')})
        </Typography.Text>
      )}

      {/* 5. Place Bid with confirmation */}
      <Popconfirm
        title={t('confirmBidTitle', 'Confirm your bid')}
        description={
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            <div>{t('bidAmount', 'Bid amount')}: <strong>{formatCurrency(bidAmount ?? 0, currency)}</strong></div>
            <div>{t('currentPrice', 'Current price')}: {formatCurrency(currentPrice, currency)}</div>
            <div>{t('minimumNextBid', 'Min next bid')}: {formatCurrency(minBid, currency)}</div>
            <div>{t('walletBalance', 'Wallet')}: {formatCurrency(walletBalance, currency)}</div>
          </div>
        }
        onConfirm={onPlaceBid}
        okText={t('confirmBid', 'Confirm Bid')}
        cancelText={t('cancel', 'Cancel')}
        okButtonProps={{ loading: isPlacingBid, disabled: isPlacingBid }}
        disabled={!bidAmount || bidAmount < minBid || isPlacingBid || disabled}
      >
        <Button
          type="primary"
          block
          loading={isPlacingBid}
          disabled={!bidAmount || bidAmount < minBid || disabled}
          style={{
            height: 52,
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 15,
            marginTop: 12,
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
          }}
        >
          {t('placeBid', 'Place Bid')}
        </Button>
      </Popconfirm>

      {/* 6. Auto-Bid button */}
      <Button
        block
        icon={<RobotOutlined />}
        onClick={onAutoBidClick}
        disabled={disabled}
        style={{
          height: 44,
          borderRadius: 8,
          marginTop: 8,
          color: 'var(--color-text-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        {t('autoBid', 'Auto-Bid')}
      </Button>

      {/* 7. Auto-Bid Dashboard */}
      {myAutoBid && (
        <div style={{ marginTop: 8 }}>
          <AutoBidDashboard
            autoBid={myAutoBid}
            currency={currency}
            onPause={onPauseAutoBid}
            onResume={onResumeAutoBid}
            onModify={onModifyAutoBid}
            onCancel={onCancelAutoBid}
            isPauseLoading={isPauseLoading}
            isResumeLoading={isResumeLoading}
          />
        </div>
      )}
    </div>
  )
}
