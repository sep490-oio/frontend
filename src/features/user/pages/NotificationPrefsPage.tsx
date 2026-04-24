import {
  Typography,
  Card,
  Switch,
  Spin,
  Space,
  Button,
  Alert,
  App,
  Flex,
} from 'antd'
import {
  MailOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { SANS_FONT } from '@/styles/tokens'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../api'
import { useState, useEffect } from 'react'
import { NotificationChannel } from '@/types/enums'

const { Title, Text } = Typography

// -- Component -----------------------------------------------------------------

export default function NotificationPrefsPage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  const { data: prefs, isLoading } = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()

  const [isEnabled, setIsEnabled] = useState(true)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)

  const channels = [
    {
      key: NotificationChannel.SignalR,
      label: t('notificationPrefs.channelInPlatformLabel', 'In-platform notifications'),
      icon: <BellOutlined style={{ color: 'var(--color-accent)' }} />,
      description: t('notificationPrefs.channelInPlatform', 'Receive real-time notifications on the platform (bell icon, toasts)'),
    },
    {
      key: NotificationChannel.Email,
      label: t('notificationPrefs.channelEmailLabel', 'Email notifications'),
      icon: <MailOutlined style={{ color: 'var(--color-accent)' }} />,
      description: t('notificationPrefs.channelEmail', 'Receive important updates by email'),
    },
  ]

  useEffect(() => {
    if (prefs) {
      setIsEnabled(prefs.isEnabled)
      try {
        const parsed: unknown = JSON.parse(prefs.channels)
        setSelectedChannels(Array.isArray(parsed) ? (parsed as string[]) : [])
      } catch {
        setSelectedChannels([])
      }
      setDirty(false)
    }
  }, [prefs])

  const toggleChannel = (key: string, checked: boolean) => {
    setSelectedChannels((prev) => (checked ? [...prev, key] : prev.filter((c) => c !== key)))
    setDirty(true)
  }

  const toggleEnabled = (checked: boolean) => {
    setIsEnabled(checked)
    setDirty(true)
  }

  const hasNoChannels = isEnabled && selectedChannels.length === 0

  const onSave = async () => {
    if (!prefs) return
    try {
      await updatePrefs.mutateAsync({
        ...prefs,
        isEnabled,
        channels: JSON.stringify(selectedChannels),
      })
      setDirty(false)
      message.success(t('notificationPrefs.saveSuccess'))
    } catch {
      message.error(t('notificationPrefs.saveError'))
    }
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px 16px 80px' : '0 24px 80px' }}>
      {/* Header */}
      <Flex 
        justify="space-between" 
        align={isMobile ? 'stretch' : 'center'} 
        vertical={isMobile}
        gap={isMobile ? 20 : 0} 
        style={{ marginBottom: 32 }}
      >
        <div>
          <Title 
            level={2} 
            style={{ 
              margin: 0, 
              fontFamily: SANS_FONT, 
              fontWeight: 600,
              fontSize: isMobile ? 24 : 32,
              color: 'var(--color-text-primary)'
            }}
          >
            <BellOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
            {t('notificationPrefs.title')}
          </Title>
          <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
            {t('notificationPrefs.subtitle', 'Choose how you want to be notified')}
          </Text>
        </div>
        <Button 
          type="primary" 
          onClick={onSave} 
          loading={updatePrefs.isPending} 
          disabled={!dirty || hasNoChannels}
          size="large"
          style={{ height: 48, borderRadius: 12, fontWeight: 600, padding: '0 32px' }}
        >
          {t('notificationPrefs.save')}
        </Button>
      </Flex>

      <Space direction="vertical" style={{ width: '100%' }} size={24}>
        {/* Master toggle */}
        <Card 
          style={{ 
            background: 'var(--color-bg-card)', 
            border: '1px solid var(--color-border)', 
            borderRadius: 24,
            boxShadow: 'var(--shadow-sm)'
          }}
          styles={{ body: { padding: isMobile ? '24px 20px' : '32px' } }}
        >
          <Flex justify="space-between" align="center">
            <div>
              <Text strong style={{ fontSize: 16, color: 'var(--color-text-primary)', display: 'block', marginBottom: 4 }}>
                {t('notificationPrefs.masterToggle')}
              </Text>
              <Text type="secondary" style={{ fontSize: 14 }}>{t('notificationPrefs.enableDesc')}</Text>
            </div>
            <Switch checked={isEnabled} onChange={toggleEnabled} size={isMobile ? 'small' : 'default'} />
          </Flex>
        </Card>

        {/* Notification Channels */}
        <Card 
          title={<span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>{t('notificationPrefs.channels')}</span>}
          style={{ 
            background: 'var(--color-bg-card)', 
            border: '1px solid var(--color-border)', 
            borderRadius: 24,
            boxShadow: 'var(--shadow-sm)'
          }}
          styles={{ body: { padding: isMobile ? '8px 20px' : '16px 32px' } }}
        >
          <Space direction="vertical" style={{ width: '100%' }} size={0} split={<div style={{ height: 1, background: 'var(--color-border)', margin: '0 -32px' }} />}>
            {channels.map((ch) => (
              <div
                key={ch.key}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0' }}
              >
                <Flex gap={20} align="center">
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 12, 
                    background: 'var(--color-bg-surface)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    {ch.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 16, color: 'var(--color-text-primary)', display: 'block', marginBottom: 4 }}>{ch.label}</Text>
                    <Text type="secondary" style={{ fontSize: 13, maxWidth: 400, display: 'block' }}>{ch.description}</Text>
                  </div>
                </Flex>
                <Switch
                  checked={selectedChannels.includes(ch.key)}
                  onChange={(checked) => toggleChannel(ch.key, checked)}
                  disabled={!isEnabled}
                />
              </div>
            ))}
          </Space>
        </Card>

        {hasNoChannels && (
          <Alert
            type="warning"
            showIcon
            style={{ borderRadius: 16, padding: 16 }}
            message={t('notificationPrefs.atLeastOneChannel', 'At least one channel is required. Use the master toggle above to disable all notifications.')}
          />
        )}
      </Space>
    </div>
  )
}
