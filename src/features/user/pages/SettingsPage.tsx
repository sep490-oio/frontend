import { Typography, Card, List, Space } from 'antd'
import {
  BellOutlined,
  SettingOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useBreakpoint } from '@/hooks/useBreakpoint'

const { Title, Text } = Typography

interface SettingsSection {
  key: string
  icon: React.ReactNode
  title: string
  description: string
  path: string
}

export default function SettingsPage() {
  const { t } = useTranslation(['user', 'common'])
  const { isMobile } = useBreakpoint()
  const navigate = useNavigate()

  const sections: SettingsSection[] = [
    {
      key: 'notifications',
      icon: <BellOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />,
      title: t('settings.notifications.title', 'Notifications'),
      description: t('settings.notifications.description', 'Choose how you receive notifications — in-platform and email'),
      path: '/me/notifications/settings',
    },
    // Room to grow: security, language, privacy, etc. keep list empty when not ready.
  ]

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <Space>
            <SettingOutlined />
            {t('settings.title', 'Settings')}
          </Space>
        </Title>
        <Text type="secondary">{t('settings.subtitle', 'Manage your account preferences')}</Text>
      </div>
      <Card styles={{ body: { padding: 0 } }}>
        <List
          itemLayout="horizontal"
          dataSource={sections}
          renderItem={(section) => (
            <List.Item
              onClick={() => navigate(section.path)}
              style={{ cursor: 'pointer', padding: '16px 20px' }}
              extra={<RightOutlined style={{ color: 'var(--color-text-secondary)' }} />}
            >
              <List.Item.Meta
                avatar={section.icon}
                title={<Text strong>{section.title}</Text>}
                description={section.description}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
