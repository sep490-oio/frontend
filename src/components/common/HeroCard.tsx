import './HeroCard.scss';
import { useNavigate } from 'react-router-dom';

interface HeroCardProps {
  productName?: string;
  imageUrl?: string;
  timeRemaining?: string;
  bidderCount?: number;
  currentPrice?: string;
  bidCount?: number;
  auctionId?: string;
}

export function HeroCard({
  productName = 'Rolex Submariner Date 126610LN',
  imageUrl,
  timeRemaining = '18:47:05',
  bidderCount = 17,
  currentPrice = '150.000.000 VNĐ',
  bidCount = 24,
  auctionId = '1',
}: HeroCardProps) {
  const navigate = useNavigate();

  return (
    <div className="hero-card">
      {/* Background Image */}
      <div
        className="hero-card-image"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />

      {/* Top Badge - Verified */}
      <div className="hero-card-badge">
        <span className="badge-dot" />
        <span className="badge-text">ĐÃ KIỂM ĐỊNH</span>
      </div>

      {/* Countdown & Bidders Overlay */}
      <div className="hero-card-stats">
        <div className="stat-box stat-time">
          <span className="stat-label">CÒN LẠI</span>
          <span className="stat-value">{timeRemaining}</span>
        </div>
        <div className="stat-box stat-bidders">
          <span className="stat-label">LƯỢT ĐẦU</span>
          <span className="stat-value">{bidderCount} Bidders</span>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="hero-card-info">
        <div className="info-row">
          <div className="price-section">
            <span className="price-label">Giá khởi điểm</span>
            <span className="price-value">{currentPrice}</span>
          </div>
          <div className="bid-section">
            <span className="bid-label">Lượt đấu giá</span>
            <span className="bid-count">{bidCount}</span>
          </div>
        </div>
        <button className="hero-card-btn" onClick={() => navigate(`/auction/${auctionId}`)}>
          XEM BẤT ĐẦU
        </button>
      </div>
    </div>
  );
}
