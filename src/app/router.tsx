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
        {title}
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
        {desc}
      </p>
      <Flex gap={12}>
        <Button
          type="primary"
          onClick={() => window.location.reload()}
          style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
        >
          {t('reloadPage', 'Reload page')}
        </Button>
        <Link to="/">
          <Button>{t('goToHome', 'Go to home')}</Button>
        </Link>
      </Flex>
    </Flex>
  )
}

function lazyPage(factory: () => Promise<{ default: React.ComponentType }>) {
  const Component = lazy(factory)
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  )
}

// Auth pages
const LoginPage = () => lazyPage(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = () => lazyPage(() => import('@/features/auth/pages/RegisterPage'))
const TwoFactorPage = () => lazyPage(() => import('@/features/auth/pages/TwoFactorPage'))
const ForgotPasswordPage = () => lazyPage(() => import('@/features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = () => lazyPage(() => import('@/features/auth/pages/ResetPasswordPage'))
const ConfirmEmailPage = () => lazyPage(() => import('@/features/auth/pages/ConfirmEmailPage'))

// Public pages
const AuctionListPage = () => lazyPage(() => import('@/features/auction/pages/AuctionListPage'))
const AuctionDetailPage = () => lazyPage(() => import('@/features/auction/pages/AuctionDetailPage'))
const ItemDetailPage = () => lazyPage(() => import('@/features/item/pages/ItemDetailPage'))
const PublicSellerPage = () => lazyPage(() => import('@/features/seller/pages/PublicSellerPage'))
const AboutPage = () => lazyPage(() => import('@/features/public/pages/AboutPage'))
const CategoriesPage = () => lazyPage(() => import('@/features/public/pages/CategoriesPage'))
const HelpPage = () => lazyPage(() => import('@/features/public/pages/HelpPage'))
const BrowseAuctionsPage = () => lazyPage(() => import('@/features/auction/pages/BrowseAuctionsPage'))
const BrowseSellersPage = () => lazyPage(() => import('@/features/seller/pages/BrowseSellersPage'))
const BrowseItemsPage = () => lazyPage(() => import('@/features/item/pages/BrowseItemsPage'))

// User pages (auth required)
const ProfilePage = () => lazyPage(() => import('@/features/user/pages/ProfilePage'))
const AddressesPage = () => lazyPage(() => import('@/features/user/pages/AddressesPage'))
const SecurityPage = () => lazyPage(() => import('@/features/user/pages/SecurityPage'))
const NotificationPrefsPage = () => lazyPage(() => import('@/features/user/pages/NotificationPrefsPage'))
const TermsPage = () => lazyPage(() => import('@/features/user/pages/TermsPage'))

// Item pages
const MyItemsPage = () => lazyPage(() => import('@/features/item/pages/MyItemsPage'))
const CreateItemPage = () => lazyPage(() => import('@/features/item/pages/CreateItemPage'))
const EditItemPage = () => lazyPage(() => import('@/features/item/pages/EditItemPage'))

// Auction pages
const CreateAuctionPage = () => lazyPage(() => import('@/features/auction/pages/CreateAuctionPage'))
const MyAuctionsPage = () => lazyPage(() => import('@/features/auction/pages/MyAuctionsPage'))
const WatchlistPage = () => lazyPage(() => import('@/features/auction/pages/WatchlistPage'))
const MyBidsPage = () => lazyPage(() => import('@/features/auction/pages/MyBidsPage'))

// Order pages
const MyOrdersPage = () => lazyPage(() => import('@/features/order/pages/MyOrdersPage'))
const SellerOrdersPage = () => lazyPage(() => import('@/features/order/pages/SellerOrdersPage'))
const SellerOutboundShipmentDetailPage = () => lazyPage(() => import('@/features/order/pages/SellerOutboundShipmentDetailPage'))
const SellerOutboundShipmentsListPage = () => lazyPage(() => import('@/features/order/pages/SellerOutboundShipmentsListPage'))
const SellerDirectShipmentDetailPage = () => lazyPage(() => import('@/features/order/pages/SellerDirectShipmentDetailPage'))
const SellerDirectShipmentsListPage = () => lazyPage(() => import('@/features/order/pages/SellerDirectShipmentsListPage'))
const OrderDetailPage = () => lazyPage(() => import('@/features/order/pages/OrderDetailPage'))
const MyDirectShipmentDetailPage = () => lazyPage(() => import('@/features/order/pages/MyDirectShipmentDetailPage'))
const MyDirectShipmentsListPage = () => lazyPage(() => import('@/features/order/pages/MyDirectShipmentsListPage'))
const BuyerShipmentScanPage = () => lazyPage(() => import('@/features/order/pages/BuyerShipmentScanPage'))
const BuyerShipmentReceivePage = () => lazyPage(() => import('@/features/order/pages/BuyerShipmentReceivePage'))
const BuyerOutboundReceivePage = () => lazyPage(() => import('@/features/order/pages/BuyerOutboundReceivePage'))
const BuyerOutboundShipmentPage = () => lazyPage(() => import('@/features/order/pages/BuyerOutboundShipmentPage'))
const OrderReturnPage = () => lazyPage(() => import('@/features/order/pages/OrderReturnPage'))

// Payment pages
const BuyerWalletPage = () => lazyPage(() => import('@/features/payment/pages/BuyerWalletPage'))
const SellerWalletPage = () => lazyPage(() => import('@/features/payment/pages/SellerWalletPage'))
const PaymentMethodsPage = () => lazyPage(() => import('@/features/payment/pages/PaymentMethodsPage'))
const CheckoutPage = () => lazyPage(() => import('@/features/payment/pages/CheckoutPage'))
const VnPayReturnPage = () => lazyPage(() => import('@/features/payment/pages/VnPayReturnPage'))
const WithdrawPage = () => lazyPage(() => import('@/features/payment/pages/WithdrawPage'))

// Notification page
const NotificationsPage = () => lazyPage(() => import('@/features/notification/pages/NotificationsPage'))

// Dispute pages
const MyDisputesPage = () => lazyPage(() => import('@/features/dispute/pages/MyDisputesPage'))
const BuyerDisputeThreadPage = () => lazyPage(() => import('@/features/dispute/pages/BuyerDisputeThreadPage'))

// Seller pages
const UserDashboardPage = () => lazyPage(() => import('@/features/user/pages/DashboardPage'))
const SellerDashboardPage = () => lazyPage(() => import('@/features/seller/pages/SellerDashboardPage'))
const CreateSellerProfilePage = () => lazyPage(() => import('@/features/seller/pages/CreateSellerProfilePage'))
const SellerProfilePage = () => lazyPage(() => import('@/features/seller/pages/SellerProfilePage'))
const VerificationPage = () => lazyPage(() => import('@/features/seller/pages/VerificationPage'))

// Warehouse pages
const InboundShipmentsPage = () => lazyPage(() => import('@/features/warehouse/pages/InboundShipmentsPage'))
const BookInboundPage = () => lazyPage(() => import('@/features/warehouse/pages/BookInboundPage'))
const InboundDetailPage = () => lazyPage(() => import('@/features/warehouse/pages/InboundDetailPage'))
const SellerInboundPackageDetailPage = () =>
  lazyPage(() => import('@/features/warehouse/pages/SellerInboundPackageDetailPage'))

const WarehouseItemsPage = () => lazyPage(() => import('@/features/warehouse/pages/WarehouseItemsPage'))
const SellerWarehouseItemDetailPage = () =>
  lazyPage(() => import('@/features/warehouse/pages/SellerWarehouseItemDetailPage'))

// Admin pages
const AdminDashboardPage = () => lazyPage(() => import('@/features/admin/pages/AdminDashboardPage'))
const AdminUsersPage = () => lazyPage(() => import('@/features/admin/pages/AdminUsersPage'))
const AdminUserDetailPage = () => lazyPage(() => import('@/features/admin/pages/AdminUserDetailPage'))
const AdminVerificationsPage = () => lazyPage(() => import('@/features/admin/pages/AdminVerificationsPage'))
const AdminVerificationDetailPage = () => lazyPage(() => import('@/features/admin/pages/AdminVerificationDetailPage'))
const AdminSellerProfilesPage = () => lazyPage(() => import('@/features/admin/pages/AdminSellerProfilesPage'))
const AdminReviewQueuePage = () => lazyPage(() => import('@/features/admin/pages/AdminReviewQueuePage'))
const AdminItemDetailPage = () => lazyPage(() => import('@/features/admin/pages/AdminItemDetailPage'))
const AdminAuctionControlPage = () => lazyPage(() => import('@/features/admin/pages/AdminAuctionControlPage'))
const AdminMonitoringPage = () => lazyPage(() => import('@/features/admin/pages/AdminMonitoringPage'))
const AdminModerationPage = () => lazyPage(() => import('@/features/admin/pages/AdminModerationPage'))
const AdminPaymentsPage = () => lazyPage(() => import('@/features/admin/pages/AdminPaymentsPage'))
const AdminTermsPage = () => lazyPage(() => import('@/features/admin/pages/AdminTermsPage'))
const AdminRolesPage = () => lazyPage(() => import('@/features/admin/pages/AdminRolesPage'))
const AdminCompletedAuctionsPage = () => lazyPage(() => import('@/features/admin/pages/AdminCompletedAuctionsPage'))
const AdminCompletedAuctionDetailPage = () => lazyPage(() => import('@/features/admin/pages/AdminCompletedAuctionDetailPage'))
const AdminDisputeListPage = () => lazyPage(() => import('@/features/admin/pages/AdminDisputeListPage'))
const AdminDisputeDetailPage = () => lazyPage(() => import('@/features/admin/pages/AdminDisputeDetailPage'))

// Inspector pages
const InspectorDashboardPage = () => lazyPage(() => import('@/features/inspector/pages/InspectorDashboardPage'))
const InspectionQueuePage = () => lazyPage(() => import('@/features/inspector/pages/InspectionQueuePage'))
const InspectionDetailPage = () => lazyPage(() => import('@/features/inspector/pages/InspectionDetailPage'))
const InspectionReviewPage = () => lazyPage(() => import('@/features/inspector/pages/InspectionReviewPage'))

// Warehouse Staff pages
const WarehouseStaffDashboardPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/WarehouseStaffDashboardPage'))
const ReceivingPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/ReceivingPage'))
const ScanPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/ScanPage'))
const StaffShipmentDetailPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/StaffShipmentDetailPage'))
const ReceivePackagePage = () => lazyPage(() => import('@/features/warehouse-staff/pages/ReceivePackagePage'))
const StaffLocationsPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/StaffLocationsPage'))
const StoredItemsPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/StoredItemsPage'))
const WarehouseItemDetailPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/WarehouseItemDetailPage'))
const OutboundQueuePage = () => lazyPage(() => import('@/features/warehouse-staff/pages/OutboundQueuePage'))
const OutboundDetailPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/OutboundDetailPage'))
const OutboundShipmentDetailPage = () => lazyPage(() => import('@/features/warehouse-staff/pages/OutboundShipmentDetailPage'))

export const router = createBrowserRouter([
  // Auth routes (guest only)
  {
    errorElement: <RouteErrorBoundary />,
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/2fa', element: <TwoFactorPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
        ],
      },
    ],
  },
  // Confirm email (accessible to all)
  {
    element: <AuthLayout />,
    children: [
      { path: '/confirm-email', element: <ConfirmEmailPage /> },
    ],
  },
  // VnPay return (no layout needed)
  { path: '/payments/vnpay/return', element: <VnPayReturnPage />, errorElement: <RouteErrorBoundary /> },
  // Main app routes
  {
    errorElement: <RouteErrorBoundary />,
    element: <AppLayout />,
    children: [
      // Public routes
      { index: true, element: <AuctionListPage /> },
      { path: '/terms', element: <Navigate to="/me/terms" replace /> },
      { path: '/auctions', element: <BrowseAuctionsPage /> },
      { path: '/auctions/:id', element: <AuctionDetailPage /> },
      { path: '/items', element: <BrowseItemsPage /> },
      { path: '/items/:id', element: <ItemDetailPage /> },
      { path: '/sellers', element: <BrowseSellersPage /> },
      { path: '/sellers/:id', element: <PublicSellerPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/categories', element: <CategoriesPage /> },
      { path: '/help', element: <HelpPage /> },
      // Auth-required routes
      {
        element: <AuthGuard />,
        children: [
          // User
          { path: '/me/dashboard', element: <UserDashboardPage /> },
          { path: '/me/profile', element: <ProfilePage /> },
          { path: '/me/addresses', element: <AddressesPage /> },
          { path: '/me/security', element: <SecurityPage /> },
          { path: '/me/notifications', element: <NotificationsPage /> },
          { path: '/me/notifications/settings', element: <NotificationPrefsPage /> },
          { path: '/me/terms', element: <TermsPage /> },
          { path: '/me/verification', element: <VerificationPage /> },
          // Items
          { path: '/me/items', element: <MyItemsPage /> },
          { path: '/me/items/create', element: <CreateItemPage /> },
          { path: '/me/items/:id/edit', element: <EditItemPage /> },
          // Auctions
          { path: '/me/auctions', element: <MyAuctionsPage /> },
          { path: '/me/auctions/create', element: <CreateAuctionPage /> },
          { path: '/me/auctions/:id/edit', element: <CreateAuctionPage /> },
          { path: '/me/watchlist', element: <WatchlistPage /> },
          { path: '/me/bids', element: <MyBidsPage /> },
          // Orders
          { path: '/me/orders', element: <MyOrdersPage /> },
          { path: '/me/orders/:id', element: <OrderDetailPage /> },
          { path: '/me/orders/:id/return', element: <OrderReturnPage /> },
          { path: '/me/outbound-shipments/:shipmentId', element: <BuyerOutboundShipmentPage /> },
          { path: '/orders/:orderId/outbound-shipment/receive', element: <BuyerOutboundReceivePage /> },
          { path: '/me/shipments', element: <MyDirectShipmentsListPage /> },
          { path: '/me/shipments/scan', element: <BuyerShipmentScanPage /> },
          { path: '/me/shipments/:shipmentId/receive', element: <BuyerShipmentReceivePage /> },
          { path: '/me/shipments/:shipmentId', element: <MyDirectShipmentDetailPage /> },
          // Payment
          { path: '/me/wallet', element: <BuyerWalletPage /> },
          { path: '/me/wallet/withdraw', element: <WithdrawPage /> },
          { path: '/me/payment-methods', element: <PaymentMethodsPage /> },
          { path: '/checkout/:orderId', element: <CheckoutPage /> },
          // Disputes
          { path: '/me/disputes', element: <MyDisputesPage /> },
          { path: '/me/disputes/:id', element: <BuyerDisputeThreadPage /> },
          // Seller registration (outside SellerGuard to avoid redirect loop)
          { path: '/seller/register', element: <CreateSellerProfilePage /> },
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
          { path: '/seller', element: <SellerDashboardPage /> },
          // Items
          { path: '/seller/items', element: <MyItemsPage /> },
          { path: '/seller/items/create', element: <CreateItemPage /> },
          { path: '/seller/items/:id/edit', element: <EditItemPage /> },
          // Auctions
          { path: '/seller/auctions', element: <MyAuctionsPage /> },
          { path: '/seller/auctions/create', element: <CreateAuctionPage /> },
          { path: '/seller/auctions/:id/edit', element: <CreateAuctionPage /> },
          // Business
          { path: '/seller/orders', element: <SellerOrdersPage /> },
          { path: '/seller/orders/:id', element: <OrderDetailPage /> },
          { path: '/seller/orders/:id/return', element: <OrderReturnPage /> },
          { path: '/seller/wallet', element: <SellerWalletPage /> },
          { path: '/seller/wallet/withdraw', element: <WithdrawPage /> },
          // Warehouse
          { path: '/seller/warehouse/inbound', element: <InboundShipmentsPage /> },
          { path: '/seller/warehouse/inbound/book', element: <BookInboundPage /> },
          { path: '/seller/warehouse/inbound/:id', element: <InboundDetailPage /> },
          { path: '/seller/warehouse/inbound/packages/:clientOrderCode', element: <SellerInboundPackageDetailPage /> },
          { path: '/seller/warehouse/outbound', element: <SellerOutboundShipmentsListPage /> },
          { path: '/seller/warehouse/outbound/:id', element: <SellerOutboundShipmentDetailPage /> },
          { path: '/seller/shipments', element: <SellerDirectShipmentsListPage /> },
          { path: '/seller/shipments/:shipmentId', element: <SellerDirectShipmentDetailPage /> },
          { path: '/seller/warehouse/items', element: <WarehouseItemsPage /> },
          { path: '/seller/warehouse/items/:warehouseItemId', element: <SellerWarehouseItemDetailPage /> },
          // Settings
          { path: '/seller/profile', element: <SellerProfilePage /> },
          { path: '/seller/verification', element: <VerificationPage /> },
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
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <AdminUsersPage /> },
          { path: '/admin/users/:id', element: <AdminUserDetailPage /> },
          { path: '/admin/verifications', element: <AdminVerificationsPage /> },
          { path: '/admin/verifications/:id', element: <AdminVerificationDetailPage /> },
          { path: '/admin/sellers', element: <AdminSellerProfilesPage /> },
          { path: '/admin/items/review', element: <AdminReviewQueuePage /> },
          { path: '/admin/items/:id', element: <AdminItemDetailPage /> },
          { path: '/admin/auctions/completed', element: <AdminCompletedAuctionsPage /> },
          { path: '/admin/auctions/completed/:auctionId', element: <AdminCompletedAuctionDetailPage /> },
          { path: '/admin/auctions/:id', element: <AdminAuctionControlPage /> },
          { path: '/admin/moderation', element: <AdminModerationPage /> },
          { path: '/admin/reports', element: <Navigate to="/admin/moderation" replace /> },
          { path: '/admin/monitoring', element: <AdminMonitoringPage /> },
          { path: '/admin/disputes', element: <AdminDisputeListPage /> },
          { path: '/admin/disputes/:id', element: <AdminDisputeDetailPage /> },
          { path: '/admin/payments', element: <AdminPaymentsPage /> },
          { path: '/admin/terms', element: <AdminTermsPage /> },
          { path: '/admin/roles', element: <AdminRolesPage /> },
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
          { path: '/inspector', element: <InspectorDashboardPage /> },
          { path: '/inspector/queue', element: <InspectionQueuePage /> },
          { path: '/inspector/inspections/:shipmentId', element: <InspectionDetailPage /> },
          { path: '/inspector/reviews', element: <InspectionReviewPage /> },
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
        { path: '/warehouse-staff', element: <WarehouseStaffDashboardPage /> },
        { path: '/warehouse-staff/receiving', element: <ReceivingPage /> },
        { path: '/warehouse-staff/receiving/packages/:clientOrderCode', element: <ReceivePackagePage /> },
        { path: '/warehouse-staff/scan', element: <ScanPage /> },
        { path: '/warehouse-staff/shipments/:id', element: <StaffShipmentDetailPage /> },
        { path: '/warehouse-staff/items', element: <StoredItemsPage /> },
        { path: '/warehouse-staff/items/:warehouseItemId', element: <WarehouseItemDetailPage /> },
        { path: '/warehouse-staff/locations', element: <StaffLocationsPage /> },
        { path: '/warehouse-staff/outbound', element: <OutboundQueuePage /> },
        { path: '/warehouse-staff/outbound/shipments/:shipmentId', element: <OutboundShipmentDetailPage /> },
        { path: '/warehouse-staff/outbound/:orderId', element: <OutboundDetailPage /> },
      ],
    }],
  },
])
