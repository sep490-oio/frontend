import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import {
    WalletOutlined,
    SearchOutlined,
    BellOutlined,
} from '@ant-design/icons';
import './MainHeader.scss';

export function MainHeader() {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const [searchValue, setSearchValue] = useState('');

    return (
        <header className="main-header">
            <div className="header-left">
                <div className="header-logo" onClick={() => navigate('/')}>
                    <div className="logo-icon"></div>
                    <span className="logo-text">oio.vn</span>
                </div>

                <nav className="header-nav">
                    <a href="/" className="nav-link">Trang chủ</a>
                    <a href="/browse" className="nav-link">Khám phá</a>
                    <a href="/dashboard" className="nav-link">Dashboard</a>
                </nav>
            </div>

            <div className="header-right">
                <div className="header-search">
                    <SearchOutlined className="search-icon" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm vật phẩm..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>

                <div className="header-wallet">
                    <WalletOutlined />
                    <span>2.500.000đ</span>
                </div>

                <div className="header-notifications">
                    <BellOutlined />
                    <span className="notification-badge">98</span>
                </div>

                <div className="header-avatar">
                    <img src={user?.avatarUrl || '/placeholder-item.svg'} alt="Avatar" />
                </div>
            </div>
        </header>
    );
}
