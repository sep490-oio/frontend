import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileTextOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    LeftOutlined,
    RightOutlined
} from '@ant-design/icons';
import './DisputesPage.scss';

interface Dispute {
    id: string;
    itemName: string;
    itemImage: string;
    requestDate: string;
    reason: string;
    status: 'pending' | 'resolved' | 'rejected';
    statusLabel: string;
    proposal: string;
    evidence: string[];
}

const mockDisputes: Dispute[] = [
    {
        id: '#MTZ-9821',
        itemName: 'Đồng hồ Rolex Datejust 1985',
        itemImage: '/placeholder-item.svg',
        requestDate: '12/10/2023',
        reason: 'Sản phẩm không đúng mô tả...',
        status: 'pending',
        statusLabel: 'ĐANG XỬ LÝ',
        proposal: 'Hoàn trả 100% số tiền hoặc giảm giá 30%',
        evidence: ['/placeholder-item.svg', '/placeholder-item.svg', '/placeholder-item.svg']
    },
    {
        id: '#MTZ-7734',
        itemName: 'Túi Hermès Birkin 35',
        itemImage: '/placeholder-item.svg',
        requestDate: '05/10/2023',
        reason: 'Lỗi vận chuyển - Trầy xước ở nắp...',
        status: 'resolved',
        statusLabel: 'ĐÃ GIẢI QUYẾT',
        proposal: 'Hoàn trả 100% số tiền',
        evidence: []
    },
    {
        id: '#MTZ-4412',
        itemName: 'Tiền xu cổ thời Minh',
        itemImage: '/placeholder-item.svg',
        requestDate: '28/09/2023',
        reason: 'Nghi ngờ hàng giả- Không có...',
        status: 'rejected',
        statusLabel: 'BỊ TỪ CHỐI',
        proposal: 'Hoàn trả 50% số tiền',
        evidence: []
    },
    {
        id: '#MTZ-1205',
        itemName: 'Tranh sơn dầu "Bình Minh"',
        itemImage: '/placeholder-item.svg',
        requestDate: '15/09/2023',
        reason: 'Người bán không giao hàng đ...',
        status: 'resolved',
        statusLabel: 'ĐÃ GIẢI QUYẾT',
        proposal: 'Hoàn trả 100% số tiền',
        evidence: []
    }
];

export function DisputesPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'resolved' | 'rejected'>('all');

    const stats = {
        total: 12,
        pending: 3,
        resolved: 9
    };

    return (
        <div className="disputes-page">
            <div className="disputes-container">
                {/* Stats Cards */}
                <div className="stats-section">
                    <div className="stat-card">
                        <div className="stat-label">Tổng số tranh chấp</div>
                        <div className="stat-value-row">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-change positive">+2%</div>
                        </div>
                        <FileTextOutlined className="stat-icon" />
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Đang giải quyết</div>
                        <div className="stat-value pending">{stats.pending}</div>
                        <ClockCircleOutlined className="stat-icon" />
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Đã hoàn tất</div>
                        <div className="stat-value resolved">{stats.resolved}</div>
                        <CheckCircleOutlined className="stat-icon" />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-section">
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                        >
                            Tất cả
                        </button>
                        <button
                            className={`filter-tab ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Đang xử lý
                        </button>
                        <button
                            className={`filter-tab ${activeTab === 'resolved' ? 'active' : ''}`}
                            onClick={() => setActiveTab('resolved')}
                        >
                            Đã giải quyết
                        </button>
                        <button
                            className={`filter-tab ${activeTab === 'rejected' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rejected')}
                        >
                            Bị từ chối
                        </button>
                    </div>
                </div>

                {/* Disputes Table */}
                <div className="disputes-table">
                    <div className="table-header">
                        <div className="th th-id">Mã đấu giá</div>
                        <div className="th th-item">Tên vật phẩm</div>
                        <div className="th th-date">Ngày yêu cầu</div>
                        <div className="th th-reason">Lý do</div>
                        <div className="th th-status">Trạng thái</div>
                        <div className="th th-action">Thao tác</div>
                    </div>

                    <div className="table-body">
                        {mockDisputes.map((dispute) => (
                            <div key={dispute.id} className="table-row-wrapper">
                                <div className="table-row">
                                    <div className="td td-id">{dispute.id}</div>
                                    <div className="td td-item">
                                        <div className="item-image">
                                            <img src={dispute.itemImage} alt={dispute.itemName} />
                                        </div>
                                        <div className="item-name">{dispute.itemName}</div>
                                    </div>
                                    <div className="td td-date">{dispute.requestDate}</div>
                                    <div className="td td-reason">{dispute.reason}</div>
                                    <div className="td td-status">
                                        {/* Trống - không hiển thị trạng thái */}
                                    </div>
                                    <div className="td td-action">
                                        <button
                                            className="btn-detail"
                                            onClick={() => {
                                                const cleanId = dispute.id.replace('#', '');
                                                console.log('Navigating to:', `/disputes/${cleanId}`);
                                                navigate(`/disputes/${cleanId}`);
                                            }}
                                        >
                                            Chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="table-footer">
                        <div className="pagination-info">Hiển thị trên 12 tranh chấp</div>
                        <div className="pagination">
                            <button className="page-btn"><LeftOutlined /></button>
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                            <button className="page-btn"><RightOutlined /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
