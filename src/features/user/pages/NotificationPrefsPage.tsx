import {
  Typography,
  Card,
  Switch,
  Spin,
  Space,
  Button,
  App,
} from 'antd'
import {
  MailOutlined,
  BellOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../api'
import { useState, useEffect } from 'react'

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
    { key: 'email', label: t('notificationPrefs.channelEmailLabel'), icon: <MailOutlined />, description: t('notificationPrefs.channelEmail') },
    { key: 'push', label: t('notificationPrefs.channelPushLabel'), icon: <BellOutlined />, description: t('notificationPrefs.channelPush') },
    { key: 'sms', label: t('notificationPrefs.channelSmsLabel'), icon: <MessageOutlined />, description: t('notificationPrefs.channelSms') },
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
        <Button type="primary" onClick={onSave} loading={updatePrefs.isPending} disabled={!dirty}>
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
    </div>
  )
}
