import { Tag, Space, Typography } from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuctionListItem } from '@/types';
import {
  formatVND,
} from '@/utils/formatters';

const { Text, Paragraph } = Typography;

interface AuctionCardProps {
  auction: AuctionListItem;
}

// ── Status badge config based on time remaining + auction.status ──
type StatusBadge = {
  label: string;
  color: string;        // background
  textColor: string;
  icon: React.ReactNode;
};

function getStatusBadge(
  auction: AuctionListItem,
  msLeft: number,
): StatusBadge {
  // failed → red
  if (auction.status === 'failed') {
    return {
      label: 'FAILED',
      color: '#ff4d4f',
      textColor: '#fff',
      icon: <StopOutlined />,
    };
  }

  // sold → grey
  if (auction.status === 'sold') {
    return {
      label: 'SOLD',
      color: '#595959',
      textColor: '#fff',
      icon: <CheckCircleOutlined />,
    };
  }

  // draft / pending → blue
  if (auction.status === 'draft' || auction.status === 'pending') {
    return {
      label: auction.status === 'draft' ? 'DRAFT' : 'PENDING',
      color: '#1677ff',
      textColor: '#fff',
      icon: <ClockCircleOutlined />,
    };
  }

  // active — dùng msLeft đã tính sẵn từ state
  if (auction.status === 'active') {
    const ONE_HOUR = 60 * 60 * 1000;

    // Dưới 1 tiếng → ENDING SOON (cam)
    if (msLeft > 0 && msLeft <= ONE_HOUR) {
      return {
        label: 'ENDING SOON',
        color: '#fa8c16',
        textColor: '#fff',
        icon: <ClockCircleOutlined />,
      };
    }

    // Còn hơn 1 tiếng → ACTIVE (xanh lá)
    return {
      label: 'ACTIVE',
      color: '#52c41a',
      textColor: '#fff',
      icon: <ThunderboltOutlined />,
    };
  }

  // Fallback
  return {
    label: auction.status.toUpperCase(),
    color: '#8c8c8c',
    textColor: '#fff',
    icon: <ClockCircleOutlined />,
  };
}

// Format milliseconds → "02h 44m 12s" or "44m 12s" or "12s"
function formatLiveCountdown(ms: number): string {
  if (ms <= 0) return '00s';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${pad(m)}m ${pad(s)}s`;
  return `${pad(s)}s`;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isLive = auction.status === 'active';
  const isSealed = auction.auctionType === 'sealed';

  // Live countdown state — ticks every second
  const [msLeft, setMsLeft] = useState(
    () => new Date(auction.endTime).getTime() - Date.now()
  );

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setMsLeft(new Date(auction.endTime).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isLive, auction.endTime]);

  const statusBadge = getStatusBadge(auction, msLeft);

  return (
    <div
      className="auction-card"
      onClick={() => navigate(`/auction/${auction.id}`)}
    >
      {/* ── Image area with top overlay ── */}
      <div className="auction-card-cover">
        <img
          alt={auction.itemTitle}
          src={
            auction.primaryImageUrl ??
            'https://picsum.photos/400/400?grayscale'
          }
          className="auction-card-image"
        />

        {/* Top-left: dynamic status badge + optional feature/sealed badges */}
        <div className="auction-card-badges">
          {/* Primary status badge — always shown */}
          <Tag
            className="auction-card-badge-tag"
            style={{
              background: statusBadge.color,
              color: statusBadge.textColor,
            }}
          >
            {statusBadge.icon}
            {statusBadge.label}
          </Tag>

          {/* Featured badge */}
          {auction.isFeatured && (
            <Tag
              className="auction-card-badge-tag"
              style={{
                background: '#000',
                color: '#fff',
              }}
            >
              <FireOutlined /> {t('auction.featured')}
            </Tag>
          )}

          {/* Sealed badge */}
          {isSealed && (
            <Tag className="auction-card-badge-tag">
              <LockOutlined /> {t('auction.typeSealed')}
            </Tag>
          )}
        </div>

        {/* Top-right: TIME LEFT label + countdown */}
        <div className="auction-card-countdown-box">
          <div className="auction-card-countdown-label">
            {t('auction.timeLeft', 'TIME LEFT')}
          </div>
          <div
            className="auction-card-countdown-value"
            style={{ color: statusBadge.color }}
          >
            {isLive
              ? formatLiveCountdown(msLeft)
              : t('auction.ended')}
          </div>
        </div>
      </div>

      {/* ── Bottom info bar ── */}
      <div className="auction-card-info-bar">
        {/* Left: Title + artist/seller */}
        <div className="auction-card-title-section">
          <Paragraph
            strong
            ellipsis={{ rows: 1 }}
            className="auction-card-title"
          >
            {auction.itemTitle}
          </Paragraph>

          <div
            className="auction-card-seller-link"
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/seller/${auction.sellerId}`);
            }}
          >
            <Space size={4} align="center">
              <Text className="auction-card-seller-name">
                {auction.sellerName ?? ''}
              </Text>
              {(auction.sellerTrustScore ?? 0) >= 80 && (
                <SafetyCertificateOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
              )}
            </Space>
          </div>
        </div>

        {/* Right: Price + bid count */}
        <div className="auction-card-price-section">
          <div className="auction-card-price-label">
            {auction.currentPrice !== null
              ? t('auction.currentPrice', 'CURRENT BID')
              : t('auction.startingPrice', 'STARTING')}
          </div>

          <Text className="auction-card-price-value">
            {formatVND(auction.currentPrice ?? auction.startingPrice)}
          </Text>

          <Text
            type="secondary"
            className="auction-card-bid-count"
          >
            {t('auction.bidCount', { count: auction.bidCount })}
          </Text>
        </div>
      </div>
    </div>
  );
}