import { useState, useMemo } from 'react'
import {
  Typography,
  Card,
  Button,
  Input,
  Space,
  Spin,
  Alert,
  Tabs,
  Tag,
  App,
  Modal,
  Flex,
  List,
  Slider,
  Row,
  Col
} from 'antd'
import {
  LockOutlined,
  SafetyOutlined,
  DesktopOutlined,
  HistoryOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BellOutlined,
  SettingOutlined,
  RightOutlined,
  FormatPainterOutlined,
  MoonOutlined,
  SunOutlined,
  BgColorsOutlined,
} from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { createPasswordSchema } from '@/utils/validation'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'
import { useTheme, type ColorPreset } from '@/hooks/useTheme'
import {
  useCurrentUser,
  useChangePassword,
  useEnable2FA,
  useSetupTotp,
  useConfirmTotp,
  useDisable2FA,
  useRegenerateRecoveryCodes,
  useSessions,
  useLoginHistory,
} from '../api'
import type { PaginationParams } from '@/types'
import type { ColumnsType } from 'antd/es/table'
import type { UserSessionDto, LoginHistoryDto } from '@/types/auth'

const { Title, Text, Paragraph } = Typography

// -- Schemas -------------------------------------------------------------------

function useChangePasswordSchema() {
  const { t: tv } = useTranslation('validation')
  const { t } = useTranslation('auth')
  return useMemo(() => z
    .object({
      currentPassword: z.string().min(1, tv('required')),
      newPassword: createPasswordSchema(tv),
      confirmPassword: z.string().min(1, tv('required')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('register.passwordMismatch'),
      path: ['confirmPassword'],
    }), [tv, t])
}

type ChangePasswordFormValues = { currentPassword: string; newPassword: string; confirmPassword: string }

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-text-tertiary)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

// -- Component Sections ---------------------------------------------------------

function PreferencesTab() {
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

  interface SettingsSection {
    key: string
    icon: React.ReactNode
    title: string
    description: string
    path: string
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
    <>
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
    </>
  )
}

function ChangePasswordSection() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()
  const changePassword = useChangePassword()
  const changePasswordSchema = useChangePasswordSchema()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      message.success(t('security.changePassword.success'))
      reset()
    } catch {
      message.error(t('security.changePassword.error'))
    }
  })

  return (
    <div 
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)',
        padding: isMobile ? '24px 20px' : '32px'
      }}
    >
      <Title level={4} style={{ marginBottom: 24, fontFamily: SANS_FONT, fontWeight: 600 }}>
        {t('security.tabs.password')}
      </Title>
      <form onSubmit={onSubmit} style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t('security.changePassword.currentPassword')}</label>
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined style={{ color: 'var(--color-accent)' }} />}
                placeholder={t('security.changePassword.currentPasswordPlaceholder')}
                status={errors.currentPassword ? 'error' : undefined}
                style={{ height: 48, borderRadius: 12 }}
              />
            )}
          />
          {errors.currentPassword && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>{errors.currentPassword.message}</Text>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t('security.changePassword.newPassword')}</label>
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined style={{ color: 'var(--color-accent)' }} />}
                placeholder={t('security.changePassword.newPasswordPlaceholder')}
                status={errors.newPassword ? 'error' : undefined}
                style={{ height: 48, borderRadius: 12 }}
              />
            )}
          />
          {errors.newPassword && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>{errors.newPassword.message}</Text>
          )}
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={labelStyle}>{t('security.changePassword.confirmPassword')}</label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined style={{ color: 'var(--color-accent)' }} />}
                placeholder={t('security.changePassword.confirmPasswordPlaceholder')}
                status={errors.confirmPassword ? 'error' : undefined}
                style={{ height: 48, borderRadius: 12 }}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text type="danger" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>{errors.confirmPassword.message}</Text>
          )}
        </div>

        <Button 
          type="primary" 
          htmlType="submit" 
          loading={changePassword.isPending}
          size="large"
          block={isMobile}
          style={{ height: 48, borderRadius: 12, fontWeight: 600, padding: '0 40px' }}
        >
          {t('security.changePassword.submit')}
        </Button>
      </form>
    </div>
  )
}

