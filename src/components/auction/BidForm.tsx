/**
 * BidForm — manual bid placement for open (English) auctions.
 *
 * Shows:
 * - User status badge (winning = green, outbid = orange)
 * - Minimum next bid amount
 * - InputNumber with VND formatter/parser (established pattern from Wallet)
 * - Quick-bid buttons: +1x, +2x, +3x increment (auto-fill amount)
 * - "Đặt giá" submit button
 *
 * Disabled if user is not qualified (shows "not qualified" message).
 *
 * The VND InputNumber pattern uses InputNumber<number> generic to avoid
 * the TypeScript literal type inference issue with min={0}.
 */

import { useState, useRef } from 'react';
import { Button, InputNumber, Flex, Typography, Alert, message } from 'antd';

// Global flag for cross-component communication between BidForm and onError handler.
// Set to true by onError in AuctionDetailPage when a bid is rejected by BE.
declare global {
  interface Window {
    __bidError?: boolean;
  }
}
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { Auction } from '@/types';
import { useAppSelector } from '@/app/hooks';
import { usePlaceBid } from '@/hooks/useBidding';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND } from '@/utils/formatters';

const { Text } = Typography;

interface BidFormProps {
  auction: Auction;
  /** SignalR hub placeBid action — if provided, used as primary channel */
  hubPlaceBid?: (amount: number, currency: string) => Promise<void>;
}

