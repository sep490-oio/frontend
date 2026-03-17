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
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { MainHeader } from './MainHeader';

const { Content, Footer } = Layout;

export function PublicLayout() {
  const { isMobile } = useBreakpoint();

  return (
    <Layout style={{ minHeight: '100vh', background: '#101922' }}>
      <MainHeader />

      <Content
        style={{
          padding: isMobile ? '16px' : '24px',
          maxWidth: 1600,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', color: '#999', padding: isMobile ? '16px' : '24px 50px', background: '#060B15' }}>
        oio.vn ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
