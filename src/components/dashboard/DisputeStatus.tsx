/**
 * DisputeStatus — Card hiển thị tranh chấp của người dùng
 */

import './DisputeStatus.scss';

interface DisputeItem {
    id: string;
    orderCode: string;
    itemName: string;
    status: 'pending' | 'resolved';
    date: string;
}

export function DisputeStatus() {
    const disputes: DisputeItem[] = [
        {
            id: '1',
            orderCode: '#12093',
            itemName: 'Giày Nike Air',
            status: 'pending',
            date: 'Hôm nay',
        },
        {
            id: '2',
            orderCode: '#11842',
            itemName: 'iPhone 13 Pro',
            status: 'resolved',
            date: '2 ngày trước',
        },
    ];

    return (
        <div className="dispute-status">
            <h3 className="dispute-title">Tranh chấp của tôi</h3>

            <div className="dispute-list">
                {disputes.map((dispute) => (
                    <div
                        key={dispute.id}
                        className={`dispute-item ${dispute.status === 'resolved' ? 'resolved' : ''}`}
                    >
                        <div className="dispute-item-header">
                            <span className={`dispute-badge ${dispute.status}`}>
                                {dispute.status === 'pending' ? 'Đang xử lý' : 'Đã giải quyết'}
                            </span>
                            <span className="dispute-date">{dispute.date}</span>
                        </div>
                        <div className="dispute-item-info">
                            Mã đơn {dispute.orderCode} - {dispute.itemName}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
