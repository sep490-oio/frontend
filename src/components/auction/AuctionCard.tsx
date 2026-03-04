import { Tag, Space, Typography, Rate } from 'antd';
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
  formatCountdown,
  CONDITION_KEYS,
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
  // emergency_stopped / failed → red
  if (auction.status === 'emergency_stopped' || auction.status === 'failed') {
    return {
      label: auction.status === 'emergency_stopped' ? 'STOPPED' : 'FAILED',
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

  // active / qualifying — dùng msLeft đã tính sẵn từ state
  if (auction.status === 'active' || auction.status === 'qualifying') {
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

  const isLive =
    auction.status === 'active' || auction.status === 'qualifying';
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
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        background: '#fff',
        border: '1px solid #e8e8e8',
        overflow: 'hidden',
      }}
    >
      {/* ── Image area with top overlay ── */}
      <div className="auction-card-cover" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <img
          alt={auction.itemTitle}
          src={
            auction.primaryImageUrl ??
            'https://picsum.photos/400/400?grayscale'
          }
          className="auction-card-image"
          style={{
            width: '100%',
            height: '100%',
            minHeight: 220,
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Top-left: dynamic status badge + optional feature/sealed badges */}
        <div
          className="auction-card-badges"
          style={{
            position: 'absolute',
            top: 'var(--spacing-sm)',
            left: 'var(--spacing-sm)',
            display: 'flex',
            gap: 'var(--spacing-xs)',
          }}
        >
          {/* Primary status badge — always shown */}
          <Tag
            style={{
              borderRadius: 0,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
              border: 'none',
              background: statusBadge.color,
              color: statusBadge.textColor,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {statusBadge.icon}
            {statusBadge.label}
          </Tag>

          {/* Featured badge */}
          {auction.isFeatured && (
            <Tag
              style={{
                borderRadius: 0,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                background: '#000',
                color: '#fff',
                border: 'none',
              }}
            >
              <FireOutlined /> {t('auction.featured')}
            </Tag>
          )}

          {/* Sealed badge */}
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

        {/* Top-right: TIME LEFT label + countdown */}
        <div
          style={{
            position: 'absolute',
            top: 'var(--spacing-sm)',
            right: 'var(--spacing-sm)',
            textAlign: 'right',
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
              color: '#8c8c8c',
              lineHeight: 1.2,
              marginBottom: 2,
            }}
          >
            {t('auction.timeLeft', 'TIME LEFT')}
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: statusBadge.color,
              lineHeight: 1,
            }}
          >
            {isLive
              ? formatLiveCountdown(msLeft)
              : t('auction.ended')}
          </div>
        </div>
      </div>

      {/* ── Bottom info bar ── */}
      <div
        style={{
          padding: 'var(--spacing-md) var(--spacing-lg)',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 'var(--spacing-md)',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        {/* Left: Title + artist/seller */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Paragraph
            strong
            ellipsis={{ rows: 1 }}
            style={{
              margin: 0,
              fontSize: 'var(--font-size-lg)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '-0.3px',
              lineHeight: 1.1,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {auction.itemTitle}
          </Paragraph>

          <div
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/seller/${auction.sellerId}`);
            }}
            style={{ marginTop: 4, cursor: 'pointer' }}
          >
            <Space size={4} align="center">
              <Text
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: '#8c8c8c',
                }}
              >
                {auction.sellerName}
              </Text>
              {auction.sellerTrustScore >= 80 && (
                <SafetyCertificateOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
              )}
            </Space>
          </div>
        </div>

        {/* Right: Price + bid count */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
              color: '#8c8c8c',
              marginBottom: 2,
            }}
          >
            {auction.currentPrice !== null
              ? t('auction.currentPrice', 'CURRENT BID')
              : t('auction.startingPrice', 'STARTING')}
          </div>

          <Text
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              display: 'block',
              lineHeight: 1.1,
            }}
          >
            {formatVND(auction.currentPrice ?? auction.startingPrice)}
          </Text>

          <Text
            type="secondary"
            style={{
              fontSize: 'var(--font-size-sm)',
              display: 'block',
              marginTop: 2,
            }}
          >
            {t('auction.bidCount', { count: auction.bidCount })}
          </Text>
        </div>
      </div>
    </div>
  );
}