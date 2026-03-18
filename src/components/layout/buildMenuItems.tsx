/**
 * buildMenuItems — creates the role-based navigation menu items.
 *
 * Shared between:
 * - Sidebar.tsx (desktop: Sider menu)
 * - AppLayout.tsx (mobile: Drawer menu)
 *
 * Logic phân tách rõ ràng:
 * - Admin / super_admin  → buildAdminMenuItems()  dùng trong AdminLayout
 * - Các role còn lại     → buildMenuItems()       dùng trong AppLayout / Sidebar
 *
 * Khi login bằng tài khoản admin, router sẽ render AdminLayout thay vì
 * AppLayout, nên sidebar tự động hiển thị đúng menu admin.
 */
import {
  DashboardOutlined,
  WalletOutlined,
  ShoppingOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined,
  FileSearchOutlined,
  SafetyOutlined,
  CustomerServiceOutlined,
  FundOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  BellOutlined,
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
  FlagOutlined,
  AlertOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import type { UserRole } from '@/types';
import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

// ─────────────────────────────────────────────────────────────────────────────
// Admin menu — dùng trong AdminLayout.tsx
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Menu đầy đủ cho sidebar của AdminLayout.
 * Không dùng trong AppLayout hay Sidebar thông thường.
 */
export function buildAdminMenuItems(
  roles: UserRole[],
  t: (key: string) => string
): MenuItem[] {
  const isSuperAdmin = roles.includes('super_admin');

  const items: MenuItem[] = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: t('admin.dashboard.title'),
    },
    { type: 'divider' },

    // ── Người dùng (sub-menu) ──────────────────────────────────
    {
      key: 'group-users',
      icon: <UserOutlined />,
      label: t('admin.users.title'),
      children: [
        { key: '/admin/users',           label: t('admin.users.title') },
        { key: '/admin/verifications',   label: t('admin.verifications.title') },
        { key: '/admin/seller-profiles', label: t('admin.sellerProfiles.title') },
      ],
    },
    {
      key: '/admin/roles',
      icon: <SafetyOutlined />,
      label: t('admin.roles.title'),
    },

    { type: 'divider' },

    // ── Nội dung & giao dịch ──────────────────────────────────
    {
      key: '/admin/items',
      icon: <AppstoreOutlined />,
      label: t('admin.items.title'),
    },
    {
      key: '/admin/payments',
      icon: <DollarOutlined />,
      label: t('admin.payments.title'),
    },
    {
      key: '/admin/reports',
      icon: <FlagOutlined />,
      label: t('admin.reports.title'),
    },

    { type: 'divider' },

    // ── Hệ thống ──────────────────────────────────────────────
    {
      key: '/admin/monitoring',
      icon: <AlertOutlined />,
      label: t('admin.monitoring.title'),
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: t('admin.settings.title'),
    },
  ];

  // Super admin: thêm staff management, emergency, audit logs
  if (isSuperAdmin) {
    items.push({ type: 'divider' });
    items.push({
      key: '/admin/staff',
      icon: <TeamOutlined />,
      label: t('staff.superAdmin'),
    });
    items.push({
      key: '/admin/emergency',
      icon: <ThunderboltOutlined />,
      label: 'Emergency',
    });
    items.push({
      key: '/admin/logs',
      icon: <AuditOutlined />,
      label: 'Audit Logs',
    });
  }

  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// User / Seller / Staff menu — dùng trong AppLayout + Sidebar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Menu cho người dùng thông thường.
 * Admin/super_admin sẽ không vào đây vì router đã redirect sang AdminLayout.
 * Nếu vì lý do nào đó admin render qua AppLayout, hiển thị shortcut đơn giản.
 */
export function buildMenuItems(
  roles: UserRole[],
  t: (key: string) => string
): MenuItem[] {
  const isAdmin = roles.includes('admin') || roles.includes('super_admin');

  // Guard: admin không nên dùng AppLayout, nhưng nếu có thì hiện shortcut
  if (isAdmin) {
    return [
      {
        key: '/admin',
        icon: <SettingOutlined />,
        label: t('staff.admin'),
      },
      { type: 'divider' },
      { key: '/notifications', icon: <BellOutlined />, label: t('nav.notifications') },
      { key: '/profile',       icon: <UserOutlined />, label: t('nav.profile') },
    ];
  }

  // ── Non-admin: build menu theo role ───────────────────────────
  const items: MenuItem[] = [];

  // Tất cả logged-in user
  items.push({ key: '/dashboard',    icon: <DashboardOutlined />, label: t('nav.dashboard') });
  items.push({ key: '/wallet',       icon: <WalletOutlined />,    label: t('nav.wallet') });
  items.push({ key: '/my-bids',      icon: <ShoppingOutlined />,  label: t('nav.myBids') });
  items.push({ key: '/orders',       icon: <ShopOutlined />,      label: t('nav.orders') });

  // Seller
  if (roles.includes('seller')) {
    items.push({ type: 'divider' });
    items.push({ key: '/my-listings', icon: <AppstoreAddOutlined />, label: t('nav.myListings') });
    items.push({ key: '/create-item', icon: <AppstoreAddOutlined />, label: t('nav.createItem') });
  }

  // Staff
  const staffItems: MenuItem[] = [];
  if (roles.includes('moderator'))    staffItems.push({ key: '/moderator', icon: <FileSearchOutlined />,    label: t('staff.moderator') });
  if (roles.includes('risk_manager')) staffItems.push({ key: '/risk',       icon: <SafetyOutlined />,       label: t('staff.riskManager') });
  if (roles.includes('support'))      staffItems.push({ key: '/support',    icon: <CustomerServiceOutlined />, label: t('staff.support') });
  if (roles.includes('marketing'))    staffItems.push({ key: '/marketing',  icon: <FundOutlined />,         label: t('staff.marketing') });

  if (staffItems.length > 0) {
    items.push({ type: 'divider' });
    items.push(...staffItems);
  }

  // Bottom items
  items.push({ type: 'divider' });
  items.push({ key: '/notifications', icon: <BellOutlined />, label: t('nav.notifications') });
  items.push({ key: '/profile',       icon: <UserOutlined />, label: t('nav.profile') });

  return items;
}