/**
 * Sidebar — role-based navigation menu.
 *
 * Dark theme, đồng bộ design-system. Styling qua Sidebar.scss.
 * Sticky dưới header, có scroll riêng nếu menu vượt viewport.
 *
 * Responsive:
 * - Desktop (≥992px): hiển thị cố định
 * - Tablet + Mobile (<992px): ẩn — AppLayout dùng Drawer thay thế
 *
 * Role-based:
 * - buildMenuItems(roles, t) quyết định menu items hiển thị.
 * - Roles hiện tại: 'bidder' | 'seller' | 'admin'
 */
import '../../styles/components/Sidebar.scss';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { buildMenuItems } from './buildMenuItems';

const { Sider } = Layout;

export function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t }     = useTranslation();
  const user      = useAppSelector((state) => state.auth.user);
  const { isDesktop } = useBreakpoint();

  const roles     = user?.roles ?? ['bidder'];
  const menuItems = buildMenuItems(roles, t);

  // Mobile + tablet: ẩn — AppLayout render Drawer thay thế
  if (!isDesktop) return null;

  return (
    <Sider width={240} className="app-sidebar">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className="app-sidebar-menu"
      />
    </Sider>
  );
}