import { Typography, Card, List } from 'antd'
import {
  BellOutlined,
  SettingOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SANS_FONT } from '@/styles/tokens'

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
      icon: <BellOutlined style={{ fontSize: 24, color: 'var(--color-accent)' }} />,
      title: t('settings.notifications.title', 'Notifications'),
      description: t('settings.notifications.description', 'Choose how you receive notifications — in-platform and email'),
      path: '/me/notifications/settings',
    },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '0 0 80px' : '0 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Title
          level={2}
          style={{
            fontFamily: SANS_FONT,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
            fontSize: isMobile ? 24 : 32,
          }}
        >
          <SettingOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
          {t('settings.title', 'Settings')}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          {t('settings.subtitle', 'Manage your account preferences and security')}
        </Text>
      </div>

      <Card
        styles={{ body: { padding: 0 } }}
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          overflow: 'hidden'
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={sections}
          renderItem={(section) => (
            <List.Item
              onClick={() => navigate(section.path)}
              className="oio-press"
              style={{
                cursor: 'pointer',
                padding: '24px 32px',
                transition: 'all 0.3s ease',
                borderBottom: '1px solid var(--color-border)'
              }}
              extra={<RightOutlined style={{ color: 'var(--color-text-tertiary)', fontSize: 16 }} />}
            >
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {section.icon}
                  </div>
                }
                title={<Text strong style={{ fontSize: 16, fontFamily: SANS_FONT }}>{section.title}</Text>}
                description={<Text type="secondary" style={{ fontSize: 14 }}>{section.description}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
