import { Card, Tag, Space, Typography, Rate } from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuctionListItem } from '@/types';
import {
  formatVND,
  formatCountdown,
  CONDITION_KEYS,
} from '@/utils/formatters';

const { Text, Paragraph } = Typography;

interface AuctionCardProps {
  auction: AuctionListItem;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isLive =
    auction.status === 'active' || auction.status === 'qualifying';
  const isSealed = auction.auctionType === 'sealed';

  return (
    <Card
      className="auction-card"
      hoverable
      onClick={() => navigate(`/auction/${auction.id}`)}
      style={{ height: '100%' }}
      bodyStyle={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column' }}
      cover={
        <div className="auction-card-cover">
          <img
            alt={auction.itemTitle}
            src={
              auction.primaryImageUrl ??
              'https://picsum.photos/400/400?grayscale'
            }
            className="auction-card-image"
          />

          {/* Overlay badges */}
          <div className="auction-card-badges">
            {auction.isFeatured && (
              <Tag
                style={{
                  borderRadius: 0,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                <FireOutlined /> {t('auction.featured')}
              </Tag>
            )}

            {isSealed && (
              <Tag
                style={{
                  borderRadius: 0,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                <LockOutlined /> {t('auction.typeSealed')}
              </Tag>
            )}
          </div>
        </div>
      }
    >
      {/* Category + Condition */}
      <Space size={6} wrap className="auction-card-category" style={{ marginBottom: 'var(--spacing-sm)' }}>
        {auction.categoryName && (
          <Tag className="small-uppercase" style={{ borderRadius: 0 }}>
            {auction.categoryName}
          </Tag>
        )}
        <Tag className="small-uppercase" style={{ borderRadius: 0 }}>
          {t(CONDITION_KEYS[auction.itemCondition])}
        </Tag>
      </Space>

      {/* Title */}
      <Paragraph
        strong
        ellipsis={{ rows: 2 }}
        style={{
          marginBottom: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-lg)',
          lineHeight: 1.2,
          minHeight: 'calc(var(--font-size-lg) * 1.2 * 2)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '-0.3px',
        }}
      >
        {auction.itemTitle}
      </Paragraph>

      {/* Pricing */}
      <div style={{ marginBottom: 'var(--spacing-sm)' }}>
        <Text
          type="secondary"
          style={{
            fontSize: 'var(--font-size-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
          }}
        >
          {auction.currentPrice !== null
            ? t('auction.currentPrice')
            : t('auction.startingPrice')}
        </Text>

        <div>
          <Text
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 800,
              letterSpacing: '-0.5px',
            }}
          >
            {formatVND(
              auction.currentPrice ?? auction.startingPrice
            )}
          </Text>
        </div>

        {auction.buyNowPrice !== null && (
          <Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            {t('auction.buyNow')}: {formatVND(auction.buyNowPrice)}
          </Text>
        )}
      </div>

      {/* Countdown */}
      <div
        className="auction-card-countdown"
        style={{
          marginBottom: 'var(--spacing-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space size={6}>
          <ClockCircleOutlined style={{ color: '#000' }} />
          <Text
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 500,
            }}
          >
            {isLive
              ? formatCountdown(auction.endTime, t)
              : t('auction.ended')}
          </Text>
        </Space>
      </div>

      {/* Stats */}
      <Space
        size={[16, 4]}
        wrap
        style={{
          marginBottom: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
          color: '#8c8c8c',
        }}
      >
        <Text type="secondary">
          {t('auction.bidCount', { count: auction.bidCount })}
        </Text>
        <Text type="secondary">
          {t('auction.qualifiedCount', {
            count: auction.qualifiedCount,
          })}
        </Text>
      </Space>

      {/* Seller */}
      <div
        role="link"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/seller/${auction.sellerId}`);
        }}
        className="auction-card-seller"
      >
        <Space size={6}>
          <Text style={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}>
            {auction.sellerName}
          </Text>
          <Rate disabled defaultValue={1} count={1} />
          <Text style={{ fontSize: 'var(--font-size-sm)' }}>
            {auction.sellerRating}
          </Text>
        </Space>

        {auction.sellerTrustScore >= 80 && (
          <SafetyCertificateOutlined
            style={{ fontSize: 16 }}
          />
        )}
      </div>
    </Card>
  );
}