import { useRef } from 'react'
import { Typography, Button, InputNumber, Popconfirm, Grid } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import type { InputNumberRef } from '@rc-component/input-number'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { AutoBidDashboard } from '@/features/auction/components/AutoBidDashboard'
import { PriceHistoryChart } from '@/features/auction/components/PriceHistoryChart'
import type { PriceHistoryPoint } from '@/types'
import { formatCurrency } from '@/utils/format'
import { MONO_FONT } from '@/styles/tokens'

const { useBreakpoint } = Grid

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
  isCancelLoading?: boolean
  // Price history
  priceHistory?: PriceHistoryPoint[]
  onExpandChart?: () => void
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
  isCancelLoading,
  priceHistory,
  onExpandChart,
}: BidFormProps) {
  const { t } = useTranslation('auction')
  const navigate = useNavigate()
  const inputRef = useRef<InputNumberRef | null>(null)
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const isBidInvalid = bidAmount != null && bidAmount < minBid
  const isBidReady = !!bidAmount && bidAmount >= minBid && !isPlacingBid && !disabled

  return (
    <div style={{ marginTop: 16, width: '100%' }}>
      {/* 1. Insufficient balance warning */}
      {insufficientBalance && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(196, 147, 61, 0.06)',
            border: '1px solid rgba(196, 147, 61, 0.15)',
          }}
        >
          <Typography.Text
            style={{ color: 'var(--color-accent)', fontWeight: 500, fontSize: 13 }}
          >
            {t('insufficientBalance', 'Top up your wallet to place a bid')}{' '}
            <a
              onClick={() => navigate('/me/wallet')}
              style={{
                color: 'var(--color-accent)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              {t('goToWallet', 'Go to Wallet')}
            </a>
          </Typography.Text>
        </div>
      )}

      {/* 2. Price History Chart (mini) */}
      {priceHistory && priceHistory.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            borderRadius: 8,
            border: '1px solid var(--color-border-light)',
            padding: '8px 4px',
            position: 'relative',
          }}
        >
          <PriceHistoryChart
            priceHistory={priceHistory}
            currency={currency}
            mode="inline"
            onExpand={onExpandChart}
          />
        </div>
      )}

      {/* 3. Quick bid increment buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[bidIncrement, bidIncrement * 2, bidIncrement * 5].map((inc) => (
          <button
            key={inc}
            type="button"
            onClick={() => onBidAmountChange((bidAmount || currentPrice || 0) + inc)}
            disabled={disabled}
            style={{
              flex: 1,
              minHeight: 44,
              padding: '8px 4px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-primary)',
              fontFamily: MONO_FONT,
              fontSize: isMobile ? 11 : 12,
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            +{formatCurrency(inc, currency)}
          </button>
        ))}
      </div>

      {/* 4. Bid amount input */}
      <label
        htmlFor="bid-amount-input"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {t('yourBidAmount', 'Your Bid Amount')}
      </label>
      <InputNumber
        id="bid-amount-input"
        ref={inputRef}
        style={{ width: '100%', height: 52, borderRadius: 8 }}
        size="large"
        min={minBid}
        step={bidIncrement}
        value={bidAmount}
        onChange={(v) => onBidAmountChange(v)}
        addonAfter={currency}
        placeholder={formatCurrency(minBid, currency)}
        formatter={(v) => (v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '')}
        parser={(v) => {
          const parsed = (v ?? '').replace(/\$\s?|(,*)/g, '')
          return parsed ? Number(parsed) : null as any
        }}
        status={isBidInvalid ? 'error' : undefined}
        disabled={disabled}
      />

      {isBidInvalid ? (
        <Typography.Text
          style={{
            fontSize: 12,
            color: 'var(--color-danger)',
            display: 'block',
            marginTop: 4,
          }}
        >
          {t('belowMinimum', 'Bid must be at least')} {formatCurrency(minBid, currency)}
        </Typography.Text>
      ) : (
        <Typography.Text
          style={{
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            display: 'block',
            marginTop: 4,
          }}
        >
          {t('minimumBid', 'Minimum Bid')}: {formatCurrency(minBid, currency)} (
          {t('currentPricePlusIncrement', 'current + increment')})
        </Typography.Text>
      )}

      {/* 5. Place Bid with confirmation */}
      <Popconfirm
        title={t('confirmBidTitle', 'Confirm Bid')}
        description={
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            <div>
              {t('bidAmount', 'Amount')}:{' '}
              <strong>{formatCurrency(bidAmount ?? 0, currency)}</strong>
            </div>
            <div>
              {t('currentPrice', 'Current Price')}: {formatCurrency(currentPrice, currency)}
            </div>
            <div>
              {t('minimumNextBid', 'Minimum Bid')}: {formatCurrency(minBid, currency)}
            </div>
            <div>
              {t('walletBalance', 'Wallet')}: {formatCurrency(walletBalance, currency)}
            </div>
          </div>
        }
        onConfirm={onPlaceBid}
        okText={t('confirmBid', 'Confirm')}
        cancelText={t('cancel', 'Cancel')}
        okButtonProps={{ loading: isPlacingBid, disabled: isPlacingBid }}
        disabled={!isBidReady}
      >
        <Button
          type="primary"
          block
          loading={isPlacingBid}
          disabled={!bidAmount || isBidInvalid || disabled}
          style={{
            height: 52,
            borderRadius: 8,
            fontWeight: 600,
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
        <div style={{ marginTop: 12 }}>
          <AutoBidDashboard
            autoBid={myAutoBid}
            currency={currency}
            onPause={onPauseAutoBid}
            onResume={onResumeAutoBid}
            onModify={onModifyAutoBid}
            onCancel={onCancelAutoBid}
            onCancelAutoBid={onCancelAutoBid}
            isPauseLoading={isPauseLoading}
            isResumeLoading={isResumeLoading}
            isCancelLoading={isCancelLoading}
          />
        </div>
      )}
    </div>
  )
}