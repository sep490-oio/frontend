/**
 * Route Configuration — all application routes defined in one place.
 *
 * Routes phân theo access level:
 * 1. Public routes        — không cần login       (PublicLayout)
 * 2. Authenticated routes — cần login             (AppLayout + ProtectedRoute)
 * 3. Staff routes         — cần role cụ thể       (AppLayout + ProtectedRoute)
 * 4. Admin routes         — cần admin/super_admin  (AdminLayout — UI riêng biệt)
 *
 * Khi user login với role admin/super_admin và truy cập /admin/*,
 * router render AdminLayout thay vì AppLayout → sidebar hiển thị
 * đúng menu admin từ buildAdminMenuItems().
 */
import { Routes, Route } from 'react-router-dom';
import { Result } from 'antd';
import { PublicLayout }  from '@/components/layout/PublicLayout';
import { AppLayout }     from '@/components/layout/AppLayout';
import { AdminLayout }   from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

// ─── Page Components ──────────────────────────────────────────────────────────
import { HomePage }          from '@/pages/public/HomePage';
import { LoginPage }         from '@/pages/public/LoginPage';
import { RegisterPage }      from '@/pages/public/RegisterPage';
import { DashboardPage }     from '@/pages/dashboard/DashboardPage';
import { WalletPage }        from '@/pages/wallet/WalletPage';
import { BrowsePage }        from '@/pages/public/BrowsePage';
import { AuctionDetailPage } from '@/pages/public/AuctionDetailPage';
import { NotFoundPage }      from '@/pages/public/NotFoundPage';
import { MyBidsPage }        from '@/pages/mybids/MyBidsPage';
import { SellerProfilePage } from '@/pages/seller/SellerProfilePage';
import { OrdersPage }        from '@/pages/orders/OrdersPage';
import { OrderDetailPage }   from '@/pages/orders/OrderDetailPage';
import { ConfirmEmailPage }  from '@/pages/public/ConfirmEmailPage';
import { ProfilePage }       from '@/pages/profile/ProfilePage';
import { CreateItemPage }    from '@/pages/seller/CreateItemPage';
import { CreateAuctionPage } from '@/pages/seller/CreateAuctionPage';
import { MyListingsPage }    from '@/pages/seller/MyListingsPage';

import AdminDashboardPage      from '@/pages/admin/AdminDashboardPage';
import AdminUsersPage          from '@/pages/admin/AdminUsersPage';
import AdminUserDetailPage     from '@/pages/admin/AdminUserDetailPage';
import AdminRolesPage          from '@/pages/admin/AdminRolesPage';
import AdminSettingsPage       from '@/pages/admin/AdminSettingsPage';
import AdminItemsPage          from '@/pages/admin/AdminItemsPage';
import AdminPaymentsPage       from '@/pages/admin/AdminPaymentsPage';
import AdminVerificationsPage  from '@/pages/admin/AdminVerificationsPage';
import AdminReportsPage        from '@/pages/admin/AdminReportsPage';
import AdminMonitoringPage     from '@/pages/admin/AdminMonitoringPage';
import AdminSellerProfilesPage from '@/pages/admin/AdminSellerProfilesPage';
import AdminAuctionsPage from '@/pages/admin/AdminAuctionsPage';
import AdminDisputesPage from '@/pages/admin/AdminDisputesPage';
import AdminTermsPage from '@/pages/admin/AdminTermsPage';
function ComingSoon({ title }: { title: string }) {
  return <Result title={title} subTitle="This page is under construction." />;
}

export function AppRoutes() {
  return (
    <Routes>

      {/* ─── Public ─────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/"              element={<HomePage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/register"      element={<RegisterPage />} />
        <Route path="/browse"        element={<BrowsePage />} />
        <Route path="/auction/:id"   element={<AuctionDetailPage />} />
        <Route path="/seller/:id"    element={<SellerProfilePage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      </Route>

      {/* ─── Authenticated (bidder / seller) ────────────────── */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"                 element={<DashboardPage />} />
        <Route path="/wallet"                    element={<WalletPage />} />
        <Route path="/my-bids"                   element={<MyBidsPage />} />
        <Route path="/orders"                    element={<OrdersPage />} />
        <Route path="/orders/:id"                element={<OrderDetailPage />} />
        <Route path="/notifications"             element={<ComingSoon title="Notifications" />} />
        <Route path="/profile"                   element={<ProfilePage />} />
        <Route path="/settings"                  element={<ComingSoon title="Settings" />} />
        <Route path="/my-listings"               element={<MyListingsPage />} />
        <Route path="/create-item"               element={<CreateItemPage />} />
        <Route path="/create-auction"            element={<CreateAuctionPage />} />
        <Route path="/create-auction/:itemId"    element={<CreateAuctionPage />} />
      </Route>

      {/* ─── Staff ──────────────────────────────────────────── */}
      <Route element={<ProtectedRoute requiredRoles={['moderator']}><AppLayout /></ProtectedRoute>}>
        <Route path="/moderator" element={<ComingSoon title="Moderator Portal" />} />
      </Route>

      <Route element={<ProtectedRoute requiredRoles={['risk_manager']}><AppLayout /></ProtectedRoute>}>
        <Route path="/risk" element={<ComingSoon title="Risk Manager Portal" />} />
      </Route>

      <Route element={<ProtectedRoute requiredRoles={['support']}><AppLayout /></ProtectedRoute>}>
        <Route path="/support" element={<ComingSoon title="Support Portal" />} />
      </Route>

      <Route element={<ProtectedRoute requiredRoles={['marketing']}><AppLayout /></ProtectedRoute>}>
        <Route path="/marketing" element={<ComingSoon title="Marketing Portal" />} />
      </Route>

      {/* ─── Admin — AdminLayout riêng, sidebar admin đầy đủ ── */}
      <Route
        element={
          <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
            <AdminLayout />          
          </ProtectedRoute>
        }
      >
        <Route path="/admin"                  element={<AdminDashboardPage />} />
        <Route path="/admin/users"            element={<AdminUsersPage />} />
        <Route path="/admin/users/:userId"    element={<AdminUserDetailPage />} />
        <Route path="/admin/roles"            element={<AdminRolesPage />} />
        <Route path="/admin/settings"         element={<AdminSettingsPage />} />
        <Route path="/admin/items"            element={<AdminItemsPage />} />
        <Route path="/admin/payments"         element={<AdminPaymentsPage />} />
        <Route path="/admin/verifications"    element={<AdminVerificationsPage />} />
        <Route path="/admin/reports"          element={<AdminReportsPage />} />
        <Route path="/admin/monitoring"       element={<AdminMonitoringPage />} />
        <Route path="/admin/seller-profiles"  element={<AdminSellerProfilesPage />} />\
        <Route path="/admin/auctions"         element={<AdminAuctionsPage />} />
        <Route path="/admin/disputes"         element={<AdminDisputesPage />} />
        <Route path="/admin/terms"           element={<AdminTermsPage />} />
        <Route path="/admin/config"           element={<ComingSoon title="Platform Configuration" />} />
        <Route path="/admin/logs"             element={<ComingSoon title="Audit Logs" />} />
        <Route path="/admin/staff"            element={<ComingSoon title="Staff Management" />} />
        <Route path="/admin/emergency"        element={<ComingSoon title="Emergency Controls" />} />
      </Route>

      {/* ─── 404 ────────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

    </Routes>
  );
}