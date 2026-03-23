import React from 'react';
import { SearchOutlined, BellOutlined, SettingOutlined } from '@ant-design/icons';
import './WarehouseHeader.scss';

interface WarehouseHeaderProps {
    activeTab?: string;
}

export const WarehouseHeader: React.FC<WarehouseHeaderProps> = ({ activeTab = 'dashboard' }) => {
    return (
        <header className="warehouse-header">
            <div className="header-left">
                <div className="warehouse-logo">
                    <div className="logo-icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="8" width="16" height="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M2 8L10 2L18 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="8" y="12" width="4" height="6" fill="currentColor" />
                        </svg>
                    </div>
                    <h2>METAZ Warehouse</h2>
                </div>
                <nav className="header-nav">
                    <a href="/warehouse-scanner" className={activeTab === 'dashboard' ? 'nav-link active' : 'nav-link'}>
                        Bảng điều khiển
                    </a>
                    <a href="/warehouse-logistics" className={activeTab === 'warehouse' ? 'nav-link active' : 'nav-link'}>
                        Kho hàng
                    </a>
                    <a href="#" className="nav-link">Khu vực</a>
                    <a href="#" className="nav-link">Ô chứa</a>
                </nav>
            </div>
            <div className="header-right">
                <div className="search-box">
                    <SearchOutlined className="search-icon" />
                    <input type="text" placeholder="Tìm kiếm SKU hoặc Ô chứa..." />
                </div>
                <button className="icon-btn">
                    <BellOutlined />
                </button>
                <button className="icon-btn">
                    <SettingOutlined />
                </button>
                <div className="user-avatar">
                    <img src="https://i.pravatar.cc/40" alt="User" />
                </div>
            </div>
        </header>
    );
};
