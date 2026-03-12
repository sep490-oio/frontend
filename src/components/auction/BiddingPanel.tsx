/**
 * BiddingPanel — the main interactive component on the Auction Detail page.
 *
 * This orchestrator component replaces the static pricing Card that was
 * previously inline in AuctionDetailPage. It combines:
 *
 * 1. EXISTING display (moved from page): status badges, title, category,
 *    pricing rows, countdown, stats, anti-sniping info
 * 2. NEW interactive sections (based on auction phase):
 *    - Qualifying → QualificationSection (deposit flow)
 *    - Active Open → BidForm + optional Buy-Now button
 *    - Active Sealed → SealedBidForm
 *    - Ended/Sold/Cancelled/Failed → AuctionResult
 * 3. WatchButton (always visible unless ended)
 *
 * Phase detection uses the same logic as the original page but is now
 * encapsulated here so the parent page stays clean (~200 lines vs ~440).
 */

import { useState } from 'react';
import {
  Card,
  Tag,
  Space,
  Typography,
  Flex,
  Divider,
  Tooltip,
  Button,
} from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  UserOutlined,
  ThunderboltOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Auction, Bid } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  formatVND,
  formatCountdown,
  CONDITION_KEYS,
  STATUS_KEYS,
  STATUS_COLORS,
} from '@/utils/formatters';
import { useIsWatching } from '@/hooks/useMyBids';
import { WatchButton } from './WatchButton';
import { AuctionResult } from './AuctionResult';
import { QualificationSection } from './QualificationSection';
import { BidForm } from './BidForm';
import { SealedBidForm } from './SealedBidForm';
import { BuyNowConfirmModal } from './BuyNowConfirmModal';
import { AutoBidForm } from './AutoBidForm';

const { Title, Text } = Typography;

interface BiddingPanelProps {
  auction: Auction;
  bids: Bid[];
  /** SignalR hub placeBid action — undefined when not connected */
  hubPlaceBid?: (amount: number, currency: string) => Promise<void>;
  /** SignalR hub buyNow action — undefined when not connected */
  hubBuyNow?: () => Promise<void>;
  /** SignalR hub configureAutoBid action — undefined when not connected */
  hubConfigureAutoBid?: (maxAmount: number, currency: string, incrementAmount?: number) => Promise<void>;
  /** Whether SignalR is connected */
  isConnected?: boolean;
}

