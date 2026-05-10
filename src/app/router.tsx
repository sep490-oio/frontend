import { createBrowserRouter, useRouteError, Link, Navigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthGuard } from '@/components/guards/AuthGuard'
import { GuestGuard } from '@/components/guards/GuestGuard'
import { SellerGuard } from '@/components/guards/SellerGuard'
import { RoleGuard } from '@/components/guards/RoleGuard'
import { InspectorGuard } from '@/components/guards/InspectorGuard'
import { SERIF_FONT } from '@/styles/tokens'
import { InspectorLayout } from '@/components/layout/InspectorLayout'
import { SellerLayout } from '@/components/layout/SellerLayout'
import { WarehouseStaffGuard } from '@/components/guards/WarehouseStaffGuard'
import { WarehouseStaffLayout } from '@/components/layout/WarehouseStaffLayout'

// Lazy imports for pages
import { lazy, Suspense } from 'react'
import { Spin, Flex, Button } from 'antd'

const PageLoader = () => (
  <Flex align="center" justify="center" style={{ minHeight: 400 }}>
    <Spin size="large" />
  </Flex>
)

// Global error boundary for route errors (dynamic import failures, etc.)
function RouteErrorBoundary() {
  const error = useRouteError()
  const { t } = useTranslation('common')
  const isDynamicImportError = error instanceof TypeError && String(error.message).includes('dynamically imported module')

  const title = isDynamicImportError
    ? t('pageUpdated', 'Page Updated')
    : t('somethingWentWrong', 'Something went wrong')
  const desc = isDynamicImportError
    ? t('pageUpdatedDesc', 'A new version has been deployed. Please reload the page.')
    : t('unexpectedErrorDesc', 'An unexpected error occurred. Please try again.')

  return (
    <Flex vertical align="center" justify="center" style={{ minHeight: '60vh', padding: 32, textAlign: 'center' }}>
      <h2
        style={{
          fontFamily: SERIF_FONT,
          fontWeight: 400,
          fontSize: 28,
          color: 'var(--color-text-primary)',
          marginBottom: 8,
        }}
      >
        <span>{title}</span>
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
        <span>{desc}</span>
      </p>
      <Flex gap={12}>
        <Button
          type="primary"
          onClick={() => {
            // Hard reload by navigating to the current path with a cache-busting timestamp
            const url = new URL(window.location.href)
            url.searchParams.set('t', Date.now().toString())
            window.location.href = url.toString()
          }}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          <span>{t('reloadPage', 'Reload page')}</span>
        </Button>
        <Link to="/">
          <Button><span>{t('goToHome', 'Go to home')}</span></Button>
        </Link>
      </Flex>
    </Flex>
  )
}

/**
 * Wraps a module-scope React.lazy component in the per-route Suspense boundary.
 * See .omc/specs/deep-dive-confirm-email-stuck-loading.md for the bug that motivated this pattern.
 * DO NOT call React.lazy() inside a render function — that was the original bug.
 */
