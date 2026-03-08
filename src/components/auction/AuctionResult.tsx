/**
 * AuctionResult — read-only display for ended auctions.
 *
 * Shows one of 4 states based on the auction outcome:
 * 1. Won — celebration message + final price + payment deadline
 * 2. Lost — deposit refunded note
 * 3. Cancelled — simple notice
 * 4. Failed — reason (not enough participants)
 *
 * The "won" check compares auction.winnerId to the current user ID.
 * In production, the API would return a boolean `isWinner` field,
 * but for mock data we compare IDs directly.
 */

import { Result, Typography, Flex, Tag, Button } from 'antd';
import {
  TrophyOutlined,
  CloseCircleOutlined,
  StopOutlined,
  WarningOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Auction } from '@/types';
import { useAppSelector } from '@/app/hooks';
import { formatVND } from '@/utils/formatters';

const { Text } = Typography;

interface AuctionResultProps {
  auction: Auction;
}

export function AuctionResult({ auction }: AuctionResultProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userId = useAppSelector((state) => state.auth.user?.id);

  // Determine if the current user won this auction
  const isWinner = !!userId && auction.winnerId === userId;
  const userParticipated = auction.currentUserDeposit !== null;
  const depositStatus = auction.currentUserDeposit?.status;

  // ─── Won ─────────────────────────────────────────────────────
  if (auction.status === 'sold' && isWinner) {
    return (
      <Result
        icon={<TrophyOutlined style={{ color: '#faad14' }} />}
        title={t('bidding.resultWon')}
        subTitle={t('bidding.paymentDeadline')}
        style={{ padding: '16px 0' }}
      >
        <Flex vertical align="center" gap={8}>
          <Text type="secondary">{t('bidding.finalPrice')}</Text>
          <Text style={{ fontSize: 24, fontWeight: 700, color: '#1677ff' }}>
            {formatVND(auction.currentPrice ?? auction.startingPrice)}
          </Text>
          {depositStatus === 'applied' && (
            <Tag color="green">{t('bidding.depositApplied')}</Tag>
          )}
          {/* Link to order page — order ID would come from the API */}
          <Button
            type="primary"
            icon={<ShoppingOutlined />}
            onClick={() => navigate('/orders')}
          >
            {t('bidding.viewOrder')}
          </Button>
        </Flex>
      </Result>
    );
  }

  // ─── Lost (sold to someone else) ─────────────────────────────
  if (auction.status === 'sold' && userParticipated) {
    return (
      <Result
        icon={<CloseCircleOutlined style={{ color: '#8c8c8c' }} />}
        title={t('bidding.resultLost')}
        style={{ padding: '16px 0' }}
      >
        <Flex vertical align="center" gap={8}>
          {depositStatus === 'refunded' && (
            <Text type="secondary">{t('bidding.depositRefundedNote')}</Text>
          )}
          {depositStatus === 'refunded' && (
            <Tag color="cyan">{t('bidding.depositRefunded')}</Tag>
          )}
        </Flex>
      </Result>
    );
  }

  // ─── Ended without winner (no bids or reserve not met) ───────
  if (auction.status === 'ended' || (auction.status === 'sold' && !userParticipated)) {
    return (
      <Result
        icon={<CloseCircleOutlined style={{ color: '#8c8c8c' }} />}
        title={t('bidding.resultLost')}
        style={{ padding: '16px 0' }}
      />
    );
  }

  // ─── Cancelled ───────────────────────────────────────────────
  if (auction.status === 'cancelled' || auction.status === 'emergency_stopped') {
    return (
      <Result
        icon={<StopOutlined style={{ color: '#ff4d4f' }} />}
        title={t('bidding.resultCancelled')}
        style={{ padding: '16px 0' }}
      >
        {userParticipated && depositStatus === 'refunded' && (
          <Text type="secondary">{t('bidding.depositRefundedNote')}</Text>
        )}
      </Result>
    );
  }

  // ─── Failed (not enough participants) ─────────────────────────
  if (auction.status === 'failed') {
    return (
      <Result
        icon={<WarningOutlined style={{ color: '#faad14' }} />}
        title={t('bidding.resultFailed')}
        subTitle={t('bidding.resultFailedReason')}
        style={{ padding: '16px 0' }}
      >
        {userParticipated && depositStatus === 'refunded' && (
          <Text type="secondary">{t('bidding.depositRefundedNote')}</Text>
        )}
      </Result>
    );
  }

  // Fallback: shouldn't happen, but just in case
  return null;
}
