/**
 * Sidebar — role-based navigation menu (Shopee-style).
 *
 * Light background, simple text links with icons, no collapse.
 * Sticky below the header — stays in place while content scrolls.
 * Has its own scroll if menu items exceed the viewport height.
 *
 * Responsive behavior:
 * - Desktop (≥992px): Visible as a fixed-width sidebar
 * - Tablet + Mobile (<992px): Hidden — AppLayout shows a Drawer instead
 */
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { buildMenuItems } from './buildMenuItems';

const { Sider } = Layout;

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { isDesktop } = useBreakpoint();

  const roles = user?.roles ?? ['bidder'];
  const menuItems = buildMenuItems(roles, t);

  // On mobile + tablet, the sidebar is hidden.
  // AppLayout renders a Drawer with the same menu items instead.
  if (!isDesktop) return null;

  return (
    <Sider
      width={240}
      style={{
        background: '#fff',
        borderRight: '1px solid #000',
        overflowY: 'auto',
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderInlineEnd: 'none', paddingTop: 8 }}
      />
    </Sider>
  );
}
