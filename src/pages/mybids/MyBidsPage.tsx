import { useState } from 'react';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './MyBidsPage.scss';

interface AuctionBid {
    id: string;
    title: string;
    image: string;
    currentBid: string;
    timeLeft: string;
    status: 'winning' | 'outbid' | 'ended';
    statusLabel: string;
}

const mockBids: AuctionBid[] = [
    {
        id: '1',
        title: 'Nike Air Jordan 1 Retro High',
        image: '/placeholder-item.svg',
        currentBid: '4.200.000đ',
        timeLeft: '04:20:12',
        status: 'winning',
        statusLabel: 'ĐANG DẪN ĐẦU'
    },
    {
        id: '2',
        title: 'Minimalist Analog Watch Bla...',
        image: '/placeholder-item.svg',
        currentBid: '1.850.000đ',
        timeLeft: '00:12:45',
        status: 'outbid',
        statusLabel: 'BỊ VƯỢT GIÁ'
    },
    {
        id: '3',
        title: 'Wireless Studio Headphone...',
        image: '/placeholder-item.svg',
        currentBid: '3.100.000đ',
        timeLeft: '12:45:00',
        status: 'winning',
        statusLabel: 'ĐANG DẪN ĐẦU'
    }
];

export function MyBidsPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'winning' | 'outbid' | 'ended'>('all');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'winning':
                return <CheckCircleOutlined />;
            case 'outbid':
                return <CloseCircleOutlined />;
            default:
                return <ClockCircleOutlined />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'winning':
                return 'status-winning';
            case 'outbid':
                return 'status-outbid';
            default:
                return 'status-ended';
        }
    };

    return (
        <div className="mybids-page">
            <div className="mybids-container">
                {/* Header */}
                <div className="mybids-header">
                    <h1 className="page-title">Đấu giá của tôi</h1>
                    <p className="page-subtitle">
                        Theo dõi và quản lý các phiên đấu giá bạn đang tham gia.
                    </p>

                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        <button
                            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'winning' ? 'active' : ''}`}
                            onClick={() => setActiveTab('winning')}
                        >
                            Đang dẫn đầu
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'outbid' ? 'active' : ''}`}
                            onClick={() => setActiveTab('outbid')}
                        >
                            Đã bị vượt giá
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'ended' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ended')}
                        >
                            Đã kết thúc
                        </button>
                    </div>
                </div>

                {/* Auction Cards Grid */}
                <div className="auction-grid">
                    {mockBids.map((bid) => (
                        <div key={bid.id} className="auction-card">
                            {/* Image Container */}
                            <div className="card-image">
                                <img src={bid.image} alt={bid.title} />

                                {/* Status Badge */}
                                <div className={`status-badge ${getStatusClass(bid.status)}`}>
                                    {getStatusIcon(bid.status)}
                                    <span>{bid.statusLabel}</span>
                                </div>

                                {/* Time Badge */}
                                <div className="time-badge">
                                    <ClockCircleOutlined />
                                    <span>{bid.timeLeft}</span>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="card-content">
                                <h3 className="card-title">{bid.title}</h3>

                                <div className="card-info">
                                    <span className="info-label">Giá hiện tại</span>
                                    <span className={`info-value ${bid.status === 'outbid' ? 'outbid' : ''}`}>
                                        {bid.currentBid}
                                    </span>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-primary">Đặt giá nhanh</button>
                                    <button className="btn-secondary">Xem chi tiết</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
