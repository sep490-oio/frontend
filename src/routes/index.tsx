/**
 * Route Configuration — all application routes defined in one place.
 *
 * Routes are organized by layout:
 * 1. Public routes — PublicLayout
 * 2. Dashboard routes — DashboardLayout
 * 3. Other routes — AppLayout
 *
 * Each route group uses a layout route (element with <Outlet />) to share
 * the same header/sidebar/footer across all pages in that group.
 *
 * Placeholder routes render a simple "Coming Soon" page until
 * the actual page component is built.
 */
import { Routes, Route } from 'react-router-dom';
import { Result } from 'antd';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WarehouseLayout } from '@/components/layout/WarehouseLayout';

// ─── Page Components ─────────────────────────────────────────────────
import { HomePage } from '@/pages/public/HomePage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { WalletPage } from '@/pages/wallet/WalletPage';
import { BrowsePage } from '@/pages/public/BrowsePage';
import { AuctionDetailPage } from '@/pages/public/AuctionDetailPage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { MyBidsPage } from '@/pages/mybids/MyBidsPage';
import { SellerProfilePage } from '@/pages/seller/SellerProfilePage';
import { OrdersPage } from '@/pages/orders/OrdersPage';
import { OrderDetailPage } from '@/pages/orders/OrderDetailPage';
import { ShippingPage } from '@/pages/orders/ShippingPage';
import { DisputesPage } from '@/pages/disputes/DisputesPage';
import { DisputeDetailPage } from '@/pages/disputes/DisputeDetailPage';
import { ConfirmEmailPage } from '@/pages/public/ConfirmEmailPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { CreateItemPage } from '@/pages/seller/CreateItemPage';
import { SellerDashboardPage } from '@/pages/seller/SellerDashboardPage';
import { SellerActiveAuctionsPage } from '@/pages/seller/SellerActiveAuctionsPage';
import { SellerItemsPage } from '@/pages/seller/SellerItemsPage';
import { CreateAuctionPage } from '@/pages/seller/CreateAuctionPage';
import { SellerShippingPage } from '@/pages/seller/SellerShippingPage';
import SellerShippingInfoPage from '@/pages/seller/SellerShippingInfoPage';
import OrderPackagingPage from '@/pages/seller/OrderPackagingPage';
import InspectorOverviewPage from '@/pages/inspector/InspectorOverviewPage';
import InspectorHistoryPage from '@/pages/inspector/InspectorHistoryPage';
import InspectorItemDetailPage from '@/pages/inspector/InspectorItemDetailPage';
import WarehouseLogisticsPage from '@/pages/warehouse/WarehouseLogisticsPage';
import WarehouseScannerPage from '@/pages/warehouse/WarehouseScannerPage';
import NewShipmentPage from '@/pages/warehouse/NewShipmentPage';
import CreateShipmentPage from '@/pages/warehouse/CreateShipmentPage';
import WarehouseInventoryPage from '@/pages/warehouse/WarehouseInventoryPage';

/** Temporary placeholder for pages not yet built */
function ComingSoon({ title }: { title: string }) {
  return <Result title={title} subTitle="This page is under construction." />;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* ─── Public Routes (no login required) ──────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/auction/:id" element={<AuctionDetailPage />} />
        <Route path="/seller/:id" element={<SellerProfilePage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      </Route>

      {/* ─── Dashboard Routes (with custom layout) ──────────────── */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/seller-dashboard" element={<SellerDashboardPage />} />
        <Route path="/seller-dashboard/active-auctions" element={<SellerActiveAuctionsPage />} />
        <Route path="/seller-dashboard/items" element={<SellerItemsPage />} />
        <Route path="/seller-dashboard/create-auction" element={<CreateAuctionPage />} />
        <Route path="/seller-dashboard/shipping" element={<SellerShippingPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/my-bids" element={<MyBidsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/shipping" element={<ShippingPage />} />
        <Route path="/disputes" element={<DisputesPage />} />
        <Route path="/disputes/:id" element={<DisputeDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* ─── Warehouse Routes (separate layout) ──────────────── */}
      <Route element={<WarehouseLayout />}>
        <Route path="/warehouse-logistics" element={<WarehouseLogisticsPage />} />
        <Route path="/warehouse-logistics/new-shipment" element={<NewShipmentPage />} />
        <Route path="/warehouse-scanner" element={<WarehouseScannerPage />} />
        <Route path="/warehouse-intake" element={<CreateShipmentPage />} />
        <Route path="/warehouse-inventory" element={<WarehouseInventoryPage />} />
      </Route>

      {/* ─── Standalone Pages (no sidebar) ──────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/seller-dashboard/shipping/info/:orderId" element={<SellerShippingInfoPage />} />
        <Route path="/seller-dashboard/order/packaging/:orderId" element={<OrderPackagingPage />} />
      </Route>

      {/* ─── Inspector Page (no layout wrapper) ──────────────── */}
      <Route path="/inspector" element={<InspectorOverviewPage />} />
      <Route path="/inspector/history" element={<InspectorHistoryPage />} />
      <Route path="/inspector/item/:itemId" element={<InspectorItemDetailPage />} />

      {/* ─── Other Routes (standard layout) ──────────────── */}
      <Route element={<AppLayout />}>
        <Route path="/notifications" element={<ComingSoon title="Notifications" />} />
        <Route path="/settings" element={<ComingSoon title="Settings" />} />
        <Route path="/my-listings" element={<ComingSoon title="My Listings" />} />
        <Route path="/create-item" element={<CreateItemPage />} />
        <Route path="/moderator" element={<ComingSoon title="Moderator Portal" />} />
        <Route path="/risk" element={<ComingSoon title="Risk Manager Portal" />} />
        <Route path="/support" element={<ComingSoon title="Support Portal" />} />
        <Route path="/marketing" element={<ComingSoon title="Marketing Portal" />} />
        <Route path="/admin" element={<ComingSoon title="Admin Dashboard" />} />
        <Route path="/admin/users" element={<ComingSoon title="User Management" />} />
        <Route path="/admin/config" element={<ComingSoon title="Platform Configuration" />} />
        <Route path="/admin/logs" element={<ComingSoon title="Audit Logs" />} />
        <Route path="/admin/staff" element={<ComingSoon title="Staff Management" />} />
        <Route path="/admin/emergency" element={<ComingSoon title="Emergency Controls" />} />
      </Route>

      {/* ─── Catch-all: 404 ─────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
