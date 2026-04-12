import React from 'react'
import { Button, Flex, Grid } from 'antd'
import { EyeOutlined, HeartFilled, HeartOutlined, LinkOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { MAX_EXTENSIONS_PER_AUCTION } from '@/utils/constants'

const { useBreakpoint } = Grid

export interface AuctionPriceHeaderProps {
  auction: {
    status: string
    auctionType: string
    startTime?: string
    endTime?: string
    startingPrice?: { amount: number }
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
  serverTimeOffset?: number
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
  serverTimeOffset = 0,
}) => {
  const { t } = useTranslation()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Status badges + watch button */}
      <Flex gap={6} align="center" wrap="wrap" style={{ marginBottom: 10 }}>
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
            padding: '0 8px',
            height: 28,
            minWidth: 28,
          }}
        />
      </Flex>

      <div style={{ height: 1, background: 'var(--color-border)', marginBottom: 12 }} />

      {/* 2. Urgency banner */}
      {isActive && endTime && auction.isEndingSoon && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 10,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'rgba(196, 81, 61, 0.08)',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-danger)',
            }}
          >
            ⏰ {t('endingSoon', 'Sắp kết thúc')}
          </span>
        </div>
      )}

      {/* 3. Price + countdown — side by side on mobile, stacked on narrow */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div>
          <span
            className="oio-label"
            style={{
              display: 'block',
              marginBottom: 4,
              textTransform: 'uppercase',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.06em',
            }}
          >
            {t('currentBid', 'GIÁ HIỆN TẠI')}
          </span>
          <PriceDisplay amount={currentPrice} currency={currency} size="large" />
        </div>

        {/* Live connection + countdown inline on mobile */}
        {isActive && endTime && (
          <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
            {/* SignalR dot */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginBottom: 4,
                fontSize: 11,
                color: 'var(--color-text-secondary)',
                justifyContent: isMobile ? 'flex-start' : 'flex-end',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  display: 'inline-block',
                  background: hubConnected ? 'var(--color-success)' : 'var(--color-danger)',
                  flexShrink: 0,
                }}
              />
              {hubConnected ? t('liveConnection', 'Live') : t('reconnecting', 'Reconnecting...')}
            </div>
            <span
              className="oio-label"
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                display: 'block',
                marginBottom: 4,
                letterSpacing: '0.04em',
              }}
            >
              {t('timeRemaining', 'Thời gian còn lại')}
            </span>
            <CountdownTimer
              endTime={endTime}
              size="large"
              onEnd={onCountdownEnd}
              serverTimeOffset={serverTimeOffset}
            />
          </div>
        )}
      </div>

      {/* Meta info: starting price, buy now, increment */}
      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {t('startingPrice', 'Giá khởi điểm')}:{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(auction.startingPrice?.amount ?? 0, currency)}
          </strong>
        </span>
        {auction.buyNowPrice != null && (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {t('buyNowPrice', 'Mua ngay')}:{' '}
            <strong style={{ color: 'var(--color-accent)' }}>
              {formatCurrency(auction.buyNowPrice.amount, currency)}
            </strong>
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {t('bidIncrement', 'Bước giá')}:{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>
            {formatCurrency(auction.bidIncrement?.amount ?? 0, currency)}
          </strong>
        </span>
      </div>

      {/* Scheduled countdown */}
      {isScheduled && auction.startTime && (
        <div style={{ marginTop: 12 }}>
          <span
            className="oio-label"
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            {t('startsIn', 'Bắt đầu sau')}
          </span>
          <CountdownTimer
            endTime={auction.startTime}
            size="large"
            onEnd={onCountdownEnd}
            serverTimeOffset={serverTimeOffset}
          />
        </div>
      )}

      {/* Start/end datetime */}
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '2px 16px' }}>
        {auction.startTime && (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {t('startTime', 'Bắt đầu')}: {formatDateTime(auction.startTime)}
          </span>
        )}
        {auction.endTime && (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {t('endTime', 'Kết thúc')}: {formatDateTime(endTime ?? auction.endTime)}
          </span>
        )}
      </div>

      {/* Auto-extend info */}
      {auction.autoExtend && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {t('autoExtend', 'Tự động gia hạn')}: {t('yes', 'Có')}, +{auction.extensionMinutes}
          {t('min', 'min')} (max {MAX_EXTENSIONS_PER_AUCTION},{' '}
          {t('used', 'đã dùng')} {auction.extensionCount})
        </div>
      )}

      {/* 5. Stats row */}
      <Flex
        gap={12}
        align="center"
        wrap="wrap"
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid var(--color-border)',
          fontSize: 12,
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>
          {t('bids', 'Bids')}: <strong>{bidCount}</strong>
        </span>
        <span>
          <EyeOutlined style={{ marginRight: 3 }} />
          {viewCount}
        </span>
        <span>
          <HeartOutlined style={{ marginRight: 3 }} />
          {watchCount}
        </span>
        {auction.autoExtend && (
          <span>
            {t('extensions', 'Ext')}: {auction.extensionCount}/{MAX_EXTENSIONS_PER_AUCTION}
          </span>
        )}
        <Button
          type="text"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
          }}
          style={{ color: 'var(--color-text-secondary)', padding: '0 4px', height: 22 }}
        />
      </Flex>
    </div>
  )
}

export default AuctionPriceHeader