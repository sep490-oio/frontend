/**
 * TwoFactorSection — toggle for two-factor authentication.
 *
 * Shows current 2FA status with a switch.
 * Enable → calls enableTwoFactor('sms')
 * Disable → Popconfirm → calls disableTwoFactor()
 */
import { Flex, Popconfirm, Switch, Tag, Typography, message } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useEnableTwoFactor, useDisableTwoFactor } from '@/hooks/useUser';

const { Text } = Typography;

interface TwoFactorSectionProps {
  twoFactorEnabled: boolean;
  twoFactorProvider: string;
}

export function TwoFactorSection({ twoFactorEnabled, twoFactorProvider }: TwoFactorSectionProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const enableMutation = useEnableTwoFactor();
  const disableMutation = useDisableTwoFactor();

  const handleEnable = async () => {
    try {
      await enableMutation.mutateAsync('sms');
      message.success(t('profile.twoFactorEnabled'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleDisable = async () => {
    try {
      await disableMutation.mutateAsync();
      message.success(t('profile.twoFactorDisabled'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const isLoading = enableMutation.isPending || disableMutation.isPending;

  return (
    <div className="security-section">
      <Text className="profile-field-label">{t('profile.twoFactorAuth')}</Text>

      <Flex
        align={isMobile ? 'flex-start' : 'center'}
        gap={12}
        vertical={isMobile}
      >
        <Flex align="center" gap={8}>
          <SafetyOutlined style={{ color: twoFactorEnabled ? '#52c41a' : '#8c8c8c', fontSize: 18 }} />
          <Text>{t('profile.twoFactorDescription')}</Text>
        </Flex>
        <Flex align="center" gap={8}>
          {twoFactorEnabled && twoFactorProvider && (
            <Tag className="profile-tag profile-tag-confirmed">
              {twoFactorProvider.toUpperCase()}
            </Tag>
          )}
          {twoFactorEnabled ? (
            <Popconfirm
              title={t('profile.disableTwoFactorConfirm')}
              onConfirm={handleDisable}
              okText={t('common.yes')}
              cancelText={t('common.no')}
            >
              <Switch checked loading={isLoading} />
            </Popconfirm>
          ) : (
            <Switch checked={false} onChange={handleEnable} loading={isLoading} />
          )}
        </Flex>
      </Flex>
    </div>
  );
}
