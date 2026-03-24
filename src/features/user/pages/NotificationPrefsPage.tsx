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
import { useNotificationPreferences, useUpdateNotificationPreferences } from '../api'
import { useState, useEffect } from 'react'


const { Title, Text } = Typography

// -- Channel Definitions -------------------------------------------------------

const CHANNELS = [
  { key: 'email', label: 'Email', icon: <MailOutlined />, description: 'Nhan thong bao qua email' },
  { key: 'push', label: 'Push', icon: <BellOutlined />, description: 'Thong bao day tren trinh duyet' },
  { key: 'sms', label: 'SMS', icon: <MessageOutlined />, description: 'Nhan tin nhan SMS' },
] as const

// -- Component -----------------------------------------------------------------

export default function NotificationPrefsPage() {
  const { t: _t } = useTranslation('common')
  const { message } = App.useApp()

  const { data: prefs, isLoading } = useNotificationPreferences()
  const updatePrefs = useUpdateNotificationPreferences()

  const [isEnabled, setIsEnabled] = useState(true)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)

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
      message.success('Cap nhat cai dat thong bao thanh cong')
    } catch {
      message.error('Khong the cap nhat cai dat thong bao')
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
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Cai dat thong bao</Title>
        <Button type="primary" onClick={onSave} loading={updatePrefs.isPending} disabled={!dirty}>
          Luu thay doi
        </Button>
      </div>

      {/* Master toggle */}
      <Card title="Thong bao" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Bat thong bao</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Bat/tat toan bo thong bao</Text>
          </div>
          <Switch checked={isEnabled} onChange={toggleEnabled} />
        </div>
      </Card>

      {/* Notification Channels */}
      <Card title="Kenh nhan thong bao">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {CHANNELS.map((ch) => (
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
