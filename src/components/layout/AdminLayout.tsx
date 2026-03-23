/**
 * AdminLayout — layout riêng cho toàn bộ khu vực /admin/*
 *
 * Cấu trúc:
 * - Sidebar trái: logo + menu admin đầy đủ (buildAdminMenuItems)
 * - Header trên: tên trang + avatar + logout
 * - Content: <Outlet /> render page tương ứng
 *
 * Sidebar menu được build từ buildAdminMenuItems(roles, t),
 * tự động điều chỉnh theo super_admin vs admin thường.
 *
 * Responsive:
 * - Desktop (≥992px): sidebar cố định bên trái
 * - Mobile/tablet (<992px): sidebar ẩn, mở bằng hamburger → Drawer
 */
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Layout, Menu, Avatar, Dropdown, Button, Drawer,
  Typography, Flex,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SettingOutlined,
  UserOutlined,
  MenuOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { clearCredentials } from '@/features/auth/authSlice';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { buildAdminMenuItems } from './buildMenuItems';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;



// ─── Sidebar menu ─────────────────────────────────────────────────────────────

function AdminSidebarMenu({ onSelect }: { onSelect?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);


  const roles = user?.roles ?? [];
  const menuItems = buildAdminMenuItems(roles, t);

  // Tự động mở sub-menu nếu pathname đang thuộc group
  const userSubPaths = ['/admin/users', '/admin/verifications', '/admin/seller-profiles'];
  const defaultOpenKeys = userSubPaths.includes(location.pathname) ? ['group-users'] : [];

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      defaultOpenKeys={defaultOpenKeys}
      items={menuItems}
      onClick={({ key }) => {
        navigate(key);
        onSelect?.();
      }}
      style={{ border: 'none' }}
    />
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function AdminHeader({ onMobileMenu }: { onMobileMenu: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { isDesktop } = useBreakpoint();
  const handleLogout = () => {
    dispatch(clearCredentials());
    navigate('/login');
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'back',
      icon: <ArrowLeftOutlined />,
      label: t('nav.dashboard'),
      onClick: () => navigate('/dashboard'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        padding: '0 20px',
        background: 'var(--ant-color-bg-container)',
        borderBottom: '1px solid var(--ant-color-border-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 56,
        lineHeight: '56px',
      }}
    >
      {/* Left: hamburger (mobile only) */}
      <Flex align="center" gap={10}>
        {!isDesktop && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMobileMenu}
            size="small"
          />
        )}
      </Flex>

      {/* Right: email + avatar dropdown */}
      <Flex align="center" gap={10}>
        {isDesktop && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
        )}
        <Dropdown
          menu={{ items: dropdownItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Avatar
            size={32}
            icon={<UserOutlined />}
            style={{ cursor: 'pointer', background: 'var(--ant-color-primary)' }}
          />
        </Dropdown>
      </Flex>
    </Header>
  );
}

// ─── AdminLayout export ───────────────────────────────────────────────────────

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isDesktop } = useBreakpoint();

  return (
    <Layout style={{ minHeight: '100vh' }}>

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      {isDesktop && (
        <Sider
          width={240}
          style={{
            background: 'var(--ant-color-bg-container)',
            borderRight: '1px solid var(--ant-color-border-secondary)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Brand */}
          <Flex
            align="center"
            gap={8}
            style={{
              padding: '0 20px',
              height: 56,
              borderBottom: '1px solid var(--ant-color-border-secondary)',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'var(--ant-color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SettingOutlined style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <Text strong style={{ fontSize: 15 }}>Admin Panel</Text>
          </Flex>

          {/* Menu — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 16 }}>
            <AdminSidebarMenu />
          </div>
        </Sider>
      )}

      {/* ── Mobile drawer ───────────────────────────────────── */}
      <Drawer
        title={
          <Flex align="center" gap={8}>
            <div style={{
              width: 24, height: 24, borderRadius: 5,
              background: 'var(--ant-color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SettingOutlined style={{ color: '#fff', fontSize: 12 }} />
            </div>
            <Text strong>Admin Panel</Text>
          </Flex>
        }
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0, paddingTop: 8 } }}
      >
        <AdminSidebarMenu onSelect={() => setDrawerOpen(false)} />
      </Drawer>

      {/* ── Main content area ───────────────────────────────── */}
      <Layout>
        <AdminHeader onMobileMenu={() => setDrawerOpen(true)} />
        <Content
          style={{
            background: 'var(--ant-color-bg-layout)',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

    </Layout>
  );
}