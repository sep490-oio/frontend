import { Typography, Card, List, Slider } from 'antd'
import {
  BellOutlined,
  SettingOutlined,
  RightOutlined,
  FormatPainterOutlined,
  MoonOutlined,
  SunOutlined,
  BgColorsOutlined,
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
  const { mode, preset, hue, saturation, setPreset, setHue, setSaturation, toggle: toggleTheme } = useTheme()

  const getPresetColor = (p: ColorPreset) => {
    switch (p) {
      case 'mint': return '#10B981'
      case 'ember': return '#F59E0B'
      case 'aurora': return '#6366F1'
      case 'slate': return '#64748B'
      case 'frosted': return '#52525B'
      case 'custom': return `hsl(${hue}, ${saturation}%, 45%)`
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
      <div className="oio-widget" style={{ 
        padding: isMobile ? '32px 24px' : '40px',
        marginTop: 32,
        borderRadius: 32,
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
          <Title level={4} className="oio-serif" style={{ margin: 0, fontWeight: 700 }}>
            {t('user:profile.appearance', 'Appearance & Branding')}
          </Title>
        </Flex>

        {/* Live Preview Card */}
        <div style={{ 
          background: 'var(--color-bg-surface)', 
          borderRadius: 24, 
          padding: 24, 
          marginBottom: 40,
          border: '1px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 12, right: 16 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t('user:settings.appearance.livePreview', 'Live Preview')}
            </Text>
          </div>
          
          <Row gutter={32} align="middle">
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                  {t('user:settings.appearance.sampleInterface', 'Sample Interface')}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t('user:settings.appearance.sampleDesc', "See how your choices affect the platform's visual identity.")}
                </Text>
              </div>
              <Flex gap={12} wrap="wrap">
                <Button type="primary" size="small">{t('user:settings.appearance.primaryAction', 'Primary Action')}</Button>
                <Button size="small">{t('user:settings.appearance.ghost', 'Ghost')}</Button>
                <div style={{ 
                  padding: '4px 12px', 
                  borderRadius: 20, 
                  background: 'var(--color-accent-light)', 
                  color: 'var(--color-accent)',
                  fontSize: 12,
                  fontWeight: 600
                }}>
                  {t('user:settings.appearance.activeTag', 'Active Tag')}
                </div>
              </Flex>
            </Col>
            <Col xs={24} md={12} style={{ marginTop: isMobile ? 24 : 0 }}>
              <div style={{ 
                height: 80, 
                borderRadius: 16, 
                background: 'var(--bg-unified-gradient)', 
                backgroundSize: '100% 200%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: mode === 'dark' ? '0% 0%' : '0% 100%',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: mode === 'dark' ? '#fff' : 'var(--color-text-primary)',
                transition: 'background-position 0.6s ease',
                overflow: 'hidden'
              }}>
                <Text strong style={{ color: 'inherit' }}>
                  {t('user:settings.appearance.backgroundGradient', 'Background Gradient')}
                </Text>
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ marginBottom: 40 }}>
          <label style={labelStyle}>{t('user:settings.appearance.brightness', 'Brightness')}</label>
          <Flex gap={16} vertical={isMobile}>
            <Button
              size="large"
              className="oio-press"
              icon={mode === 'light' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ 
                height: 60, 
                borderRadius: 18, 
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
                fontSize: 16,
                fontWeight: 600,
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)'
              }}
            >
              {mode === 'light' ? t('user:settings.appearance.lightModeActive', 'Light Mode Active') : t('user:settings.appearance.darkModeActive', 'Dark Mode Active')}
              <div style={{ flex: 1 }} />
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                {mode === 'light' ? t('user:settings.appearance.clickForDark', 'Click for Dark') : t('user:settings.appearance.clickForLight', 'Click for Light')}
              </Text>
            </Button>
          </Flex>
        </div>

        <div>
          <label style={labelStyle}>{t('user:settings.appearance.colorDna', 'Brand Color DNA')}</label>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 14 }}>
            {t('user:settings.appearance.presetHint', 'Each preset uses a unique multi-pigment formula for maximum depth.')}
          </Text>
          
          <Row gutter={[16, 16]}>
            {(['default', 'mint', 'ember', 'aurora', 'slate', 'frosted', 'custom'] as ColorPreset[]).map((p) => {
              const active = preset === p
              return (
                <Col xs={24} sm={12} md={8} key={p}>
                  <div 
                    onClick={() => setPreset(p)}
                    className="oio-press"
                    style={{
                      cursor: 'pointer',
                      padding: '20px',
                      borderRadius: 24,
                      border: `2px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      background: active ? 'var(--color-accent-light)' : 'var(--color-bg-surface)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                  >
                    <Flex align="center" gap={16}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: getPresetColor(p),
                        boxShadow: `0 8px 16px ${active ? 'var(--color-accent-light)' : 'rgba(0,0,0,0.1)'}`,
                        border: '3px solid #fff',
                        flexShrink: 0
                      }} />
                      <div>
                        <Text strong style={{ 
                          fontSize: 15, 
                          display: 'block',
                          color: active ? 'var(--color-accent)' : 'var(--color-text-primary)'
                        }}>
                          {t(`user:settings.appearance.presets.${p}.label`)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t(`user:settings.appearance.presets.${p}.desc`)}
                        </Text>
                      </div>
                    </Flex>
                  </div>
                </Col>
              )
            })}
          </Row>

          {preset === 'custom' && (
            <div className="oio-widget" style={{ 
              marginTop: 40, 
              padding: 32, 
              borderRadius: 28,
              border: '1px dashed var(--color-accent)'
            }}>
              <Flex align="center" gap={12} style={{ marginBottom: 32 }}>
                <BgColorsOutlined style={{ color: 'var(--color-accent)', fontSize: 24 }} />
                <div>
                  <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                    {t('user:settings.appearance.precisionTuning', 'Precision Tuning')}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {t('user:profile.customDesc', 'Adjust the pigment and intensity to create your own brand identity.')}
                  </Text>
                </div>
              </Flex>
              
              <Row gutter={[40, 40]} align="middle">
                <Col xs={24} lg={16}>
                  {/* Hue Slider */}
                  <div style={{ marginBottom: 32 }}>
                    <Flex justify="space-between" style={{ marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('user:settings.appearance.pigmentHue', 'Pigment Hue')}
                      </Text>
                      <Text strong style={{ color: 'var(--color-accent)' }}>{hue}°</Text>
                    </Flex>
                    <Slider 
                      min={0} 
                      max={360} 
                      value={hue} 
                      onChange={(val) => setHue(val)}
                      railStyle={{ 
                        background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                        height: 10,
                        borderRadius: 5
                      }}
                      trackStyle={{ background: 'transparent' }}
                      handleStyle={{ 
                        borderColor: '#fff', 
                        background: `hsl(${hue}, 85%, 45%)`,
                        width: 24,
                        height: 24,
                        marginTop: -7,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }}
                      tooltip={{ open: false }}
                    />
                  </div>

                  {/* Saturation Slider */}
                  <div>
                    <Flex justify="space-between" style={{ marginBottom: 12 }}>
                      <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('user:settings.appearance.intensity', 'Intensity (Saturation)')}
                      </Text>
                      <Text strong style={{ color: 'var(--color-accent)' }}>{saturation}%</Text>
                    </Flex>
                    <Slider 
                      min={0} 
                      max={100} 
                      value={saturation} 
                      onChange={(val) => setSaturation(val)}
                      railStyle={{ 
                        background: `linear-gradient(to right, hsl(${hue}, 0%, 50%), hsl(${hue}, 100%, 50%))`,
                        height: 10,
                        borderRadius: 5
                      }}
                      trackStyle={{ background: 'transparent' }}
                      handleStyle={{ 
                        borderColor: '#fff', 
                        background: `hsl(${hue}, ${saturation}%, 45%)`,
                        width: 24,
                        height: 24,
                        marginTop: -7,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }}
                      tooltip={{ open: false }}
                    />
                  </div>
                </Col>
                <Col xs={24} lg={8}>
                  <div style={{ 
                    aspectRatio: '1/1',
                    borderRadius: 32, 
                    background: `hsl(${hue}, ${saturation}%, 45%)`,
                    border: '8px solid #fff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    textAlign: 'center'
                  }}>
                    <BgColorsOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                    <Text strong style={{ color: '#fff', fontSize: 18 }}>{hue}°</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{saturation}% Sat</Text>
                  </div>
                </Col>
              </Row>
              
              {/* Quick Swatches */}
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
                  {t('user:settings.appearance.quickTemplates', 'QUICK TEMPLATES')}
                </Text>
                <Flex gap={16} wrap="wrap">
                  {[
                    { h: 0, s: 85, key: 'ruby', fallback: 'Ruby' },
                    { h: 30, s: 90, key: 'amber', fallback: 'Amber' },
                    { h: 140, s: 70, key: 'emerald', fallback: 'Emerald' },
                    { h: 210, s: 80, key: 'sapphire', fallback: 'Sapphire' },
                    { h: 280, s: 75, key: 'amethyst', fallback: 'Amethyst' },
                    { h: 330, s: 85, key: 'rose', fallback: 'Rose' }
                  ].map((sw) => (
                    <div 
                      key={sw.key}
                      onClick={() => {
                        setHue(sw.h)
                        setSaturation(sw.s)
                      }}
                      className="oio-press"
                      style={{
                        padding: '8px 16px',
                        borderRadius: 12,
                        background: 'var(--color-bg-surface)',
                        border: hue === sw.h ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: `hsl(${sw.h}, ${sw.s}%, 50%)` }} />
                      <Text style={{ fontSize: 12, fontWeight: 600 }}>
                        {t(`user:settings.appearance.swatches.${sw.key}`, sw.fallback)}
                      </Text>
                    </div>
                  ))}
                </Flex>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
