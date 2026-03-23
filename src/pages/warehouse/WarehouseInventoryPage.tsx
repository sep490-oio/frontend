import React, { useState } from 'react';
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader';
import {
    AppstoreOutlined,
    DatabaseOutlined,
    DownloadOutlined,
    InboxOutlined,
    FilterOutlined,
    LeftOutlined,
    RightOutlined,
    MoreOutlined,
    EnvironmentOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons';
import './WarehouseInventoryPage.scss';

interface InventoryItem {
    id: string;
    name: string;
    category: string;
    image: string;
    binLocation: string;
    zone: string;
    status: 'available' | 'inspecting' | 'reserved';
    statusLabel: string;
}

const WarehouseInventoryPage: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả thương hiệu');
    const [selectedPrice, setSelectedPrice] = useState('Tất cả giá trị');
    const [selectedStatus, setSelectedStatus] = useState('Tất cả trạng thái');

    const stats = [
        {
            label: 'Tổng vật phẩm',
            value: '1,284',
            change: '+12% tháng này',
            changePositive: true,
            icon: 'inbox'
        },
        {
            label: 'Tỷ lệ lấp đầy',
            value: '85%',
            isProgress: true,
            progressValue: 85,
            icon: 'database'
        },
        {
            label: 'Đang kiểm định',
            value: '42',
            change: 'Cần thẩm định',
            changePositive: false,
            icon: 'check'
        },
        {
            label: 'Giá trị bảo vệ',
            value: '950B VNĐ',
            change: 'Bảo mật cao độ 5',
            changePositive: true,
            icon: 'shield'
        }
    ];

    const inventoryItems: InventoryItem[] = [
        {
            id: '#LX-88821',
            name: 'Rolex Cosmograph Daytona',
            category: 'Thương hiệu Rolex',
            image: '',
            binLocation: 'L-01-A',
            zone: 'Luxury Goods',
            status: 'available',
            statusLabel: 'LƯU TRỮ'
        },
        {
            id: '#LX-92144',
            name: 'Hermès Birkin 25 Gold',
            category: 'Thương hiệu Hermès',
            image: '',
            binLocation: 'L-04-C',
            zone: 'Luxury Goods',
            status: 'inspecting',
            statusLabel: 'ĐANG KIỂM ĐỊNH'
        },
        {
            id: '#LX-77012',
            name: 'Patek Philippe Nautilus',
            category: 'Thương hiệu Patek Philippe',
            image: '',
            binLocation: 'L-02-B',
            zone: 'Luxury Goods',
            status: 'reserved',
            statusLabel: 'ĐÃ ĐẶT TRƯỚC'
        },
        {
            id: '#LX-65109',
            name: 'Louis Vuitton Keepall 50',
            category: 'Thương hiệu Louis Vuitton',
            image: '',
            binLocation: 'L-08-A',
            zone: 'Luxury Goods',
            status: 'available',
            statusLabel: 'LƯU TRỮ'
        }
    ];

    return (
        <div className="warehouse-inventory-page">
            <WarehouseHeader activeTab="warehouse" />

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
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-value">{stat.value}</div>
                                {stat.isProgress ? (
                                    <div className="stat-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${stat.progressValue}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`stat-change ${stat.changePositive ? 'positive' : 'neutral'}`}>
                                        {stat.changePositive && <ArrowUpOutlined />}
                                        {stat.change}
                                    </div>
                                )}
                                <div className="stat-icon-bg"></div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="filters-row">
                        <div className="filter-item">
                            <label>THƯƠNG HIỆU</label>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option>Tất cả thương hiệu</option>
                                <option>Rolex</option>
                                <option>Hermès</option>
                                <option>Patek Philippe</option>
                                <option>Louis Vuitton</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>KHOẢNG GIÁ</label>
                            <select value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)}>
                                <option>Tất cả giá trị</option>
                                <option>Dưới 100M</option>
                                <option>100M - 500M</option>
                                <option>Trên 500M</option>
                            </select>
                        </div>
                        <div className="filter-item">
                            <label>GIÁM ĐỊNH</label>
                            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                                <option>Tất cả trạng thái</option>
                                <option>Đã giám định</option>
                                <option>Đang kiểm tra</option>
                                <option>Chờ giám định</option>
                            </select>
                        </div>
                        <button className="btn-clear-filters">
                            <FilterOutlined />
                            Xóa bộ lọc
                        </button>
                    </div>

                    {/* Inventory Table */}
                    <div className="inventory-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>MÃ ID</th>
                                    <th>SẢN PHẨM</th>
                                    <th>DANH MỤC</th>
                                    <th>VỊ TRÍ Ô</th>
                                    <th>TRẠNG THÁI</th>
                                    <th>HÀNH ĐỘNG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventoryItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="item-id">{item.id}</div>
                                        </td>
                                        <td>
                                            <div className="item-info">
                                                <div className="item-image">
                                                    <InboxOutlined />
                                                </div>
                                                <div className="item-details">
                                                    <div className="item-name">{item.name}</div>
                                                    <div className="item-category">{item.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="category-badge">
                                                <div className="badge-row">Luxury</div>
                                                <div className="badge-row">Goods</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="location-info">
                                                <EnvironmentOutlined />
                                                <span>{item.binLocation}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={`status-badge status-${item.status}`}>
                                                <span className="status-dot"></span>
                                                {item.statusLabel}
                                            </div>
                                        </td>
                                        <td>
                                            <button className="btn-more">
                                                <MoreOutlined />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <div className="pagination-info">
                            Hiển thị 1-4 của 1,284 vật phẩm
                        </div>
                        <div className="pagination-controls">
                            <button className="page-btn" disabled={currentPage === 1}>
                                <LeftOutlined />
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
                            <button className="page-btn">
                                <RightOutlined />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarehouseInventoryPage;
