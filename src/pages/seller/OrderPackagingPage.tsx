import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './OrderPackagingPage.scss';

const OrderPackagingPage: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();

    // Mock data
    const orderData = {
        orderId: 'METZ-99283-2024',
        status: 'packaging',
        itemName: 'Đồng hồ Rolex Submariner Date - M126610LN',
        itemImage: '/placeholder-item.svg',
        finalPrice: 450000000,
        buyer: 'Nguyễn Văn Hoàng Anh',
        auctionDate: '20/10/2023 - 14:30',
        shippingAddress: 'Tầng 12, Tòa nhà Bitexco Financial, Sk 2 Hải Triều, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        phone: '0901 *** 888',
        buyerNote: '"Vui lòng đóng gói cẩn thận giúp tôi. Đây là quà tặng kỷ niệm."',
        shippingFee: 0,
        metazFee: -22500000,
        total: 427500000,
        carrier: 'Metaz Luxury Logistics',
        trackingCode: 'HỎA TỐC - BẢO MẬT 24/7'
    };

    const steps = [
        { id: 1, label: 'Chờ xác nhận', status: 'completed', icon: 'check' },
        { id: 2, label: 'Chờ đóng gói', status: 'active', icon: 'package' },
        { id: 3, label: 'Chờ lấy hàng', status: 'pending', icon: 'pickup' },
        { id: 4, label: 'Đang vận chuyển', status: 'pending', icon: 'truck' },
        { id: 5, label: 'Đã giao', status: 'pending', icon: 'delivered' }
    ];

    const instructions = [
        {
            number: 1,
            title: 'Kiểm tra sản phẩm',
            description: 'Đảm bảo sản phẩm đúng mô tả và không có lỗi phát sinh trước khi đóng gói.'
        },
        {
            number: 2,
            title: 'Đóng gói chuẩn Premium',
            description: 'Sử dụng thị tư Metaz chuyên dụng, bọc chống sốc 3 lớp để đảm bảo an toàn cho sản phẩm giá trị cao.'
        },
        {
            number: 3,
            title: 'Dán mã vận đơn',
            description: 'In và dán mã vận đơn (Waybill) chắc chắn trên mặt phẳng của hộp quà tặng.'
        }
    ];

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="order-packaging-page">
            <div className="packaging-container">
                {/* Back Link */}
                <button className="back-link" onClick={() => navigate(-1)}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M8.75 5H1.25M1.25 5L5 8.75M1.25 5L5 1.25" stroke="#0F66BD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Quay lại Dashboard
                </button>

                {/* Status & Stepper Card */}
                <div className="status-stepper-card">
                    <div className="status-header">
                        <div className="status-badge">
                            <span className="badge-text">THÀNH THÁI HIỆN TẠI</span>
                        </div>
                        <h1 className="status-title">Chờ đóng gói</h1>
                    </div>

                    <div className="order-id-section">
                        <span className="order-id-label">Mã vận đơn</span>
                        <span className="order-id-value">{orderData.orderId}</span>
                    </div>

                    {/* Stepper */}
                    <div className="stepper">
                        <div className="stepper-line"></div>
                        <div className="stepper-line-active"></div>

                        {steps.map((step, index) => (
                            <div key={step.id} className={`step-item ${step.status}`}>
                                <div className="step-circle">
                                    {step.status === 'completed' && (
                                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {step.status === 'active' && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <rect x="2" y="2" width="8" height="8" rx="1" stroke="white" strokeWidth="1.5" />
                                        </svg>
                                    )}
                                    {step.status === 'pending' && step.id === 3 && (
                                        <svg width="9" height="12" viewBox="0 0 9 12" fill="none">
                                            <path d="M1 4L4.5 1L8 4M4.5 1V11" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {step.status === 'pending' && step.id === 4 && (
                                        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                                            <path d="M1 5H12M12 5L8 1M12 5L8 9" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {step.status === 'pending' && step.id === 5 && (
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <circle cx="6" cy="6" r="5" stroke="#64748B" strokeWidth="1.5" />
                                            <path d="M3 6L5 8L9 4" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="content-grid">
                    {/* Left Column */}
                    <div className="left-column">
                        {/* Order Info Card */}
                        <div className="order-info-card">
                            <div className="order-content">
                                <div className="item-image">
                                    <img src={orderData.itemImage} alt={orderData.itemName} />
                                </div>

                                <div className="item-details">
                                    <div className="item-header">
                                        <h3 className="item-title">{orderData.itemName}</h3>
                                        <span className="item-price">{formatPrice(orderData.finalPrice)}</span>
                                    </div>

                                    <p className="order-id-text">ID Đơn hàng: #{orderData.orderId}</p>

                                    <div className="buyer-info-grid">
                                        <div className="info-col">
                                            <span className="info-label">NGƯỜI MUA</span>
                                            <span className="info-value">{orderData.buyer}</span>
                                        </div>
                                        <div className="info-col">
                                            <span className="info-label">NGÀY ĐẤU GIÁ THÀNH CÔNG</span>
                                            <span className="info-value">{orderData.auctionDate}</span>
                                        </div>
                                    </div>

                                    <div className="action-buttons">
                                        <div>
                                            <button className="btn-confirm">
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M3 10L8 15L17 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Xác nhận đã đóng gói
                                            </button>
                                            <button className="btn-print">
                                                <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                                                    <path d="M5 6V1H15V6M5 13H3C1.89543 13 1 12.1046 1 11V7C1 5.89543 1.89543 5 3 5H17C18.1046 5 19 5.89543 19 7V11C19 12.1046 18.1046 13 17 13H15M5 10H15V17H5V10Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions Card */}
                        <div className="instructions-card">
                            <div className="card-header">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <circle cx="10" cy="10" r="9" stroke="#0F66BD" strokeWidth="1.5" />
                                    <path d="M10 6V10L13 13" stroke="#0F66BD" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <h3>Hướng dẫn chuẩn bị hàng</h3>
                            </div>

                            <div className="instructions-list">
                                {instructions.map((instruction) => (
                                    <div key={instruction.number} className="instruction-item">
                                        <div className="instruction-number">{instruction.number}</div>
                                        <div className="instruction-content">
                                            <h4>{instruction.title}</h4>
                                            <p>{instruction.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="right-column">
                        {/* Shipping Address Card */}
                        <div className="shipping-address-card">
                            <h3 className="card-title">ĐỊA CHỈ GIAO HÀNG</h3>

                            <div className="address-content">
                                <div className="address-row">
                                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                                        <path d="M8 10C9.65685 10 11 8.65685 11 7C11 5.34315 9.65685 4 8 4C6.34315 4 5 5.34315 5 7C5 8.65685 6.34315 10 8 10Z" stroke="#64748B" strokeWidth="1.5" />
                                        <path d="M8 19C11 15 15 11.4183 15 7C15 3.13401 11.866 0 8 0C4.13401 0 1 3.13401 1 7C1 11.4183 5 15 8 19Z" stroke="#64748B" strokeWidth="1.5" />
                                    </svg>
                                    <p>{orderData.shippingAddress}</p>
                                </div>

                                <div className="phone-row">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <path d="M17 12.5V15.5C17 16.0523 16.5523 16.5 16 16.5H14C6.8203 16.5 1 10.6797 1 3.5V1.5C1 0.947715 1.44772 0.5 2 0.5H5L6.5 5L4.5 6.5C5.5 8.5 9.5 12.5 11.5 13.5L13 11.5L17 12.5Z" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>{orderData.phone}</span>
                                </div>
                            </div>

                            <div className="buyer-note-section">
                                <span className="note-label">Lưu ý từ người mua:</span>
                                <div className="note-content">
                                    <p>{orderData.buyerNote}</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="summary-card">
                            <h3 className="card-title">CHI PHÍ ĐƠN HÀNG</h3>

                            <div className="summary-rows">
                                <div className="summary-row">
                                    <span className="row-label">Giá trúng đấu giá</span>
                                    <span className="row-value">{formatPrice(orderData.finalPrice)}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="row-label">Phí vận chuyển</span>
                                    <span className="row-value green">Miễn phí</span>
                                </div>
                                <div className="summary-row">
                                    <span className="row-label">Phí dịch vụ Metaz</span>
                                    <span className="row-value">{formatPrice(orderData.metazFee)}</span>
                                </div>
                                <div className="summary-total">
                                    <span className="total-label">Tổng số nhận thực tế</span>
                                    <span className="total-value">{formatPrice(orderData.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Carrier Card */}
                        <div className="carrier-card">
                            <div className="carrier-icon">
                                <svg width="18" height="19" viewBox="0 0 18 19" fill="none">
                                    <path d="M1 8.5H13M13 8.5L9 4.5M13 8.5L9 12.5M17 4.5V14.5C17 15.0523 16.5523 15.5 16 15.5H2C1.44772 15.5 1 15.0523 1 14.5V4.5C1 3.94772 1.44772 3.5 2 3.5H16C16.5523 3.5 17 3.94772 17 4.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="carrier-info">
                                <span className="carrier-label">ĐƠN VỊ VẬN CHUYỂN</span>
                                <span className="carrier-name">{orderData.carrier}</span>
                                <span className="carrier-code">{orderData.trackingCode}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPackagingPage;
