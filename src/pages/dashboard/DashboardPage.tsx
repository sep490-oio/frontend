/**
 * DashboardPage — Trang dashboard chính theo thiết kế Figma
 */

import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/app/hooks';
import {
  useDashboardStats,
  useDashboardWallet,
  useMyActiveBids,
  useRecentlyEnded,
} from '@/hooks/useDashboard';
import { SpendingOverview } from '@/components/dashboard/SpendingOverview';
import { DisputeStatus } from '@/components/dashboard/DisputeStatus';
import { ActiveBidsSection } from '@/components/dashboard/ActiveBidsSection';
import { ShippingTracking } from '@/components/dashboard/ShippingTracking';
import './DashboardPage.scss';

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);

  const { data: stats } = useDashboardStats();
  const { data: wallet } = useDashboardWallet();
  const { data: activeBids } = useMyActiveBids();
  const { data: recentlyEnded } = useRecentlyEnded();

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Chào mừng trở lại!</h1>
        <p className="dashboard-subtitle">
          Dưới đây là tóm tắt hoạt động đấu giá của bạn.
        </p>
      </div>

      {/* Spending Overview & Dispute Status */}
      <div className="dashboard-top-section">
        <SpendingOverview />
        <DisputeStatus />
      </div>

      {/* Active Bids Section */}
      <ActiveBidsSection bids={activeBids ?? []} />

      {/* Shipping Tracking */}
      <ShippingTracking />
    </div>
  );
}
