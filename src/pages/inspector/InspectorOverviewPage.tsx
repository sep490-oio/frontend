import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './InspectorOverviewPage.scss';

interface PendingItem {
    id: string;
    name: string;
    code: string;
    category: 'WATCHES' | 'FASHION' | 'ART';
    categoryLabel: string;
    image: string;
    submittedTime: string;
    price: string;
    priceLabel: string;
}

const InspectorOverviewPage: React.FC = () => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'watches' | 'fashion' | 'art'>('all');

    const stats = {
        pending: { value: '124', change: '+12% so với hôm qua', trend: 'up' },
        accuracy: { value: '99.2%', label: 'Duy trì ở mức ổn định' },
        avgTime: { value: '4.5m', change: '-30s nhanh hơn TB', trend: 'down' }
    };

    const pendingItems: PendingItem[] = [
        {
            id: '1',
            name: 'Rolex Daytona 116500LN',
            code: '#RD-9961',
            category: 'WATCHES',
            categoryLabel: 'WATCHES',
            image: '/placeholder-item.svg',
            submittedTime: 'Gửi lúc: 14:30 Hôm nay',
            price: '$32,500',
            priceLabel: 'Mức giá dự kiến'
        },
        {
            id: '2',
            name: 'Nike Air Jordan 1 Retro High',
            code: '#AJ-4482',
            category: 'FASHION',
            categoryLabel: 'FASHION',
            image: '/placeholder-item.svg',
            submittedTime: 'Gửi lúc: 12:15 Hôm nay',
            price: '$4,200',
            priceLabel: 'Mức giá dự kiến'
        },
        {
            id: '3',
            name: 'Tác phẩm "Vô Diện" #04',
            code: '#AR-00DE',
            category: 'ART',
            categoryLabel: 'ART',
            image: '/placeholder-item.svg',
            submittedTime: 'Gửi lúc: 10:45 Hôm nay',
            price: '$12,800',
            priceLabel: 'Mức giá dự kiến'
        }
    ];

    const recentHistory = [
        {
            id: '1',
            name: 'LV Keepall 50 Bandouliere',
            status: 'approved',
            statusLabel: 'CHẤP THUẬN',
            time: '10:20 - 24/05',
            note: 'Full phụ kiện, hóa đơn gốc.'
        },
        {
            id: '2',
            name: 'Patek Philippe Nautilus',
            status: 'rejected',
            statusLabel: 'TỪ CHỐI',
            time: '09:45 - 24/05',
            note: 'Nghi ngờ mất số đã thay thế.'
        }
    ];

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'WATCHES': return '#0D7FF2';
            case 'FASHION': return '#10B981';
            case 'ART': return '#A855F7';
            default: return '#0D7FF2';
        }
    };

    return (
        <div className="inspector-overview-page">
            {/* Header */}
            <header className="inspector-header">
                <div className="header-left">
                    <div className="logo">
                        <svg width="20" height="25" viewBox="0 0 20 25" fill="none">
                            <path d="M10 0L0 5V12.5C0 19.4 4.84 25.86 10 27.5C15.16 25.86 20 19.4 20 12.5V5L10 0Z" fill="#0D7FF2" />
                        </svg>
                        <h1>oio.vn Inspector</h1>
                    </div>
                    <nav className="main-nav">
                        <Link to="/inspector" className="nav-link active">Tổng quan</Link>
                        <Link to="/inspector/history" className="nav-link">Lịch sử</Link>
                        <Link to="/inspector/reports" className="nav-link">Báo cáo</Link>
                    </nav>
                </div>
                <div className="header-right">
                    <div className="search-box">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <circle cx="6.5" cy="6.5" r="5.5" stroke="#94A3B8" strokeWidth="1.5" />
                            <path d="M11 11L14 14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <input type="text" placeholder="Tìm kiếm vật phẩm..." />
                    </div>
                    <button className="notification-btn">
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                            <path d="M8 20C9.1 20 10 19.1 10 18H6C6 19.1 6.9 20 8 20ZM14 14V9C14 5.93 12.37 3.36 9.5 2.68V2C9.5 1.17 8.83 0.5 8 0.5C7.17 0.5 6.5 1.17 6.5 2V2.68C3.64 3.36 2 5.92 2 9V14L0 16V17H16V16L14 14Z" fill="#CBD5E1" />
                        </svg>
                    </button>
                    <div className="user-avatar">
                        <img src="https://i.pravatar.cc/40" alt="User" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {/* Stats Section */}
                <div className="stats-section">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">ĐANG CHỜ XỬ LÝ</span>
                            <div className="stat-icon blue">
                                <svg width="19" height="21" viewBox="0 0 19 21" fill="none">
                                    <path d="M9.5 0L0 5V11C0 17 4.5 22.5 9.5 24C14.5 22.5 19 17 19 11V5L9.5 0Z" fill="#0D7FF2" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">{stats.pending.value}</div>
                        <div className="stat-change positive">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                <path d="M5 0L10 6H0L5 0Z" fill="#34D399" />
                            </svg>
                            <span>{stats.pending.change}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">ĐỘ CHÍNH XÁC</span>
                            <div className="stat-icon blue">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="10" r="9" stroke="#0D7FF2" strokeWidth="2" />
                                    <path d="M6 10L9 13L14 7" stroke="#0D7FF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">{stats.accuracy.value}</div>
                        <div className="stat-change neutral">
                            <span>{stats.accuracy.label}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-label">THỜI GIAN TB</span>
                            <div className="stat-icon blue">
                                <svg width="18" height="21" viewBox="0 0 18 21" fill="none">
                                    <rect x="1" y="3" width="16" height="16" rx="2" stroke="#0D7FF2" strokeWidth="2" />
                                    <path d="M9 7V11L12 13" stroke="#0D7FF2" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                        <div className="stat-value">{stats.avgTime.value}</div>
                        <div className="stat-change negative">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                <path d="M5 6L0 0H10L5 6Z" fill="#FB7185" />
                            </svg>
                            <span>{stats.avgTime.change}</span>
                        </div>
                    </div>
                </div>

                {/* Pending Items Section */}
                <div className="pending-section">
                    <div className="section-header">
                        <div className="header-text">
                            <h2>Vật phẩm chờ giám định</h2>
                            <p>Kiểm tra và xác thực các vật phẩm đấu giá mới trong hàng đợi</p>
                        </div>
                        <div className="filter-tabs">
                            <button
                                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
                                    <path d="M1 1L7 6L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Tất cả
                            </button>
                            <button
                                className={`filter-btn ${activeFilter === 'watches' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('watches')}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                Đồng hồ
                            </button>
                            <button
                                className={`filter-btn ${activeFilter === 'fashion' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('fashion')}
                            >
                                <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
                                    <path d="M6 1L1 3V8L6 10L11 8V3L6 1Z" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                Thời trang
                            </button>
                            <button
                                className={`filter-btn ${activeFilter === 'art' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('art')}
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                Nghệ thuật
                            </button>
                        </div>
                    </div>

                    <div className="items-grid">
                        {pendingItems.map((item) => (
                            <div key={item.id} className={`item-card ${item.id === '1' ? 'featured' : ''}`}>
                                <div className="item-image">
                                    <img src={item.image} alt={item.name} />
                                    <span className="category-badge" style={{ background: getCategoryColor(item.category) }}>
                                        {item.categoryLabel}
                                    </span>
                                    {item.id === '1' && (
                                        <div className="hover-overlay">
                                            <button className="inspect-btn">Kiểm định</button>
                                        </div>
                                    )}
                                </div>
                                <div className="item-info">
                                    <div className="item-header">
                                        <h4>{item.name}</h4>
                                        <span className="item-code">{item.code}</span>
                                    </div>
                                    <div className="item-meta">
                                        <svg width="13.5" height="15" viewBox="0 0 14 15" fill="none">
                                            <rect x="1" y="3" width="12" height="11" rx="1" stroke="#94A3B8" strokeWidth="1.5" />
                                            <path d="M4 1V3M10 1V3M1 6H13" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                        <span>{item.submittedTime}</span>
                                    </div>
                                    <div className="item-footer">
                                        <span className="item-price">{item.price}</span>
                                        <span className="price-label">{item.priceLabel}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent History Section */}
                <div className="history-section">
                    <div className="section-header">
                        <h3>Lịch sử giám định</h3>
                        <Link to="/inspector/history" className="view-all-link">
                            Xem tất cả
                            <svg width="9.33" height="9.33" viewBox="0 0 10 10" fill="none">
                                <path d="M2 5H8M8 5L5 2M8 5L5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                    </div>

                    <div className="history-table-compact">
                        <table>
                            <thead>
                                <tr>
                                    <th>VẬT PHẨM</th>
                                    <th>TRẠNG THÁI</th>
                                    <th>THỜI GIAN</th>
                                    <th>GHI CHÚ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentHistory.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="item-cell">
                                                <div className="item-icon">
                                                    <svg width="10.5" height="10.5" viewBox="0 0 11 11" fill="none">
                                                        <rect x="1" y="1" width="9" height="9" rx="1" stroke="#CBD5E1" strokeWidth="1.5" />
                                                    </svg>
                                                </div>
                                                <span>{item.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${item.status}`}>
                                                {item.statusLabel}
                                            </span>
                                        </td>
                                        <td className="time-cell">{item.time}</td>
                                        <td className="note-cell">{item.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default InspectorOverviewPage;
