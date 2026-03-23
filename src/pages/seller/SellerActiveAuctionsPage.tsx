/**
 * SellerActiveAuctionsPage - Trang đấu giá đang tham gia của seller
 * Tab trong Seller Dashboard hiển thị các đấu giá đang hoạt động
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SellerActiveAuctionsPage.scss';

type ViewMode = 'grid' | 'list';

interface ActiveAuction {
    id: string;
    title: string;
    image: string;
    currentBid: number;
    bidCount: number;
    timeLeft: string;
    status: 'leading' | 'outbid';
    statusLabel: string;
}

const mockAuctions: ActiveAuction[] = [
    {
        id: '1',
        title: 'Patek Philippe Nautilus 5711/1A',
        image: '/placeholder-item.svg',
        currentBid: 2850000000,
        bidCount: 42,
        timeLeft: '09:45:12',
        status: 'leading',
        statusLabel: 'ĐANG DẪN ĐẦU (LEADING)',
    },
    {
        id: '2',
        title: 'Hermès Birkin 25 Himalayan Crocodile',
        image: '/placeholder-item.svg',
        currentBid: 3200000000,
        bidCount: 15,
        timeLeft: '02:18:08',
        status: 'outbid',
        statusLabel: 'BỊ VƯỢT GIÁ (OUTBID)',
    },
    {
        id: '3',
        title: 'Macallan 1926 60 Year Old Fine & Rare',
        image: '/placeholder-item.svg',
        currentBid: 45000000000,
        bidCount: 8,
        timeLeft: '04:33:59',
        status: 'leading',
        statusLabel: 'ĐANG DẪN ĐẦU (LEADING)',
    },
];

export function SellerActiveAuctionsPage() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(1)}B ₫`;
        }
        return `${(amount / 1000000).toLocaleString('vi-VN')}M ₫`;
    };

    return (
        <div className="seller-active-auctions-page">
            {/* Sub-navigation Tab Bar */}
            <nav className="sub-navigation">
                <button className="nav-tab" onClick={() => navigate('/seller-dashboard')}>
                    Tổng quan
                </button>
                <button className="nav-tab active">
                    Đấu giá đang tham gia
                </button>
                <button className="nav-tab">
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
            <section className="auctions-section">
                {/* Section Header */}
                <div className="section-header">
                    <div className="header-left">
                        <h2 className="section-title">Đấu giá đang tham gia</h2>
                        <p className="section-subtitle">
                            Bạn đang theo dõi 3 phiên đấu giá trực tiếp.
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

                {/* Auctions Grid */}
                <div className={`auctions-grid ${viewMode}`}>
                    {mockAuctions.map((auction) => (
                        <article key={auction.id} className="auction-card">
                            {/* Image Container */}
                            <div className="auction-image-container">
                                <div
                                    className="auction-image"
                                    style={{ backgroundImage: `url(${auction.image})` }}
                                />

                                {/* Status Badge */}
                                <div className={`status-badge ${auction.status}`}>
                                    {auction.status === 'leading' && (
                                        <span className="status-dot" />
                                    )}
                                    <span className="status-text">{auction.statusLabel}</span>
                                </div>

                                {/* Time Badge */}
                                <div className="time-badge">
                                    <span className="time-value">{auction.timeLeft}</span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="auction-content">
                                <div className="auction-info">
                                    <h4 className="auction-title">{auction.title}</h4>

                                    {/* Bid Info */}
                                    <div
                                        className={`bid-info ${auction.status === 'outbid' ? 'outbid' : ''
                                            }`}
                                    >
                                        <div className="bid-current">
                                            <span className="bid-label">
                                                {auction.status === 'outbid' ? 'Giá của tôi' : 'Giá hiện tại'}
                                            </span>
                                            <span className="bid-value">
                                                {formatCurrency(auction.currentBid)}
                                            </span>
                                        </div>
                                        <div className="bid-count">
                                            <span className="count-label">Lượt đặt</span>
                                            <span className="count-value">{auction.bidCount}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    className={`btn-action ${auction.status === 'outbid' ? 'urgent' : ''
                                        }`}
                                    onClick={() => navigate(`/auction/${auction.id}`)}
                                >
                                    {auction.status === 'outbid'
                                        ? 'Đặt giá mới ngay'
                                        : 'Xem chi tiết'}
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
