import React from 'react'
import { Button, Flex } from 'antd'
import { EyeOutlined, HeartFilled, HeartOutlined, LinkOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { MAX_EXTENSIONS_PER_AUCTION } from '@/utils/constants'

export interface AuctionPriceHeaderProps {
  auction: {
    status: string
    auctionType: string
    startTime?: string
    endTime?: string
    startingPrice?: { amount: number }
    reservePrice?: { amount: number } | null
    isReserveMet?: boolean
    buyNowPrice?: { amount: number } | null
    bidIncrement?: { amount: number }
    autoExtend?: boolean
    extensionMinutes?: number
    extensionCount?: number
    verifyByPlatform?: boolean
    qualificationStartAt?: string
    qualificationEndAt?: string
    sellerId?: string
    isEndingSoon?: boolean
  }
  item?: { condition?: string }
  currentPrice: number
  currency: string
  bidCount: number
  watchCount: number
  viewCount: number
  endTime?: string
  isActive: boolean
  isScheduled: boolean
  hubConnected: boolean
  isWatching: boolean
  onWatch: () => void
  watchLoading: boolean
  onCountdownEnd?: () => void
}

export const AuctionPriceHeader: React.FC<AuctionPriceHeaderProps> = ({
  auction,
  item,
  currentPrice,
  currency,
  bidCount,
  watchCount,
  viewCount,
  endTime,
  isActive,
  isScheduled,
  hubConnected,
  isWatching,
  onWatch,
  watchLoading,
  onCountdownEnd,
}) => {
  const { t } = useTranslation()

  return (
    <>
      {/* 1. Status badges + inline watch button */}
      <Flex gap={8} align="center" wrap="wrap" style={{ marginBottom: 8 }}>
        <StatusBadge status={auction.status} />
        <StatusBadge status={auction.auctionType} />
        {item?.condition && <StatusBadge status={item.condition} size="small" />}
        <Button
          type="text"
          size="small"
          icon={isWatching ? <HeartFilled style={{ color: '#C4513D' }} /> : <HeartOutlined />}
          onClick={onWatch}
          loading={watchLoading}
          style={{
            marginLeft: 'auto',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            padding: '0 6px',
            height: 24,
            minWidth: 24,
          }}
        />
      </Flex>

      <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />

      {/* 2. Urgency header — only when active & < 1 hour left */}
      {isActive && endTime && auction.isEndingSoon && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(196, 81, 61, 0.08)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-danger)' }}>
            ⏰ {t('endingSoon', 'Sắp kết thúc')}
          </span>
        </div>
      )}

      {/* 3. Current bid section */}
      <span className="oio-label" style={{ display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
        {t('currentBid', 'GIÁ HIỆN TẠI')}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <PriceDisplay amount={currentPrice} currency={currency} size="large" />
      </div>

      {/* Starting price */}
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
        {t('startingPrice', 'Gia khoi diem')}: {formatCurrency(auction.startingPrice?.amount ?? 0, currency)}
      </div>

      {/* Reserve indicator */}
      {auction.reservePrice != null && (
        <div style={{ fontSize: 13, marginTop: 4, fontWeight: 500 }}>
          {auction.isReserveMet ? (
            <span style={{ color: 'var(--color-success)' }}>&#10003; {t('reserveMet', 'Reserve met')}</span>
          ) : (
            <span style={{ color: 'var(--color-danger)' }}>&#10007; {t('reserveNotMet', 'Reserve not met')}</span>
          )}
        </div>
      )}

      {/* Buy now price */}
      {auction.buyNowPrice != null && (
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {t('buyNowPrice', 'Mua ngay')}: {formatCurrency(auction.buyNowPrice.amount, currency)}
        </div>
      )}

      {/* Bid increment */}
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
        {t('bidIncrement', 'Buoc gia')}: {formatCurrency(auction.bidIncrement?.amount ?? 0, currency)}
      </div>

      {/* 4. Timing section */}
      <div style={{ marginTop: 16 }}>
        {/* SignalR connection indicator */}
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
              background: hubConnected ? 'var(--color-success)' : 'var(--color-danger)',
            }} />
            {hubConnected ? t('liveConnection', 'Live') : t('reconnecting', 'Reconnecting...')}
          </div>
        )}

        {isActive && endTime && (
          <div style={{ marginBottom: 8 }}>
            <span className="oio-label" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
              {t('timeRemaining', 'Thoi gian con lai')}
            </span>
            <CountdownTimer
              endTime={endTime}
              size="large"
              onEnd={onCountdownEnd}
            />
          </div>
        )}

        {isScheduled && auction.startTime && (
          <div style={{ marginBottom: 8 }}>
            <span className="oio-label" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
              {t('startsIn', 'Bat dau sau')}
            </span>
            <CountdownTimer
              endTime={auction.startTime}
              size="large"
              onEnd={onCountdownEnd}
            />
          </div>
        )}

        {auction.startTime && (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('startTime', 'Bat dau')}: {formatDateTime(auction.startTime)}
          </div>
        )}
        {auction.endTime && (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('endTime', 'Ket thuc')}: {formatDateTime(endTime ?? auction.endTime)}
          </div>
        )}

        {/* Auto-extend info */}
        {auction.autoExtend && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {t('autoExtend', 'Tu dong gia han')}: {t('yes', 'Co')}, +{auction.extensionMinutes}{t('min', 'min')} (max {MAX_EXTENSIONS_PER_AUCTION}, {t('used', 'da dung')} {auction.extensionCount})
          </div>
        )}
      </div>

      {/* 5. Compact stats row */}
      <Flex
        gap={16}
        align="center"
        wrap="wrap"
        style={{
          marginTop: 12,
          fontSize: 12,
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>{t('bids', 'Bids')}: <strong>{bidCount}</strong></span>
        <span><EyeOutlined style={{ marginRight: 2 }} />{viewCount}</span>
        <span><HeartOutlined style={{ marginRight: 2 }} />{watchCount}</span>
        {auction.autoExtend && (
          <span>{t('extensions', 'Ext')}: {auction.extensionCount}/{MAX_EXTENSIONS_PER_AUCTION}</span>
        )}
        <Button
          type="text"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            // Note: message.success would need to be passed as prop or use App.useApp
          }}
          style={{ color: 'var(--color-text-secondary)' }}
        />
      </Flex>
    </>
  )
}

export default AuctionPriceHeader
