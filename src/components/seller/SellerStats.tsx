/**
 * SellerStats — trust metrics grid for the Seller Profile page.
 *
 * Displays 6 key reputation metrics in a responsive grid:
 * Trust Score, Average Rating, Total Sales, Success Rate,
 * Dispute Rate, Response Rate.
 *
 * Grid: 6 per row (xl) → 3 per row (md) → 2 per row (xs)
 */

import { Card, Row, Col, Statistic, Rate, Flex, Typography } from 'antd';
import {
  SafetyCertificateOutlined,
  StarOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { SellerProfileDetail } from '@/types';

const { Text } = Typography;

interface SellerStatsProps {
  seller: SellerProfileDetail;
}

export function SellerStats({ seller }: SellerStatsProps) {
  const { t } = useTranslation();
  const { profile } = seller;

  const successRate = profile.totalSalesCount > 0
    ? (profile.successfulSalesCount / profile.totalSalesCount) * 100
    : 0;

  const metrics = [
    {
      key: 'trust',
      icon: <SafetyCertificateOutlined />,
      label: t('sellerProfile.trustScore'),
      value: profile.trustScore,
      suffix: '/100',
      color: profile.trustScore >= 80 ? '#52c41a' : profile.trustScore >= 60 ? '#faad14' : '#ff4d4f',
    },
    {
      key: 'rating',
      label: t('sellerProfile.rating'),
      isRating: true,
      ratingValue: profile.ratingAverage,
      ratingCount: profile.ratingCount,
    },
    {
      key: 'sales',
      icon: <ShoppingCartOutlined />,
      label: t('sellerProfile.totalSales'),
      value: profile.totalSalesCount,
      color: '#1677ff',
    },
    {
      key: 'success',
      icon: <CheckCircleOutlined />,
      label: t('sellerProfile.successRate'),
      value: successRate,
      suffix: '%',
      precision: 1,
      color: successRate >= 95 ? '#52c41a' : successRate >= 85 ? '#faad14' : '#ff4d4f',
    },
    {
      key: 'dispute',
      icon: <WarningOutlined />,
      label: t('sellerProfile.disputeRate'),
      value: profile.disputeRate * 100,
      suffix: '%',
      precision: 2,
      color: profile.disputeRate <= 0.02 ? '#52c41a' : profile.disputeRate <= 0.05 ? '#faad14' : '#ff4d4f',
    },
    {
      key: 'response',
      icon: <MessageOutlined />,
      label: t('sellerProfile.responseRate'),
      value: profile.responseRate * 100,
      suffix: '%',
      precision: 1,
      color: profile.responseRate >= 0.9 ? '#52c41a' : profile.responseRate >= 0.7 ? '#faad14' : '#ff4d4f',
    },
  ];

  return (
    <Card title={t('sellerProfile.statsTitle')}>
      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col key={metric.key} xs={12} md={8} xl={4}>
            {'isRating' in metric && metric.isRating ? (
              // Special layout for star rating
              <Flex vertical align="center" gap={4} style={{ textAlign: 'center' }}>
                <StarOutlined style={{ fontSize: 20, color: '#faad14' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {metric.label}
                </Text>
                <Rate disabled allowHalf value={metric.ratingValue} style={{ fontSize: 14 }} />
                <Text strong style={{ fontSize: 18 }}>
                  {metric.ratingValue}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({metric.ratingCount} {t('sellerProfile.reviewsLabel')})
                </Text>
              </Flex>
            ) : (
              // Standard statistic card
              <Flex vertical align="center" gap={4} style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 20, color: metric.color }}>{metric.icon}</span>
                <Statistic
                  title={metric.label}
                  value={metric.value}
                  suffix={metric.suffix}
                  precision={metric.precision}
                  styles={{ content: { color: metric.color, fontSize: 20 } }}
                />
              </Flex>
            )}
          </Col>
        ))}
      </Row>
    </Card>
  );
}
