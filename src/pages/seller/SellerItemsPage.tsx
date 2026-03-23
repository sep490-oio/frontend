/**
 * SellerItemsPage - Trang vật phẩm đang đấu giá của seller
 * Hiển thị các vật phẩm mà seller đang bán trên nền tảng
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SellerItemsPage.scss';

type ViewMode = 'grid' | 'list';
type ItemStatus = 'active' | 'pending' | 'ended';

interface SellerItem {
    id: string;
    title: string;
    image: string;
    startingPrice: number;
    currentBid: number;
    bidCount: number;
    timeLeft: string;
    status: ItemStatus;
    statusLabel: string;
    statusColor: string;
}

const mockItems: SellerItem[] = [
    {
        id: '1',
        title: 'Rolex GMT-Master II "Pepsi" 126710BLRO',
        image: '/placeholder-item.svg',
        startingPrice: 580000000,
        currentBid: 580000000,
        bidCount: 24,
        timeLeft: '12:38:45',
        status: 'active',
        statusLabel: 'ĐANG DIỄN RA',
        statusColor: '#2563EB',
    },
    {
        id: '2',
        title: 'Hermès Birkin 30 Black Togo Gold Hardware',
        image: '/placeholder-item.svg',
        startingPrice: 625000000,
        currentBid: 625000000,
        bidCount: 38,
        timeLeft: '00:18:22',
        status: 'pending',
        statusLabel: 'SẮP KẾT THÚC',
        statusColor: '#F97316',
    },
    {
        id: '3',
        title: 'Louis Vuitton Courrier Lozine 110 Trunk',
        image: '/placeholder-item.svg',
        startingPrice: 1150000000,
        currentBid: 1150000000,
        bidCount: 12,
        timeLeft: '48:12:05',
        status: 'active',
        statusLabel: 'ĐANG DIỄN RA',
        statusColor: '#2563EB',
    },
];

export function SellerItemsPage() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(3)}B ₫`;
        }
        return `${(amount / 1000000).toLocaleString('vi-VN')}M ₫`;
    };

    return (
        <div className="seller-items-page">
            {/* Sub-navigation Tab Bar */}
            <nav className="sub-navigation">
                <button className="nav-tab" onClick={() => navigate('/seller-dashboard')}>
                    Tổng quan
                </button>
                <button className="nav-tab" onClick={() => navigate('/seller-dashboard/active-auctions')}>
                    Đấu giá đang tham gia
                </button>
                <button className="nav-tab active">
                    Vật phẩm đang đấu giá
                </button>
                <button className="nav-tab">
                    Đơn hàng
                </button>
                <button className="nav-tab">
                    Phân tích
                </button>
            </nav>

            {/* Main Content */}
            <section className="items-section">
                {/* Section Header */}
                <div className="section-header">
                    <div className="header-left">
                        <h2 className="section-title">Vật phẩm đang đấu giá</h2>
                        <p className="section-subtitle">
                            Quản lý 3 vật phẩm bạn đang đăng bán trực tiếp.
                        </p>
                    </div>
                    <div className="header-right">
                        <button
                            className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                            aria-label="List view"
                        >
                            <svg width="11" height="7" viewBox="0 0 11 7" fill="none">
                                <rect width="10.5" height="1.5" fill="currentColor" />
                                <rect y="5.5" width="10.5" height="1.5" fill="currentColor" />
                            </svg>
                        </button>
                        <button
                            className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                            aria-label="Grid view"
                        >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                <rect width="4.5" height="4.5" fill="currentColor" />
                                <rect x="6" width="4.5" height="4.5" fill="currentColor" />
                                <rect y="6" width="4.5" height="4.5" fill="currentColor" />
                                <rect x="6" y="6" width="4.5" height="4.5" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Items Grid */}
                <div className={`items-grid ${viewMode}`}>
                    {mockItems.map((item) => (
                        <article key={item.id} className="item-card">
                            {/* Image Container */}
                            <div className="item-image-container">
                                <div
                                    className="item-image"
                                    style={{ backgroundImage: `url(${item.image})` }}
                                />

                                {/* Status Badge */}
                                <div
                                    className="status-badge"
                                    style={{ backgroundColor: item.statusColor }}
                                >
                                    <span className="status-text">{item.statusLabel}</span>
                                </div>

                                {/* Time Badge */}
                                <div className="time-badge">
                                    <span className="time-value">{item.timeLeft}</span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="item-content">
                                <div className="item-info">
                                    <h4 className="item-title">{item.title}</h4>

                                    {/* Bid Info */}
                                    <div className="bid-info">
                                        <div className="bid-current">
                                            <span className="bid-label">Giá khởi điểm</span>
                                            <span className="bid-value">
                                                {formatCurrency(item.currentBid)}
                                            </span>
                                        </div>
                                        <div className="bid-count">
                                            <span className="count-label">Lượt đặt</span>
                                            <span className="count-value">{item.bidCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    className="btn-action"
                                    onClick={() => navigate(`/auction/${item.id}`)}
                                >
                                    Quản lý phiên
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* Marketplace Explorer Section */}
            <section className="marketplace-explorer">
                <div className="explorer-content">
                    <div className="explorer-text">
                        <h2 className="explorer-title">
                            Tìm kiếm kiệt tác tiếp theo để sưu tầm?
                        </h2>
                        <p className="explorer-description">
                            Là người bán tại Metaz, bạn cũng có quyền truy cập độc quyền vào các
                            phiên đấu giá kín và những ưu đãi sớm dành cho nhà sưu tập hàng đầu.
                        </p>
                        <div className="explorer-actions">
                            <button className="btn-explore-primary">Khám phá thị trường</button>
                            <button className="btn-explore-secondary">Xem danh mục đầy đủ</button>
                        </div>
                    </div>

                    <div className="explorer-categories">
                        <div className="category-row">
                            <div className="category-card">
                                <span className="category-label">Nghệ thuật</span>
                                <span className="category-count">+1.2k vật phẩm</span>
                            </div>
                            <div className="category-card">
                                <span className="category-label">Đồng hồ</span>
                                <span className="category-count">+850 vật phẩm</span>
                            </div>
                        </div>
                        <div className="category-row">
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
