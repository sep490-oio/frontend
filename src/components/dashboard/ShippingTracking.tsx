/**
 * ShippingTracking — Theo dõi giao hàng
 */

import './ShippingTracking.scss';

export function ShippingTracking() {
    return (
        <div className="shipping-tracking">
            <h3 className="shipping-title">Theo dõi giao hàng</h3>

            <div className="tracking-card">
                <div className="tracking-header">
                    <div className="tracking-product">
                        <div className="product-image">
                            <img src="/placeholder-item.svg" alt="Product" />
                        </div>
                        <div className="product-info">
                            <h4 className="product-name">Máy ảnh Vintage Film M1</h4>
                            <p className="product-code">Mã đơn: #VN-SG14201</p>
                        </div>
                    </div>

                    <div className="tracking-estimate">
                        <div className="estimate-label">DỰ KIẾN GIAO</div>
                        <div className="estimate-date">24 Tháng 10, 2023</div>
                    </div>
                </div>

                <div className="tracking-progress">
                    <div className="progress-labels">
                        <span className="progress-label active">Đã thanh toán</span>
                        <span className="progress-label active">Đang giao</span>
                        <span className="progress-label">Hoàn tất</span>
                    </div>

                    <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '65%' }}></div>
                        </div>
                        <div className="progress-dots">
                            <div className="progress-dot completed"></div>
                            <div className="progress-dot completed"></div>
                            <div className="progress-dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
