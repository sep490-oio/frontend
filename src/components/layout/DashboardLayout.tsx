/**
 * DashboardLayout — Layout theo thiết kế Figma
 */

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { clearCredentials } from '@/features/auth/authSlice';
import {
    WalletOutlined,
    ShoppingOutlined,
    UserOutlined,
    ShopOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { MainHeader } from './MainHeader';
import './DashboardLayout.scss';

export function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { key: '/wallet', icon: <WalletOutlined />, label: 'Ví tiền' },
        { key: '/shipping', icon: <ShoppingOutlined />, label: 'Giao hàng' },
        { key: '/my-bids', icon: <ShoppingOutlined />, label: 'Đấu giá của tôi' },
        { key: '/disputes', icon: <WarningOutlined />, label: 'Tranh chấp' },
        { key: '/profile', icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
    ];

    return (
        <div className="dashboard-layout">
            <MainHeader />

            <div className="dashboard-layout-container">
                <aside className="dashboard-layout-sidebar">
                    <div className="sidebar-menu">
                        <div className="menu-section">
                            <div className="menu-section-title">MENU CÁ NHÂN</div>
                            <nav className="menu-nav">
                                {menuItems.map((item) => (
                                    <a
                                        key={item.key}
                                        href={item.key}
                                        className={`menu-item ${location.pathname === item.key ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(item.key);
                                        }}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>

                    <div className="sidebar-action">
                        <button className="seller-button">
                            <ShopOutlined />
                            <span>Trở thành Người bán</span>
                        </button>
                    </div>
                </aside>

                <main className="dashboard-layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
