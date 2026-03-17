/**
 * MyBidsPage — the bidder's command center for all auction participation.
 *
 * Three tabs via Segmented control (Shopee-style compact pills):
 * 1. Active — auctions with deposit or active bid (winning/outbid/waiting)
 * 2. Ended — finished auctions user participated in (won/lost)
 * 3. Watching — heart-only auctions (no deposit paid)
 *
 * All 3 data hooks fire in parallel on mount so tab switching is instant.
 * Each tab has its own filter controls managed inside the tab component.
 *
 * View mode toggle (table/card) is page-level state shared across all tabs.
 * On mobile, tab switcher changes to a Select dropdown to prevent truncation
 * of long Vietnamese labels (Segmented can't fit 3 labels at 344px).
 *
 * Pattern follows WalletPage.tsx (single page, parallel queries).
 */

import { useState } from 'react';
import { Typography, Segmented, Flex, Tooltip, Select } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  useMyActiveBidsFull,
  useMyEndedBids,
  useMyWatchedAuctions,
} from '@/hooks/useMyBids';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ActiveBidsList } from '@/components/mybids/ActiveBidsList';
import { EndedBidsList } from '@/components/mybids/EndedBidsList';
import { WatchingList } from '@/components/mybids/WatchingList';

const { Title, Text } = Typography;

type TabKey = 'active' | 'ended' | 'watching';
export type ViewMode = 'table' | 'card';

export function MyBidsPage() {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // All 3 queries fire in parallel — no sequential dependency
  const { data: activeBids, isLoading: activeLoading } = useMyActiveBidsFull();
  const { data: endedBids, isLoading: endedLoading } = useMyEndedBids();
  const { data: watchedAuctions, isLoading: watchingLoading } = useMyWatchedAuctions();

  // Counts for tab labels (show 0 while loading)
  const activeCount = activeBids?.length ?? 0;
  const endedCount = endedBids?.length ?? 0;
  const watchingCount = watchedAuctions?.length ?? 0;

  // Tab options — shared between Segmented (desktop) and Select (mobile)
  const tabOptions = [
    { value: 'active' as const, label: `${t('myBids.tabActive')} (${activeCount})` },
    { value: 'ended' as const, label: `${t('myBids.tabEnded')} (${endedCount})` },
    { value: 'watching' as const, label: `${t('myBids.tabWatching')} (${watchingCount})` },
  ];

  // View toggle — shared between mobile and desktop layouts
  const viewToggle = (
    <Segmented
      size="small"
      value={viewMode}
      onChange={(val) => setViewMode(val as ViewMode)}
      options={[
        {
          value: 'table',
          icon: (
            <Tooltip title={t('myBids.viewTable')}>
              <UnorderedListOutlined />
            </Tooltip>
          ),
        },
        {
          value: 'card',
          icon: (
            <Tooltip title={t('myBids.viewCard')}>
              <AppstoreOutlined />
            </Tooltip>
          ),
        },
      ]}
    />
  );

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────── */}
      <Title level={3}>{t('myBids.title')}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('myBids.subtitle')}
      </Text>

      {/* ─── Tab switcher + view toggle ──────────────────────────── */}
      {isMobile ? (
        // Mobile: Select dropdown avoids truncation of long Vietnamese labels
        <Flex gap={8} align="center" style={{ marginBottom: 24 }}>
          <Select
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            options={tabOptions}
            style={{ flex: 1 }}
          />
          {viewToggle}
        </Flex>
      ) : (
        // Desktop: Segmented pills with full labels
        <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Segmented
              value={activeTab}
              onChange={(val) => setActiveTab(val as TabKey)}
              options={tabOptions}
              block
            />
          </div>
          {viewToggle}
        </Flex>
      )}

      {/* ─── Tab content ──────────────────────────────────────────── */}
      {activeTab === 'active' && (
        <ActiveBidsList
          bids={activeBids ?? []}
          isLoading={activeLoading}
          viewMode={viewMode}
        />
      )}
      {activeTab === 'ended' && (
        <EndedBidsList
          bids={endedBids ?? []}
          isLoading={endedLoading}
          viewMode={viewMode}
        />
      )}
      {activeTab === 'watching' && (
        <WatchingList
          auctions={watchedAuctions ?? []}
          isLoading={watchingLoading}
          viewMode={viewMode}
        />
      )}
    </div>
  );
}