function withSuspense(Component: React.LazyExoticComponent<React.ComponentType<any>>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const TwoFactorPage = lazy(() => import('@/features/auth/pages/TwoFactorPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'))
const ConfirmEmailPage = lazy(() => import('@/features/auth/pages/ConfirmEmailPage'))

// Public pages
const AuctionListPage = lazy(() => import('@/features/auction/pages/AuctionListPage'))
const AuctionDetailPage = lazy(() => import('@/features/auction/pages/AuctionDetailPage'))
const ItemDetailPage = lazy(() => import('@/features/item/pages/ItemDetailPage'))
const PublicSellerPage = lazy(() => import('@/features/seller/pages/PublicSellerPage'))
const AboutPage = lazy(() => import('@/features/public/pages/AboutPage'))
const CategoriesPage = lazy(() => import('@/features/public/pages/CategoriesPage'))
const HelpPage = lazy(() => import('@/features/public/pages/HelpPage'))
const BrowseAuctionsPage = lazy(() => import('@/features/auction/pages/BrowseAuctionsPage'))
const BrowseSellersPage = lazy(() => import('@/features/seller/pages/BrowseSellersPage'))
const BrowseItemsPage = lazy(() => import('@/features/item/pages/BrowseItemsPage'))

// User pages (auth required)
const ProfilePage = lazy(() => import('@/features/user/pages/ProfilePage'))
const AddressesPage = lazy(() => import('@/features/user/pages/AddressesPage'))
const SecurityPage = lazy(() => import('@/features/user/pages/SecurityPage'))
const NotificationPrefsPage = lazy(() => import('@/features/user/pages/NotificationPrefsPage'))
const SettingsPage = lazy(() => import('@/features/user/pages/SettingsPage'))
const TermsPage = lazy(() => import('@/features/user/pages/TermsPage'))

// Item pages
const MyItemsPage = lazy(() => import('@/features/item/pages/MyItemsPage'))
const CreateItemPage = lazy(() => import('@/features/item/pages/CreateItemPage'))
const EditItemPage = lazy(() => import('@/features/item/pages/EditItemPage'))

// Auction pages
const CreateAuctionPage = lazy(() => import('@/features/auction/pages/CreateAuctionPage'))
const MyAuctionsPage = lazy(() => import('@/features/auction/pages/MyAuctionsPage'))
const WatchlistPage = lazy(() => import('@/features/auction/pages/WatchlistPage'))
const MyBidsPage = lazy(() => import('@/features/auction/pages/MyBidsPage'))

// Order pages
const MyOrdersPage = lazy(() => import('@/features/order/pages/MyOrdersPage'))
const SellerOrdersPage = lazy(() => import('@/features/order/pages/SellerOrdersPage'))
const SellerOutboundShipmentDetailPage = lazy(() => import('@/features/order/pages/SellerOutboundShipmentDetailPage'))
const SellerOutboundShipmentsListPage = lazy(() => import('@/features/order/pages/SellerOutboundShipmentsListPage'))
const SellerDirectShipmentDetailPage = lazy(() => import('@/features/order/pages/SellerDirectShipmentDetailPage'))
const SellerDirectShipmentsListPage = lazy(() => import('@/features/order/pages/SellerDirectShipmentsListPage'))
const OrderDetailPage = lazy(() => import('@/features/order/pages/OrderDetailPage'))
const MyDirectShipmentDetailPage = lazy(() => import('@/features/order/pages/MyDirectShipmentDetailPage'))
const MyDirectShipmentsListPage = lazy(() => import('@/features/order/pages/MyDirectShipmentsListPage'))
const BuyerShipmentScanPage = lazy(() => import('@/features/order/pages/BuyerShipmentScanPage'))
const BuyerShipmentReceivePage = lazy(() => import('@/features/order/pages/BuyerShipmentReceivePage'))
const BuyerOutboundReceivePage = lazy(() => import('@/features/order/pages/BuyerOutboundReceivePage'))
const BuyerOutboundShipmentPage = lazy(() => import('@/features/order/pages/BuyerOutboundShipmentPage'))
const OrderReturnPage = lazy(() => import('@/features/order/pages/OrderReturnPage'))

// Payment pages
const BuyerWalletPage = lazy(() => import('@/features/payment/pages/BuyerWalletPage'))
const SellerWalletPage = lazy(() => import('@/features/payment/pages/SellerWalletPage'))
const PaymentMethodsPage = lazy(() => import('@/features/payment/pages/PaymentMethodsPage'))
const CheckoutPage = lazy(() => import('@/features/payment/pages/CheckoutPage'))
const VnPayReturnPage = lazy(() => import('@/features/payment/pages/VnPayReturnPage'))
const WithdrawPage = lazy(() => import('@/features/payment/pages/WithdrawPage'))

// Notification page
const NotificationsPage = lazy(() => import('@/features/notification/pages/NotificationsPage'))

// Dispute pages
const MyDisputesPage = lazy(() => import('@/features/dispute/pages/MyDisputesPage'))
const BuyerDisputeThreadPage = lazy(() => import('@/features/dispute/pages/BuyerDisputeThreadPage'))

// Seller pages
const UserDashboardPage = lazy(() => import('@/features/user/pages/DashboardPage'))
const SellerDashboardPage = lazy(() => import('@/features/seller/pages/SellerDashboardPage'))
const CreateSellerProfilePage = lazy(() => import('@/features/seller/pages/CreateSellerProfilePage'))
const SellerProfilePage = lazy(() => import('@/features/seller/pages/SellerProfilePage'))
const VerificationPage = lazy(() => import('@/features/seller/pages/VerificationPage'))
const SellerReturnsPage = lazy(() => import('@/features/seller/pages/SellerReturnsPage'))
const SellerAuctionDashboardPage = lazy(() => import('@/features/seller/pages/SellerAuctionDashboardPage'))
const SellerAuctionOverviewPage = lazy(() => import('@/features/seller/pages/SellerAuctionOverviewPage'))

// Warehouse pages
const InboundShipmentsPage = lazy(() => import('@/features/warehouse/pages/InboundShipmentsPage'))
const BookInboundPage = lazy(() => import('@/features/warehouse/pages/BookInboundPage'))
const InboundDetailPage = lazy(() => import('@/features/warehouse/pages/InboundDetailPage'))
const SellerInboundPackageDetailPage = lazy(() => import('@/features/warehouse/pages/SellerInboundPackageDetailPage'))

const WarehouseItemsPage = lazy(() => import('@/features/warehouse/pages/WarehouseItemsPage'))
const SellerWarehouseItemDetailPage = lazy(() => import('@/features/warehouse/pages/SellerWarehouseItemDetailPage'))

// Admin pages
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'))
const AdminUserDetailPage = lazy(() => import('@/features/admin/pages/AdminUserDetailPage'))
const AdminVerificationsPage = lazy(() => import('@/features/admin/pages/AdminVerificationsPage'))
const AdminVerificationDetailPage = lazy(() => import('@/features/admin/pages/AdminVerificationDetailPage'))
const AdminSellerProfilesPage = lazy(() => import('@/features/admin/pages/AdminSellerProfilesPage'))
const AdminReviewQueuePage = lazy(() => import('@/features/admin/pages/AdminReviewQueuePage'))
const AdminItemDetailPage = lazy(() => import('@/features/admin/pages/AdminItemDetailPage'))
const AdminAuctionsPage = lazy(() => import('@/features/admin/pages/AdminAuctionsPage'))
const AdminAuctionControlPage = lazy(() => import('@/features/admin/pages/AdminAuctionControlPage'))
const AdminMonitoringPage = lazy(() => import('@/features/admin/pages/AdminMonitoringPage'))
const AdminModerationPage = lazy(() => import('@/features/admin/pages/AdminModerationPage'))
const AdminPaymentsPage = lazy(() => import('@/features/admin/pages/AdminPaymentsPage'))
const AdminTermsPage = lazy(() => import('@/features/admin/pages/AdminTermsPage'))
const AdminRolesPage = lazy(() => import('@/features/admin/pages/AdminRolesPage'))
const AdminCompletedAuctionsPage = lazy(() => import('@/features/admin/pages/AdminCompletedAuctionsPage'))
const AdminCompletedAuctionDetailPage = lazy(() => import('@/features/admin/pages/AdminCompletedAuctionDetailPage'))
const AdminDisputeListPage = lazy(() => import('@/features/admin/pages/AdminDisputeListPage'))
const AdminDisputeDetailPage = lazy(() => import('@/features/admin/pages/AdminDisputeDetailPage'))
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('@/features/admin/pages/AdminOrderDetailPage'))

