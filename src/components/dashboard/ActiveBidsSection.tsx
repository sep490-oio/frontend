/**
 * ActiveBidsSection — Section hiển thị đấu giá đang tham gia
 */

import { ClockCircleOutlined } from '@ant-design/icons';
import type { MyBidItem } from '@/types';
import './ActiveBidsSection.scss';

interface ActiveBidsSectionProps {
    bids: MyBidItem[];
}

export function ActiveBidsSection({ bids }: ActiveBidsSectionProps) {
    // Mock data for display
    const mockBids = [
        {
            id: '1',
            image: '/placeholder-item.svg',
            title: 'Nike Air Jordan 1 Retro High',
            currentBid: '4.200.000đ',
            timeLeft: '04:29:12',
            status: 'winning',
            label: 'ĐÃU ĐƯA',
        },
        {
            id: '2',
            image: '/placeholder-item.svg',
            title: 'Minimalist Analog Watch Black',
            currentBid: '1.850.000đ',
            timeLeft: '00:15:45',
            status: 'outbid',
            label: 'BỊ VƯỢ GIÁ',
        },
        {
            id: '3',
            image: '/placeholder-item.svg',
            title: 'Wireless Studio Headphones Pro',
            currentBid: '3.100.000đ',
            timeLeft: '12:45:00',
            status: 'winning',
            label: 'ĐÃU ĐƯA',
        },
    ];

    return (
        <div className="active-bids-section">
            <div className="section-header">
                <h3 className="section-title">Đấu giá đang tham gia</h3>
                <button className="view-all-btn">Xem tất cả</button>
            </div>

            <div className="bids-grid">
                {mockBids.map((bid) => (
                    <div key={bid.id} className="bid-card">
                        <div className="bid-image-container">
                            <img src={bid.image} alt={bid.title} className="bid-image" />
                            <span className={`bid-status-badge ${bid.status}`}>
                                {bid.label}
                            </span>
                            <div className="bid-time-badge">
                                <ClockCircleOutlined />
                                <span>{bid.timeLeft}</span>
                            </div>
                        </div>

                        <div className="bid-info">
                            <h4 className="bid-title">{bid.title}</h4>
                            <div className="bid-price-row">
                                <span className="bid-label">Giá hiện tại</span>
                                <span className="bid-price">{bid.currentBid}</span>
                            </div>

                            {bid.status === 'outbid' && (
                                <button className="rebid-btn">Đấu giá lại</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