export function BiddingPanel({ auction, hubPlaceBid, hubBuyNow, hubConfigureAutoBid, isConnected }: BiddingPanelProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  // Cross-reference watchlist to get real isWatching status
  // (BE doesn't return isWatching in GET /api/auctions/{id})
  const isWatchingFromList = useIsWatching(auction.id);

  // ─── Phase detection ──────────────────────────────────────────
  const isActive = auction.status === 'active';
  const isEnded = ['ended', 'sold', 'cancelled', 'failed'].includes(
    auction.status
  );
  const isSealed = auction.auctionType === 'sealed';

  // Determine countdown target
  const countdownTarget = auction.actualEndTime ?? auction.endTime;

  // Reserve price status
  const hasReserve = auction.reservePrice !== null;
  const reserveMet =
    hasReserve && auction.currentPrice !== null
      ? auction.currentPrice >= auction.reservePrice!
      : false;

  // Whether the user is qualified for bidding
  // Bypass deposit requirement until BE delivers /api/auctions/{id}/qualify
  // When ready, set VITE_BYPASS_DEPOSIT=false in .env to re-enable
  const BYPASS_DEPOSIT = import.meta.env.VITE_BYPASS_DEPOSIT !== 'false';
  const isQualified = BYPASS_DEPOSIT || auction.currentUserDeposit !== null;

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        {/* ─── Status + type badges ────────────────────────────────── */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Space size={8}>
            <Tag color={STATUS_COLORS[auction.status]}>
              {t(STATUS_KEYS[auction.status])}
            </Tag>
            {isSealed && (
              <Tag icon={<LockOutlined />}>{t('auction.typeSealed')}</Tag>
            )}
            {auction.isFeatured && (
              <Tag color="gold" icon={<FireOutlined />}>
                {t('auction.featured')}
              </Tag>
            )}
          </Space>

          {/* Watch button — always visible */}
          <WatchButton
            auctionId={auction.id}
            isWatching={isWatchingFromList || auction.isWatching}
            watchCount={auction.watchCount}
          />
        </Flex>

        {/* ─── Item title ──────────────────────────────────────────── */}
        <Title level={isMobile ? 4 : 3} style={{ marginTop: 0, marginBottom: 8 }}>
          {auction.item?.title}
        </Title>

        {/* ─── Category + condition + verification ─────────────────── */}
        <Space size={4} wrap style={{ marginBottom: 16 }}>
          {auction.item?.categoryName && (
            <Tag>{auction.item.categoryName}</Tag>
          )}
          {auction.item?.condition && (
            <Tag color="blue">
              {t(CONDITION_KEYS[auction.item.condition])}
            </Tag>
          )}
          {auction.item?.verificationStatus === 'verified' && (
            <Tag color="green" icon={<SafetyCertificateOutlined />}>
              {t('auction.verified')}
            </Tag>
          )}
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        {/* ─── Pricing section ─────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          {/* Current price (large) or sealed message */}
          {isSealed && isActive ? (
            <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
              <LockOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />
              <Text style={{ fontSize: 22, fontWeight: 700, color: '#8c8c8c' }}>
                {t('auction.sealedPrice')}
              </Text>
            </Flex>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {auction.currentPrice
                  ? t('auction.currentPrice')
                  : t('auction.startingPrice')}
              </Text>
              <div>
                <Text style={{ fontSize: 28, fontWeight: 700, color: '#1677ff' }}>
                  {formatVND(auction.currentPrice ?? auction.startingPrice)}
                </Text>
              </div>
            </div>
          )}

          {/* Starting price (shown if current price differs) */}
          {auction.currentPrice && (
            <Flex justify="space-between" style={{ marginBottom: 4 }}>
              <Text type="secondary">{t('auction.startingPrice')}</Text>
              <Text>{formatVND(auction.startingPrice)}</Text>
            </Flex>
          )}

          {/* Bid increment */}
          <Flex justify="space-between" style={{ marginBottom: 4 }}>
            <Text type="secondary">{t('auctionDetail.bidIncrement')}</Text>
            <Text>{formatVND(auction.bidIncrement)}</Text>
          </Flex>

          {/* Buy now price */}
          {auction.buyNowPrice && (
            <Flex justify="space-between" style={{ marginBottom: 4 }}>
              <Text type="secondary">{t('auction.buyNow')}</Text>
              <Text strong style={{ color: '#fa8c16' }}>
                {formatVND(auction.buyNowPrice)}
              </Text>
            </Flex>
          )}

          {/* Reserve price indicator */}
          {hasReserve && (
            <Flex justify="space-between" style={{ marginBottom: 4 }}>
              <Text type="secondary">{t('auctionDetail.reservePrice')}</Text>
              <Tag color={reserveMet ? 'green' : 'orange'}>
                {reserveMet
                  ? t('auctionDetail.reserveMet')
                  : t('auctionDetail.reserveNotMet')}
              </Tag>
            </Flex>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* ─── Deposit info ─────────────────────────────────────────── */}
        {auction.depositAmount && (
          <Flex justify="space-between" style={{ marginBottom: 12 }}>
            <Text type="secondary">{t('auctionDetail.depositInfo')}</Text>
            <Text>
              {t('auctionDetail.depositAmount', {
                percentage: auction.depositPercentage,
                amount: formatVND(auction.depositAmount),
              })}
            </Text>
          </Flex>
        )}

        {/* ─── Countdown ───────────────────────────────────────────── */}
        {!isEnded && (
          <Flex
            align="center"
            gap={8}
            style={{
              padding: '8px 12px',
              background: isActive ? '#f6ffed' : '#fff7e6',
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            <ClockCircleOutlined
              style={{ color: isActive ? '#52c41a' : '#fa8c16' }}
            />
            <Text>
              {t('auction.endsIn')}:{' '}
              <Text strong>
                {formatCountdown(countdownTarget, t)}
              </Text>
            </Text>
          </Flex>
        )}

        {/* ─── Interactive section (phase-dependent) ────────────────── */}
        <div style={{ marginBottom: 12 }}>
          {/* NOT QUALIFIED → deposit flow */}
          {isActive && !isQualified && <QualificationSection auction={auction} />}

          {/* ACTIVE OPEN + QUALIFIED → bid form + optional buy-now */}
          {isActive && !isSealed && isQualified && (
            <Flex vertical gap={12}>
              <BidForm auction={auction} hubPlaceBid={hubPlaceBid} />
              {auction.buyNowPrice && isQualified && (
                <Button
                  size="large"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setBuyNowOpen(true)}
                  style={{ color: '#fa8c16', borderColor: '#fa8c16' }}
                >
                  {t('bidding.buyNowButton')} — {formatVND(auction.buyNowPrice)}
                </Button>
              )}
              <Divider style={{ margin: '8px 0' }} />
              <AutoBidForm
                auction={auction}
                hubConfigureAutoBid={hubConfigureAutoBid}
              />
            </Flex>
          )}

          {/* ACTIVE SEALED → sealed bid form */}
          {isActive && isSealed && <SealedBidForm auction={auction} />}

          {/* ENDED → auction result */}
          {isEnded && <AuctionResult auction={auction} />}
        </div>

        {/* ─── SignalR connection status ──────────────────────────── */}
        {isConnected !== undefined && (
          <Flex align="center" gap={6} style={{ marginBottom: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#52c41a' : '#d9d9d9',
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {isConnected
                ? t('bidding.liveConnection')
                : t('bidding.noConnection')}
            </Text>
          </Flex>
        )}

        {/* ─── Stats row ───────────────────────────────────────────── */}
        <Flex wrap="wrap" gap={16} style={{ marginBottom: 12 }}>
          <Tooltip title={t('auction.bidCount', { count: auction.bidCount })}>
            <Text type="secondary">
              {t('auction.bidCount', { count: auction.bidCount })}
            </Text>
          </Tooltip>
          <Tooltip
            title={t('auction.qualifiedCount', { count: auction.qualifiedCount })}
          >
            <Text type="secondary">
              <UserOutlined style={{ marginRight: 4 }} />
              {t('auction.qualifiedCount', { count: auction.qualifiedCount })}
            </Text>
          </Tooltip>
          <Text type="secondary">
            <EyeOutlined style={{ marginRight: 4 }} />
            {t('auctionDetail.viewCount', { count: auction.viewCount })}
          </Text>
        </Flex>

        {/* ─── Anti-sniping info ────────────────────────────────────── */}
        {auction.autoExtend && (
          <Flex align="center" gap={4}>
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('auctionDetail.antiSniping')} ·{' '}
              {t('auctionDetail.extensionMinutes', {
                minutes: auction.extensionMinutes,
              })}
            </Text>
          </Flex>
        )}

      </Card>

      {/* ─── Buy-now modal ──────────────────────────────────────── */}
      {auction.buyNowPrice && (
        <BuyNowConfirmModal
          open={buyNowOpen}
          onClose={() => setBuyNowOpen(false)}
          auction={auction}
          hubBuyNow={hubBuyNow}
        />
      )}
    </>
  );
}
