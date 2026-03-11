/**
 * AutoBidForm — configure proxy bidding for open auctions.
 *
 * Allows the user to set a maximum amount and optional custom increment.
 * The system then automatically places the minimum winning bid on
 * the user's behalf until the max is reached or they are outbid.
 *
 * If an auto-bid already exists, shows status + pause/resume controls.
 *
 * Primary channel: SignalR `ConfigureAutoBid` action (real-time).
 * Fallback: REST PUT /api/auctions/:id/auto-bid.
 */

import { useState } from 'react';
import {
  Button,
  InputNumber,
  Flex,
  Typography,
  Alert,
  Tag,
  Collapse,
  message,
} from 'antd';
import {
  RobotOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Auction, AutoBidStatus } from '@/types';
import {
  useConfigureAutoBid,
  usePauseAutoBid,
  useResumeAutoBid,
} from '@/hooks/useBidding';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND } from '@/utils/formatters';

const { Text } = Typography;

interface AutoBidFormProps {
  auction: Auction;
  /** SignalR hub configureAutoBid action — if provided, used as primary channel */
  hubConfigureAutoBid?: (
    maxAmount: number,
    currency: string,
    incrementAmount?: number,
  ) => Promise<void>;
}

/** Maps auto-bid status to Ant Design Tag color */
const STATUS_TAG_COLOR: Record<AutoBidStatus, string> = {
  active: 'green',
  paused: 'orange',
  exhausted: 'red',
  won: 'blue',
  outbid: 'volcano',
};

/** Maps auto-bid status to existing i18n key suffix */
const STATUS_I18N_KEY: Record<AutoBidStatus, string> = {
  active: 'bidding.autoBidActive',
  paused: 'bidding.autoBidPaused',
  exhausted: 'bidding.autoBidExhausted',
  won: 'bidding.autoBidWon',
  outbid: 'bidding.autoBidOutbid',
};