function TwoFactorSection() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()
  const { data: user, isLoading } = useCurrentUser()

  const [totpData, setTotpData] = useState<{ sharedKey: string; qrCodeBase64: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  const enable2FA = useEnable2FA()
  const setupTotp = useSetupTotp()
  const confirmTotp = useConfirmTotp()
  const disable2FA = useDisable2FA()
  const regenCodes = useRegenerateRecoveryCodes()

  const totpCodeSchema = useMemo(() => z.object({
    code: z.string().length(6, t('security.twoFactor.codeValidation')),
  }), [t])

  type TotpCodeFormValues = z.infer<typeof totpCodeSchema>

  const {
    control: confirmControl,
    handleSubmit: handleConfirmSubmit,
    reset: resetConfirm,
    formState: { errors: confirmErrors },
  } = useForm<TotpCodeFormValues>({
    resolver: zodResolver(totpCodeSchema),
    defaultValues: { code: '' },
  })

  const {
    control: disableControl,
    handleSubmit: handleDisableSubmit,
    reset: resetDisable,
    formState: { errors: disableErrors },
  } = useForm<TotpCodeFormValues>({
    resolver: zodResolver(totpCodeSchema),
    defaultValues: { code: '' },
  })

  const onStartSetup = async () => {
    try {
      await enable2FA.mutateAsync('totp')
      const data = await setupTotp.mutateAsync()
      setTotpData(data)
    } catch {
      message.error(t('security.twoFactor.enableError'))
    }
  }

  const onConfirmTotp = handleConfirmSubmit(async (values) => {
    try {
      await confirmTotp.mutateAsync(values)
      setTotpData(null)
      resetConfirm()
      message.success(t('security.twoFactor.enableSuccess'))
    } catch {
      message.error(t('security.twoFactor.confirmError'))
    }
  })

  const onDisable2FA = handleDisableSubmit(async (values) => {
    try {
      await disable2FA.mutateAsync(values)
      resetDisable()
      message.success(t('security.twoFactor.disableSuccess'))
    } catch {
      message.error(t('security.twoFactor.disableError'))
    }
  })

  const [regenModalOpen, setRegenModalOpen] = useState(false)
  const [regenTotpCode, setRegenTotpCode] = useState('')

  const onRegenerateCodes = async () => {
    if (!regenTotpCode || regenTotpCode.length !== 6) return
    try {
      const data = await regenCodes.mutateAsync(regenTotpCode)
      setRecoveryCodes(data.recoveryCodes)
      message.success(t('security.twoFactor.regenerateSuccess'))
      setRegenModalOpen(false)
      setRegenTotpCode('')
    } catch {
      message.error(t('security.twoFactor.regenerateError'))
    }
  }

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
  }

  const is2FAEnabled = user?.twoFactorEnabled

  return (
    <div
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)',
        padding: isMobile ? '24px 20px' : '32px'
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={32}>
        <div>
          <Title level={4} style={{ marginBottom: 8, fontFamily: SANS_FONT, fontWeight: 600 }}>
            <SafetyOutlined style={{ marginRight: 8, color: 'var(--color-accent)' }} /> {t('security.twoFactor.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            {t('security.twoFactor.description')}
          </Text>
        </div>

        {totpData ? (
          <Card 
            size="small" 
            title={<span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>{t('security.twoFactor.setupTitle')}</span>}
            style={{ borderRadius: 20, border: '1px solid var(--color-border)' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={24}>
              <Paragraph type="secondary">
                {t('security.twoFactor.setupDesc')}
              </Paragraph>

              {/* QR Code */}
              <div style={{ textAlign: 'center', padding: 24, background: '#fff', borderRadius: 16, display: 'inline-block', margin: '0 auto' }}>
                <img
                  src={`data:image/png;base64,${totpData.qrCodeBase64}`}
                  alt="TOTP QR Code"
                  width={200}
                  height={200}
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              <div style={{ padding: 16, background: 'var(--color-bg-surface)', borderRadius: 12, textAlign: 'center', border: '1px solid var(--color-border)' }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>{t('security.twoFactor.manualKey')}</Text>
                <Text style={{ fontFamily: MONO_FONT, fontSize: 16, fontWeight: 600 }} copyable>{totpData.sharedKey}</Text>
              </div>

              <form onSubmit={onConfirmTotp}>
                <Flex gap={12} vertical={isMobile}>
                  <Controller
                    name="code"
                    control={confirmControl}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder={t('security.twoFactor.codePlaceholder')}
                        maxLength={6}
                        status={confirmErrors.code ? 'error' : undefined}
                        style={{ 
                          height: 48, 
                          borderRadius: 12, 
                          fontFamily: MONO_FONT, 
                          letterSpacing: '0.2em', 
                          textAlign: 'center',
                          fontSize: 18,
                          flex: 1
                        }}
                      />
                    )}
                  />
                  <Button type="primary" size="large" htmlType="submit" loading={confirmTotp.isPending} style={{ height: 48, borderRadius: 12, fontWeight: 600, padding: '0 32px' }}>
                    {t('security.twoFactor.confirm')}
                  </Button>
                </Flex>
                {confirmErrors.code && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="danger" style={{ fontSize: 12 }}>{confirmErrors.code.message}</Text>
                  </div>
                )}
              </form>
            </Space>
          </Card>
        ) : is2FAEnabled ? (
          <>
            <Alert
              type="success"
              showIcon
              message={<span style={{ fontWeight: 600 }}>{t('security.twoFactor.enabled')}</span>}
              description={t('security.twoFactor.enabledDesc')}
              style={{ borderRadius: 16, padding: 16 }}
            />

            {/* Disable 2FA */}
            <Card 
              size="small" 
              title={<span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>{t('security.twoFactor.disableTitle')}</span>}
              style={{ borderRadius: 16, border: '1px solid var(--color-border)' }}
            >
              <form onSubmit={onDisable2FA}>
                <Flex gap={12} vertical={isMobile}>
                  <Controller
                    name="code"
                    control={disableControl}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder={t('security.twoFactor.totpPlaceholder')}
                        maxLength={6}
                        status={disableErrors.code ? 'error' : undefined}
                        style={{ height: 44, borderRadius: 10, fontFamily: MONO_FONT, letterSpacing: '0.1em', textAlign: 'center' }}
                      />
                    )}
                  />
                  <Button danger type="primary" htmlType="submit" loading={disable2FA.isPending} style={{ height: 44, borderRadius: 10, fontWeight: 600 }}>
                    {t('security.twoFactor.disableSubmit')}
                  </Button>
                </Flex>
                {disableErrors.code && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="danger" style={{ fontSize: 12 }}>{disableErrors.code.message}</Text>
                  </div>
                )}
              </form>
            </Card>

            {/* Regenerate Recovery Codes */}
            <Card 
              size="small" 
              title={<span style={{ fontFamily: SANS_FONT, fontWeight: 600 }}>{t('security.twoFactor.recoveryTitle')}</span>}
              style={{ borderRadius: 16, border: '1px solid var(--color-border)' }}
            >
              <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                {t('security.twoFactor.recoveryDesc')}
              </Paragraph>
              <Button 
                onClick={() => { setRegenTotpCode(''); setRegenModalOpen(true) }}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                {t('security.twoFactor.regenerate')}
              </Button>
              {recoveryCodes && (
                <div style={{ marginTop: 20, padding: 20, background: 'var(--color-bg-surface)', borderRadius: 16, border: '1px solid var(--color-border)' }}>
                  <Paragraph strong style={{ color: 'var(--color-danger)', marginBottom: 12 }}>
                    <CheckCircleOutlined style={{ marginRight: 8 }} />
                    {t('security.twoFactor.saveCodesWarning')}
                  </Paragraph>
                  <div style={{ 
                    fontFamily: MONO_FONT, 
                    fontSize: 15, 
                    background: 'rgba(0,0,0,0.05)', 
                    padding: 16, 
                    borderRadius: 8, 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: 8 
                  }}>
                    {recoveryCodes.map((code) => (
                      <div key={code}>{code}</div>
                    ))}
                  </div>
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    style={{ marginTop: 16, borderRadius: 10, fontWeight: 600 }}
                    onClick={() => {
                      navigator.clipboard.writeText(recoveryCodes.join('\n'))
                      message.success(t('security.twoFactor.copySuccess'))
                    }}
                  >
                    {t('security.twoFactor.copyCodes')}
                  </Button>
                </div>
              )}
            </Card>

            {/* TOTP Verification Modal */}
            <Modal
              title={t('security.twoFactor.regenerateModalTitle')}
              open={regenModalOpen}
              onCancel={() => setRegenModalOpen(false)}
              onOk={onRegenerateCodes}
              okText={t('security.twoFactor.confirm')}
              okButtonProps={{ loading: regenCodes.isPending, disabled: regenTotpCode.length !== 6 }}
              centered
              width={400}
            >
              <div style={{ marginBottom: 20 }}>
                <Text type="secondary">{t('security.twoFactor.regenerateModalDesc')}</Text>
              </div>
              <Input
                value={regenTotpCode}
                onChange={(e) => setRegenTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{ 
                  fontSize: 24, 
                  letterSpacing: 8, 
                  textAlign: 'center', 
                  height: 60, 
                  borderRadius: 12,
                  fontFamily: MONO_FONT
                }}
              />
            </Modal>
          </>
        ) : (
          <>
            <Alert
              type="warning"
              showIcon
              message={<span style={{ fontWeight: 600 }}>{t('security.twoFactor.disabled')}</span>}
              description={t('security.twoFactor.disabledDesc')}
              style={{ borderRadius: 16, padding: 16 }}
            />

            <Button 
              type="primary" 
              size="large"
              onClick={onStartSetup} 
              loading={enable2FA.isPending || setupTotp.isPending}
              style={{ height: 48, borderRadius: 12, fontWeight: 600, padding: '0 40px' }}
            >
              {t('security.twoFactor.enable')}
            </Button>
          </>
        )}
      </Space>
    </div>
  )
}

