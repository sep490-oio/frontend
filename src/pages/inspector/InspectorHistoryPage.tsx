import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './InspectorHistoryPage.scss';

interface InspectionHistory {
    id: string;
    itemName: string;
    itemCode: string;
    image: string;
    status: 'approved' | 'rejected';
    statusLabel: string;
    inspector: string;
    note: string;
    time: string;
}

const InspectorHistoryPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);

    const stats = {
        totalApproved: 1284,
        totalChange: '+15% so với tháng trước',
        accuracy: 99.2,
        accuracyLabel: 'Duy trì ở mức ổn định',
        avgTime: '4.2m',
        avgTimeChange: '-25s nhanh hơn TB'
    };

    const historyData: InspectionHistory[] = [
        {
            id: '1',
            itemName: 'LV Keepall 50 Bandouliere',
            itemCode: '#LV-99283',
            image: '/placeholder-item.svg',
            status: 'approved',
            statusLabel: 'CHẤP THUẬN',
            inspector: 'Nguyễn Văn A',
            note: 'Full phụ kiện, hóa đơn gốc. Đã qua chuẩn.',
            time: '10:20 - 24/05/2024'
        },
        {
            id: '2',
            itemName: 'Patek Philippe Nautilus',
            itemCode: '#PP-4482',
            image: '/placeholder-item.svg',
            status: 'rejected',
            statusLabel: 'TỪ CHỐI',
            inspector: 'Trần Thị B',
            note: 'Nghi ngờ mất số đã thay thế. Kim không zin.',
            time: '09:45 - 24/05/2024'
        },
        {
            id: '3',
            itemName: 'Rolex Daytona 116500LN',
            itemCode: '#RD-9961',
            image: '/placeholder-item.svg',
            status: 'approved',
            statusLabel: 'CHẤP THUẬN',
            inspector: 'Lê Văn C',
            note: 'Tình trạng hoàn hảo, chưa qua sửa chữa.',
            time: '16:30 - 23/05/2024'
        },
        {
            id: '4',
            itemName: 'Dior Lady Art Bag',
            itemCode: '#DR-7701',
            image: '/placeholder-item.svg',
            status: 'approved',
            statusLabel: 'CHẤP THUẬN',
            inspector: 'Phạm Thị D',
            note: 'Phiên bản giới hạn, thẻ chứng nhận khớp.',
            time: '14:15 - 23/05/2024'
        }
    ];

    return (
        <div className="inspector-history-page">
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
                        <Link to="/inspector" className="nav-link">Tổng quan</Link>
                        <Link to="/inspector/history" className="nav-link active">Lịch sử</Link>
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
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-content">
                            <div className="stat-info">
                                <div className="stat-label">TỔNG SỐ ĐÃ DUYỆT</div>
                                <div className="stat-value">{stats.totalApproved.toLocaleString()}</div>
                                <div className="stat-change positive">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 2L6 10M6 2L3 5M6 2L9 5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {stats.totalChange}
                                </div>
                            </div>
                            <div className="stat-icon blue">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 11L12 14L22 4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-content">
                            <div className="stat-info">
                                <div className="stat-label">ĐỘ CHÍNH XÁC</div>
                                <div className="stat-value">{stats.accuracy}%</div>
                                <div className="stat-change neutral">{stats.accuracyLabel}</div>
                            </div>
                            <div className="stat-icon purple">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="9" stroke="#A855F7" strokeWidth="2" />
                                    <path d="M12 6V12L16 14" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-content">
                            <div className="stat-info">
                                <div className="stat-label">THỜI GIAN TRUNG BÌNH</div>
                                <div className="stat-value">{stats.avgTime}</div>
                                <div className="stat-change positive">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 10L6 2M6 10L3 7M6 10L9 7" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {stats.avgTimeChange}
                                </div>
                            </div>
                            <div className="stat-icon orange">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="9" stroke="#F97316" strokeWidth="2" />
                                    <path d="M12 7V12L15 15" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Section */}
                <div className="history-section">
                    <div className="section-header">
                        <div className="header-text">
                            <h2>Lịch sử giám định</h2>
                            <p>Danh sách chi tiết các vật phẩm đã được kiểm tra trong hệ thống.</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-filter">Bộ lọc</button>
                            <button className="btn-export">Xuất báo cáo</button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>VẬT PHẨM</th>
                                    <th>TRẠNG THÁI</th>
                                    <th>THỜI GIAN</th>
                                    <th>GHI CHÚ CHUYÊN GIA</th>
                                    <th>THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyData.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="item-cell">
                                                <div className="item-image">
                                                    <img src={item.image} alt={item.itemName} />
                                                </div>
                                                <div className="item-details">
                                                    <div className="item-name">{item.itemName}</div>
                                                    <div className="item-code">{item.itemCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${item.status}`}>
                                                {item.statusLabel}
                                            </span>
                                        </td>
                                        <td className="time-cell">{item.time}</td>
                                        <td className="note-cell">{item.note}</td>
                                        <td>
                                            <button className="btn-view-detail">Xem chi tiết</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="pagination">
                            <div className="pagination-info">
                                Hiển thị 1-10 trong số 1,284 kết quả
                            </div>
                            <div className="pagination-controls">
                                <button className="page-btn" disabled={currentPage === 1}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button className={`page-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>
                                    1
                                </button>
                                <button className={`page-btn ${currentPage === 2 ? 'active' : ''}`} onClick={() => setCurrentPage(2)}>
                                    2
                                </button>
                                <button className={`page-btn ${currentPage === 3 ? 'active' : ''}`} onClick={() => setCurrentPage(3)}>
                                    3
                                </button>
                                <span className="page-dots">...</span>
                                <button className="page-btn" onClick={() => setCurrentPage(129)}>
                                    129
                                </button>
                                <button className="page-btn">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="inspector-footer">
                <div className="footer-content">
                    <p>© 2024 Metaz Inspector. Hệ thống quản lý kiểm định tài sản số.</p>
                    <div className="footer-links">
                        <a href="#">Điều khoản</a>
                        <a href="#">Quyền riêng tư</a>
                        <a href="#">Hỗ trợ</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InspectorHistoryPage;
