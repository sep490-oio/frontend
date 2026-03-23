import React from 'react';
import { WarehouseHeader } from '@/components/warehouse/WarehouseHeader';
import { AppstoreOutlined, DatabaseOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import './NewShipmentPage.scss';

const NewShipmentPage: React.FC = () => {
    return (
        <div className="new-shipment-page">
            <WarehouseHeader activeTab="warehouse" />
            <div className="warehouse-main">
                <aside className="warehouse-sidebar">
                    <div className="sidebar-section">
                        <div className="section-title">DANH MỤC CHÍNH</div>
                        <a href="/warehouse-scanner" className="sidebar-item">
                            <AppstoreOutlined className="item-icon" />
                            <span>Bảng điều khiển</span>
                        </a>
                        <a href="/warehouse-logistics" className="sidebar-item">
                            <DatabaseOutlined className="item-icon" />
                            <span>Mục tồn kho</span>
                        </a>
                        <a href="/warehouse-intake" className="sidebar-item active">
                            <DownloadOutlined className="item-icon" />
                            <span>Nhập kho</span>
                        </a>
                    </div>
                    <div className="storage-info">
                        <div className="storage-header">
                            <InboxOutlined className="storage-icon" />
                            <span className="storage-title">SỨC CHỨA</span>
                        </div>
                        <div className="storage-bar">
                            <div className="storage-fill" style={{ width: '82%' }}></div>
                        </div>
                        <div className="storage-text">82.4% Không gian đã sử dụng</div>
                    </div>
                </aside>
                <div className="warehouse-content">
                    <h1>New Shipment</h1>
                    <p>New shipment form here</p>
                </div>
            </div>
        </div>
    );
};

export default NewShipmentPage;
