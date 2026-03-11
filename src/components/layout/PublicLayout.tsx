/**
 * PublicLayout — layout for pages accessible without login.
 *
 * Used by: Home, Browse, Auction Detail (read-only), Login, Register.
 * Structure: Shared AppHeader → Content → Footer.
 *
 * Responsive behavior:
 * - Desktop (≥992px): Full nav links + auth buttons in shared header
 * - Tablet + Mobile (<992px): Hamburger opens drawer with navigation
 *
 * Drawer content differs based on auth state:
 * - Guest: Home, Browse, Login/Register buttons
 * - Logged in: Browse + full sidebar nav + Logout (same as AppLayout drawer)
 */
import { useState } from 'react';
import { Layout, Button, Drawer, Menu, Flex } from 'antd';
import { LogoutOutlined, SearchOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { clearCredentials } from '@/features/auth/authSlice';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { AppHeader } from './AppHeader';
import { buildMenuItems } from './buildMenuItems';

const { Content, Footer } = Layout;

export function PublicLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { isDesktop, isMobile } = useBreakpoint();

  // Controls the mobile/tablet navigation drawer open/closed state
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate('/login');
    setDrawerOpen(false);
  };

  /** Navigate and close the drawer */
  const handleMobileNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Guest drawer: simple public nav
  const guestMenuItems = [
    { key: '/', label: t('nav.home') },
    { key: '/browse', label: t('nav.browse') },
  ];

  // Logged-in drawer: Browse + full sidebar items (same as AppLayout)
  const roles = user?.roles ?? ['bidder'];
  const sidebarMenuItems = buildMenuItems(roles, t);
  const loggedInMenuItems = [
    {
      key: '/browse',
      icon: <SearchOutlined />,
      label: t('nav.browse'),
    },
    { type: 'divider' as const },
    ...sidebarMenuItems,
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Shared header — shows hamburger on mobile/tablet */}
      <AppHeader onMenuClick={!isDesktop ? () => setDrawerOpen(true) : undefined} />

      {/* ─── Mobile/Tablet navigation drawer ───────────────────── */}
      <Drawer
        title={t('app.name')}
        placement={user ? 'left' : 'right'}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{ wrapper: { width: 280 }, body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={user ? loggedInMenuItems : guestMenuItems}
          onClick={({ key }) => handleMobileNav(key)}
          style={{ borderInlineEnd: 'none' }}
        />

        {/* Bottom section: Logout (logged in) or Login/Register (guest) */}
        <div style={{ padding: '16px 24px' }}>
          {user ? (
            <Button danger block onClick={handleLogout}>
              <LogoutOutlined /> {t('nav.logout')}
            </Button>
          ) : (
            <Flex vertical gap="middle">
              <Button block onClick={() => handleMobileNav('/login')}>
                {t('nav.login')}
              </Button>
              <Button type="primary" block onClick={() => handleMobileNav('/register')}>
                {t('nav.register')}
              </Button>
            </Flex>
          )}
        </div>
      </Drawer>

      {/* Page content renders here via React Router's <Outlet /> */}
      <Content
        style={{
          padding: isMobile ? '16px' : '0px',
          maxWidth: 1600,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', color: '#999', padding: isMobile ? '16px' : '24px 50px' }}>
        {t('app.name')} ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