function SessionsSection() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { data: sessions, isLoading } = useSessions()

  const columns: ColumnsType<UserSessionDto> = [
    {
      title: t('security.sessions.device'),
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (text: string) => (
        <Space>
          <DesktopOutlined style={{ color: 'var(--color-accent)' }} />
          <Text strong={!isMobile}>{text}</Text>
        </Space>
      ),
    },
    {
      title: t('security.sessions.ipAddress'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (text) => <Text style={{ fontFamily: MONO_FONT }}>{text}</Text>
    },
    {
      title: t('security.sessions.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: UserSessionDto) => (
        <Space wrap>
          <Tag color={isActive ? 'green' : 'default'} style={{ borderRadius: 6 }}>
            {isActive ? t('security.sessions.active') : t('security.sessions.inactive')}
          </Tag>
          {record.isCurrentDevice && <Tag color="blue" style={{ borderRadius: 6 }}>{t('security.sessions.currentDevice')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('security.sessions.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(text).format('DD/MM/YYYY HH:mm')}</Text>,
    },
  ]

  return (
    <div 
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)',
        padding: isMobile ? '12px' : '24px'
      }}
    >
      <ResponsiveTable<UserSessionDto>
        mobileMode="list"
        columns={columns}
        dataSource={sessions?.items ?? []}
        rowKey="sessionId"
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: t('security.sessions.empty') }}
      />
    </div>
  )
}

