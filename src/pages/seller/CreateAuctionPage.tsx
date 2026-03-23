/**
 * CreateAuctionPage - Trang tạo đấu giá mới
 * Form để seller đăng vật phẩm lên đấu giá
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateAuctionPage.scss';

interface FormData {
    itemName: string;
    category: string;
    condition: 'new' | 'used' | '';
    description: string;
    images: File[];
    startingPrice: string;
    buyNowPrice: string;
    duration: string;
    minBidIncrement: string;
    verification: boolean;
}

export function CreateAuctionPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        itemName: '',
        category: '',
        condition: '',
        description: '',
        images: [],
        startingPrice: '',
        buyNowPrice: '',
        duration: '',
        minBidIncrement: '100000',
        verification: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log('Form data:', formData);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setFormData({ ...formData, images: [...formData.images, ...files] });
        }
    };

    return (
        <div className="create-auction-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-content">
                    <button className="back-link" onClick={() => navigate('/seller-dashboard')}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M6 2L3 5L6 8" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Quay lại Dashboard
                    </button>
                    <h1 className="page-title">Tạo đấu giá mới</h1>
                    <p className="page-subtitle">
                        Điền thông tin chi tiết về vật phẩm của bạn để bắt đầu phiên đấu giá.
                    </p>
                </div>
            </header>

            {/* Main Form */}
            <main className="form-container">
                <form onSubmit={handleSubmit}>
                    {/* Section 1: Thông tin vật phẩm */}
                    <section className="form-section">
                        <div className="section-header">
                            <div className="section-number">1</div>
                            <h2 className="section-title">Thông tin vật phẩm</h2>
                        </div>

                        <div className="form-fields">
                            {/* Tên vật phẩm */}
                            <div className="form-field full-width">
                                <label className="field-label">Tên vật phẩm *</label>
                                <input
                                    type="text"
                                    className="field-input"
                                    placeholder="Ví dụ: Giày Nike Air Jordan 1 Retro High OG"
                                    value={formData.itemName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, itemName: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            {/* Danh mục & Tình trạng */}
                            <div className="form-row">
                                <div className="form-field">
                                    <label className="field-label">Danh mục</label>
                                    <select
                                        className="field-select"
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                    >
                                        <option value="">Chọn danh mục</option>
                                        <option value="watches">Đồng hồ cao cấp</option>
                                        <option value="bags">Túi xách hàng hiệu</option>
                                        <option value="wine">Rượu vang & Whisky</option>
                                        <option value="art">Nghệ thuật</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Tình trạng</label>
                                    <div className="condition-buttons">
                                        <button
                                            type="button"
                                            className={`condition-btn ${formData.condition === 'new' ? 'active' : ''
                                                }`}
                                            onClick={() =>
                                                setFormData({ ...formData, condition: 'new' })
                                            }
                                        >
                                            Mới 100%
                                        </button>
                                        <button
                                            type="button"
                                            className={`condition-btn ${formData.condition === 'used' ? 'active' : ''
                                                }`}
                                            onClick={() =>
                                                setFormData({ ...formData, condition: 'used' })
                                            }
                                        >
                                            Đã qua sử dụng
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div className="form-field full-width">
                                <label className="field-label">Mô tả vật phẩm</label>
                                <textarea
                                    className="field-textarea"
                                    placeholder="Mô tả chi tiết về vật phẩm, kích thước, chất liệu, lịch sử..."
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={5}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Hình ảnh vật phẩm */}
                    <section className="form-section">
                        <div className="section-header">
                            <div className="section-number">2</div>
                            <h2 className="section-title">Hình ảnh vật phẩm</h2>
                        </div>

                        {/* Upload Area */}
                        <div className="upload-area">
                            <div className="upload-icon">
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                    <path
                                        d="M20 10V30M10 20H30"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                            <h3 className="upload-title">Chọn ảnh để tải lên</h3>
                            <p className="upload-description">
                                Vui dụng ảnh chụp rõ nét, đầy đủ các góc độ của vật phẩm. Tối đa 8
                                ảnh, mỗi ảnh tối đa 5MB.
                            </p>
                            <label className="upload-button">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                                    <path
                                        d="M10 12V2M10 2L6 6M10 2L14 6M2 16H18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                Chọn ảnh từ máy tính
                            </label>
                        </div>

                        {/* Photo Guidelines */}
                        <div className="photo-guidelines">
                            <div className="guideline-item">
                                <div className="guideline-icon">
                                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                                        <rect width="20" height="12" rx="2" fill="currentColor" />
                                    </svg>
                                </div>
                                <span className="guideline-label">Góc chụp chính</span>
                                <div className="guideline-status success">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                            </div>

                            <div className="guideline-item">
                                <div className="guideline-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <span className="guideline-label">Góc chụp chi tiết</span>
                                <div className="guideline-status">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <circle cx="5" cy="5" r="4" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>

                            <div className="guideline-item">
                                <div className="guideline-icon">
                                    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                                        <rect x="2" y="2" width="14" height="18" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <span className="guideline-label">Nhãn mác</span>
                                <div className="guideline-status">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <circle cx="5" cy="5" r="4" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>

                            <div className="guideline-item">
                                <div className="guideline-icon">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                        <rect width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </div>
                                <span className="guideline-label">Chứng từ kèm</span>
                                <div className="guideline-status">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <circle cx="5" cy="5" r="4" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="photo-warning">
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                <path
                                    d="M7.5 5V8M7.5 10.5H7.51M13.5 7.5C13.5 10.8137 10.8137 13.5 7.5 13.5C4.18629 13.5 1.5 10.8137 1.5 7.5C1.5 4.18629 4.18629 1.5 7.5 1.5C10.8137 1.5 13.5 4.18629 13.5 7.5Z"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                />
                            </svg>
                            <p className="warning-text">
                                Lưu ý: Hình ảnh cần rõ nét, không chỉnh sửa quá mức. Các góc chụp bắt
                                buộc: chính diện, chi tiết, nhãn mác (nếu có). Ảnh không đạt chuẩn sẽ bị
                                từ chối khi kiểm duyệt.
                            </p>
                        </div>
                    </section>

                    {/* Section 3: Giá & Thời gian */}
                    <section className="form-section">
                        <div className="section-header">
                            <div className="section-number">3</div>
                            <h2 className="section-title">Giá & Thời gian</h2>
                        </div>

                        <div className="form-fields">
                            <div className="form-row">
                                <div className="form-field">
                                    <label className="field-label">Giá khởi điểm (VND)</label>
                                    <div className="price-input">
                                        <span className="currency-symbol">₫</span>
                                        <input
                                            type="text"
                                            className="field-input"
                                            placeholder="0"
                                            value={formData.startingPrice}
                                            onChange={(e) =>
                                                setFormData({ ...formData, startingPrice: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Giá bán ngay (Tùy chọn)</label>
                                    <div className="price-input">
                                        <span className="currency-symbol">₫</span>
                                        <input
                                            type="text"
                                            className="field-input"
                                            placeholder="0"
                                            value={formData.buyNowPrice}
                                            onChange={(e) =>
                                                setFormData({ ...formData, buyNowPrice: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label className="field-label">Thời gian đấu giá</label>
                                    <select
                                        className="field-select"
                                        value={formData.duration}
                                        onChange={(e) =>
                                            setFormData({ ...formData, duration: e.target.value })
                                        }
                                    >
                                        <option value="">3 ngày</option>
                                        <option value="5">5 ngày</option>
                                        <option value="7">7 ngày</option>
                                        <option value="10">10 ngày</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Bước giá tối thiểu</label>
                                    <div className="price-input">
                                        <span className="currency-symbol">₫</span>
                                        <input
                                            type="text"
                                            className="field-input"
                                            value={formData.minBidIncrement}
                                            onChange={(e) =>
                                                setFormData({ ...formData, minBidIncrement: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Verification Section */}
                    <section className="verification-section">
                        <div className="verification-content">
                            <div className="verification-icon">
                                <svg width="20" height="25" viewBox="0 0 20 25" fill="none">
                                    <path
                                        d="M10 2L2 6V12C2 17 6 22 10 24C14 22 18 17 18 12V6L10 2Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                </svg>
                            </div>
                            <div className="verification-text">
                                <h2 className="verification-title">Xác thực bởi Nền tảng</h2>
                                <p className="verification-description">
                                    Yêu cầu chuyên gia oio.vn kiểm định vật phẩm trước khi đấu giá.
                                </p>
                            </div>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={formData.verification}
                                onChange={(e) =>
                                    setFormData({ ...formData, verification: e.target.checked })
                                }
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </section>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate('/seller-dashboard')}
                        >
                            Lưu bản nháp
                        </button>
                        <button type="submit" className="btn-primary">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                    d="M8 2V14M2 8H14"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                            Đăng vật phẩm đấu giá
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
