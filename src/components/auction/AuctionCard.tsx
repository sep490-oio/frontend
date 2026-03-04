/**
 * AuctionCard — redesigned to match reference UI.
 *
 * Layout:
 * - Top bar: status badge (left) + TIME LEFT label + HH:MM:SS countdown (right)
 * - Full-width square product image (no padding)
 * - Bottom info: item title + artist/seller (left) | price label + price + bid count (right)
 */
import { useState, useEffect } from 'react';
import { Tag } from 'antd';
import { FireOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuctionListItem } from '@/types';
import { formatVND } from '@/utils/formatters';

interface AuctionCardProps {
  auction: AuctionListItem;
}

function parseCountdown(endTime: string): { hours: number; mins: number; secs: number } {
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  return {
    hours: Math.floor(diff / 3_600_000),
    mins: Math.floor((diff % 3_600_000) / 60_000),
    secs: Math.floor((diff % 60_000) / 1_000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const isLive = auction.status === 'active' || auction.status === 'qualifying';
  const isSealed = auction.auctionType === 'sealed';
  const isEndingSoon =
    isLive &&
    new Date(auction.endTime).getTime() - Date.now() < 3_600_000; // < 1 hour

  const [countdown, setCountdown] = useState(() => parseCountdown(auction.endTime));

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCountdown(parseCountdown(auction.endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime, isLive]);

  const displayPrice =
    isSealed && !auction.currentPrice
      ? auction.startingPrice
      : (auction.currentPrice ?? auction.startingPrice);

  const priceLabel =
    isSealed && !auction.currentPrice
      ? t('auction.startingPrice')
      : auction.currentPrice !== null
        ? t('auction.currentPrice')
        : t('auction.startingPrice');

  /* ─── Status badge config ─────────────────────────────── */
  type StatusConfig = { label: string; bg: string; color: string };
  const statusConfig: Record<string, StatusConfig> = {
    active: isEndingSoon
      ? { label: 'ENDING SOON', bg: '#e8001c', color: '#fff' }
      : { label: 'LIVE', bg: '#00b96b', color: '#fff' },
    qualifying: { label: 'QUALIFYING', bg: '#1677ff', color: '#fff' },
    upcoming: { label: 'UPCOMING', bg: '#595959', color: '#fff' },
    ended: { label: 'ENDED', bg: '#d9d9d9', color: '#555' },
    cancelled: { label: 'CANCELLED', bg: '#d9d9d9', color: '#555' },
  };
  const badge: StatusConfig = statusConfig[auction.status] ?? { label: auction.status.toUpperCase(), bg: '#d9d9d9', color: '#555' };

  return (
    <div
      onClick={() => navigate(`/auction/${auction.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        overflow: 'hidden',
        background: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
      }}
    >

      {/* ── Top bar ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px 10px 12px',
          minHeight: 40,
          background: '#fff',
        }}
      >
        {/* Left: status badge */}
        <div
          style={{
            background: badge.bg,
            color: badge.color,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.8px',
            borderRadius: 4,
            padding: '3px 8px',
            textTransform: 'uppercase',
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isEndingSoon && isLive && (
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#fff', opacity: 0.85 }} />
          )}
          {badge.label}
        </div>

        {/* Right: time left */}
        {isLive ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 9, fontWeight: 500, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.6px', lineHeight: 1.5 }}>
              TIME LEFT
            </span>
            <span style={{ fontSize: 18, fontWeight: 300, color: '#111', letterSpacing: '-0.5px', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums' }}>
              {pad(countdown.hours)}h {pad(countdown.mins)}m {pad(countdown.secs)}s
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>—</span>
        )}
      </div>

      {/* ── Product image — full-width, square ────────────── */}
      <div
  style={{
    position: 'relative',
    width: '100%',
    paddingTop: '100%', // giữ tỉ lệ 1:1

    overflow: 'hidden',
    margin: '0 auto', // căn giữa container nếu cần
  }}
>
  <img
    alt={auction.itemTitle}
    src={
      auction.primaryImageUrl ??
      'https://picsum.photos/400/400?grayscale'
    }
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: hovered
        ? 'translate(-50%, -50%) scale(1.05)'
        : 'translate(-50%, -50%) scale(1)',
      maxWidth: '70%', 
      maxHeight: '70%',
      objectFit: 'contain',
      display: 'block',
      transition: 'transform 0.4s ease',
    }}
  />
        {/* Overlay badges: Featured / Sealed */}
        {(auction.isFeatured || isSealed) && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4, zIndex: 2 }}>
            {auction.isFeatured && (
              <Tag color="gold" icon={<FireOutlined />} style={{ margin: 0, fontSize: 10 }}>
                {t('auction.featured')}
              </Tag>
            )}
            {isSealed && (
              <Tag color="purple" icon={<LockOutlined />} style={{ margin: 0, fontSize: 10 }}>
                {t('auction.typeSealed')}
              </Tag>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom info ───────────────────────────────────── */}
      <div
        style={{
          background: '#E5E7E0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '14px 14px 16px',
          gap: 10,
          borderTop: '1px solid #f0f0f0',
        }}
      >

        {/* Left: title + seller */}
        <div
          style={{ minWidth: 0, flex: 1 }}
          onClick={(e) => { e.stopPropagation(); navigate(`/seller/${auction.sellerId}`); }}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); navigate(`/seller/${auction.sellerId}`); } }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#111',
              lineHeight: 1,
              letterSpacing: '-0.3px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginBottom: 3,
              textTransform: 'uppercase',
            }}
          >
            {auction.itemTitle}
          </div>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {auction.categoryName ? `${auction.categoryName}: ` : ''}{auction.sellerName}
          </div>
        </div>

        {/* Right: price + bid count */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2, whiteSpace: 'nowrap' }}>
            {priceLabel}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#111',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}
          >
            {formatVND(displayPrice)}
          </div>
          <div style={{ fontSize: 10, color: '#bbb', marginTop: 3, whiteSpace: 'nowrap' }}>
            {t('auction.bidCount', { count: auction.bidCount })}
          </div>
        </div>

      </div>
    </div>
  );
}