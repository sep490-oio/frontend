import './AutionCard.scss';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuctionListItem } from '@/types';
import { formatVND } from '@/utils/formatters';

interface AuctionCardProps {
  auction: AuctionListItem;
}

// Format countdown as "HH:MM:SS"
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const navigate = useNavigate();
  const isLive = auction.status === 'active';
  const isVerified = (auction.verificationStatus === 'verified');

  // Live countdown
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

  return (
    <div
      className="auction-card-figma"
      onClick={() => navigate(`/auction/${auction.id}`)}
    >
      {/* Image Container */}
      <div className="auction-card-image-wrapper">
        <div className="auction-card-product-image">
          <img
            src={auction.primaryImageUrl ?? '/placeholder-item.svg'}
            alt={auction.itemTitle}
          />
        </div>

        {/* Labels (Top Left) */}
        <div className="auction-card-labels">
          {/* Status Badge with green dot */}
          <div className="auction-card-badge-live">
            <div className="badge-dot" />
            <span>ĐANG DIỄN RA</span>
          </div>

          {/* Verified Badge */}
          {isVerified && (
            <div className="auction-card-badge-verified">
              ĐÃ KIỂM ĐỊNH
            </div>
          )}
        </div>

        {/* Countdown (Bottom Center) */}
        {isLive && (
          <div className="auction-card-countdown">
            <div className="countdown-label">THỜI GIAN CÒN LẠI</div>
            <div className="countdown-time">{formatCountdown(msLeft)}</div>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="auction-card-info-container">
        {/* Title */}
        <h3 className="auction-card-heading">{auction.itemTitle}</h3>

        {/* Item Code */}
        <div className="auction-card-item-code">
          Mã vật phẩm: #{auction.id.slice(-6)}
        </div>

        {/* Price and Bids Row */}
        <div className="auction-card-price-bids-row">
          {/* Current Price */}
          <div className="price-section">
            <div className="price-label">GIÁ HIỆN TẠI</div>
            <div className="price-amount">
              {formatVND(auction.currentPrice ?? auction.startingPrice)}
            </div>
          </div>

          {/* Bid Count */}
          <div className="bids-section">
            <div className="bids-label">LƯỢT GIÁ</div>
            <div className="bids-count">{auction.bidCount}</div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          className="auction-card-cta"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/auction/${auction.id}`);
          }}
        >
          XEM ĐẤU GIÁ
        </button>
      </div>
    </div>
  );
}
