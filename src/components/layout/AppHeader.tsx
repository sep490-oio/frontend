/**
 * AppHeader — shared top header used by both PublicLayout and AppLayout.
 *
 * Provides consistent brand identity across the entire app (Shopee/Tiki pattern):
 * - Logo (always visible, links to home)
 * - "Khám phá" link (desktop only)
 * - Language switcher (always visible)
 * - Auth section: Login/Register (guest) OR user avatar dropdown (logged in)
 *
 * Responsive behavior:
 * - Desktop (≥992px): Full nav links + auth section, no hamburger
 * - Tablet (768–991px): Nav links visible + hamburger for drawer navigation
 * - Mobile (<768px): Compact — hamburger + logo + language + avatar/login
 *
 * The optional `onMenuClick` prop shows a hamburger button (mobile + tablet).
 * Parent layouts decide when to pass it (typically when sidebar is hidden).
 * Each parent layout manages its own drawer (PublicLayout → right, AppLayout → left).
 */
import { Button, Space, Dropdown, Typography, Avatar, Layout } from 'antd';
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

const { Header } = Layout;
const { Text } = Typography;

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
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: isMobile ? '0 16px' : '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* ─── Left side: hamburger (mobile) + logo ─────────────────── */}
      <Space size="middle">
        {/* Hamburger button — shows when parent provides onMenuClick (mobile + tablet) */}
        {onMenuClick && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            aria-label={t('common.menu')}
          />
        )}

        {/* Logo — always visible, links to home */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMobile ? (
            // Placeholder logo icon for mobile — replace with actual <img> when logo is ready
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
      </Space>

      {/* ─── Right side: nav links + language + auth/user ─────────── */}
      <Space size="middle">
        {/* Desktop nav links */}
        {!isMobile && <Link to="/browse">{t('nav.browse')}</Link>}

        {/* Language Switcher — always visible */}
        <Dropdown menu={{ items: languageItems }} placement="bottomRight">
          <Button type="text" icon={<GlobalOutlined />} />
        </Dropdown>

        {/* Auth buttons (guest) OR user dropdown (logged in) */}
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} src={user.avatarUrl} />
              <Text
                style={isMobile
                  ? { maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }
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
              <Button onClick={() => navigate('/login')}>{t('nav.login')}</Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                {t('nav.register')}
              </Button>
            </Space>
          )
        )}
      </Space>
    </Header>
  );
}
