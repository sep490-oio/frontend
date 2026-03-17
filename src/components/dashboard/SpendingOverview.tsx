/**
 * SpendingOverview — Biểu đồ tổng quan chi tiêu
 */

import { ArrowUpOutlined } from '@ant-design/icons';
import './SpendingOverview.scss';

export function SpendingOverview() {
    const months = ['THÁNG 1', 'THÁNG 2', 'THÁNG 3', 'THÁNG 4', 'THÁNG 5', 'THÁNG 6'];

    return (
        <div className="spending-overview">
            <div className="spending-header">
                <div className="spending-info">
                    <h3 className="spending-title">Tổng quan chi tiêu</h3>
                    <p className="spending-period">Xu hướng chi tiêu hàng tháng</p>
                </div>
                <div className="spending-total">
                    <div className="total-amount">15.200.000đ</div>
                    <div className="total-change">
                        <ArrowUpOutlined className="change-icon" />
                        <span className="change-text">+12% so với tháng trước</span>
                    </div>
                </div>
            </div>

            <div className="spending-chart">
                <svg width="100%" height="192" viewBox="0 0 582 192" preserveAspectRatio="none">
                    {/* Gradient fill */}
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(37, 99, 235, 0.3)" />
                            <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                        d="M 0 154 Q 97 120, 194 100 T 388 80 T 582 60 L 582 192 L 0 192 Z"
                        fill="url(#chartGradient)"
                    />

                    {/* Line */}
                    <path
                        d="M 0 154 Q 97 120, 194 100 T 388 80 T 582 60"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="5"
                    />
                </svg>

                <div className="chart-labels">
                    {months.map((month, index) => (
                        <span key={index} className="chart-label">{month}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