function LoginHistorySection() {
  const { t } = useTranslation('user')
  const { t: tc } = useTranslation('common')
  const { isMobile } = useBreakpoint()
  const [params, setParams] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: 10,
  })

  const { data, isLoading } = useLoginHistory(params)

  const columns: ColumnsType<LoginHistoryDto> = [
    {
      title: t('security.loginHistory.loginAt'),
      dataIndex: 'loginAt',
      key: 'loginAt',
      render: (text: string) => <Text strong={!isMobile}>{dayjs(text).format('DD/MM/YYYY HH:mm:ss')}</Text>,
    },
    {
      title: t('security.loginHistory.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={status === 'success' ? 'green' : 'red'}
          icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          style={{ borderRadius: 6 }}
        >
          {status === 'success' ? t('security.loginHistory.success') : t('security.loginHistory.failed')}
        </Tag>
      ),
    },
    {
      title: t('security.loginHistory.device'),
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (text) => <Text type="secondary" style={{ fontSize: 13 }}>{text}</Text>
    },
    {
      title: t('security.loginHistory.ipAddress'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (text) => <Text style={{ fontFamily: MONO_FONT, fontSize: 13 }}>{text}</Text>
    },
  ]

  return (
    <div 
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)',
        padding: isMobile ? '12px' : '24px'
      }}
    >
      <ResponsiveTable<LoginHistoryDto>
        mobileMode="list"
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: data?.metadata?.currentPage,
          pageSize: data?.metadata?.pageSize,
          total: data?.metadata?.totalCount,
          showSizeChanger: true,
          showTotal: (total) => tc('pagination.total', { total }),
          onChange: (page, pageSize) => setParams({ pageNumber: page, pageSize }),
        }}
        locale={{ emptyText: t('security.loginHistory.empty') }}
      />
    </div>
  )
}

// -- Main Component ------------------------------------------------------------

export default function SettingsPage() {
  const { t } = useTranslation(['user', 'common'])
  const { isMobile } = useBreakpoint()

  const tabItems = [
    {
      key: 'preferences',
      label: (
        <span style={{ fontWeight: 600 }}>
          <SettingOutlined /> {t('user:settings.tabs.preferences', 'Preferences')}
        </span>
      ),
      children: <PreferencesTab />,
    },
    {
      key: 'security',
      label: (
        <span style={{ fontWeight: 600 }}>
          <SafetyOutlined /> {t('user:security.tabs.security', 'Security')}
        </span>
      ),
      children: (
        <Flex vertical gap={24}>
          <ChangePasswordSection />
          <TwoFactorSection />
        </Flex>
      ),
    },
    {
      key: 'activity',
      label: (
        <span style={{ fontWeight: 600 }}>
          <HistoryOutlined /> {t('user:security.tabs.activity', 'Activity')}
        </span>
      ),
      children: (
        <Flex vertical gap={24}>
          <SessionsSection />
          <LoginHistorySection />
        </Flex>
      ),
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
          {t('user:settings.title', 'Settings')}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          {t('user:settings.subtitle', 'Manage your account preferences and security')}
        </Text>
      </div>

      <Tabs 
        items={tabItems} 
        className="oio-tabs"
        size={isMobile ? 'middle' : 'large'}
      />
    </div>
  )
}