export function AutoBidForm({ auction, hubConfigureAutoBid }: AutoBidFormProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

  const configureAutoBid = useConfigureAutoBid();
  const pauseAutoBidMut = usePauseAutoBid();
  const resumeAutoBidMut = useResumeAutoBid();

  const existingAutoBid = auction.currentUserAutoBid;
  const minBid = auction.minimumBidAmount;

  // Form state — prefill from existing config if available
  const [maxAmount, setMaxAmount] = useState<number | null>(
    existingAutoBid?.maxAmount ?? null,
  );
  const [incrementAmount, setIncrementAmount] = useState<number | null>(
    existingAutoBid?.incrementAmount ?? null,
  );
  const [hubLoading, setHubLoading] = useState(false);

  // ─── Submit handler ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!maxAmount || maxAmount < minBid) {
      message.warning(
        t('bidding.autoBidMaxAmountTooLow', { min: formatVND(minBid) }),
      );
      return;
    }

    // SignalR primary path
    if (hubConfigureAutoBid) {
      setHubLoading(true);
      try {
        await hubConfigureAutoBid(
          maxAmount,
          'VND',
          incrementAmount ?? undefined,
        );
        message.success(t('bidding.autoBidSuccess'));
      } catch {
        message.error(t('common.error'));
      } finally {
        setHubLoading(false);
      }
      return;
    }

    // REST fallback path
    configureAutoBid.mutate(
      {
        auctionId: auction.id,
        maxAmount,
        incrementAmount: incrementAmount ?? undefined,
      },
      {
        onSuccess: () => {
          message.success(t('bidding.autoBidSuccess'));
        },
        onError: () => {
          message.error(t('common.error'));
        },
      },
    );
  };

  // ─── Pause/Resume handlers ──────────────────────────────────────
  const handlePause = () => {
    pauseAutoBidMut.mutate(auction.id, {
      onSuccess: () => message.success(t('bidding.autoBidPaused')),
      onError: () => message.error(t('common.error')),
    });
  };

  const handleResume = () => {
    resumeAutoBidMut.mutate(auction.id, {
      onSuccess: () => message.success(t('bidding.autoBidSuccess')),
      onError: () => message.error(t('common.error')),
    });
  };

  const isSubmitting = hubLoading || configureAutoBid.isPending;
  const isPauseLoading = pauseAutoBidMut.isPending;
  const isResumeLoading = resumeAutoBidMut.isPending;

  // ─── Existing auto-bid status display ───────────────────────────
  const existingSection = existingAutoBid ? (
    <Flex vertical gap={8} style={{ marginBottom: 12 }}>
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={6}>
          <RobotOutlined />
          <Text strong>{t('bidding.autoBidTitle')}</Text>
        </Flex>
        <Tag color={STATUS_TAG_COLOR[existingAutoBid.status] ?? 'default'}>
          {t(STATUS_I18N_KEY[existingAutoBid.status] ?? 'bidding.autoBidActive')}
        </Tag>
      </Flex>

      <Flex justify="space-between">
        <Text type="secondary">{t('bidding.autoBidCurrentMax')}</Text>
        <Text strong>{formatVND(existingAutoBid.maxAmount)}</Text>
      </Flex>

      <Flex justify="space-between">
        <Text type="secondary">{t('bidding.autoBidTotalBids')}</Text>
        <Text>{existingAutoBid.totalAutoBids}</Text>
      </Flex>

      {existingAutoBid.incrementAmount && (
        <Flex justify="space-between">
          <Text type="secondary">{t('bidding.autoBidIncrement')}</Text>
          <Text>{formatVND(existingAutoBid.incrementAmount)}</Text>
        </Flex>
      )}

      {/* Pause / Resume buttons */}
      {(existingAutoBid.status === 'active' || existingAutoBid.status === 'paused') && (
        <Flex gap={8}>
          {existingAutoBid.status === 'active' ? (
            <Button
              icon={<PauseCircleOutlined />}
              onClick={handlePause}
              loading={isPauseLoading}
              block
            >
              {t('bidding.autoBidPause')}
            </Button>
          ) : (
            <Button
              icon={<PlayCircleOutlined />}
              onClick={handleResume}
              loading={isResumeLoading}
              block
            >
              {t('bidding.autoBidResume')}
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  ) : null;

  // ─── Configuration form ─────────────────────────────────────────
  const formSection = (
    <Flex vertical gap={10}>
      {/* Max amount input */}
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('bidding.autoBidMaxAmount')}
        </Text>
        <InputNumber<number>
          style={{ width: '100%' }}
          size={isMobile ? 'middle' : 'large'}
          value={maxAmount}
          onChange={(val) => setMaxAmount(val)}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          }
          parser={(value) => Number(value?.replace(/\./g, '') ?? 0)}
          addonAfter="VND"
          min={minBid}
          step={auction.bidIncrement}
          placeholder={formatVND(minBid)}
        />
      </div>

      {/* Increment amount input (optional) */}
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('bidding.autoBidIncrement')}
        </Text>
        <InputNumber<number>
          style={{ width: '100%' }}
          size={isMobile ? 'middle' : 'large'}
          value={incrementAmount}
          onChange={(val) => setIncrementAmount(val)}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          }
          parser={(value) => Number(value?.replace(/\./g, '') ?? 0)}
          addonAfter="VND"
          min={auction.bidIncrement}
          step={auction.bidIncrement}
          placeholder={t('bidding.autoBidIncrementHint', {
            default: formatVND(auction.bidIncrement),
          })}
        />
      </div>

      {/* Info alert */}
      <Alert
        type="info"
        showIcon
        message={t('bidding.autoBidDescription')}
        style={{ padding: '6px 12px' }}
      />

      {/* Submit button */}
      <Button
        type="primary"
        size={isMobile ? 'middle' : 'large'}
        block
        icon={<RobotOutlined />}
        onClick={handleSubmit}
        loading={isSubmitting}
        disabled={!maxAmount || maxAmount < minBid}
      >
        {existingAutoBid
          ? t('bidding.autoBidUpdate')
          : t('bidding.autoBidSubmit')}
      </Button>
    </Flex>
  );

  return (
    <div>
      {existingSection}
      <Collapse
        ghost
        size="small"
        items={[
          {
            key: 'autobid',
            label: (
              <Flex align="center" gap={6}>
                <RobotOutlined />
                <Text strong style={{ fontSize: 13 }}>
                  {existingAutoBid
                    ? t('bidding.autoBidUpdate')
                    : t('bidding.autoBidTitle')}
                </Text>
              </Flex>
            ),
            children: formSection,
          },
        ]}
      />
    </div>
  );
}
