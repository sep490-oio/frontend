import React, { useState } from 'react';
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader';
import {
    AppstoreOutlined,
    DatabaseOutlined,
    DownloadOutlined,
    CameraOutlined,
    InboxOutlined,
    TagOutlined,
    EnvironmentOutlined,
    UploadOutlined,
    CheckOutlined
} from '@ant-design/icons';
import './CreateShipmentPage.scss';

const CreateShipmentPage: React.FC = () => {
    const [selectedZone, setSelectedZone] = useState('Watch (Đồng hồ)');
    const [binId, setBinId] = useState('Z-04-B12');
    const [photos, setPhotos] = useState<{ [key: string]: File | null }>({
        front: null,
        back: null,
        seal: null,
        inside: null
    });

    const handlePhotoUpload = (position: string, file: File) => {
        setPhotos(prev => ({ ...prev, [position]: file }));
    };

    const handleOpenCamera = () => {
        console.log('Opening camera...');
        // Implement camera functionality
    };

    const handleSubmit = () => {
        console.log('Submitting shipment intake...');
        // Implement submit logic
    };

    return (
        <div className="create-shipment-page">
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
                    {/* Title Section */}
                    <div className="title-section">
                        <div className="title-info">
                            <div className="title-header">
                                <div className="status-badge">
                                    Đang xử lý nhập kho
                                </div>
                                <div className="shipment-id">Mã vận đơn: #METAZ-992834</div>
                            </div>
                            <h1>Xử lý nhập kho kiện hàng</h1>
                        </div>
                        <button className="btn-history">
                            <UploadOutlined />
                            Hủy quy trình
                        </button>
                    </div>

                    {/* Grid Layout */}
                    <div className="intake-grid">
                        {/* Left Column: Item & Seller Info */}
                        <div className="left-column">
                            <div className="info-card">
                                <h3>
                                    <TagOutlined />
                                    Thông tin sản phẩm
                                </h3>
                                <div className="info-content">
                                    <div className="info-field">
                                        <label>Tên sản phẩm</label>
                                        <div className="product-name">
                                            Patek Philippe Nautilus 5711/1A-010
                                        </div>
                                    </div>
                                    <div className="info-fields-row">
                                        <div className="info-field">
                                            <label>Danh mục</label>
                                            <div className="field-value">
                                                <InboxOutlined />
                                                Đồng hồ
                                            </div>
                                        </div>
                                        <div className="info-field">
                                            <label>Người bán</label>
                                            <div className="field-value-text">luxury_watch_hcm</div>
                                        </div>
                                        <div className="info-field">
                                            <label>Mã đơn hàng</label>
                                            <div className="field-value-code">#ORD-552910</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="notes-card">
                                <h3>Ghi chú vận chuyển</h3>
                                <p>"Hàng giá trị cao, yêu cầu quay video mở hộp cẩn thận."</p>
                            </div>
                        </div>

                        {/* Center Column: Unboxing Photo Section */}
                        <div className="center-column">
                            <div className="photo-card">
                                <div className="photo-header">
                                    <h3>
                                        <CameraOutlined />
                                        Chụp ảnh khui hàng
                                    </h3>
                                    <span className="photo-count">Yêu cầu tối thiểu 4 ảnh</span>
                                </div>

                                <div className="photo-grid">
                                    <div className="photo-placeholder">
                                        <UploadOutlined />
                                        <span>Mặt trước kiện hàng</span>
                                    </div>
                                    <div className="photo-placeholder">
                                        <UploadOutlined />
                                        <span>Viền seal/niêm phong</span>
                                    </div>
                                    <div className="photo-placeholder">
                                        <UploadOutlined />
                                        <span>Tình trạng seal/băng keo</span>
                                    </div>
                                    <div className="photo-placeholder">
                                        <UploadOutlined />
                                        <span>Nội dung bên trong</span>
                                    </div>
                                </div>

                                <button className="btn-camera" onClick={handleOpenCamera}>
                                    <CameraOutlined />
                                    Mở camera
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Storage Location Selector */}
                        <div className="right-column">
                            <div className="location-card">
                                <h3>
                                    <EnvironmentOutlined />
                                    Vị trí lưu trữ
                                </h3>
                                <div className="location-fields">
                                    <div className="field-group">
                                        <label>Phân khu (Zone)</label>
                                        <div className="select-wrapper">
                                            <select
                                                value={selectedZone}
                                                onChange={(e) => setSelectedZone(e.target.value)}
                                            >
                                                <option>Watch (Đồng hồ)</option>
                                                <option>Luxury (Xa xỉ)</option>
                                                <option>Electronics (Điện tử)</option>
                                                <option>Fashion (Thời trang)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="field-group">
                                        <label>Mã kệ (Bin ID)</label>
                                        <input
                                            type="text"
                                            value={binId}
                                            onChange={(e) => setBinId(e.target.value)}
                                            placeholder="Z-04-B12"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateShipmentPage;
