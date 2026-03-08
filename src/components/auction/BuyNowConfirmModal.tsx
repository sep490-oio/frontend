/**
 * BuyNowConfirmModal — confirmation modal for instant purchase.
 *
 * Buy-now allows a qualified bidder to purchase the item immediately
 * at the buyNowPrice, ending the auction. This is a significant action,
 * so we use a confirmation modal with clear warnings:
 *
 * - Shows the buy-now price prominently
 * - Warning: "Phiên đấu giá sẽ kết thúc ngay lập tức"
 * - Info alert: this is a simulated feature
 *
 * Same modal pattern as AddFundsModal/WithdrawModal:
 * full-width on mobile, 480px on desktop.
 */

import { Modal, Typography, Flex, Alert, message } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Auction } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useBuyNow } from '@/hooks/useBidding';
import { formatVND } from '@/utils/formatters';

const { Text } = Typography;

interface BuyNowConfirmModalProps {
  open: boolean;
  onClose: () => void;
  auction: Auction;
  /** SignalR hub buyNow action — if provided, used as primary channel */
  hubBuyNow?: () => Promise<void>;
}

export function BuyNowConfirmModal({ open, onClose, auction, hubBuyNow }: BuyNowConfirmModalProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const buyNow = useBuyNow();

  const handleConfirm = async () => {
    // SignalR primary path
    if (hubBuyNow) {
      try {
        await hubBuyNow();
        message.success(t('bidding.buyNowSuccess'));
        onClose();
      } catch {
        message.error(t('common.error'));
      }
      return;
    }

    // REST fallback
    buyNow.mutate(auction.id, {
      onSuccess: () => {
        message.success(t('bidding.buyNowSuccess'));
        onClose();
      },
      onError: () => {
        message.error(t('common.error'));
      },
    });
  };

  return (
    <Modal
      title={t('bidding.buyNowTitle')}
      open={open}
      onOk={handleConfirm}
      onCancel={onClose}
      okText={t('bidding.buyNowConfirmButton')}
      cancelText={t('common.cancel')}
      confirmLoading={buyNow.isPending}
      width={isMobile ? '100%' : 480}
      style={isMobile ? { top: 20 } : undefined}
    >
      <Flex vertical gap={16} style={{ marginTop: 16 }}>
        {/* Price display */}
        <Flex vertical align="center" gap={4}>
          <Text type="secondary">{t('bidding.buyNowConfirm', {
            amount: formatVND(auction.buyNowPrice ?? 0),
          })}</Text>
          <Text style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>
            {formatVND(auction.buyNowPrice ?? 0)}
          </Text>
        </Flex>

        {/* Warning: auction ends immediately */}
        <Alert
          type="warning"
          showIcon
          message={t('bidding.buyNowWarning')}
        />

        {/* Note: simulated feature */}
        <Alert
          type="info"
          showIcon
          message={t('bidding.buyNowNote')}
        />
      </Flex>
    </Modal>
  );
}
