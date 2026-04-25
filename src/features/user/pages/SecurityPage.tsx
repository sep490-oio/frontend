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
  QRCode,
  Modal,
  Flex,
} from 'antd'
import {
  LockOutlined,
  SafetyOutlined,
  DesktopOutlined,
  HistoryOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { ResponsiveTable } from '@/components/ui/ResponsiveTable'
import { createPasswordSchema } from '@/utils/validation'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'
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

// -- Component Sections ---------------------------------------------------------

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
    <Card 
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)'
      }}
      styles={{ body: { padding: isMobile ? '24px 20px' : '32px' } }}
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
    </Card>
  )
}

function TwoFactorSection() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()
  const { data: user, isLoading } = useCurrentUser()

  const [totpData, setTotpData] = useState<{ secret: string; qrCodeUri: string } | null>(null)
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
    <Card
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)'
      }}
      styles={{ body: { padding: isMobile ? '24px 20px' : '32px' } }}
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

        {is2FAEnabled ? (
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

            {/* TOTP Verification Modal for Recovery Code Regeneration */}
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

            {!totpData ? (
              <Button 
                type="primary" 
                size="large"
                onClick={onStartSetup} 
                loading={enable2FA.isPending || setupTotp.isPending}
                style={{ height: 48, borderRadius: 12, fontWeight: 600, padding: '0 40px' }}
              >
                {t('security.twoFactor.enable')}
              </Button>
            ) : (
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
                    <QRCode value={totpData.qrCodeUri} size={200} bordered={false} />
                  </div>

                  <div style={{ padding: 16, background: 'var(--color-bg-surface)', borderRadius: 12, textAlign: 'center', border: '1px solid var(--color-border)' }}>
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>{t('security.twoFactor.manualKey')}</Text>
                    <Text style={{ fontFamily: MONO_FONT, fontSize: 16, fontWeight: 600 }} copyable>{totpData.secret}</Text>
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
            )}
          </>
        )}
      </Space>
    </Card>
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
    <Card 
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)'
      }}
      styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
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
    </Card>
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
    <Card 
      style={{ 
        background: 'var(--color-bg-card)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 24,
        boxShadow: 'var(--shadow-sm)'
      }}
      styles={{ body: { padding: isMobile ? '12px' : '24px' } }}
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
    </Card>
  )
}

// -- Main Component ------------------------------------------------------------

export default function SecurityPage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()

  const tabItems = [
    {
      key: 'password',
      label: (
        <span style={{ fontWeight: 600 }}>
          <LockOutlined /> {t('security.tabs.password')}
        </span>
      ),
      children: <ChangePasswordSection />,
    },
    {
      key: '2fa',
      label: (
        <span style={{ fontWeight: 600 }}>
          <SafetyOutlined /> {t('security.tabs.twoFactor')}
        </span>
      ),
      children: <TwoFactorSection />,
    },
    {
      key: 'sessions',
      label: (
        <span style={{ fontWeight: 600 }}>
          <DesktopOutlined /> {t('security.tabs.sessions')}
        </span>
      ),
      children: <SessionsSection />,
    },
    {
      key: 'history',
      label: (
        <span style={{ fontWeight: 600 }}>
          <HistoryOutlined /> {t('security.tabs.history')}
        </span>
      ),
      children: <LoginHistorySection />,
    },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '12px 16px 80px' : '0 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 24 : 40 }}>
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
          <SafetyOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
          {t('security.title')}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          {t('security.subtitle', 'Manage your account security and sessions')}
        </Text>
      </div>

      <Tabs 
        items={tabItems} 
        className="oio-tabs"
        size={isMobile ? 'middle' : 'large'}
        style={{ marginBottom: 40 }}
      />
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-text-tertiary)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}
