/**
 * AppLayout — layout for authenticated (logged-in) pages.
 *
 * Used by: Dashboard, Wallet, My Bids, Seller pages, Staff portals, Admin.
 * Structure: Shared AppHeader (full-width) → Sidebar + Content → Footer.
 *
 * The shared AppHeader sits above everything for brand consistency
 * (same header as public pages — Shopee/Tiki pattern, Decision #18).
 *
 * Responsive behavior:
 * - Desktop (≥992px): Shared header + sidebar visible + content + footer
 * - Tablet + Mobile (<992px): Shared header (with hamburger) + drawer + content + footer
 */
import { useState } from 'react';
import { Layout, Button, Drawer, Menu } from 'antd';
import { LogoutOutlined, SearchOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { clearCredentials } from '@/features/auth/authSlice';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MainHeader } from './MainHeader';
import { Sidebar } from './Sidebar';
import { buildMenuItems } from './buildMenuItems';

const { Content, Footer } = Layout;

export function AppLayout() {
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
  };

  // Reuse the same role-based menu items from Sidebar for the drawer
  const roles = user?.roles ?? ['bidder'];
  const sidebarMenuItems = buildMenuItems(roles, t);

  // Drawer items: Browse link + sidebar items (unified navigation)
  const drawerMenuItems = [
    {
      key: '/browse',
      icon: <SearchOutlined />,
      label: t('nav.browse'),
    },
    { type: 'divider' as const },
    ...sidebarMenuItems,
  ];

  /** Navigate and close the drawer */
  const handleMobileNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <Layout style={{ height: '100dvh', background: '#101922' }}>
      <MainHeader />

      <Drawer
        title={t('app.name')}
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        styles={{ wrapper: { width: 280 }, body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={drawerMenuItems}
          onClick={({ key }) => handleMobileNav(key)}
          style={{ borderInlineEnd: 'none' }}
        />

        <div style={{ padding: '16px 24px' }}>
          <Button danger block onClick={handleLogout}>
            <LogoutOutlined /> {t('nav.logout')}
          </Button>
        </div>
      </Drawer>

      <Layout style={{ flex: 1, overflow: 'hidden', background: '#101922' }}>
        <Sidebar />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Content
            style={{
              margin: isMobile ? 12 : 24,
              padding: isMobile ? 16 : 24,
              background: '#1a2332',
              borderRadius: 8,
              flex: '1 0 auto',
            }}
          >
            <Outlet />
          </Content>

          <Footer style={{ textAlign: 'center', color: '#999', padding: isMobile ? '16px' : '24px 50px', background: '#060B15' }}>
            {t('app.name')} ©{new Date().getFullYear()}
          </Footer>
        </div>
      </Layout>
    </Layout>
  );
}
