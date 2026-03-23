import React, { useState } from 'react';
import './InspectorItemDetailPage.scss';

const InspectorItemDetailPage: React.FC = () => {
    const [checklist, setChecklist] = useState({
        movement: false,
        serial: false,
        functional: false,
        docs: false,
    });

    const [gradeRating, setGradeRating] = useState('Grade S - Tuyệt ẩm (Unworn)');
    const [conditionPercent, setConditionPercent] = useState(98);
    const [movementNotes, setMovementNotes] = useState('');
    const [authenticityNotes, setAuthenticityNotes] = useState('');

    const handleChecklistChange = (key: string) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="inspector-item-detail">
            {/* Header */}
            <header className="inspector-header">
                <div className="header-container">
                    <div className="logo-nav">
                        <div className="logo">
                            <div className="logo-icon" />
                            <h1 className="logo-text">oio.vn Inspector</h1>
                        </div>
                        <nav className="nav">
                            <a href="/inspector" className="nav-link active">Tổng quan</a>
                            <a href="/inspector/history" className="nav-link">Lịch sử</a>
                            <a href="/inspector/reports" className="nav-link">Báo cáo</a>
                        </nav>
                    </div>
                    <div className="header-actions">
                        <div className="search-container">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Tìm kiếm vật phẩm..."
                            />
                            <div className="search-icon" />
                        </div>
                        <button className="notification-btn">
                            <div className="notification-icon" />
                        </button>
                        <div className="user-avatar-border">
                            <div className="user-avatar" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="main-content">
                {/* Breadcrumbs & Title */}
                <div className="breadcrumb-section">
                    <div className="breadcrumb-title">
                        <div className="breadcrumb-margin">
                            <div className="breadcrumb">
                                <a href="/inspector" className="breadcrumb-link">STAFF PORTAL</a>
                                <div className="breadcrumb-separator" />
                                <a href="/inspector/items" className="breadcrumb-link">KIỂM ĐỊNH</a>
                                <div className="breadcrumb-separator" />
                                <span className="breadcrumb-current">#LX-88021</span>
                            </div>
                        </div>
                        <h2 className="page-title">Chi tiết Kiểm định Vật phẩm</h2>
                    </div>
                    <div className="status-info">
                        <div className="status-badge">
                            <div className="status-dot" />
                            <span className="status-text">ĐANG XỬ LÝ</span>
                        </div>
                        <span className="deadline-text">Đặt đấu lúc: 14:20 - 24/05/2024</span>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="content-columns">
                    {/* Left Panel - Product Info */}
                    <aside className="left-panel">
                        {/* Product Summary Card */}
                        <div className="product-summary">
                            <div className="product-card">
                                <div className="product-image">
                                    <div className="image-gradient" />
                                    <div className="product-info-overlay">
                                        <h3 className="product-name">Rolex Cosmograph Daytona</h3>
                                        <span className="product-code">Mã số: #LX-88021</span>
                                    </div>
                                    <div className="auction-type-badge">ENH TỪ NGT ĐI BÁN</div>
                                </div>

                                <div className="product-details">
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="detail-label">Danh mục</span>
                                            <span className="detail-value">Đồng hồ cao cấp</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Thương hiệu</span>
                                            <span className="detail-value">Rolex</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Người bán</span>
                                            <a href="#" className="detail-value seller-link">Nguyễn Văn A</a>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Giá khởi điểm</span>
                                            <span className="detail-value price">1.250.000.000đ</span>
                                        </div>
                                    </div>

                                    <div className="image-gallery-section">
                                        <span className="gallery-label">Thư viện ảnh gốc (4)</span>
                                        <div className="gallery-thumbnails">
                                            <div className="thumbnail" />
                                            <div className="thumbnail" />
                                            <div className="thumbnail" />
                                            <div className="thumbnail more-images">
                                                <div className="more-overlay">
                                                    <span className="more-text">+2</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documentation Section */}
                        <div className="documentation-section">
                            <div className="documentation-card">
                                <h4 className="documentation-title">
                                    <div className="doc-icon" />
                                    <span>Mô tả từ người bán</span>
                                </h4>
                                <p className="documentation-text">
                                    "Đồng hồ Rolex Daytona 116500LN đời 2021, fullbox giấy tờ zin, độ mới 98%, chưa qua sửa chữa hay đánh bóng..."
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Right Panel - Verification Actions */}
                    <section className="right-panel">
                        <div className="verification-container">
                            {/* Macro Photography Section */}
                            <div className="macro-section">
                                <div className="section-header">
                                    <h3 className="section-title">
                                        <div className="title-icon" />
                                        <span>Chụp ảnh ths c tế (Macro)</span>
                                    </h3>
                                    <button className="setup-camera-btn">GẮI ĐẶT CAMERA</button>
                                </div>

                                <div className="upload-grid">
                                    <div className="upload-box">
                                        <div className="upload-icon-circle">
                                            <div className="upload-icon" />
                                        </div>
                                        <span className="upload-label">ENH BỘ MÁY (MOVEMENT)</span>
                                    </div>
                                    <div className="upload-box">
                                        <div className="upload-icon-circle">
                                            <div className="upload-icon" />
                                        </div>
                                        <span className="upload-label">MÃ SMERI / CASE</span>
                                    </div>
                                    <div className="upload-box">
                                        <div className="upload-icon-circle">
                                            <div className="upload-icon" />
                                        </div>
                                        <span className="upload-label">TÌNH TRẠNG DÂY ĐEO</span>
                                    </div>
                                </div>
                            </div>

                            {/* Inspection Checklist & Rating */}
                            <div className="inspection-row">
                                <div className="checklist-section">
                                    <h3 className="section-title">
                                        <div className="title-icon" />
                                        <span>Danh mục kiểm tra</span>
                                    </h3>
                                    <div className="checklist-card">
                                        <label className="checkbox-label">
                                            <span className="checkbox-text">Xác minh bộ máy (Movement)</span>
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={checklist.movement}
                                                onChange={() => handleChecklistChange('movement')}
                                            />
                                        </label>
                                        <label className="checkbox-label">
                                            <span className="checkbox-text">Trùng khớp sk Seri (Serial match)</span>
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={checklist.serial}
                                                onChange={() => handleChecklistChange('serial')}
                                            />
                                        </label>
                                        <label className="checkbox-label">
                                            <span className="checkbox-text">Kiểm tra chức năng (Functional)</span>
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={checklist.functional}
                                                onChange={() => handleChecklistChange('functional')}
                                            />
                                        </label>
                                        <label className="checkbox-label">
                                            <span className="checkbox-text">Phụ kiện & Giấy tờ (Original Docs)</span>
                                            <input
                                                type="checkbox"
                                                className="checkbox-input"
                                                checked={checklist.docs}
                                                onChange={() => handleChecklistChange('docs')}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="rating-section">
                                    <h3 className="section-title">
                                        <div className="title-icon" />
                                        <span>Xếp hạng tình trạng</span>
                                    </h3>
                                    <div className="rating-card">
                                        <div className="form-group">
                                            <label className="form-label">Đánh giá tổng thể</label>
                                            <select
                                                className="form-select"
                                                value={gradeRating}
                                                onChange={(e) => setGradeRating(e.target.value)}
                                            >
                                                <option>Grade S - Tuyệt ẩm (Unworn)</option>
                                                <option>Grade A - Xuất sắc (Excellent)</option>
                                                <option>Grade B - Tốt (Good)</option>
                                                <option>Grade C - Khá (Fair)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Độ mới (Ước tính %)</label>
                                            <div className="slider-group">
                                                <input
                                                    type="range"
                                                    className="slider-input"
                                                    min="0"
                                                    max="100"
                                                    value={conditionPercent}
                                                    onChange={(e) => setConditionPercent(Number(e.target.value))}
                                                />
                                                <span className="slider-value">{conditionPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="notes-section">
                                <h3 className="section-title">
                                    <div className="title-icon" />
                                    <span>Ghi chú chi tiết từ kiểm định viên</span>
                                </h3>
                                <div className="notes-grid">
                                    <div className="note-group">
                                        <label className="note-label">Tình trạng bộ máy & Vỏ</label>
                                        <textarea
                                            className="note-textarea"
                                            placeholder="Nhập nhận xét về bộ máy, độ sai lệch giây, tình trạng vỏ và bezel..."
                                            value={movementNotes}
                                            onChange={(e) => setMovementNotes(e.target.value)}
                                        />
                                    </div>
                                    <div className="note-group">
                                        <label className="note-label">Ghi chú tính xác thực</label>
                                        <textarea
                                            className="note-textarea"
                                            placeholder="Xác nhận tính nguyên bản của các linh kiện, cọc số, kim, mặt số..."
                                            value={authenticityNotes}
                                            onChange={(e) => setAuthenticityNotes(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Footer - Action Bar */}
            <footer className="action-footer">
                <div className="footer-left">
                    <button className="btn-secondary">
                        <div className="btn-icon" />
                        <span>Lưu bản nháp</span>
                    </button>
                    <button className="btn-ghost">Hủy bỏ</button>
                </div>
                <div className="footer-right">
                    <button className="btn-reject">
                        <div className="btn-icon" />
                        <span>TỪ CHM (FAILED)</span>
                    </button>
                    <button className="btn-approve">
                        <div className="btn-icon" />
                        <span>PHÊ DUYỆT (PASSED)</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default InspectorItemDetailPage;