// Inspector pages
const InspectorDashboardPage = lazy(() => import('@/features/inspector/pages/InspectorDashboardPage'))
const InspectionQueuePage = lazy(() => import('@/features/inspector/pages/InspectionQueuePage'))
const InspectionDetailPage = lazy(() => import('@/features/inspector/pages/InspectionDetailPage'))
const InspectionReviewPage = lazy(() => import('@/features/inspector/pages/InspectionReviewPage'))

// Warehouse Staff pages
const WarehouseStaffDashboardPage = lazy(() => import('@/features/warehouse-staff/pages/WarehouseStaffDashboardPage'))
const ReceivingPage = lazy(() => import('@/features/warehouse-staff/pages/ReceivingPage'))
const ScanPage = lazy(() => import('@/features/warehouse-staff/pages/ScanPage'))
const StaffShipmentDetailPage = lazy(() => import('@/features/warehouse-staff/pages/StaffShipmentDetailPage'))
const ReceivePackagePage = lazy(() => import('@/features/warehouse-staff/pages/ReceivePackagePage'))
const StaffLocationsPage = lazy(() => import('@/features/warehouse-staff/pages/StaffLocationsPage'))
const StoredItemsPage = lazy(() => import('@/features/warehouse-staff/pages/StoredItemsPage'))
const WarehouseItemDetailPage = lazy(() => import('@/features/warehouse-staff/pages/WarehouseItemDetailPage'))
const OutboundQueuePage = lazy(() => import('@/features/warehouse-staff/pages/OutboundQueuePage'))
const OutboundDetailPage = lazy(() => import('@/features/warehouse-staff/pages/OutboundDetailPage'))
const OutboundShipmentDetailPage = lazy(() => import('@/features/warehouse-staff/pages/OutboundShipmentDetailPage'))
const PendingReturnsPage = lazy(() => import('@/features/warehouse-staff/pages/PendingReturnsPage'))

