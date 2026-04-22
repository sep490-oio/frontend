import {
  Typography,
  Card,
  Switch,
  Spin,
  Space,
  Button,
  Alert,
  App,
} from 'antd'
import {
  MailOutlined,
  BellOutlined,
} from '@ant-design/icons'
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
      icon: <BellOutlined />,
      description: t('notificationPrefs.channelInPlatform', 'Receive real-time notifications on the platform (bell icon, toasts)'),
    },
    {
      key: NotificationChannel.Email,
      label: t('notificationPrefs.channelEmailLabel', 'Email notifications'),
      icon: <MailOutlined />,
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
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? 12 : 0, marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{t('notificationPrefs.title')}</Title>
        <Button type="primary" onClick={onSave} loading={updatePrefs.isPending} disabled={!dirty || hasNoChannels}>
          {t('notificationPrefs.save')}
        </Button>
      </div>

      {/* Master toggle */}
      <Card title={t('notificationPrefs.masterToggle')} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>{t('notificationPrefs.enableNotifications')}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{t('notificationPrefs.enableDesc')}</Text>
          </div>
          <Switch checked={isEnabled} onChange={toggleEnabled} />
        </div>
      </Card>

      {/* Notification Channels */}
      <Card title={t('notificationPrefs.channels')}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {channels.map((ch) => (
            <div
              key={ch.key}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Space>
                {ch.icon}
                <div>
                  <Text strong>{ch.label}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{ch.description}</Text>
                </div>
              </Space>
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
          style={{ marginTop: 16 }}
          message={t('notificationPrefs.atLeastOneChannel', 'At least one channel is required. Use the master toggle above to disable all notifications.')}
        />
      )}
    </div>
  )
}
