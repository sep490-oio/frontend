/**
 * ProfilePage — user account management with 4 tabs.
 *
 * Tabs: Profile Info, Addresses, Security, Sessions/Login History.
 * Uses Segmented on desktop, Select dropdown on mobile (same pattern as MyBidsPage).
 * All user queries fire at this level and pass data down to tab components.
 */
import { useState } from 'react';
import { Typography, Segmented, Flex, Select, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useCurrentUser, useUserProfile } from '@/hooks/useUser';
import { ProfileInfoTab } from '@/components/profile/ProfileInfoTab';
import { AddressesTab } from '@/components/profile/AddressesTab';
import { SecurityTab } from '@/components/profile/SecurityTab';
import { SessionsTab } from '@/components/profile/SessionsTab';

const { Title, Text } = Typography;

type TabKey = 'info' | 'addresses' | 'security' | 'sessions';

export function ProfilePage() {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  // Fire both queries at page level — tabs consume the data
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();

  const tabOptions = [
    { value: 'info' as const, label: t('profile.tabInfo') },
    { value: 'addresses' as const, label: t('profile.tabAddresses') },
    { value: 'security' as const, label: t('profile.tabSecurity') },
    { value: 'sessions' as const, label: t('profile.tabSessions') },
  ];

  const isLoading = userLoading || profileLoading;

  return (
    <div>
      {/* Header */}
      <Title level={3}>{t('profile.title')}</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {t('profile.subtitle')}
      </Text>

      {/* Tab switcher */}
      {isMobile ? (
        <Flex gap={8} align="center" style={{ marginBottom: 24 }}>
          <Select
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            options={tabOptions}
            style={{ flex: 1 }}
          />
        </Flex>
      ) : (
        <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Segmented
              value={activeTab}
              onChange={(val) => setActiveTab(val as TabKey)}
              options={tabOptions}
              block
            />
          </div>
        </Flex>
      )}

      {/* Tab content */}
      {isLoading ? (
        <Flex justify="center" style={{ padding: 64 }}>
          <Spin size="large" />
        </Flex>
      ) : (
        <>
          {activeTab === 'info' && (
            <ProfileInfoTab currentUser={currentUser} userProfile={userProfile} />
          )}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'security' && <SecurityTab currentUser={currentUser} />}
          {activeTab === 'sessions' && <SessionsTab />}
        </>
      )}
    </div>
  );
}
