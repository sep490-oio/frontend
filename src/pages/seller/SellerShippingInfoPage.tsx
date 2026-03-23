import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './SellerShippingInfoPage.scss';

interface ShippingFormData {
    carrier: string;
    shippingDate: string;
    notes: string;
}

const SellerShippingInfoPage: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();

    const [formData, setFormData] = useState<ShippingFormData>({
        carrier: '',
        shippingDate: '',
        notes: ''
    });

    // Mock order data
    const orderData = {
        itemName: 'Áo Hoodie Metaz Limited Edition',
        orderId: '#MT-89253',
        winner: 'Nguyễn Văn A',
        imageUrl: '/placeholder-item.svg'
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log('Shipping info submitted:', formData);
        navigate(`/seller-dashboard/order/packaging/${orderId}`);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="seller-shipping-info-page">
            <div className="shipping-container">
                <button className="back-link" onClick={() => navigate(-1)}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M8.75 5H1.25M1.25 5L5 8.75M1.25 5L5 1.25" stroke="#0F66BD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Quay lại Dashboard
                </button>

                <div className="content-wrapper">
                    <div className="title-section">
                        <h2>Nhập thông tin vận chuyển</h2>
                        <p className="subtitle">Vui lòng cung cấp chi tiết vận chuyển cho đơn hàng của người thắng cuộc.</p>
                    </div>

                    <div className="order-summary-card">
                        <div className="item-image">
                            <img src={orderData.imageUrl} alt={orderData.itemName} />
                        </div>
                        <div className="item-details">
                            <h3>{orderData.itemName}</h3>
                            <div className="order-meta">
                                <div className="meta-row">
                                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                                        <path d="M1 5L4.5 8.5L11 1.5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="label">Mã đơn hàng:</span>
                                    <span className="value">{orderData.orderId}</span>
                                </div>
                                <div className="meta-row">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <circle cx="5" cy="5" r="4" stroke="#94A3B8" strokeWidth="1.5" />
                                    </svg>
                                    <span className="label">Người nhận: Nguyễn Văn A</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form className="shipping-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-field">
                                <label>Đơn vị vận chuyển</label>
                                <div className="select-wrapper">
                                    <select
                                        value={formData.carrier}
                                        onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                                        required
                                    >
                                        <option value="">Chọn đơn vị vận chuyển</option>
                                        <option value="ghn">Giao hàng nhanh (GHN)</option>
                                        <option value="ghtk">Giao hàng tiết kiệm (GHTK)</option>
                                        <option value="vnpost">VNPost</option>
                                        <option value="jnt">J&T Express</option>
                                        <option value="viettel">Viettel Post</option>
                                    </select>
                                    <svg className="select-icon" width="12" height="8" viewBox="0 0 12 8" fill="none">
                                        <path d="M1 1L6 6L11 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Ngày gửi hàng</label>
                                <div className="date-input-wrapper">
                                    <input
                                        type="date"
                                        value={formData.shippingDate}
                                        onChange={(e) => setFormData({ ...formData, shippingDate: e.target.value })}
                                        required
                                    />
                                    <svg className="calendar-icon" width="18" height="20" viewBox="0 0 18 20" fill="none">
                                        <rect x="1" y="3" width="16" height="16" rx="2" stroke="#64748B" strokeWidth="1.5" />
                                        <path d="M1 7H17M5 1V5M13 1V5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="form-field">
                            <label>Ghi chú thêm</label>
                            <textarea
                                placeholder="Nhập lưu ý cho đơn vị vận chuyển hoặc khách hàng..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary">
                                Xác nhận
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleCancel}>
                                Hủy bỏ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellerShippingInfoPage;
