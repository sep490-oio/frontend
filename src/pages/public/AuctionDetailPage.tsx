import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  StarFilled,
  MessageOutlined
} from '@ant-design/icons';
import './AuctionDetailPage.scss';

export function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'description' | 'certification'>('specs');
  const [bidAmount, setBidAmount] = useState('');

  // Mock data
  const auction = {
    id: id || '1',
    title: 'Patek Philippe Nautilus 5711/1A-010',
    category: 'Đồng hồ xa xỉ',
    year: 'Sản xuất năm 2021',
    currentPrice: 142500.00,
    currentPriceVND: '3.020.000.000 VND',
    leadingBidder: 'elux_collector',
    timeLeft: { hours: 0, minutes: 42, seconds: 15 },
    bidders: 42,
    bids: 158,
    views: 3120,
    images: [
      '/placeholder-item.svg',
      '/placeholder-item.svg',
      '/placeholder-item.svg',
      '/placeholder-item.svg'
    ],
    verified: true,
    status: 'Đã xác minh',
    specs: {
      movement: 'Self-winding Mechanical 26-330 S C',
      size: '40 mm (Độ dày: 8.3 mm)',
      material: 'Thép không gỉ 316L',
      waterResistance: '120m (12 bar)'
    },
    certification: {
      status: 'Đã Phê Duyệt',
      expert: 'Trần Anh Tuấn',
      experience: '18 năm kinh nghiệm tại Patek Philippe Geneva',
      description: 'Được kiểm định trực tiếp bởi chuyên gia Trần Anh Tuấn (18 năm kinh nghiệm tại Patek Philippe Geneva). Tất cả các linh kiện đều nguyên bản và trong tình trạng vận hành hoàn hảo.',
      image: '/placeholder-item.svg'
    },
    seller: {
      name: 'Gia Bao Luxury',
      avatar: '/placeholder-item.svg',
      verified: true,
      trustScore: 98.5,
      rating: 4.9
    },
    bidHistory: [
      { bidder: 'elux_collector', amount: 142500, time: '2 phút trước', isLeading: true },
      { bidder: 'watch_master', amount: 141500, time: '5 phút trước', isLeading: false },
      { bidder: 'luxury_enthusiast_99', amount: 140000, time: '12 phút trước', isLeading: false }
    ]
  };

  const quickBidAmounts = [1000, 5000, 10000];

  return (
    <div className="auction-detail-page">
      <div className="auction-detail-container">
        {/* Main Content */}
        <div className="main-content">
          {/* Left Column */}
          <div className="left-column">
            {/* Product Gallery */}
            <div className="product-gallery">
              <div className="main-image">
                <img src={auction.images[selectedImage]} alt={auction.title} />
                <div className="image-badges">
                  <div className="badge verified">
                    <SafetyCertificateOutlined />
                    <span>ĐÃ XÁC MINH</span>
                  </div>
                  <div className="badge category">
                    <span>{auction.category}</span>
                  </div>
                </div>
              </div>

              <div className="thumbnail-list">
                {auction.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} />
                    {idx === 3 && <div className="more-overlay">+8</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Product Header */}
            <div className="product-header">
              <h1>{auction.title}</h1>
              <div className="product-meta">
                <span className="meta-item">{auction.category}</span>
                <span className="separator">|</span>
                <span className="meta-item">{auction.year}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="product-tabs">
              <div className="tabs-header">
                <button
                  className={`tab ${activeTab === 'specs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('specs')}
                >
                  Thông số kỹ thuật
                </button>
                <button
                  className={`tab ${activeTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveTab('description')}
                >
                  Mô tả sản phẩm
                </button>
                <button
                  className={`tab ${activeTab === 'certification' ? 'active' : ''}`}
                  onClick={() => setActiveTab('certification')}
                >
                  Chứng nhận và kiểm định
                </button>
              </div>

              <div className="tabs-content">
                {activeTab === 'specs' && (
                  <div className="specs-grid">
                    <div className="spec-card">
                      <div className="spec-label">Bộ máy</div>
                      <div className="spec-value">{auction.specs.movement}</div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-label">Kích thước</div>
                      <div className="spec-value">{auction.specs.size}</div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-label">Chất liệu</div>
                      <div className="spec-value">{auction.specs.material}</div>
                    </div>
                    <div className="spec-card">
                      <div className="spec-label">Kháng nước</div>
                      <div className="spec-value">{auction.specs.waterResistance}</div>
                    </div>
                  </div>
                )}

                {activeTab === 'description' && (
                  <div className="description-content">
                    <h3>Tổng quan sản phẩm</h3>
                    <p>
                      Chiếc Patek Philippe Nautilus 5711/1A-010 là biểu tượng của sự sang trọng, thể thao và tinh tế.
                      Được thiết kế bởi huyền thoại Gérald Genta vào năm 1976, mẫu đồng hồ này đã trở thành một trong những
                      chiếc đồng hồ thể thao xa xỉ được săn đón nhất trên thế giới.
                    </p>

                    <div className="feature-columns">
                      <div className="feature-column">
                        <h4>TÍNH NĂNG CHI TIẾT</h4>
                        <ul>
                          <li>Vỏ đồng hồ được gia công với độ chính xác cao, nguyên khối</li>
                          <li>Mặt số màu xanh nước biển với họa tiết nổi đặc trưng</li>
                          <li>Dây đeo thép không gỉ với khóa gập an toàn</li>
                          <li>Máy tự động Caliber 26-330 S C</li>
                        </ul>
                      </div>

                      <div className="feature-column">
                        <h4>ĐẶC ĐIỂM NỔI CHUYÊN GIA</h4>
                        <ul>
                          <li>Thiết kế vỏ nhà ốc độc đáo với 2 "tai" đặc trưng</li>
                          <li>Độ dày chỉ 8.3mm, mỏng hơn hầu hết đồng hồ thể thao</li>
                          <li>Chức năng lịch ngày tại vị trí 3 giờ</li>
                          <li>Được kiểm định bởi Patek Philippe Seal</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'certification' && (
                  <div className="certification-content">
                    <div className="cert-expert">
                      <div className="expert-image">
                        <img src={auction.certification.image} alt="Expert" />
                      </div>
                      <div className="expert-info">
                        <h4>Trưởng thái Kiểm định: Đỗ Phúc Duyệt</h4>
                        <p>{auction.certification.description}</p>
                        <button className="btn-view-cert">
                          Xem chứng chỉ điện tử →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Info */}
            <div className="inspection-info">
              <div className="inspection-content">
                <div className="inspection-image">
                  <img src={auction.certification.image} alt="Expert" />
                </div>
                <div className="inspection-details">
                  <h3>Trạng thái Kiểm định: {auction.certification.status}</h3>
                  <p>{auction.certification.description}</p>
                  <button className="btn-certificate">
                    Xem chứng chỉ điện tử
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Auction Controls */}
            <div className="auction-controls">
              {/* Urgency Banner */}
              <div className="urgency-banner">
                <div className="urgency-text">
                  <ClockCircleOutlined />
                  <span>Sắp kết thúc</span>
                </div>
                <div className="countdown">
                  <div className="time-unit">
                    <div className="time-value">{auction.timeLeft.hours}</div>
                    <div className="time-label">Giờ</div>
                  </div>
                  <div className="time-separator">:</div>
                  <div className="time-unit">
                    <div className="time-value">{auction.timeLeft.minutes}</div>
                    <div className="time-label">Phút</div>
                  </div>
                </div>
              </div>

              {/* Pricing Info */}
              <div className="pricing-section">
                <div className="pricing-info">
                  <div className="price-main">
                    <div className="price-label">Giá hiện tại</div>
                    <div className="price-value">${auction.currentPrice.toLocaleString()}</div>
                    <div className="price-vnd">{auction.currentPriceVND}</div>
                  </div>
                  <div className="leading-bidder">
                    <div className="bidder-label">Người dẫn đầu</div>
                    <div className="bidder-name">{auction.leadingBidder}</div>
                  </div>
                </div>

                {/* Price Chart Placeholder */}
                <div className="price-chart">
                  <svg width="100%" height="96" viewBox="0 0 445 96">
                    <defs>
                      <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(0, 209, 255, 0.1)" />
                        <stop offset="100%" stopColor="rgba(0, 209, 255, 0)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 30 70 Q 100 65, 150 60 T 250 50 T 350 45 L 410 40"
                      stroke="#00D1FF"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      d="M 30 70 Q 100 65, 150 60 T 250 50 T 350 45 L 410 40 L 410 96 L 30 96 Z"
                      fill="url(#priceGradient)"
                    />
                  </svg>
                </div>

                {/* Bidding Section */}
                <div className="bidding-section">
                  <div className="quick-bid-buttons">
                    {quickBidAmounts.map((amount) => (
                      <button key={amount} className="quick-bid-btn">
                        +${amount.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="bid-input-group">
                    <div className="bid-input-wrapper">
                      <span className="currency-symbol">$</span>
                      <input
                        type="text"
                        placeholder="Nhập số tiền đặt giá"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                      />
                    </div>
                    <div className="auto-bid-checkbox">
                      <input type="checkbox" id="autoBid" />
                      <label htmlFor="autoBid">Kích hoạt Đấu giá Tự động (Auto-bid)</label>
                    </div>
                  </div>

                  <button className="btn-place-bid">ĐẶT GIÁ NGAY</button>
                </div>

                {/* Live Stats */}
                <div className="live-stats">
                  <div className="stat-item">
                    <div className="stat-label">Người thầu</div>
                    <div className="stat-value">{auction.bidders}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Lượt đấu</div>
                    <div className="stat-value">{auction.bids}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Lượt xem</div>
                    <div className="stat-value">{auction.views}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Profile */}
            <div className="seller-profile">
              <div className="seller-header">
                <h3>Người bán</h3>
                <div className="top-rated-badge">TOP RATED</div>
              </div>
              <div className="seller-info">
                <div className="seller-avatar">
                  <img src={auction.seller.avatar} alt={auction.seller.name} />
                </div>
                <div className="seller-details">
                  <div className="seller-name">
                    {auction.seller.name}
                    {auction.seller.verified && <SafetyCertificateOutlined />}
                  </div>
                  <div className="seller-stats">
                    <span>Điểm tin cậy: <strong>{auction.seller.trustScore}%</strong></span>
                    <span>
                      <StarFilled style={{ color: '#EAB308' }} />
                      <strong>{auction.seller.rating}</strong>
                    </span>
                  </div>
                </div>
                <button className="btn-message">
                  <MessageOutlined />
                </button>
              </div>
            </div>

            {/* Bid History */}
            <div className="bid-history">
              <div className="history-header">
                <h3>Lịch sử đấu giá</h3>
                <div className="live-indicator">
                  <span className="live-dot"></span>
                  <span>Live</span>
                </div>
              </div>
              <div className="history-list">
                {auction.bidHistory.map((bid, idx) => (
                  <div key={idx} className={`history-item ${bid.isLeading ? 'leading' : ''}`}>
                    <div className="bidder-info">
                      <div className="bidder-icon">
                        <UserOutlined />
                      </div>
                      <div className="bidder-details">
                        <div className="bidder-name">{bid.bidder}</div>
                        <div className="bid-time">{bid.time}</div>
                      </div>
                    </div>
                    <div className="bid-amount-info">
                      <div className="bid-amount">${bid.amount.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-view-all">Xem tất cả lịch sử</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
