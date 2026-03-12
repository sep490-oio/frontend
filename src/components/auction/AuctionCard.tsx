import './AutionCard.scss';
import { Button, Tag, Typography } from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuctionListItem } from '@/types';
import { formatVND } from '@/utils/formatters';

const { Text, Paragraph } = Typography;

interface AuctionCardProps {
  auction: AuctionListItem;
}

type StatusBadge = {
  label: string;
  color: string;
  textColor: string;
  icon: React.ReactNode;
};

function getStatusBadge(auction: AuctionListItem, msLeft: number): StatusBadge {
  if (auction.status === 'failed') {
    return { label: 'FAILED', color: '#ef4444', textColor: '#fff', icon: <StopOutlined /> };
  }
  if (auction.status === 'sold') {
    return { label: 'SOLD', color: '#595959', textColor: '#fff', icon: <CheckCircleOutlined /> };
  }
  if (auction.status === 'draft' || auction.status === 'pending') {
    return {
      label: auction.status === 'draft' ? 'DRAFT' : 'SẮP DIỄN RA',
      color: '#3b82f6',
      textColor: '#fff',
      icon: <ClockCircleOutlined />,
    };
  }
  if (auction.status === 'active') {
    const ONE_HOUR = 60 * 60 * 1000;
    if (msLeft > 0 && msLeft <= ONE_HOUR) {
      return { label: 'ENDING SOON', color: '#fa8c16', textColor: '#fff', icon: <ClockCircleOutlined /> };
    }
    return { label: 'ĐANG DIỄN RA', color: '#ef4444', textColor: '#fff', icon: <ThunderboltOutlined /> };
  }
  return { label: auction.status.toUpperCase(), color: '#8c8c8c', textColor: '#fff', icon: <ClockCircleOutlined /> };
}

// "00:15:45" format matching the reference image
function formatLiveCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const isLive = auction.status === 'active';
  const isSealed = auction.auctionType === 'sealed';

  // Live countdown — ticks every second, only when active
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

  // CTA changes based on auction status
  const ctaLabel = isLive
    ? t('auction.ctaBid', 'XEM ĐẤU GIÁ')
    : t('auction.ctaJoin', 'THAM GIA');

  return (
    <div
      className="auction-card"
      onClick={() => navigate(`/auction/${auction.id}`)}
    >
      {/* ══ Cover / image area ══════════════════════════════════ */}
      <div className="auction-card-cover">
        <img
          alt={auction.itemTitle}
          src={auction.primaryImageUrl ?? 'https://picsum.photos/400/300?grayscale'}
          className="auction-card-image"
        />

        {/* Top row: status badge LEFT — verified badge RIGHT */}
        <div className="auction-card-top-row">
          <div className="auction-card-badges-left">
            {/* Primary status */}
            <Tag
              className="auction-card-badge-tag"
              style={{ background: statusBadge.color, color: statusBadge.textColor }}
            >
              {statusBadge.icon}
              {statusBadge.label}
            </Tag>

            {/* Featured */}
            {auction.isFeatured && (
              <Tag
                className="auction-card-badge-tag"
                style={{ background: '#000', color: '#fff' }}
              >
                <FireOutlined /> {t('auction.featured', 'NỔI BẬT')}
              </Tag>
            )}

            {/* Sealed */}
            {isSealed && (
              <Tag className="auction-card-badge-tag auction-card-badge-sealed">
                <LockOutlined /> {t('auction.typeSealed', 'ĐẤU GIÁ KÍN')}
              </Tag>
            )}
          </div>

          {/* Verified — top right */}
          {(auction.sellerTrustScore ?? 0) >= 80 && (
            <Tag className="auction-card-badge-tag auction-card-badge-verified">
              <SafetyCertificateOutlined />
              {t('auction.verified', 'ĐÃ KIỂM ĐỊNH')}
            </Tag>
          )}
        </div>

        {/* Bottom stats bar inside the image */}
        <div className="auction-card-stats-bar">
          <div className="auction-card-stat">
            <span className="auction-card-stat-label">
              {t('auction.timeLeft', 'CÒN LẠI')}
            </span>
            <span className="auction-card-stat-value">
              {isLive
                ? formatLiveCountdown(msLeft)
                : t('auction.ended', 'Đã kết thúc')}
            </span>
          </div>

          <div className="auction-card-stat-divider" />

          <div className="auction-card-stat">
            <span className="auction-card-stat-label">
              {t('auction.bidsLabel', 'LƯỢT ĐẤU')}
            </span>
            <span className="auction-card-stat-value">
              <TeamOutlined style={{ marginRight: 4 }} />
              {auction.bidCount} {t('auction.biddersUnit', 'Bidders')}
            </span>
          </div>
        </div>
      </div>

      {/* ══ Info bar ════════════════════════════════════════════ */}
      <div className="auction-card-info-bar">

        {/* Category row — "WINE • COLLECTIBLE" style */}
        {auction.categoryName && (
          <div className="auction-card-category">
            {auction.categoryName}
            {(auction as any).itemType && (
              <> <span className="auction-card-category-dot">•</span> {(auction as any).itemType}</>
            )}
          </div>
        )}

        {/* Title */}
        <Paragraph ellipsis={{ rows: 2 }} className="auction-card-title">
          {auction.itemTitle}
        </Paragraph>

        {/* Seller */}
        <div
          className="auction-card-seller-link"
          role="link"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/seller/${auction.sellerId}`);
          }}
        >
          <Text className="auction-card-seller-name">
            {auction.sellerName ?? ''}
          </Text>
        </div>

        {/* Price + CTA button */}
        <div className="auction-card-price-row">
          <div className="auction-card-price-block">
            <span className="auction-card-price-label">
              {auction.currentPrice !== null
                ? t('auction.currentPrice', 'Giá hiện tại')
                : t('auction.startingPrice', 'Giá khởi điểm')}
            </span>
            <div className="auction-card-price-value">
              {formatVND(auction.currentPrice ?? auction.startingPrice)}
              <span className="auction-card-price-currency">
                &nbsp;{auction.currency ?? 'USDT'}
              </span>
            </div>
          </div>

          <Button
            type="primary"
            className="auction-card-cta-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/auction/${auction.id}`);
            }}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}