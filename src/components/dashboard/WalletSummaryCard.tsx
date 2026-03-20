/**
 * WalletSummaryCard — balance breakdown with quick action placeholders.
 *
 * Shows the 3 main balance types (available, locked, refund) with
 * color-coded dots, formatted in VND. Action buttons navigate to
 * the Wallet page where the user can add funds or withdraw.
 */

import { Card, Divider, Button, Space, Skeleton, Typography } from 'antd';
import {
  WalletOutlined,
  PlusOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Wallet } from '@/types';
import { formatVND } from '@/utils/formatters';

const { Text } = Typography;

interface WalletSummaryCardProps {
  wallet: Wallet | undefined;
  isLoading: boolean;
}

/** Color-coded balance row */
function BalanceRow({
  color,
  label,
  amount,
}: {
  color: string;
  label: string;
  amount: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
      }}
    >
      <Space size={8}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
        <Text type="secondary">{label}</Text>
      </Space>
      <Text strong>{formatVND(amount)}</Text>
    </div>
  );
}

export function WalletSummaryCard({
  wallet,
  isLoading,
}: WalletSummaryCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card
      title={
        <Space>
          <WalletOutlined />
          {t('dashboard.walletSummary')}
        </Space>
      }
      extra={
        <Button
          type="link"
          size="small"
          onClick={() => navigate('/wallet')}
        >
          {t('dashboard.goToWallet')} <ArrowRightOutlined />
        </Button>
      }
      style={{ height: '100%' }}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          <BalanceRow
            color="#52c41a"
            label={t('dashboard.available')}
            amount={wallet?.availableBalance ?? 0}
          />
          <BalanceRow
            color="#faad14"
            label={t('dashboard.locked')}
            amount={wallet?.lockedBalance ?? 0}
          />
          <BalanceRow
            color="#1677ff"
            label={t('dashboard.refund')}
            amount={wallet?.refundBalance ?? 0}
          />

          <Divider style={{ margin: '12px 0' }} />

          <Space style={{ width: '100%' }} direction="vertical" size={8}>
            <Button
              block
              icon={<PlusOutlined />}
              onClick={() => navigate('/wallet')}
            >
              {t('dashboard.addFunds')}
            </Button>
            <Button block onClick={() => navigate('/wallet')}>
              {t('dashboard.withdraw')}
            </Button>
          </Space>
        </>
      )}
    </Card>
  );
}
