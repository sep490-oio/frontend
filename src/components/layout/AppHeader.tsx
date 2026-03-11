/**
 * AppHeader — shared top header used by both PublicLayout and AppLayout.
 *
 * Provides consistent brand identity across the entire app.
 *
 * Responsive behavior:
 * - Desktop (≥1200px): full nav, search, language switcher, and auth actions
 * - Mobile (<1200px): compact header with hamburger, logo, language, and user/auth controls
 */
import { useState } from 'react';
import { Button, Dropdown, Avatar, Layout } from 'antd';
import {
  DashboardOutlined,
  GlobalOutlined,
  MenuOutlined,
  LogoutOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { clearCredentials } from '@/features/auth/authSlice';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import type { SupportedLanguage } from '@/types';

import './AppHeader.scss';

const { Header } = Layout;

interface AppHeaderProps {
  /** If provided, shows a hamburger button (mobile + tablet) that opens the nav drawer */
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { isMobile } = useBreakpoint();
  const [searchValue, setSearchValue] = useState('');

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  const languageItems = [
    { key: 'vi', label: t('language.vi'), onClick: () => changeLanguage('vi') },
    { key: 'en', label: t('language.en'), onClick: () => changeLanguage('en') },
  ];

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: t('nav.dashboard'),
      onClick: () => navigate('/dashboard'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Header className="app-header">
      <div className="app-header__inner">
        <div className="app-header__brand">
          {onMenuClick && (
            <Button
              className="app-header__menuButton"
              type="text"
              icon={<MenuOutlined />}
              onClick={onMenuClick}
              aria-label={t('common.menu')}
            />
          )}

          <Link to="/" className="app-header__logo">
            <span className="app-header__logoImage" />
            <span className="app-header__title">{t('app.name')}</span>
          </Link>
        </div>

        <div className="app-header__search">
          <div className="app-header__searchInput">
            <SearchOutlined className="app-header__searchIcon" />
            <input
              className="app-header__searchField"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t('browse.searchPlaceholder')}
              aria-label={t('common.search')}
            />
          </div>
        </div>

        <div className="app-header__actions">
          <nav className="app-header__nav">
            <Link to="/browse" className="app-header__navLink">
              {t('nav.browse')}
            </Link>
            <Link to="/about" className="app-header__navLink">
              {t('nav.about')}
            </Link>
          </nav>

          <div className="app-header__controls">
            <Dropdown menu={{ items: languageItems }} placement="bottomRight">
              <Button className="app-header__langButton" type="text" icon={<GlobalOutlined />} />
            </Dropdown>

            {user ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <button className="app-header__user" type="button">
                  <Avatar icon={<UserOutlined />} src={user.avatarUrl} />
                  <span className="app-header__userName">{user.fullName}</span>
                </button>
              </Dropdown>
            ) : (
              !isMobile && (
                <div className="app-header__authButtons">
                  <Button
                    className="app-header__authButtonSecondary"
                    onClick={() => navigate('/login')}
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    className="app-header__authButtonPrimary"
                    onClick={() => navigate('/register')}
                  >
                    {t('nav.register')}
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Header>
  );
}
