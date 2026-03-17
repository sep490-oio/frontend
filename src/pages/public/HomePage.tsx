/**
 * HomePage — Landing page with Hero + Featured Auctions
 * Redesigned to match new specifications
 */

import './HomePage.scss';
import { useMemo, useState } from 'react';
import { Button, Spin, Empty, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { AuctionFilters, AuctionStatus } from '@/types';
import { useAuctions } from '@/hooks/useAuctions';
import { AuctionCard } from '@/components/auction/AuctionCard';

export function HomePage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');

  const filters: AuctionFilters = useMemo(() => ({
    page: 1,
    sortBy: 'endTime',
    sortOrder: 'asc',
    status: ['active'] as AuctionStatus[],
    pageSize: 8,
  }), []);

  const { data, isLoading } = useAuctions(filters);
  const featuredAuctions = data?.items ?? [];

  const categories = [
    { key: 'all', label: 'Tất cả' },
    { key: 'watches', label: 'Đồng hồ' },
    { key: 'wine', label: 'Rượu quý' },
    { key: 'art', label: 'Nghệ thuật' },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow hero-glow--blue" />
        <div className="hero-glow hero-glow--purple" />

        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-heading">
              Sở hữu tuyệt tác<br />
              Đã được kiểm định
            </h1>
            <p className="hero-subtitle">
              Khám phá những vật phẩm xa xỉ, độc đáo được xác thực bởi các chuyên gia hàng đầu.
            </p>
            <div className="hero-actions">
              <button className="btn-explore" onClick={() => navigate('/browse')}>
                Khám phá ngay
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button className="btn-sell" onClick={() => navigate('/register')}>
                Ký gửi vật phẩm
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">12K+</div>
                <div className="stat-label">Sản phẩm</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">45K+</div>
                <div className="stat-label">Người dùng</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">100%</div>
                <div className="stat-label">Xác thực</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-card">
              <img src="/placeholder-item.svg" alt="Luxury Item" className="hero-visual-image" />
              <div className="hero-visual-overlay">
                <div className="overlay-left">
                  <div className="overlay-label">Giá khởi điểm</div>
                  <div className="overlay-value">250.000.000₫</div>
                </div>
                <div className="overlay-right">
                  <div className="overlay-label">Số lượt</div>
                  <div className="overlay-value-blue">24</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="categories-container">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`category-btn ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="auction-section">
        <div className="section-header">
          <div className="header-left">
            <h2 className="section-title">Sản phẩm nổi bật</h2>
            <p className="section-subtitle">Khám phá những vật phẩm hiếm có nhất hiện nay.</p>
          </div>
          <a href="/browse" className="view-all-link">
            Xem tất cả
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="auction-grid">
          {isLoading ? (
            <div className="loading-state"><Spin size="large" /></div>
          ) : featuredAuctions.length === 0 ? (
            <Empty description="Hiện không có phiên đấu giá nào" />
          ) : (
            featuredAuctions.slice(0, 4).map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))
          )}
        </div>
      </section>

      {/* Live Auctions Section */}
      <section className="auction-section">
        <div className="section-header">
          <div className="header-left">
            <h2 className="section-title">Đang diễn ra</h2>
            <p className="section-subtitle">Khám phá những vật phẩm hiếm có nhất hiện nay.</p>
          </div>
          <a href="/browse" className="view-all-link">
            Xem tất cả
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="auction-grid">
          {isLoading ? (
            <div className="loading-state"><Spin size="large" /></div>
          ) : featuredAuctions.length === 0 ? (
            <Empty description="Hiện không có phiên đấu giá nào" />
          ) : (
            featuredAuctions.slice(0, 4).map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))
          )}
        </div>

        <div className="load-more-container">
          <button className="load-more-btn">Xem thêm vật phẩm</button>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="trust-header">
          <h2 className="trust-title">Tại sao chọn oio.vn?</h2>
          <p className="trust-subtitle">
            Chúng tôi xây dựng niềm tin thông qua sự minh bạch tuyệt đối và quy trình kiểm định khắt khe nhất.
          </p>
        </div>
        <div className="trust-grid">
          <div className="trust-card">
            <div className="trust-icon trust-icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.67">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="trust-card-title">Kiểm định 100%</h3>
            <p className="trust-card-desc">
              Mọi vật phẩm đều qua tay các chuyên gia hàng đầu để đảm bảo tính xác thực tuyệt đối.
            </p>
          </div>
          <div className="trust-card">
            <div className="trust-icon trust-icon--purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.67">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h3 className="trust-card-title">Thanh toán bảo mật</h3>
            <p className="trust-card-desc">
              Hệ thống thanh toán bảo mật, hỗ trợ nhiều phương thức linh hoạt cho nhà sưu tầm.
            </p>
          </div>
          <div className="trust-card">
            <div className="trust-icon trust-icon--cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.67">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="trust-card-title">Đấu giá thời gian thực</h3>
            <p className="trust-card-desc">
              Công nghệ live-bidding mượt mà, đảm bảo công bằng cho mọi người tham gia.
            </p>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-glow" />
        <h2 className="newsletter-title">Đừng bỏ lỡ tuyệt tác nào</h2>
        <p className="newsletter-subtitle">
          Đăng ký nhận thông tin về các buổi đấu giá đặc biệt và vật phẩm hiếm sắp ra mắt.
        </p>
        <form className="newsletter-form">
          <input
            type="email"
            placeholder="Địa chỉ email của bạn"
            className="newsletter-input"
          />
          <button type="submit" className="newsletter-btn">
            Đăng ký ngay
          </button>
        </form>
      </section>
    </div>
  );
}
