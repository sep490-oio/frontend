/**
 * AuctionCard — displays one auction in the Browse grid.
 *
 * Reusable across Browse page, Home page featured section,
 * and future Watchlist page. Shows:
 * - Product image with overlay badges (featured, sealed)
 * - Category + condition tags
 * - Pricing (current price, starting price, buy-now)
 * - Countdown timer or "Ended" label
 * - Bid count + qualified bidder count
 * - Seller name, rating, and verification badge
 * - Status badge (color-coded via Ant Design Tag)
 *
 * Clicking the card navigates to /auction/:id.
 *
 */
import { useState, useEffect } from 'react';
import { Tag, Typography, Rate } from 'antd';
import {
  ClockCircleOutlined,
  FireOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  BookOutlined,
  BookFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuctionListItem } from '@/types';
import { formatVND, CONDITION_KEYS } from '@/utils/formatters';

const { Text } = Typography;

interface AuctionCardProps {
  auction: AuctionListItem;
}

/** Single countdown box — HOURS / MINS / SECS */
function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 42,
        height: 42,
        borderRadius: 8,
        border: '1px solid #e4e4e4',
        background: '#fafafa',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, color: '#111', letterSpacing: '-0.5px' }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{ fontSize: 8.5, fontWeight: 500, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 3 }}>
        {label}
      </span>
    </div>
  );
}


function parseCountdown(endTime: string): { hours: number; mins: number; secs: number } {
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  return {
    hours: Math.floor(diff / 3_600_000),
    mins: Math.floor((diff % 3_600_000) / 60_000),
    secs: Math.floor((diff % 60_000) / 1_000),
  };
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isLive = auction.status === 'active' || auction.status === 'qualifying';
  const isSealed = auction.auctionType === 'sealed';
  const [countdown, setCountdown] = useState(() =>
    parseCountdown(auction.endTime)
  );

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setCountdown(parseCountdown(auction.endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction.endTime, isLive]);

  // Determine displayed price
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

  return (
    <div
      onClick={() => navigate(`/auction/${auction.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.18s ease',
      }}
    >

      {/* ── Image — square 1:1 ────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: '#f0f0f0', overflow: 'hidden' }}>
        <img
          alt={auction.itemTitle}
          src={auction.primaryImageUrl ?? 'https://picsum.photos/400/400?grayscale'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Category badge — dark charcoal pill, top-left */}
        {auction.categoryName && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(28, 28, 28, 0.82)',
            backdropFilter: 'blur(6px)',
            borderRadius: 6,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '0.1px',
            zIndex: 2,
          }}>
            {auction.categoryName}
          </div>
        )}

        {/* Featured / Sealed badges — below category badge */}
        <div style={{ position: 'absolute', top: 38, left: 10, display: 'flex', gap: 4, zIndex: 2 }}>
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

        {/* Bookmark / save icon — top-right circle */}
        <button
          onClick={(e) => { e.stopPropagation(); setSaved((v) => !v); }}
          aria-label="Save auction"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            color: saved ? '#111' : '#666',
          }}
        >
          {saved ? <BookFilled style={{ fontSize: 13 }} /> : <BookOutlined style={{ fontSize: 13 }} />}
        </button>
      </div>

      {/* ── Info section ──────────────────────────────────── */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Condition tag — small, subtle */}
        <div style={{ marginBottom: 6 }}>
          <Tag style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>
            {t(CONDITION_KEYS[auction.itemCondition])}
          </Tag>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#111',
          marginBottom: 5,
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {auction.itemTitle}
        </div>

        {/* Bid count + Qualified count row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontSize: 12, color: '#999' }}>
          <EyeOutlined style={{ fontSize: 11 }} />
          <span>{t('auction.bidCount', { count: auction.bidCount })}</span>
          {auction.qualifiedCount > 0 && (
            <>
              <span style={{ color: '#ddd', fontSize: 10 }}>•</span>
              <span style={{ color: '#666', fontWeight: 500 }}>
                {t('auction.qualifiedCount', { count: auction.qualifiedCount })}
              </span>
            </>
          )}
        </div>

        {/* Price + Countdown (or Ended) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>

          {/* Left: label + price */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: '#aaa', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
              {priceLabel}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {formatVND(displayPrice)}
            </div>
            {/* Buy Now price */}
            {auction.buyNowPrice !== null && (
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
                {t('auction.buyNow')}: {formatVND(auction.buyNowPrice)}
              </div>
            )}
          </div>

          {/* Right: countdown boxes or Ended */}
          {isLive ? (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <CountdownBox value={countdown.hours} label="Hours" />
              <CountdownBox value={countdown.mins} label="Mins" />
              <CountdownBox value={countdown.secs} label="Secs" />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#999', fontSize: 12, flexShrink: 0 }}>
              <ClockCircleOutlined style={{ fontSize: 12 }} />
              <span>{t('auction.ended')}</span>
            </div>
          )}
        </div>

        {/* ── Seller row ──────────────────────────────────── */}
        <div
          role="link"
          tabIndex={0}
          onClick={(e) => { e.stopPropagation(); navigate(`/seller/${auction.sellerId}`); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); navigate(`/seller/${auction.sellerId}`); } }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #f0f0f0',
            paddingTop: 8,
            marginTop: 'auto',
            cursor: 'pointer',
          }}
          title={t('sellerProfile.viewSellerProfile')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 12, color: '#555' }}>{auction.sellerName}</Text>
            <Rate disabled defaultValue={1} count={1} style={{ fontSize: 11 }} />
            <Text style={{ fontSize: 11, color: '#999' }}>{auction.sellerRating}</Text>
          </div>
          {auction.sellerTrustScore >= 80 && (
            <SafetyCertificateOutlined
              style={{ color: '#52c41a', fontSize: 15 }}
              title={t('auction.verified')}
            />
          )}
        </div>

      </div>
    </div>
  );
}