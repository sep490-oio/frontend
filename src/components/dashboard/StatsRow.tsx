/**
 * StatsRow — four quick stat cards at the top of the dashboard.
 *
 * Shows: Active Bids | Won | Wallet Balance | Watching
 * Responsive: 2 cards per row on mobile, 4 across on desktop.
 */

import { Row, Col, Card, Statistic, Skeleton } from 'antd';
import {
  ShoppingOutlined,
  TrophyOutlined,
  WalletOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { BidderDashboardStats } from '@/types';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatVND } from '@/utils/formatters';

interface StatsRowProps {
  stats: BidderDashboardStats;
  walletBalance: number;
  isLoading: boolean;
}

export function StatsRow({ stats, walletBalance, isLoading }: StatsRowProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();

  const cards = [
    {
      title: t('dashboard.activeBids'),
      value: stats.activeBidsCount,
      icon: <ShoppingOutlined style={{ color: '#52c41a' }} />,
      formatted: false,
    },
    {
      title: t('dashboard.won'),
      value: stats.wonCount,
      icon: <TrophyOutlined style={{ color: '#faad14' }} />,
      formatted: false,
    },
    {
      title: t('dashboard.walletBalance'),
      value: walletBalance,
      icon: <WalletOutlined style={{ color: '#1677ff' }} />,
      formatted: true,
    },
    {
      title: t('dashboard.watching'),
      value: stats.watchingCount,
      icon: <EyeOutlined />,
      formatted: false,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col xs={12} xl={6} key={card.title}>
          <Card styles={{ body: { padding: isMobile ? 12 : 24 } }}>
            {isLoading ? (
              <Skeleton active paragraph={false} />
            ) : (
              <Statistic
                title={
                  isMobile ? (
                    <>{card.icon} {card.title}</>
                  ) : (
                    card.title
                  )
                }
                value={card.formatted ? formatVND(card.value) : card.value}
                prefix={isMobile ? undefined : card.icon}
                styles={
                  isMobile
                    ? { content: { fontSize: 20, overflowWrap: 'break-word' } }
                    : undefined
                }
              />
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}
