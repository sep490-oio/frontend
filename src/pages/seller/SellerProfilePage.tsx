/**
 * SellerProfilePage — exact Figma design from image
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useSellerProfile, useSellerAuctions, useSellerReviews } from '@/hooks/useSeller';
import './SellerProfilePage.scss';

export function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: seller, isLoading: profileLoading } = useSellerProfile(id);
  const { data: auctions } = useSellerAuctions(id);
  const { data: reviews } = useSellerReviews(id);

  if (profileLoading) {
    return (
      <div className="seller-profile-page">
        <div className="seller-profile-container">
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="seller-profile-page">
        <div className="seller-profile-container">
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
            Seller not found
          </div>
        </div>
      </div>
    );
  }

  const { profile, ratingSummary } = seller;
  const activeAuctions = auctions?.filter(a => a.status === 'active').slice(0, 4) || [];
  const yearsOnPlatform = Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (365 * 24 * 60 * 60 * 1000));

  return (
    <div className="seller-profile-page">
      <div className="seller-profile-container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span className="breadcrumb-link" onClick={() => navigate('/')}>Home</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-link" onClick={() => navigate('/browse')}>Sellers</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{profile.storeName}</span>
        </div>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-left">
            <div className="avatar-wrapper">
              <img
                src={seller.avatarUrl || 'https://api.dicebear.com/9.x/initials/svg?seed=' + profile.storeName}
                alt={profile.storeName}
                className="avatar"
              />
              {profile.status === 'verified' && (
                <div className="verified-indicator"></div>
              )}
            </div>
            <div className="profile-details">
              <div className="name-row">
                <h1 className="seller-name">{profile.storeName}</h1>
                {profile.status === 'verified' && (
                  <span className="verified-badge">VERIFIED SELLER</span>
                )}
              </div>
              <p className="seller-bio">{profile.storeDescription}</p>
              <div className="rating-row">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`star ${i < Math.floor(profile.ratingAverage) ? 'filled' : ''}`}>★</span>
                  ))}
                </div>
                <span className="rating-value">{profile.ratingAverage.toFixed(1)}</span>
                <span className="rating-count">({profile.ratingCount} reviews)</span>
              </div>
            </div>
          </div>
          <div className="profile-right">
            <div className="trust-meter">
              <div className="trust-circle-wrapper">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#334155" strokeWidth="5.33" />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="#1152D4"
                    strokeWidth="5.33"
                    strokeDasharray={`${(profile.trustScore / 100) * 176} 176`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </svg>
                <div className="trust-score-number">{Math.round(profile.trustScore)}</div>
              </div>
              <div className="trust-info">
                <div className="trust-label">TRUST SCORE</div>
                <div className="trust-text">Exceptional</div>
              </div>
            </div>
            <button className="follow-btn">Follow Seller</button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="18" height="19" viewBox="0 0 18 19" fill="none">
                <path d="M9 2L11 7L16 8L12 12L13 17L9 14.5L5 17L6 12L2 8L7 7L9 2Z" fill="#1152D4" />
              </svg>
            </div>
            <div className="stat-label">SUCCESSFUL AUCTIONS</div>
            <div className="stat-value">{profile.successfulSalesCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
                <rect x="3" y="4" width="12" height="14" rx="1" fill="#1152D4" />
                <path d="M6 2V6M12 2V6" stroke="#1152D4" strokeWidth="2" />
              </svg>
            </div>
            <div className="stat-label">YEARS ON PLATFORM</div>
            <div className="stat-value">{yearsOnPlatform}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                <path d="M1 8H21M21 8L14 1M21 8L14 15" stroke="#1152D4" strokeWidth="2" />
              </svg>
            </div>
            <div className="stat-label">AVG. DELIVERY TIME</div>
            <div className="stat-value">2 days</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="content-layout">
          {/* Left Column */}
          <div className="left-col">
            {/* Trust Breakdown */}
            <div className="section">
              <h2 className="section-heading">
                <svg width="15" height="22" viewBox="0 0 15 22" fill="white">
                  <path d="M7.5 2L13 8H9V14H6V8H2L7.5 2Z" />
                </svg>
                Trust Breakdown
              </h2>
              <div className="trust-breakdown">
                <div className="trust-item">
                  <div className="trust-item-header">
                    <span>Item Accuracy</span>
                    <span className="trust-percent">98%</span>
                  </div>
                  <div className="trust-bar">
                    <div className="trust-fill" style={{ width: '98%' }}></div>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-item-header">
                    <span>Communication</span>
                    <span className="trust-percent">95%</span>
                  </div>
                  <div className="trust-bar">
                    <div className="trust-fill" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div className="trust-item">
                  <div className="trust-item-header">
                    <span>Shipping Speed</span>
                    <span className="trust-percent">91%</span>
                  </div>
                  <div className="trust-bar">
                    <div className="trust-fill" style={{ width: '91%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="section">
              <h2 className="section-heading">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                  <circle cx="10" cy="10" r="8" />
                </svg>
                Recent Feedback
              </h2>
              <div className="feedback-list">
                {reviews?.slice(0, 2).map((review) => (
                  <div key={review.id} className="feedback-item">
                    <div className="feedback-top">
                      <div className="feedback-user">
                        <div className="feedback-avatar">
                          <svg width="9.33" height="9.33" viewBox="0 0 10 10" fill="#F1F5F9">
                            <circle cx="5" cy="5" r="5" />
                          </svg>
                        </div>
                        <span className="feedback-username">{review.reviewerName}</span>
                      </div>
                      <span className="feedback-badge">VERIFIED</span>
                    </div>
                    <p className="feedback-text">{review.comment}</p>
                    <div className="feedback-stars">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`mini-star ${i < review.overallRating ? 'filled' : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="view-all-btn">View All 142 Reviews</button>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-col">
            <div className="section">
              <div className="section-header">
                <h2 className="section-heading">
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="white">
                    <rect width="16" height="20" rx="2" />
                  </svg>
                  Current Auctions
                </h2>
                <div className="view-toggles">
                  <button className="toggle-btn">
                    <svg width="13.5" height="13.5" viewBox="0 0 14 14" fill="#F1F5F9">
                      <rect width="6" height="6" /><rect x="8" width="6" height="6" />
                      <rect y="8" width="6" height="6" /><rect x="8" y="8" width="6" height="6" />
                    </svg>
                  </button>
                  <button className="toggle-btn active">
                    <svg width="13.5" height="7.5" viewBox="0 0 14 8" fill="#F1F5F9">
                      <rect width="14" height="2" /><rect y="6" width="14" height="2" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="auctions-grid">
                {activeAuctions.map((auction) => (
                  <div key={auction.id} className="auction-item" onClick={() => navigate(`/auction/${auction.id}`)}>
                    <div className="auction-image">
                      <img src={auction.images?.[0]?.imageUrl || 'https://picsum.photos/seed/' + auction.id + '/300/224'} alt={auction.title} />
                      <span className="auction-badge">ACTIVE</span>
                      <span className="auction-watchers">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                          <circle cx="5" cy="5" r="5" />
                        </svg>
                        {auction.watchCount || 12}
                      </span>
                    </div>
                    <div className="auction-details">
                      <h3 className="auction-title">
                        {auction.title && auction.title.length > 40
                          ? auction.title.substring(0, 40) + '...'
                          : auction.title || 'Untitled Item'}
                      </h3>
                      <p className="auction-subtitle">
                        {auction.description?.substring(0, 50) || 'Premium collectible item'}
                      </p>
                      <div className="auction-footer">
                        <div className="auction-price">
                          <span className="price-label">CURRENT BID</span>
                          <span className="price-value">
                            ${Math.floor((auction.currentPrice || 0) / 1000).toLocaleString()}
                          </span>
                        </div>
                        <button className="bid-btn" onClick={(e) => e.stopPropagation()}>Bid Now</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="load-more-btn">Load More Auctions</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
