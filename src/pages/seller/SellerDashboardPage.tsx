/**
 * SellerDashboardPage — Trang dashboard cho người bán theo thiết kế Figma
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { useSellerDashboard } from '@/hooks/useSeller';
import './SellerDashboardPage.scss';

type TabType = 'overview' | 'active-auctions' | 'items' | 'orders' | 'analytics';

export function SellerDashboardPage() {
    const { t } = useTranslation();
    const user = useAppSelector((state) => state.auth.user);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const { data: dashboardData } = useSellerDashboard();

    const stats = dashboardData?.stats || {
        trustScore: 99.8,
        rating: 4.9,
        totalRevenue: 2400000000,
        totalItems: 142,
    };

    const wallet = dashboardData?.wallet || {
        balance: 45000000,
        balanceUSD: 1850,
    };

    return (
        <div className="seller-dashboard-page">
            {/* Hero Stats Section */}
            <section className="hero-stats-section">
                {/* Welcome & Trust Meter */}
                <div className="welcome-card">
                    <div className="welcome-content">
                        <div className="welcome-header">
                            <h1 className="welcome-title">
                                Chào mừng trở lại, {user?.displayName || 'Alex Nguyen'}
                            </h1>
                            <p className="welcome-subtitle">
                                Hôm nay, bạn có 15+ vật phẩm đang hoạt động. Hãy tiếp tục duy trì!
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-label">Độ tin cậy</span>
                                <span className="stat-value trust-score">{stats.trustScore}%</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Đánh giá</span>
                                <div className="stat-value-row">
                                    <span className="stat-value">{stats.rating}</span>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <path d="M10 2L12.5 7.5L18.5 8.5L14.25 12.5L15.5 18.5L10 15.5L4.5 18.5L5.75 12.5L1.5 8.5L7.5 7.5L10 2Z" fill="#EAB308" />
                                    </svg>
                                </div>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Tổng doanh thu</span>
                                <span className="stat-value">{(stats.totalRevenue / 1000000000).toFixed(1)}B ₫</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Vật phẩm</span>
                                <span className="stat-value">{stats.totalItems}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wallet Balance Card */}
                <div className="wallet-balance-card">
                    <div className="wallet-header">
                        <span className="wallet-label">Ví tiền</span>
                        <div className="wallet-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M21 8V6C21 4.9 20.1 4 19 4H5C3.9 4 3 4.9 3 6V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V16" stroke="white" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                    <div className="wallet-amount">
                        <h2 className="wallet-balance">{wallet.balance.toLocaleString('vi-VN')} ₫</h2>
                        <p className="wallet-usd">≈ {wallet.balanceUSD.toLocaleString('en-US')} USD</p>
                    </div>
                    <div className="wallet-actions">
                        <button className="btn-wallet-primary">Rút tiền</button>
                        <button className="btn-wallet-secondary">Lịch sử</button>
                    </div>
                </div>
            </section>

            {/* Tabs Navigation */}
            <nav className="tabs-navigation">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Tổng quan
                </button>
                <button
                    className={`tab-button ${activeTab === 'active-auctions' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('active-auctions');
                        window.location.href = '/seller-dashboard/active-auctions';
                    }}
                >
                    Đấu giá đang tham gia
                </button>
                <button
                    className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('items');
                        window.location.href = '/seller-dashboard/items';
                    }}
                >
                    Vật phẩm đang đấu giá
                </button>
                <button
                    className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Đơn hàng
                </button>
                <button
                    className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Phân tích
                </button>
            </nav>

            {/* Performance Chart Section */}
            <section className="performance-chart-section">
                <div className="section-header">
                    <h3 className="section-title">Hiệu suất bán hàng</h3>
                    <select className="chart-period-select">
                        <option>7 ngày qua</option>
                        <option>30 ngày qua</option>
                        <option>90 ngày qua</option>
                    </select>
                </div>
                <div className="chart-container">
                    {/* Mock Bar Chart */}
                    {[108, 175.5, 148.5, 243, 121.5, 189, 162, 216, 135, 108, 81, 148.5].map((height, index) => (
                        <div
                            key={index}
                            className={`chart-bar ${index === 3 ? 'highlighted' : ''}`}
                            style={{ height: `${height}px` }}
                        >
                            {index === 3 && <div className="chart-tooltip">24.5M</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* Active Auctions Section */}
            <section className="active-auctions-section">
                <div className="section-header">
                    <div className="section-title-group">
                        <h3 className="section-title">Đấu giá đang hoạt động</h3>
                        <span className="section-badge">15 đang hoạt động</span>
                    </div>
                    <a href="#" className="section-link">Xem tất cả</a>
                </div>

                <div className="auctions-grid">
                    {/* Auction Item 1 */}
                    <article className="auction-card">
                        <div className="auction-image-container">
                            <div className="auction-image" style={{ background: '#1F2937' }} />
                            <div className="auction-badges">
                                <span className="badge badge-active">Đang hoạt động</span>
                                <span className="badge badge-reserve">Giá dự trữ</span>
                            </div>
                            <div className="auction-timer">
                                <span className="timer-label">Kết thúc sau</span>
                                <span className="timer-value">2h 34m</span>
                            </div>
                        </div>
                        <div className="auction-details">
                            <div className="auction-info">
                                <h4 className="auction-title">Rolex Submariner Date 126610LN</h4>
                                <p className="auction-code">Mã vật phẩm: #527901</p>
                                <div className="auction-pricing">
                                    <div className="current-bid">
                                        <span className="bid-label">Giá hiện tại</span>
                                        <span className="bid-value">45.000.000 ₫</span>
                                    </div>
                                    <div className="bid-count">
                                        <span className="count-label">Lượt đặt</span>
                                        <span className="count-value">23</span>
                                    </div>
                                </div>
                            </div>
                            <button className="btn-view-auction">Xem chi tiết</button>
                        </div>
                    </article>

                    {/* Auction Item 2 */}
                    <article className="auction-card">
                        <div className="auction-image-container">
                            <div className="auction-image" style={{ background: '#1F2937' }} />
                            <div className="auction-badges">
                                <span className="badge badge-active">Đang hoạt động</span>
                            </div>
                            <div className="auction-timer">
                                <span className="timer-label">Kết thúc sau</span>
                                <span className="timer-value">5h 12m</span>
                            </div>
                        </div>
                        <div className="auction-details">
                            <div className="auction-info">
                                <h4 className="auction-title">Hermès Birkin 30 Crocodile</h4>
                                <p className="auction-code">Mã vật phẩm: #527902</p>
                                <div className="auction-pricing">
                                    <div className="current-bid">
                                        <span className="bid-label">Giá hiện tại</span>
                                        <span className="bid-value">120.000.000 ₫</span>
                                    </div>
                                    <div className="bid-count">
                                        <span className="count-label">Lượt đặt</span>
                                        <span className="count-value">8</span>
                                    </div>
                                </div>
                            </div>
                            <button className="btn-view-auction">Xem chi tiết</button>
                        </div>
                    </article>

                    {/* Auction Item 3 - Wait List */}
                    <article className="auction-card waitlist">
                        <div className="auction-image-container">
                            <div className="auction-image grayscale" style={{ background: '#1F2937' }} />
                            <div className="auction-badges">
                                <span className="badge badge-waitlist">Chờ phê duyệt</span>
                                <span className="badge badge-reserve">Giá dự trữ</span>
                            </div>
                            <div className="auction-timer waitlist-timer">
                                <span className="timer-label">Chờ duyệt</span>
                                <span className="timer-value">~24h</span>
                            </div>
                        </div>
                        <div className="auction-details">
                            <div className="auction-info">
                                <h4 className="auction-title muted">The Macallan 60 Year Old Lalique</h4>
                                <p className="auction-code muted">Mã vật phẩm: #527903</p>
                                <div className="auction-pricing">
                                    <div className="current-bid">
                                        <span className="bid-label muted">Giá khởi điểm</span>
                                        <span className="bid-value muted">500.000.000 ₫</span>
                                    </div>
                                </div>
                            </div>
                            <button className="btn-view-auction disabled">Xem chi tiết</button>
                        </div>
                    </article>

                    {/* Placeholder for New Item */}
                    <div className="auction-card-placeholder">
                        <div className="placeholder-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="placeholder-text">Thêm vật phẩm mới</span>
                    </div>
                </div>
            </section>

            {/* Marketplace Explorer Section */}
            <section className="marketplace-explorer-section">
                <div className="explorer-content">
                    <div className="explorer-text">
                        <h2 className="explorer-title">
                            Tìm kiếm kiệt tác tiếp theo để sưu tầm?
                        </h2>
                        <p className="explorer-description">
                            Là người bán tại Metaz, bạn cũng có quyền truy cập độc quyền vào các phiên đấu giá kín và những ưu đãi sớm dành cho nhà sưu tập hàng đầu.
                        </p>
                        <div className="explorer-actions">
                            <button className="btn-explore-primary">Khám phá đấu giá</button>
                            <button className="btn-explore-secondary">Tìm kiếm nâng cao</button>
                        </div>
                    </div>

                    <div className="explorer-categories">
                        <div className="category-grid-left">
                            <div className="category-card">
                                <span className="category-label">Nghệ thuật</span>
                                <span className="category-count">+1.2k vật phẩm</span>
                            </div>
                            <div className="category-card">
                                <span className="category-label">Đồng hồ</span>
                                <span className="category-count">+850 vật phẩm</span>
                            </div>
                        </div>
                        <div className="category-grid-right">
                            <div className="category-card">
                                <span className="category-label">Rượu quý</span>
                                <span className="category-count">+400 vật phẩm</span>
                            </div>
                            <div className="category-card">
                                <span className="category-label">Túi xách</span>
                                <span className="category-count">+320 vật phẩm</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
