import { Typography, Card, List } from 'antd'
import {
  BellOutlined,
  SettingOutlined,
  RightOutlined,
  FormatPainterOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Flex, Button, Row, Col } from 'antd'
import { useTheme, type ColorPreset } from '@/hooks/useTheme'
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
  const { mode, preset, setPreset, toggle: toggleTheme } = useTheme()

  const getPresetColor = (p: ColorPreset) => {
    switch (p) {
      case 'mint': return '#059669'
      case 'ember': return '#D97706'
      case 'aurora': return '#4F46E5'
      case 'slate': return '#475569'
      case 'frosted': return '#71717A'
      default: return '#0284C7'
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

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
                borderBottom: '0px solid var(--color-border)'
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

      {/* Theme & Appearance Section */}
      <div style={{ 
        background: 'var(--color-bg-card)', 
        borderRadius: 32, 
        border: '1px solid var(--color-border)',
        padding: isMobile ? '32px 24px' : '40px',
        boxShadow: 'var(--shadow-sm)',
        marginTop: 32
      }}>
        <Flex align="center" gap={12} style={{ marginBottom: 32 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: 12, 
            background: 'var(--color-accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)'
          }}>
            <FormatPainterOutlined style={{ fontSize: 20 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            {t('user:profile.appearance', 'Appearance')}
          </Title>
        </Flex>

        <div style={{ marginBottom: 32 }}>
          <label style={labelStyle}>{t('user:profile.themeMode', 'Theme Mode')}</label>
          <Flex gap={16} vertical={isMobile}>
            <Button
              size="large"
              icon={mode === 'light' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ 
                height: 52, 
                borderRadius: 14, 
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: 1
              }}
            >
              {mode === 'light' ? t('user:profile.switchToDark', 'Switch to Dark Mode') : t('user:profile.switchToLight', 'Switch to Light Mode')}
            </Button>
          </Flex>
        </div>

        <div>
          <label style={labelStyle}>{t('user:profile.colorPreset', 'Color Combo')}</label>
          <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13 }}>
            {t('user:profile.presetHint', 'Choose a color combination that matches your style.')}
          </Text>
          
          <Row gutter={[16, 16]}>
            {(['default', 'mint', 'ember', 'aurora', 'slate', 'frosted'] as ColorPreset[]).map((p) => (
              <Col xs={12} sm={8} md={4.8} key={p}>
                <div 
                  onClick={() => setPreset(p)}
                  style={{
                    cursor: 'pointer',
                    padding: '16px 12px',
                    borderRadius: 20,
                    border: `2px solid ${preset === p ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: preset === p ? 'var(--color-accent-light)' : 'var(--color-bg-surface)',
                    textAlign: 'center',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: preset === p ? 'scale(1.05)' : 'none',
                    boxShadow: preset === p ? 'var(--shadow-md)' : 'none',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    margin: '0 auto 12px',
                    background: getPresetColor(p),
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                    border: '2px solid #fff'
                  }} />
                  <Text strong style={{ 
                    fontSize: 12, 
                    textTransform: 'capitalize',
                    color: preset === p ? 'var(--color-accent)' : 'var(--color-text-primary)'
                  }}>
                    {t(`user:profile.presets.${p}`, p)}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>
    </div>
  )
}
