import { useState } from 'react';
import { Button, Dropdown, Avatar, Layout, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  GlobalOutlined,
  MenuOutlined,
  LogoutOutlined,
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
const { Text } = Typography;

interface AppHeaderProps {
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
        
        {/* ─── Left side: brand / menu ───────────────── */}
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

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isMobile ? (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #1677ff, #4096ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                B
              </div>
            ) : (
              <Text strong style={{ fontSize: 20, color: '#1677ff' }}>
                {t('app.name')}
              </Text>
            )}
          </Link>
        </div>

        {/* ─── Right side ───────────────── */}
        <Space size="middle">
          {!isMobile && <Link to="/browse">{t('nav.browse')}</Link>}

          <Dropdown menu={{ items: languageItems }} placement="bottomRight">
            <Button type="text" icon={<GlobalOutlined />} />
          </Dropdown>

          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} src={user.avatarUrl} />
                <Text
                  style={
                    isMobile
                      ? {
                          maxWidth: 64,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 12,
                        }
                      : undefined
                  }
                >
                  {user.fullName}
                </Text>
              </Space>
            </Dropdown>
          ) : (
            !isMobile && (
              <Space>
                <Button onClick={() => navigate('/login')}>
                  {t('nav.login')}
                </Button>
                <Button
                  type="primary"
                  onClick={() => navigate('/register')}
                >
                  {t('nav.register')}
                </Button>
              </Space>
            )
          )}
        </Space>

      </div>
    </Header>
  );
}