export const router = createBrowserRouter([
  // Auth routes (guest only)
  {
    errorElement: <RouteErrorBoundary />,
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: withSuspense(LoginPage) },
          { path: '/register', element: withSuspense(RegisterPage) },
          { path: '/2fa', element: withSuspense(TwoFactorPage) },
          { path: '/forgot-password', element: withSuspense(ForgotPasswordPage) },
          { path: '/reset-password', element: withSuspense(ResetPasswordPage) },
        ],
      },
    ],
  },
  // Confirm email (accessible to all)
  {
    element: <AuthLayout />,
    children: [
      { path: '/confirm-email', element: withSuspense(ConfirmEmailPage) },
    ],
  },
  // VnPay return (no layout needed)
  { path: '/payments/vnpay/return', element: withSuspense(VnPayReturnPage), errorElement: <RouteErrorBoundary /> },
  // Main app routes
  {
    errorElement: <RouteErrorBoundary />,
    element: <AppLayout />,
    children: [
      // Public routes
      { index: true, element: withSuspense(AuctionListPage) },
      { path: '/terms', element: <Navigate to="/me/terms" replace /> },
      { path: '/auctions', element: withSuspense(BrowseAuctionsPage) },
      { path: '/auctions/:id', element: withSuspense(AuctionDetailPage) },
      { path: '/items', element: withSuspense(BrowseItemsPage) },
      { path: '/items/:id', element: withSuspense(ItemDetailPage) },
      { path: '/sellers', element: withSuspense(BrowseSellersPage) },
      { path: '/sellers/:id', element: withSuspense(PublicSellerPage) },
      { path: '/about', element: withSuspense(AboutPage) },
      { path: '/categories', element: withSuspense(CategoriesPage) },
      { path: '/help', element: withSuspense(HelpPage) },
      // Auth-required routes
      {
        element: <AuthGuard />,
        children: [
          // User
          { path: '/me/dashboard', element: withSuspense(UserDashboardPage) },
          { path: '/me/profile', element: withSuspense(ProfilePage) },
          { path: '/me/addresses', element: withSuspense(AddressesPage) },
          { path: '/me/security', element: withSuspense(SecurityPage) },
          { path: '/me/settings', element: withSuspense(SettingsPage) },
          { path: '/me/notifications', element: withSuspense(NotificationsPage) },
          { path: '/me/notifications/settings', element: withSuspense(NotificationPrefsPage) },
          { path: '/me/terms', element: withSuspense(TermsPage) },
          { path: '/me/verification', element: withSuspense(VerificationPage) },
          // Items
          { path: '/me/items', element: withSuspense(MyItemsPage) },
          { path: '/me/items/create', element: withSuspense(CreateItemPage) },
          // Auctions
          { path: '/me/auctions', element: withSuspense(MyAuctionsPage) },
          { path: '/me/auctions/create', element: withSuspense(CreateAuctionPage) },
          { path: '/me/auctions/:id/edit', element: withSuspense(CreateAuctionPage) },
          { path: '/me/watchlist', element: withSuspense(WatchlistPage) },
          { path: '/me/bids', element: withSuspense(MyBidsPage) },
          // Orders
          { path: '/me/orders', element: withSuspense(MyOrdersPage) },
          { path: '/me/orders/:id', element: withSuspense(OrderDetailPage) },
          { path: '/me/orders/:id/return', element: withSuspense(OrderReturnPage) },
          { path: '/me/outbound-shipments/:shipmentId', element: withSuspense(BuyerOutboundShipmentPage) },
          { path: '/orders/:orderId/outbound-shipment/receive', element: withSuspense(BuyerOutboundReceivePage) },
          { path: '/me/shipments', element: withSuspense(MyDirectShipmentsListPage) },
          { path: '/me/shipments/scan', element: withSuspense(BuyerShipmentScanPage) },
          { path: '/me/shipments/:shipmentId/receive', element: withSuspense(BuyerShipmentReceivePage) },
          { path: '/me/shipments/:shipmentId', element: withSuspense(MyDirectShipmentDetailPage) },
          // Payment
          { path: '/me/wallet', element: withSuspense(BuyerWalletPage) },
          { path: '/me/wallet/withdraw', element: withSuspense(WithdrawPage) },
          { path: '/me/payment-methods', element: withSuspense(PaymentMethodsPage) },
          { path: '/checkout/:orderId', element: withSuspense(CheckoutPage) },
          // Disputes
          { path: '/me/disputes', element: withSuspense(MyDisputesPage) },
          { path: '/me/disputes/:id', element: withSuspense(BuyerDisputeThreadPage) },
          // Seller registration (outside SellerGuard to avoid redirect loop)
          { path: '/seller/register', element: withSuspense(CreateSellerProfilePage) },
        ],
      },
    ],
  },
  // Seller routes (unified under SellerLayout)
  {
    errorElement: <RouteErrorBoundary />,
    element: <SellerGuard />,
    children: [
      {
        element: <SellerLayout />,
        children: [
          { path: '/seller', element: withSuspense(SellerDashboardPage) },
          // Items
          { path: '/seller/items', element: withSuspense(MyItemsPage) },
          { path: '/seller/items/create', element: withSuspense(CreateItemPage) },
          { path: '/seller/items/:id/edit', element: withSuspense(EditItemPage) },
          // Auctions
          { path: '/seller/auctions', element: withSuspense(MyAuctionsPage) },
          { path: '/seller/auction-overview', element: withSuspense(SellerAuctionOverviewPage) },
          { path: '/seller/auctions/:id/dashboard', element: withSuspense(SellerAuctionDashboardPage) },
          { path: '/seller/auctions/create', element: withSuspense(CreateAuctionPage) },
          { path: '/seller/auctions/:id/edit', element: withSuspense(CreateAuctionPage) },
          // Business
          { path: '/seller/orders', element: withSuspense(SellerOrdersPage) },
          { path: '/seller/orders/:id', element: withSuspense(OrderDetailPage) },
          { path: '/seller/orders/:id/return', element: withSuspense(OrderReturnPage) },
          { path: '/seller/returns', element: withSuspense(SellerReturnsPage) },
          { path: '/seller/wallet', element: withSuspense(SellerWalletPage) },
          { path: '/seller/wallet/withdraw', element: withSuspense(WithdrawPage) },
          // Warehouse
          { path: '/seller/warehouse/inbound', element: withSuspense(InboundShipmentsPage) },
          { path: '/seller/warehouse/inbound/book', element: withSuspense(BookInboundPage) },
          { path: '/seller/warehouse/inbound/:id', element: withSuspense(InboundDetailPage) },
          { path: '/seller/warehouse/inbound/packages/:clientOrderCode', element: withSuspense(SellerInboundPackageDetailPage) },
          { path: '/seller/warehouse/outbound', element: withSuspense(SellerOutboundShipmentsListPage) },
          { path: '/seller/warehouse/outbound/:id', element: withSuspense(SellerOutboundShipmentDetailPage) },
          { path: '/seller/shipments', element: withSuspense(SellerDirectShipmentsListPage) },
          { path: '/seller/shipments/:shipmentId', element: withSuspense(SellerDirectShipmentDetailPage) },
          { path: '/seller/warehouse/items', element: withSuspense(WarehouseItemsPage) },
          { path: '/seller/warehouse/items/:warehouseItemId', element: withSuspense(SellerWarehouseItemDetailPage) },
          // Settings
          { path: '/seller/profile', element: withSuspense(SellerProfilePage) },
          { path: '/seller/verification', element: withSuspense(VerificationPage) },
        ],
      },
    ],
  },
  // Admin routes
  {
    errorElement: <RouteErrorBoundary />,
    element: <RoleGuard roles={['Admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: withSuspense(AdminDashboardPage) },
          { path: '/admin/users', element: withSuspense(AdminUsersPage) },
          { path: '/admin/users/:id', element: withSuspense(AdminUserDetailPage) },
          { path: '/admin/verifications', element: withSuspense(AdminVerificationsPage) },
          { path: '/admin/verifications/:id', element: withSuspense(AdminVerificationDetailPage) },
          { path: '/admin/sellers', element: withSuspense(AdminSellerProfilesPage) },
          { path: '/admin/items/review', element: withSuspense(AdminReviewQueuePage) },
          { path: '/admin/items/:id', element: withSuspense(AdminItemDetailPage) },
          { path: '/admin/auctions', element: withSuspense(AdminAuctionsPage) },
          { path: '/admin/auctions/completed', element: withSuspense(AdminCompletedAuctionsPage) },
          { path: '/admin/auctions/completed/:auctionId', element: withSuspense(AdminCompletedAuctionDetailPage) },
          { path: '/admin/auctions/:id', element: withSuspense(AdminAuctionControlPage) },
          { path: '/admin/moderation', element: withSuspense(AdminModerationPage) },
          { path: '/admin/reports', element: <Navigate to="/admin/moderation" replace /> },
          { path: '/admin/monitoring', element: withSuspense(AdminMonitoringPage) },
          { path: '/admin/disputes', element: withSuspense(AdminDisputeListPage) },
          { path: '/admin/disputes/:id', element: withSuspense(AdminDisputeDetailPage) },
          { path: '/admin/orders', element: withSuspense(AdminOrdersPage) },
          { path: '/admin/orders/:orderId', element: withSuspense(AdminOrderDetailPage) },
          { path: '/admin/payments', element: withSuspense(AdminPaymentsPage) },
          { path: '/admin/terms', element: withSuspense(AdminTermsPage) },
          { path: '/admin/roles', element: withSuspense(AdminRolesPage) },
        ],
      },
    ],
  },
  // Inspector routes
  {
    errorElement: <RouteErrorBoundary />,
    element: <InspectorGuard />,
    children: [
      {
        element: <InspectorLayout />,
        children: [
          { path: '/inspector', element: withSuspense(InspectorDashboardPage) },
          { path: '/inspector/queue', element: withSuspense(InspectionQueuePage) },
          { path: '/inspector/inspections/:shipmentId', element: withSuspense(InspectionDetailPage) },
          { path: '/inspector/reviews', element: withSuspense(InspectionReviewPage) },
        ],
      },
    ],
  },
  // Warehouse Staff routes
  {
    errorElement: <RouteErrorBoundary />,
    element: <WarehouseStaffGuard />,
    children: [{
      element: <WarehouseStaffLayout />,
      children: [
        { path: '/warehouse-staff', element: withSuspense(WarehouseStaffDashboardPage) },
        { path: '/warehouse-staff/receiving', element: withSuspense(ReceivingPage) },
        { path: '/warehouse-staff/receiving/packages/:clientOrderCode', element: withSuspense(ReceivePackagePage) },
        { path: '/warehouse-staff/scan', element: withSuspense(ScanPage) },
        { path: '/warehouse-staff/shipments/:id', element: withSuspense(StaffShipmentDetailPage) },
        { path: '/warehouse-staff/items', element: withSuspense(StoredItemsPage) },
        { path: '/warehouse-staff/items/:warehouseItemId', element: withSuspense(WarehouseItemDetailPage) },
        { path: '/warehouse-staff/locations', element: withSuspense(StaffLocationsPage) },
        { path: '/warehouse-staff/outbound', element: withSuspense(OutboundQueuePage) },
        { path: '/warehouse-staff/outbound/shipments/:shipmentId', element: withSuspense(OutboundShipmentDetailPage) },
        { path: '/warehouse-staff/outbound/:orderId', element: withSuspense(OutboundDetailPage) },
        { path: '/warehouse-staff/returns', element: withSuspense(PendingReturnsPage) },
      ],
    }],
  },
  // Catch-all: redirect unknown paths to homepage
  { path: '*', element: <Navigate to="/" replace /> },
])
