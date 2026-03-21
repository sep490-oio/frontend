/**
 * QualificationSection — handles the deposit/qualification flow via VNPay.
 *
 * Two states:
 * 1. NOT qualified: Shows deposit amount and "Đặt cọc tham gia" button.
 *    Clicking redirects to VNPay payment page. After payment, user is
 *    redirected back and BE has created the deposit via IPN callback.
 * 2. QUALIFIED: Shows a success banner with deposit details and
 *    a "waiting for auction to start" or "ready to bid" message.
 *
 * Uses the shared ['wallet', 'me'] cache key — navigating from
 * Dashboard/Wallet won't trigger a duplicate fetch.
 */

import { Button, Alert, Flex, Typography, Tag, message } from 'antd';
import {
  CheckCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Auction } from '@/types';
import { useJoinAuction } from '@/hooks/useBidding';
import { useWalletData } from '@/hooks/useWallet';
import { formatVND } from '@/utils/formatters';

const { Text } = Typography;

/**
 * Maps backend deposit status values to their i18n keys.
 * Using a static map instead of dynamic key construction prevents
 * silent failures when new statuses are added without locale entries.
 */
const DEPOSIT_STATUS_KEY: Record<string, string> = {
  held: 'bidding.depositHeld',
  holding: 'bidding.depositHolding',
  converted_to_payment: 'bidding.depositConverted_to_payment',
  applied: 'bidding.depositApplied',
  returned: 'bidding.depositReturned',
  refunded: 'bidding.depositRefunded',
  forfeited: 'bidding.depositForfeited',
};

interface QualificationSectionProps {
  auction: Auction;
}

export function QualificationSection({ auction }: QualificationSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const joinAuction = useJoinAuction();
  const { data: wallet } = useWalletData();

  const depositAmount = auction.depositAmount ?? 0;
  const isQualified = auction.currentUserDeposit !== null;
  const isActive = auction.status === 'active';

  // ─── Already qualified: show success state ──────────────────
  if (isQualified) {
    const deposit = auction.currentUserDeposit!;
    return (
      <Alert
        type="success"
        icon={<CheckCircleOutlined />}
        showIcon
        message={t('bidding.qualified')}
        description={
          <Flex vertical gap={4} style={{ marginTop: 4 }}>
            <Text type="secondary">
              {isActive
                ? t('bidding.qualifiedReady')
                : t('bidding.qualifiedWaiting')}
            </Text>
            <Flex gap={8} align="center">
              <Text type="secondary">{formatVND(deposit.amount)}</Text>
              <Tag
                color={
                  deposit.status === 'held'
                    ? 'orange'
                    : deposit.status === 'converted_to_payment'
                      ? 'green'
                      : deposit.status === 'returned'
                        ? 'cyan'
                        : 'red'
                }
              >
                {t(DEPOSIT_STATUS_KEY[deposit.status] ?? 'bidding.depositHeld')}
              </Tag>
            </Flex>
          </Flex>
        }
      />
    );
  }

  // ─── Not qualified: show deposit flow ───────────────────────
  const availableBalance = wallet?.availableBalance ?? 0;
  const hasSufficientFunds = availableBalance >= depositAmount;
  const shortfall = depositAmount - availableBalance;

  const handleJoin = () => {
    joinAuction.mutate({ auctionId: auction.id, depositAmount }, {
      onSuccess: (paymentUrl) => {
        // Redirect user to VNPay payment page
        window.location.href = paymentUrl;
      },
      onError: () => {
        message.error(t('common.error'));
      },
    });
  };

  return (
    <Flex vertical gap={12}>
      {/* Deposit amount required */}
      <Alert
        type="info"
        showIcon
        message={t('bidding.depositRequired', {
          amount: formatVND(depositAmount),
        })}
        description={
          hasSufficientFunds ? (
            <Text type="secondary">
              {t('bidding.walletSufficient', {
                balance: formatVND(availableBalance),
              })}
            </Text>
          ) : (
            <Flex vertical gap={4}>
              <Text type="danger">
                {t('bidding.walletInsufficient', {
                  shortfall: formatVND(shortfall),
                })}
              </Text>
              <Button
                type="link"
                icon={<WalletOutlined />}
                onClick={() => navigate('/wallet')}
                style={{ padding: 0, height: 'auto' }}
              >
                {t('bidding.goToWallet')}
              </Button>
            </Flex>
          )
        }
      />

      {/* Join button */}
      <Button
        type="primary"
        size="large"
        block
        onClick={handleJoin}
        loading={joinAuction.isPending}
        disabled={!hasSufficientFunds}
      >
        {joinAuction.isPending
          ? t('bidding.joining')
          : t('bidding.joinAuction')}
      </Button>
    </Flex>
  );
}
