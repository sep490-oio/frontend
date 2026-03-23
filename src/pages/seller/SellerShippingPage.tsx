/**
 * SellerShippingPage - Trang giao hàng cho seller
 * Quản lý và chọn phương thức vận chuyển cho các sản phẩm đã bán thành công
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SellerShippingPage.scss';

interface ShippingItem {
    id: string;
    image: string;
    title: string;
    itemCode: string;
    auctionCode: string;
    buyer: string;
    location: string;
    finalPrice: number;
    verified: boolean;
}

type ShippingMethod = 'buyer' | 'warehouse';
type ShippingStatus = 'pending' | 'awaiting-pickup' | 'in-transit' | 'shipped' | 'completed' | 'cancelled';

export function SellerShippingPage() {
    const navigate = useNavigate();
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('buyer');
    const [activeStatus, setActiveStatus] = useState<ShippingStatus>('pending');

    // Mock data
    const shippingItems: ShippingItem[] = [
        {
            id: '1',
            image: '/placeholder-item.svg',
            title: 'Nike Air Zoom Pegasus 38 - Edition Limited',
            itemCode: 'ORD-39281',
            auctionCode: 'AUC-221',
            buyer: 'Hoàng Nguyên',
            location: 'Quận 1, TP.HCM',
            finalPrice: 4250000,
            verified: true,
        },
        {
            id: '2',
            image: '/placeholder-item.svg',
            title: 'Đồng hồ Classic Minimalist Silver',
            itemCode: 'ORD-39245',
            auctionCode: 'AUC-216',
            buyer: 'Trần Anh Tú',
            location: 'Quận 7, TP.HCM',
            finalPrice: 12800000,
            verified: true,
        },
    ];

    const statusTabs = [
        { key: 'pending' as ShippingStatus, label: 'Chờ xác nhận' },
        { key: 'awaiting-pickup' as ShippingStatus, label: 'Chờ đóng gói' },
        { key: 'in-transit' as ShippingStatus, label: 'Đang vận chuyển' },
        { key: 'shipped' as ShippingStatus, label: 'Đã vận chuyển' },
        { key: 'completed' as ShippingStatus, label: 'Hoàn thành' },
        { key: 'cancelled' as ShippingStatus, label: 'Đã hủy' },
    ];

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    return (
        <div className="seller-shipping-page">
            {/* Sub-navigation Tab Bar */}
            <nav className="sub-navigation">
                <div className="nav-container">
                    <button
                        className="nav-button"
                        onClick={() => navigate('/seller-dashboard')}
                    >
                        Tổng quan
                    </button>
                    <button
                        className="nav-button"
                        onClick={() => navigate('/seller-dashboard/active-auctions')}
                    >
                        Đấu giá đang tham gia
                    </button>
                    <button
                        className="nav-button"
                        onClick={() => navigate('/seller-dashboard/items')}
                    >
                        Vật phẩm đang đấu giá
                    </button>
                    <button className="nav-button active">
                        Giao hàng
                        <div className="active-indicator" />
                    </button>
                    <button className="nav-button">Đơn hàng</button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-container">
                    {/* Shipping Method Toggle */}
                    <div className="shipping-method-section">
                        <div className="toggle-background">
                            <button
                                className={`toggle-button ${shippingMethod === 'buyer' ? 'active' : ''}`}
                                onClick={() => setShippingMethod('buyer')}
                            >
                                Gửi cho Người mua
                            </button>
                            <div className="toggle-button-wrapper">
                                <button
                                    className={`toggle-button ${shippingMethod === 'warehouse' ? 'active' : ''}`}
                                    onClick={() => setShippingMethod('warehouse')}
                                >
                                    Gửi về Kho kiểm định
                                </button>
                            </div>
                        </div>
                        <div className="info-text">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <circle cx="6" cy="6" r="5.5" stroke="currentColor" />
                            </svg>
                            <span>Bạn có 3 đơn hàng cần xử lý ngay</span>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="status-tabs-section">
                        <div className="tabs-container">
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`tab-button ${activeStatus === tab.key ? 'active' : ''}`}
                                    onClick={() => setActiveStatus(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="header-info">
                        <h1 className="page-heading">Đơn hàng chờ vận chuyển</h1>
                        <p className="page-description">
                            Quản lý và chọn phương thức vận chuyển cho các sản phẩm đã bán thành công.
                        </p>
                    </div>

                    {/* Shipping Items List */}
                    <div className="shipping-items-list">
                        {shippingItems.map((item) => (
                            <div key={item.id} className="shipping-item">
                                {/* Item Image */}
                                <div className="item-image-wrapper">
                                    <div className="item-image">
                                        <img src={item.image} alt={item.title} />
                                    </div>
                                    {item.verified && (
                                        <div className="verified-badge">
                                            <span>Đã thành toán</span>
                                        </div>
                                    )}
                                </div>

                                {/* Item Details */}
                                <div className="item-details">
                                    {/* Title and Price Row */}
                                    <div className="item-header-row">
                                        <div className="item-info">
                                            <h3 className="item-title">{item.title}</h3>
                                            <p className="item-code">
                                                Mã đơn: #{item.itemCode} • Phiên đấu giá: #{item.auctionCode}
                                            </p>
                                        </div>
                                        <div className="item-price">
                                            <span className="price-label">Giá chốt</span>
                                            <span className="price-value">{formatPrice(item.finalPrice)}</span>
                                        </div>
                                    </div>

                                    {/* Buyer Info Row */}
                                    <div className="buyer-info-row">
                                        <div className="info-item">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                <path
                                                    d="M6 6C7.38071 6 8.5 4.88071 8.5 3.5C8.5 2.11929 7.38071 1 6 1C4.61929 1 3.5 2.11929 3.5 3.5C3.5 4.88071 4.61929 6 6 6Z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                                <path
                                                    d="M10 10.5C10 8.567 8.209 7 6 7C3.791 7 2 8.567 2 10.5"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span>Người mua: {item.buyer}</span>
                                        </div>
                                        <div className="info-item">
                                            <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
                                                <path
                                                    d="M6 7.5C7.10457 7.5 8 6.60457 8 5.5C8 4.39543 7.10457 3.5 6 3.5C4.89543 3.5 4 4.39543 4 5.5C4 6.60457 4.89543 7.5 6 7.5Z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                                <path
                                                    d="M1 5.5C1 2.73858 3.23858 0.5 6 0.5C8.76142 0.5 11 2.73858 11 5.5C11 8.26142 6 13.5 6 13.5C6 13.5 1 8.26142 1 5.5Z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                            <span>Khu vực: {item.location}</span>
                                        </div>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="item-actions">
                                        <div className="btn-primary-wrapper">
                                            <button
                                                className="btn-primary"
                                                onClick={() => navigate(`/seller-dashboard/shipping/info/${item.itemCode}`)}
                                            >
                                                <span>Chọn hình thức vận chuyển</span>
                                                <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                                                    <path
                                                        d="M1 1L3.5 3.5L6 1"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                        <button className="btn-secondary">Chi tiết đơn hàng</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    <div className="empty-state">
                        <div className="empty-content">
                            <p className="empty-text">Hết danh sách đơn hàng cần vận chuyển</p>
                            <button className="empty-link">Xem tất cả lịch sử đơn hàng</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
