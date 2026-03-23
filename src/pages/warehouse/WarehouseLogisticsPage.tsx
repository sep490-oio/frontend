import React from 'react';
import { useWarehouse } from '@/hooks/useWarehouse';
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader';
import {
    AppstoreOutlined,
    DatabaseOutlined,
    DownloadOutlined,
    UploadOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    InboxOutlined,
    ShopOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';
import './WarehouseLogisticsPage.scss';

const WarehouseLogisticsPage: React.FC = () => {
    const {
        metrics,
        zones,
        binLocations,
        recentActivities,
        selectedBin,
        handleBinClick,
        handleExportReport,
        handleNewShipment,
    } = useWarehouse();

    return (
        <div className="warehouse-logistics-page">
            <WarehouseHeader activeTab="warehouse" />

            <div className="warehouse-main">
                {/* Sidebar */}
                <aside className="warehouse-sidebar">
                    <div className="sidebar-section">
                        <div className="section-title">DANH MỤC CHÍNH</div>
                        <a href="/warehouse-scanner" className="sidebar-item">
                            <AppstoreOutlined className="item-icon" />
                            <span>Bảng điều khiển</span>
                        </a>
                        <a href="/warehouse-logistics" className="sidebar-item active">
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
                    {/* Page Header */}
                    <div className="page-header">
                        <div className="header-info">
                            <h1>Bảng Điều khiển Logistics</h1>
                            <p>Kho Phân khu Alpha • Giám sát thời gian thực</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-secondary" onClick={handleExportReport}>
                                <UploadOutlined />
                                Xuất báo cáo
                            </button>
                            <button className="btn-primary" onClick={handleNewShipment}>
                                <DownloadOutlined />
                                Lô hàng mới
                            </button>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="metrics-grid">
                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="metric-icon blue">
                                    <InboxOutlined />
                                </div>
                                <div className={`metric-change ${metrics.totalUnitsChange >= 0 ? 'positive' : 'negative'}`}>
                                    {metrics.totalUnitsChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    <span>{Math.abs(metrics.totalUnitsChange)}%</span>
                                </div>
                            </div>
                            <div className="metric-label">Tổng đơn vị</div>
                            <div className="metric-value">{metrics.totalUnits.toLocaleString()}</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="metric-icon cyan">
                                    <ShopOutlined />
                                </div>
                                <div className={`metric-change ${metrics.activeBinsChange >= 0 ? 'positive' : 'negative'}`}>
                                    {metrics.activeBinsChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    <span>{Math.abs(metrics.activeBinsChange)}%</span>
                                </div>
                            </div>
                            <div className="metric-label">Ô chứa đang hoạt động</div>
                            <div className="metric-value">{metrics.activeBins.toLocaleString()}</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="metric-icon orange">
                                    <ToolOutlined />
                                </div>
                                <div className={`metric-change ${metrics.inspectingChange >= 0 ? 'positive' : 'negative'}`}>
                                    {metrics.inspectingChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    <span>{Math.abs(metrics.inspectingChange)}%</span>
                                </div>
                            </div>
                            <div className="metric-label">Đang kiểm tra</div>
                            <div className="metric-value">{metrics.inspecting.toLocaleString()}</div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-header">
                                <div className="metric-icon purple">
                                    <UploadOutlined />
                                </div>
                                <div className={`metric-change ${metrics.todayShipmentsChange >= 0 ? 'positive' : 'negative'}`}>
                                    {metrics.todayShipmentsChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    <span>{Math.abs(metrics.todayShipmentsChange)}%</span>
                                </div>
                            </div>
                            <div className="metric-label">Xuất hàng hôm nay</div>
                            <div className="metric-value">{metrics.todayShipments.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Main Layout */}
                    <div className="content-layout">
                        {/* Zone Status Table */}
                        <div className="zone-status-section">
                            <div className="section-header">
                                <h3>Trạng thái tồn kho khu vực</h3>
                                <div className="legend">
                                    <div className="legend-item">
                                        <span className="dot green"></span>
                                        <span>Còn hàng</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="dot orange"></span>
                                        <span>Sắp hết hàng</span>
                                    </div>
                                </div>
                            </div>

                            <div className="zones-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>TÊN KHU VỰC</th>
                                            <th>DANH MỤC</th>
                                            <th>SỬ DỤNG Ô CHỨA</th>
                                            <th>CẬP NHẬT CUỐI</th>
                                            <th>THAO TÁC</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {zones.map((zone) => (
                                            <tr key={zone.id}>
                                                <td>
                                                    <div className="zone-info">
                                                        <div className="zone-icon" style={{ background: zone.iconBg }}>
                                                            {zone.id === 'Alpha-1' && <InboxOutlined style={{ color: zone.iconColor }} />}
                                                            {zone.id === 'Vault-X' && <DatabaseOutlined style={{ color: zone.iconColor }} />}
                                                            {zone.id === 'Tech-9' && <ToolOutlined style={{ color: zone.iconColor }} />}
                                                        </div>
                                                        <div>
                                                            <div className="zone-name">{zone.name}</div>
                                                            <div className="zone-category">{zone.category}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="category-badge">Giá trị cao</span>
                                                </td>
                                                <td>
                                                    <div className="capacity-bar">
                                                        <div className="progress-bar">
                                                            <div
                                                                className="progress-fill"
                                                                style={{
                                                                    width: zone.capacity,
                                                                    background: zone.status === 'nearly-full' ? '#F59E0B' : '#10B981'
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="capacity-text">{zone.capacity}</span>
                                                    </div>
                                                </td>
                                                <td className="time-text">{zone.time}</td>
                                                <td>
                                                    <button className="btn-icon">⋮</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Bin Locations Grid */}
                            <div className="bin-locations">
                                <div className="bin-header">
                                    <h4>Sơ đồ ô chứa hoạt động - Phân khu Alpha</h4>
                                    <div className="bin-legend">
                                        <div className="legend-item">
                                            <span className="square filled"></span>
                                            <span>Đầy</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="square empty"></span>
                                            <span>Trống</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bin-grid">
                                    {binLocations.map((bin) => (
                                        <div
                                            key={bin.id}
                                            className={`bin-cell ${bin.status} ${selectedBin === bin.id ? 'active' : ''}`}
                                            onClick={() => handleBinClick(bin.id)}
                                            title={`${bin.label} - ${bin.capacity}% đầy`}
                                        >
                                            {bin.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="activity-panel">
                            <div className="panel-header">
                                <h3>
                                    <ClockCircleOutlined />
                                    Luồng hàng nhập
                                </h3>
                            </div>
                            <div className="activity-list">
                                {recentActivities.map((activity, index) => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-timeline">
                                            <div
                                                className="timeline-dot"
                                                style={{ background: activity.statusColor }}
                                            >
                                                {activity.status === 'received' && <CheckCircleOutlined />}
                                                {activity.status === 'inspecting' && <ClockCircleOutlined />}
                                                {activity.status === 'pending' && <WarningOutlined />}
                                            </div>
                                            {index < recentActivities.length - 1 && <div className="timeline-line"></div>}
                                        </div>
                                        <div className="activity-content">
                                            <div className="activity-title">{activity.title}</div>
                                            <div className="activity-subtitle">{activity.subtitle}</div>
                                            <div
                                                className="activity-status"
                                                style={{
                                                    background: `${activity.statusColor}1A`,
                                                    border: `1px solid ${activity.statusColor}33`,
                                                    color: activity.statusColor
                                                }}
                                            >
                                                {activity.statusLabel}
                                            </div>
                                            <div className="activity-time">{activity.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-view-all">Xem toàn bộ luồng hàng</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarehouseLogisticsPage;
