import { useState } from 'react';
import {
    DownOutlined,
    UpOutlined,
    InboxOutlined,
    CarOutlined,
    CalendarOutlined,
    DollarOutlined
} from '@ant-design/icons';
import './ShippingPage.scss';

interface ShippingItem {
    id: string;
    title: string;
    orderId: string;
    date: string;
    price: string;
    status: 'shipping' | 'pending' | 'waiting';
    statusLabel: string;
    seller: string;
    buyer: string;
    trackingNumber: string;
    image?: string;
    timeline: {
        label: string;
        time: string;
        status: 'completed' | 'pending';
    }[];
}

const mockShippingItems: ShippingItem[] = [
    {
        id: '1',
        title: 'Tượng Bearbrick Iron Man 1000%',
        orderId: 'VN123456789',
        date: '25 Tháng 10, 2023',
        price: '45.000.000đ',
        status: 'shipping',
        statusLabel: 'ĐANG VẬN CHUYỂN',
        seller: 'Nguyễn Văn A',
        buyer: 'Trần Thị B',
        trackingNumber: 'VN123456789',
        image: '/placeholder-item.svg',
        timeline: [
            { label: 'Đang vận chuyển', time: '10:00 Hôm nay', status: 'completed' },
            { label: 'Đã lấy hàng', time: '08:30 Hôm nay', status: 'pending' }
        ]
    },
    {
        id: '2',
        title: 'Đồng hồ Rolex Datejust 1985 Vintage',
        orderId: 'VN987654321',
        date: '28 Tháng 10, 2023',
        price: '120.000.000đ',
        status: 'pending',
        statusLabel: 'ĐANG XỬ LÝ',
        seller: 'Lê Văn C',
        buyer: 'Phạm Thị D',
        trackingNumber: 'VN987654321',
        image: '/placeholder-item.svg',
        timeline: []
    },
    {
        id: '3',
        title: 'Máy ảnh Leica M11 Chrome Edition',
        orderId: 'VN544533221',
        date: '01 Tháng 11, 2023',
        price: '315.000.000đ',
        status: 'waiting',
        statusLabel: 'CHỜ LẤY HÀNG',
        seller: 'Hoàng Văn E',
        buyer: 'Ngô Thị F',
        trackingNumber: 'VN544533221',
        timeline: []
    }
];

export function ShippingPage() {
    const [activeTab, setActiveTab] = useState<'shipping' | 'delivered' | 'all'>('shipping');
    const [expandedItem, setExpandedItem] = useState<string | null>('1');

    const toggleExpand = (id: string) => {
        setExpandedItem(expandedItem === id ? null : id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'shipping': return 'status-shipping';
            case 'pending': return 'status-pending';
            case 'waiting': return 'status-waiting';
            default: return '';
        }
    };

    return (
        <div className="shipping-page">
            <div className="shipping-container">
                {/* Header */}
                <div className="shipping-header">
                    <div className="header-content">
                        <h1 className="page-title">Theo dõi Giao hàng</h1>
                        <p className="page-subtitle">
                            Quản lý trạng thái vận chuyển các sản phẩm bạn đã thắng đấu giá.
                        </p>
                    </div>
                    <button className="refresh-button">Làm mới</button>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={`tab-button ${activeTab === 'shipping' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shipping')}
                    >
                        Đang vận chuyển (3)
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'delivered' ? 'active' : ''}`}
                        onClick={() => setActiveTab('delivered')}
                    >
                        Đã giao (12)
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Tất cả đơn hàng
                    </button>
                </div>

                {/* Shipping List */}
                <div className="shipping-list">
                    {mockShippingItems.map((item) => (
                        <div
                            key={item.id}
                            className={`shipping-item ${expandedItem === item.id ? 'expanded' : ''}`}
                        >
                            <div className="item-container">
                                {/* Summary Row */}
                                <div className="item-summary">
                                    <div className="item-image">
                                        <img src={item.image} alt={item.title} />
                                    </div>

                                    <div className="item-info">
                                        <div className="info-header">
                                            <h3 className="item-title">{item.title}</h3>
                                            <span className={`status-badge ${getStatusColor(item.status)}`}>
                                                {item.statusLabel}
                                            </span>
                                        </div>

                                        <div className="item-meta">
                                            <div className="meta-item">
                                                <InboxOutlined style={{ fontSize: 12 }} />
                                                <span>{item.orderId}</span>
                                            </div>
                                            <div className="meta-item">
                                                <CalendarOutlined style={{ fontSize: 12 }} />
                                                <span>{item.date}</span>
                                            </div>
                                            <div className="meta-item highlight">
                                                <DollarOutlined style={{ fontSize: 12 }} />
                                                <span>{item.price}</span>
                                            </div>
                                            <button
                                                className="expand-button"
                                                onClick={() => toggleExpand(item.id)}
                                            >
                                                {expandedItem === item.id ? <UpOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed View */}
                                {expandedItem === item.id && (
                                    <div className="item-details">
                                        <div className="timeline-container">
                                            <div className="timeline-divider" />
                                            <div className="timeline-divider-active" />

                                            <div className="timeline-steps">
                                                {item.timeline.map((step, index) => (
                                                    <div key={index} className="timeline-step">
                                                        <div className={`step-icon ${step.status}`}>
                                                            <div className="icon-shadow" />
                                                            {step.status === 'completed' ? <CarOutlined style={{ fontSize: 12 }} /> : <InboxOutlined style={{ fontSize: 10 }} />}
                                                        </div>
                                                        <div className="step-content">
                                                            <div className="step-label">{step.label}</div>
                                                            <div className="step-time">{step.time}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="action-buttons">
                                            <button className="btn-primary">Xác nhận đã nhận</button>
                                            <button className="btn-secondary">Liên hệ shipper</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