export function BidForm({ auction, hubPlaceBid }: BidFormProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const queryClient = useQueryClient();
  const placeBid = usePlaceBid();

  // Use BE-computed minimum bid amount (more reliable than FE calculation)
  const currentPrice = auction.currentPrice ?? auction.startingPrice;
  const minNextBid = auction.minimumBidAmount ?? (currentPrice + auction.bidIncrement);

  const [amount, setAmount] = useState<number | null>(minNextBid);
  const [hubLoading, setHubLoading] = useState(false);
  // Ref guard prevents double-submission when user clicks rapidly before React state updates
  const submittingRef = useRef(false);
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Bypass deposit requirement until BE delivers /api/auctions/{id}/qualify
  // When ready, set VITE_BYPASS_DEPOSIT=false in .env to re-enable
  const BYPASS_DEPOSIT = import.meta.env.VITE_BYPASS_DEPOSIT !== 'false';
  const isQualified = BYPASS_DEPOSIT || auction.currentUserDeposit !== null;

  // Check if the current user is currently winning.
  // Primary: bid with status 'winning'. Fallback: highest bid by amount.
  // The fallback handles eventual consistency — BE may update currentPrice
  // before updating bid statuses in the API response.
  const winningBid = auction.recentBids?.find((b) => b.status === 'winning');
  const highestBid = auction.recentBids?.length
    ? auction.recentBids.reduce((max, b) => (b.amount > max.amount ? b : max))
    : undefined;
  const effectiveWinner = winningBid ?? highestBid;
  const isWinning = !!userId && effectiveWinner?.bidderId === userId;

  // ─── Not qualified: show warning ──────────────────────────────
  if (!isQualified) {
    return (
      <Alert
        type="warning"
        showIcon
        message={t('bidding.notQualified')}
      />
    );
  }

  // ─── Winning/outbid status banner ─────────────────────────────
  const handleSubmit = async () => {
    // Prevent double-submission from rapid clicks
    if (submittingRef.current) return;
    if (!amount || amount < minNextBid) {
      message.warning(
        t('bidding.bidAmountTooLow', { min: formatVND(minNextBid) })
      );
      return;
    }

    // SignalR primary path — if hub is connected
    // NOTE: invoke('PlaceBid') resolves even on business errors — BE sends
    // a separate Error event to Clients.Caller instead of throwing.
    // We show an optimistic success toast with a stable key ('bid-toast'),
    // so the onError handler in AuctionDetailPage can REPLACE it with an
    // error message if the bid was actually rejected.
    if (hubPlaceBid) {
      submittingRef.current = true;
      setHubLoading(true);
      // Flag to track if onError fires during this bid attempt.
      // onError in AuctionDetailPage sets this to true (via window.__bidError).
      window.__bidError = false;
      try {
        message.loading({
          content: t('bidding.placing'),
          key: 'bid-toast',
          duration: 0,
        });
        await hubPlaceBid(amount, 'VND');
        // Wait for Error event to arrive (BE sends it before invoke resolves,
        // but JS event loop processes it after the await resumes)
        await new Promise((r) => setTimeout(r, 200));
        if (!window.__bidError) {
          message.success({
            content: t('bidding.bidSuccess', { amount: formatVND(amount) }),
            key: 'bid-toast',
          });
          setAmount(amount + auction.bidIncrement);
        }
        // Refresh auction data regardless
        await queryClient.invalidateQueries({ queryKey: ['auction', auction.id] });
        await queryClient.invalidateQueries({ queryKey: ['auctionBids', auction.id] });
      } catch {
        message.error({ content: t('common.error'), key: 'bid-toast' });
      } finally {
        setHubLoading(false);
        submittingRef.current = false;
      }
      return;
    }

    // REST fallback path
    placeBid.mutate(
      { auctionId: auction.id, amount },
      {
        onSuccess: (data) => {
          // BE may not return newCurrentPrice, or may wrap it in MoneyDto
          const newPrice = data.newCurrentPrice ?? amount;
          message.success(
            t('bidding.bidSuccess', { amount: formatVND(newPrice) })
          );
          setAmount(newPrice + auction.bidIncrement);
          // Refresh auction data + bid history
          queryClient.invalidateQueries({ queryKey: ['auction', auction.id] });
          queryClient.invalidateQueries({ queryKey: ['auctionBids', auction.id] });
        },
        onError: () => {
          message.error(t('common.error'));
        },
      }
    );
  };

  // Quick bid amounts: +1x, +2x, +3x the bid increment
  const quickBids = [1, 2, 3].map((multiplier) => ({
    label: `+${multiplier}x`,
    amount: currentPrice + auction.bidIncrement * multiplier,
  }));

  return (
    <Flex vertical gap={12}>
      {/* Winning/outbid status */}
      {isWinning ? (
        <Alert
          type="success"
          showIcon
          message={t('bidding.youAreWinning')}
          style={{ padding: '6px 12px' }}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          message={t('bidding.youAreOutbid')}
          style={{ padding: '6px 12px' }}
        />
      )}

      {/* Minimum next bid display */}
      <Flex justify="space-between" align="center">
        <Text type="secondary">{t('bidding.minNextBid')}</Text>
        <Text strong>{formatVND(minNextBid)}</Text>
      </Flex>

      {/* Bid amount input */}
      <InputNumber<number>
        style={{ width: '100%' }}
        size="large"
        value={amount}
        onChange={(val) => setAmount(val)}
        formatter={(value) =>
          `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        }
        parser={(value) => Number(value?.replace(/\./g, '') ?? 0)}
        addonAfter="VND"
        min={minNextBid}
        step={auction.bidIncrement}
        placeholder={formatVND(minNextBid)}
      />

      {/* Quick-bid buttons — wraps on narrow screens */}
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('bidding.quickBid')}:
        </Text>
        <Flex wrap="wrap" gap={8}>
          {quickBids.map((qb) => (
            <Button
              key={qb.label}
              size="small"
              onClick={() => setAmount(qb.amount)}
            >
              {isMobile ? qb.label : `${qb.label} (${formatVND(qb.amount)})`}
            </Button>
          ))}
        </Flex>
      </div>

      {/* Submit button */}
      <Button
        type="primary"
        size="large"
        block
        onClick={handleSubmit}
        loading={hubLoading || placeBid.isPending}
        disabled={!amount || amount < minNextBid}
      >
        {placeBid.isPending
          ? t('bidding.placing')
          : `${t('bidding.placeBid')} ${amount ? formatVND(amount) : ''}`}
      </Button>
    </Flex>
  );
}
