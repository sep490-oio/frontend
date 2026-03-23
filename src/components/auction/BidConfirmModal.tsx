/**
 * BidConfirmModal — confirmation dialog before placing a bid.
 *
 * Supervisor requested this in the 14/03 meeting to prevent accidental bids.
 * Shows: item title, current price, YOUR bid amount, difference from current.
 * Warns on high-value bids (above 10M VND threshold).
 *
 * Same modal pattern as BuyNowConfirmModal:
 * full-width on mobile, 480px on desktop.
 */

import { Modal, Typography, Flex, Alert, Descriptions } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Auction } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND } from '@/utils/formatters';

const { Text } = Typography;

/** Bids above this threshold show a high-value warning */
const HIGH_VALUE_THRESHOLD = 10_000_000; // 10M VND

interface BidConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  auction: Auction;
  bidAmount: number;
  loading?: boolean;
}

export function BidConfirmModal({
  open,
  onConfirm,
  onCancel,
  auction,
  bidAmount,
  loading,
}: BidConfirmModalProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

  const currentPrice = auction.currentPrice ?? auction.startingPrice;
  const difference = bidAmount - currentPrice;
  const isHighValue = bidAmount >= HIGH_VALUE_THRESHOLD;

  return (
    <Modal
      title={t('bidConfirm.title')}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={t('bidConfirm.confirmButton')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      width={isMobile ? '100%' : 480}
      style={isMobile ? { top: 20 } : undefined}
    >
      <Flex vertical gap={16} style={{ marginTop: 16 }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label={t('bidConfirm.item')}>
            {auction.item?.title ?? '—'}
          </Descriptions.Item>
          <Descriptions.Item label={t('bidConfirm.currentPrice')}>
            {formatVND(currentPrice)}
          </Descriptions.Item>
          <Descriptions.Item label={t('bidConfirm.yourBid')}>
            <Text strong style={{ fontSize: 18, color: '#1677ff' }}>
              {formatVND(bidAmount)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('bidConfirm.increase')}>
            <Text type="success">+{formatVND(difference)}</Text>
          </Descriptions.Item>
        </Descriptions>

        {/* High-value bid warning */}
        {isHighValue && (
          <Alert
            type="warning"
            showIcon
            message={t('bidConfirm.highValueWarning', {
              amount: formatVND(bidAmount),
            })}
          />
        )}

        <Alert
          type="info"
          showIcon
          message={t('bidConfirm.irreversibleNote')}
        />
      </Flex>
    </Modal>
  );
}
