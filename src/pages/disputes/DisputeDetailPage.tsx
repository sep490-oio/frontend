import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    RightOutlined,
    PaperClipOutlined,
    SendOutlined
} from '@ant-design/icons';
import './DisputeDetailPage.scss';

export function DisputeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');

    // Mock data
    const dispute = {
        id: '#MTZ-9821',
        title: 'Chi tiết tranh chấp #MTZ-9821',
        createdAt: 'Khởi tạo vào 14:20, 24/10/2023',
        status: 'pending',
        statusLabel: 'Đang xử lý',
        product: {
            name: 'Đồng hồ Rolex Datejust 1985',
            code: 'R-DJ-1985-Gold',
            image: '/placeholder-item.svg',
            seller: 'Premium Bidder',
            sellerAvatar: '/placeholder-item.svg',
            winningBid: '145.500.000 VND'
        },
        reason: {
            title: 'Lý do: Sản phẩm không đúng mô tả',
            description: 'Sản phẩm nhận được có nhiều vết trầy xước ở sấu ở phần vỏ, và dây đeo không được đề cập trong bài đấu giá. Ngoài ra, cơ chế lịch ngày không hoạt động trơn tru như cam kết "tình trạng hoàn hảo" của người bán.'
        },
        evidence: [
            '/placeholder-item.svg',
            '/placeholder-item.svg',
            '/placeholder-item.svg'
        ],
        timeline: [
            { label: 'Đã mở khiếu nại', time: '14:20, 24/10/2023', status: 'completed' },
            { label: 'Đã nộp bằng chứng', time: '14:45, 24/10/2023', status: 'completed' },
            { label: 'Chờ điều phối viên', time: 'Hệ thống đang chờ dịch...', status: 'current' },
            { label: 'Phán quyết cuối cùng', time: 'Chưa bắt đầu', status: 'pending' }
        ],
        messages: [
            {
                id: 1,
                sender: 'system',
                senderName: 'Hệ thống Metaz',
                content: 'Khiếu nại của bạn đã được tiếp nhận. Đội ngũ hỗ trợ sẽ phản hồi trong vòng 24-48h làm việc.',
                time: '',
                type: 'system'
            },
            {
                id: 2,
                sender: 'user',
                content: 'Tôi đã đính kèm ảnh chụp chi tiết các vết trầy xước ở cạnh. Vui lòng xem xét việc hoàn trả một phần chi phí spa chữa.',
                time: '10:22',
                type: 'user'
            },
            {
                id: 3,
                sender: 'moderator',
                senderName: 'Minh Anh (Support)',
                senderAvatar: '/placeholder-item.svg',
                content: 'Cảm ơn bạn đã cung cấp thông tin. Chúng tôi đang xem xét và sẽ liên hệ với người bán để làm rõ vấn đề.',
                time: '11:05',
                type: 'moderator'
            }
        ]
    };

    const handleSendMessage = () => {
        if (message.trim()) {
            console.log('Sending message:', message);
            setMessage('');
        }
    };

    return (
        <div className="dispute-detail-page">
            <div className="dispute-detail-container">
                {/* Breadcrumb */}
                <div className="breadcrumb">
                    <span className="breadcrumb-link" onClick={() => navigate('/disputes')}>
                        Tranh chấp
                    </span>
                    <RightOutlined className="breadcrumb-separator" />
                    <span className="breadcrumb-current">Chi tiết tranh chấp {dispute.id}</span>
                </div>

                {/* Header */}
                <div className="detail-header">
                    <div className="header-left">
                        <h1 className="page-title">{dispute.title}</h1>
                        <p className="page-subtitle">{dispute.createdAt}</p>
                    </div>
                    <div className="header-right">
                        <div className="status-badge-large pending">
                            <span className="status-dot"></span>
                            {dispute.statusLabel}
                        </div>
                        <button className="btn-cancel">Hủy tranh chấp</button>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="detail-grid">
                    {/* Left Column */}
                    <div className="left-column">
                        {/* Product Card */}
                        <div className="product-card">
                            <div className="product-image">
                                <img src={dispute.product.image} alt={dispute.product.name} />
                            </div>
                            <div className="product-info">
                                <div className="info-label">Thông tin sản phẩm</div>
                                <h3 className="product-name">{dispute.product.name}</h3>
                                <p className="product-code">Mã phiên bản: {dispute.product.code}</p>

                                <div className="product-details">
                                    <div className="detail-box">
                                        <div className="detail-label">Người bán</div>
                                        <div className="detail-value">
                                            <img src={dispute.product.sellerAvatar} alt="" className="seller-avatar" />
                                            <span>{dispute.product.seller}</span>
                                        </div>
                                    </div>
                                    <div className="detail-box">
                                        <div className="detail-label">Giá thắng thầu</div>
                                        <div className="detail-value price">{dispute.product.winningBid}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dispute Reason */}
                        <div className="reason-section">
                            <div className="section-header">
                                <FileTextOutlined />
                                <h3>Chi tiết lý do khiếu nại</h3>
                            </div>

                            <div className="reason-box">
                                <div className="reason-content">
                                    <strong>{dispute.reason.title}</strong>
                                    <p>{dispute.reason.description}</p>
                                </div>
                            </div>

                            <div className="evidence-section">
                                <div className="evidence-label">Hình ảnh & Video bằng chứng (4)</div>
                                <div className="evidence-gallery">
                                    {dispute.evidence.map((img, idx) => (
                                        <div key={idx} className="evidence-item">
                                            <img src={img} alt={`Evidence ${idx + 1}`} />
                                        </div>
                                    ))}
                                    <div className="evidence-upload">
                                        <PaperClipOutlined />
                                        <span>Thêm file</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="right-column">
                        {/* Timeline */}
                        <div className="timeline-section">
                            <h3>Tiến độ xử lý</h3>
                            <div className="timeline">
                                <div className="timeline-line"></div>
                                {dispute.timeline.map((step, idx) => (
                                    <div key={idx} className={`timeline-step ${step.status}`}>
                                        <div className="step-icon">
                                            {step.status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                                        </div>
                                        <div className="step-content">
                                            <div className="step-label">{step.label}</div>
                                            <div className="step-time">{step.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Communication Feed */}
                        <div className="communication-section">
                            <h3>Trao đổi hỗ trợ</h3>

                            <div className="messages-container">
                                {dispute.messages.map((msg) => (
                                    <div key={msg.id} className={`message ${msg.type}`}>
                                        {msg.type === 'system' && (
                                            <>
                                                <div className="message-sender system">{msg.senderName}</div>
                                                <div className="message-content">{msg.content}</div>
                                            </>
                                        )}
                                        {msg.type === 'user' && (
                                            <>
                                                <div className="message-bubble user">
                                                    {msg.content}
                                                </div>
                                                <div className="message-time">{msg.time}</div>
                                            </>
                                        )}
                                        {msg.type === 'moderator' && (
                                            <>
                                                <div className="message-header">
                                                    <img src={msg.senderAvatar} alt="" className="sender-avatar" />
                                                    <span className="sender-name">{msg.senderName}</span>
                                                </div>
                                                <div className="message-bubble moderator">
                                                    {msg.content}
                                                </div>
                                                <div className="message-time">{msg.time}</div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="chat-input">
                                <textarea
                                    placeholder="Nhập tin nhắn phản hồi..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <div className="input-actions">
                                    <button className="btn-attach">
                                        <PaperClipOutlined />
                                    </button>
                                    <button className="btn-send" onClick={handleSendMessage}>
                                        <SendOutlined />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button className="btn-submit-evidence">
                            <FileTextOutlined />
                            Bổ sung thêm bằng chứng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
