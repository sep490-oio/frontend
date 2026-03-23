import React, { useState } from 'react';
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader';
import {
    AppstoreOutlined,
    DatabaseOutlined,
    DownloadOutlined,
    InboxOutlined
} from '@ant-design/icons';
import './WarehouseScannerPage.scss';

interface ScanItem {
    id: string;
    sku: string;
    name: string;
    location: string;
    status: 'success' | 'pending' | 'warning';
    statusText: string;
    time: string;
}

const WarehouseScannerPage: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [recentScans] = useState<ScanItem[]>([
        {
            id: '#ID-99283-K',
            sku: '#ID-99283-K',
            name: 'Máy tính xách tay Dell XPS 15',
            location: 'Trạng thái: Nhập kho',
            status: 'success',
            statusText: 'Thành công',
            time: 'VỪA XONG'
        },
        {
            id: '#ID-99282-K',
            sku: '#ID-99282-K',
            name: 'Màn hình LG Ultrafine 4K',
            location: 'Trạng thái: Xuất kho',
            status: 'success',
            statusText: 'Thành công',
            time: '2 PHÚT TRƯỚC'
        },
        {
            id: '#ID-99281-K',
            sku: '#ID-99281-K',
            name: 'Bàn phím cơ Keychron K2',
            location: 'Trạng thái: Kiểm kê',
            status: 'pending',
            statusText: 'Chờ xác nhận',
            time: '5 PHÚT TRƯỚC'
        },
        {
            id: '#ID-99280-K',
            sku: '#ID-99280-K',
            name: 'Chuột Logitech MX Master 3S',
            location: 'Trạng thái: Nhập kho',
            status: 'success',
            statusText: 'Thành công',
            time: '12 PHÚT TRƯỚC'
        }
    ]);

    const handleScan = () => {
        setIsScanning(true);
        // Simulate scanning
        setTimeout(() => {
            setIsScanning(false);
        }, 2000);
    };

    return (
        <div className="warehouse-scanner-page">
            <WarehouseHeader activeTab="dashboard" />

            <div className="warehouse-main">
                {/* Sidebar */}
                <aside className="warehouse-sidebar">
                    <div className="sidebar-section">
                        <div className="section-title">DANH MỤC CHÍNH</div>
                        <a href="/warehouse-scanner" className="sidebar-item active">
                            <AppstoreOutlined className="item-icon" />
                            <span>Bảng điều khiển</span>
                        </a>
                        <a href="/warehouse-logistics" className="sidebar-item">
                            <DatabaseOutlined className="item-icon" />
                            <span>Mục tồn kho</span>
                        </a>
                        <a href="/warehouse-intake" className="sidebar-item">
                            <DownloadOutlined className="item-icon" />
                            <span>Nhập kho</span>
                        </a>
                    </div>

                    <div className="sidebar-section">
                        <div className="section-title">DANH MỤC CHÍNH</div>
                        <div className="category-item">
                            <div className="category-info">
                                <span className="category-dot purple"></span>
                                <span>Hàng xa xỉ</span>
                            </div>
                            <span className="category-count">124</span>
                        </div>
                        <div className="category-item">
                            <div className="category-info">
                                <span className="category-dot blue"></span>
                                <span>Kho Lưỡng hồ</span>
                            </div>
                            <span className="category-count">208</span>
                        </div>
                        <div className="category-item">
                            <div className="category-info">
                                <span className="category-dot green"></span>
                                <span>Điện tử</span>
                            </div>
                            <span className="category-count">156</span>
                        </div>
                    </div>

                    <div className="storage-info">
                        <div className="storage-header">
                            <InboxOutlined className="storage-icon" />
                            <span className="storage-title">SỨC CHỨA</span>
                        </div>
                        <div className="storage-bar">
                            <div className="storage-fill" style={{ width: '82%' }}></div>
                        </div>
                        <div className="storage-text">82.4% Không gian đã sử dụng</div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="warehouse-content">
                    <div className="scanner-container">
                        {/* Left Section: Scanner */}
                        <div className="scanner-section">
                            <div className="scanner-gradient" />

                            <div className="scanner-frame">
                                <div className="camera-view">
                                    {/* Scanner overlay with corner borders */}
                                    <div className="scanner-overlay">
                                        <div className="scanner-target">
                                            <div className="corner-border corner-tl" />
                                            <div className="corner-border corner-tr" />
                                            <div className="corner-border corner-bl" />
                                            <div className="corner-border corner-br" />
                                            {isScanning && <div className="scanning-line" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Flash/Settings Controls */}
                                <div className="scanner-controls-top">
                                    <button className="control-btn">
                                        <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
                                            <path d="M6.5 1L1 10H6L5.5 19L11 10H6L6.5 1Z" fill="white" stroke="white" strokeWidth="1.5" />
                                        </svg>
                                    </button>
                                    <button className="control-btn">
                                        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                                            <path d="M1 8C1 8 4 2 10 2C16 2 19 8 19 8C19 8 16 14 10 14C4 14 1 8 1 8Z" stroke="white" strokeWidth="1.5" />
                                            <circle cx="10" cy="8" r="3" stroke="white" strokeWidth="1.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="scanner-info">
                                <h3 className="scanner-title">Đang chờ quét...</h3>
                                <p className="scanner-description">
                                    Vui lòng đưa mã QR trên đơn hàng vào khung hình để tự động quét và cập nhật hệ thống.
                                </p>
                            </div>

                            <div className="scan-actions">
                                <button className="btn-primary" onClick={handleScan}>
                                    <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                                        <path d="M1 9H19M1 1H19M1 17H19M5 5H15M5 13H15" stroke="white" strokeWidth="2" />
                                    </svg>
                                    Quét mã
                                </button>
                                <button className="btn-secondary">
                                    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                                        <path d="M1 7H19M1 1H19M1 13H19" stroke="white" strokeWidth="2" />
                                    </svg>
                                    Nhập mã vận đơn
                                </button>
                            </div>
                        </div>

                        {/* Right Section: Recent Scans */}
                        <div className="recent-scans-section">
                            <div className="recent-scans-header">
                                <div className="header-title">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M9 1V17M1 9H17" stroke="#3B82F6" strokeWidth="2" />
                                    </svg>
                                    <h3>Lịch sử quét gần đây</h3>
                                </div>
                                <button className="view-all-btn">Xem tất cả</button>
                            </div>

                            <div className="recent-scans-list">
                                {recentScans.map((scan) => (
                                    <div key={scan.id} className="scan-item">
                                        <div className="scan-item-header">
                                            <span className="scan-sku">{scan.sku}</span>
                                            <span className="scan-time">{scan.time}</span>
                                        </div>
                                        <h4 className="scan-name">{scan.name}</h4>
                                        <div className="scan-footer">
                                            <span className="scan-location">{scan.location}</span>
                                            <span className={`scan-status status-${scan.status}`}>
                                                {scan.statusText}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="statistics-card">
                                <div className="stat-item stat-total">
                                    <span className="stat-label">Tổng lượt quét</span>
                                    <span className="stat-value">124</span>
                                </div>
                                <div className="stat-item stat-success">
                                    <span className="stat-label">Lượt thành công</span>
                                    <span className="stat-value">118</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarehouseScannerPage;
