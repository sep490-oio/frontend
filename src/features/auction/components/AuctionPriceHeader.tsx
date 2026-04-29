import React from 'react'
import { Button, Flex, Grid, message, Row, Col } from 'antd'
import { EyeOutlined, HeartFilled, HeartOutlined, LinkOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

import { CountdownTimer } from '@/components/ui/CountdownTimer'
import { PriceDisplay } from '@/components/ui/PriceDisplay'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { MAX_EXTENSIONS_PER_AUCTION } from '@/utils/constants'
import { Tooltip } from 'antd'

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
  const { t } = useTranslation('auction')
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
          icon={isWatching ? <HeartFilled style={{ color: 'var(--color-danger)' }} /> : <HeartOutlined />}
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
            background: 'var(--color-danger-soft)',
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
            ⏰ {t('endingSoon', 'Ending Soon')}
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
            {t('currentBid', 'Current Bid')}
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
              {t('timeRemaining', 'Time Remaining')}
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

      {/* 4. Pricing & Rules Information Grid */}
      <div 
        style={{ 
          marginTop: 16, 
          padding: '16px', 
          borderRadius: 12, 
          background: 'var(--color-bg-surface-soft)', 
          border: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <Row gutter={[24, 16]}>
          {/* Prices Row */}
          <Col xs={12} sm={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('startingPrice', 'Starting Price')}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {formatCurrency(auction.startingPrice?.amount ?? 0, currency)}
              </span>
            </div>
          </Col>

          {auction.buyNowPrice != null && (
            <Col xs={12} sm={8}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('buyNowPrice', 'Buy Now Price')}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-accent)' }}>
                  {formatCurrency(auction.buyNowPrice.amount, currency)}
                </span>
              </div>
            </Col>
          )}

          <Col xs={12} sm={8}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('bidIncrement', 'Bid Increment')}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {formatCurrency(auction.bidIncrement?.amount ?? 0, currency)}
              </span>
            </div>
          </Col>

          {/* Divider */}
          <Col span={24}>
            <div style={{ height: 1, background: 'var(--color-border-light)', opacity: 0.5 }} />
          </Col>

          {/* Timeline Row */}
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('startTime', 'Start Time')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {auction.startTime ? formatDateTime(auction.startTime) : '-'}
              </span>
            </div>
          </Col>

          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('endTime', 'End Time')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {auction.endTime ? formatDateTime(endTime ?? auction.endTime) : '-'}
              </span>
            </div>
          </Col>

          {/* Divider */}
          {auction.autoExtend && (
            <Col span={24}>
              <div style={{ height: 1, background: 'var(--color-border-light)', opacity: 0.5 }} />
            </Col>
          )}

          {/* Auto-Extend Row */}
          {auction.autoExtend && (
            <>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t('autoExtend', 'Auto-Extend')}
                    </span>
                    <Tooltip title={t('autoExtendTooltip', 'If a bid is placed in the final minutes, the auction end time will be extended to allow for counter-bids.')}>
                      <InfoCircleOutlined style={{ fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'help' }} />
                    </Tooltip>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-info)' }}>
                    {t('autoExtendEnabled', 'Enabled')} (+{auction.extensionMinutes} {t('timing.minutes', 'Phút')})
                  </span>
                </div>
              </Col>

              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {t('extensionsUsed', 'Extensions Used')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {auction.extensionCount} / {MAX_EXTENSIONS_PER_AUCTION}
                    </span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {Array.from({ length: MAX_EXTENSIONS_PER_AUCTION }).map((_, i) => (
                        <div 
                          key={i}
                          style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            background: i < (auction.extensionCount ?? 0) 
                              ? 'var(--color-info)' 
                              : 'var(--color-border-light)' 
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            </>
          )}
        </Row>
      </div>

      {/* Scheduled countdown - only if not already started */}
      {isScheduled && auction.startTime && (
        <div style={{ marginTop: 20, textAlign: 'center', padding: '16px', borderRadius: 12, background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <span
            className="oio-label"
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              display: 'block',
              marginBottom: 8,
              letterSpacing: '0.1em'
            }}
          >
            {t('startsIn', 'Starts In')}
          </span>
          <CountdownTimer
            endTime={auction.startTime}
            size="large"
            onEnd={onCountdownEnd}
            serverTimeOffset={serverTimeOffset}
          />
        </div>
      )}

      {/* 5. Stats row */}
      <div 
        style={{ 
          marginTop: 20, 
          paddingTop: 12, 
          borderTop: '1px solid var(--color-border-light)', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{bidCount}</span> {t('bids', 'Bids')}
          </span>
          <div style={{ width: 1, height: 12, background: 'var(--color-border-light)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <EyeOutlined />
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{viewCount}</span>
          </span>
          <div style={{ width: 1, height: 12, background: 'var(--color-border-light)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <HeartOutlined />
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{watchCount}</span>
          </span>
        </div>

        <Button
          type="text"
          size="small"
          icon={<LinkOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            message.success(t('linkCopied', 'Link copied to clipboard'))
          }}
          style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: 12, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            borderRadius: 6,
            background: 'var(--color-bg-surface-soft)',
            padding: '4px 8px',
            height: 28
          }}
        >
          {t('share', 'Share')}
        </Button>
      </div>
    </div>
  )
}

export default AuctionPriceHeader
