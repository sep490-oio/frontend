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
      currentPassword: z.string().min(1, tv('required', 'Trường này là bắt buộc')),
      newPassword: createPasswordSchema(tv),
      confirmPassword: z.string().min(1, tv('required', 'Trường này là bắt buộc')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('passwordMismatch', 'Mật khẩu không khớp'),
      path: ['confirmPassword'],
    }), [tv, t])
}

type ChangePasswordFormValues = { currentPassword: string; newPassword: string; confirmPassword: string }

// -- Change Password Tab -------------------------------------------------------

function ChangePasswordSection() {
  const { t } = useTranslation('user')
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
    <Card>
      <form onSubmit={onSubmit} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 16 }}>
          <label>{t('security.changePassword.currentPassword')}</label>
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder={t('security.changePassword.currentPasswordPlaceholder')}
                status={errors.currentPassword ? 'error' : undefined}
              />
            )}
          />
          {errors.currentPassword && (
            <Text type="danger" style={{ fontSize: 12 }}>{errors.currentPassword.message}</Text>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{t('security.changePassword.newPassword')}</label>
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder={t('security.changePassword.newPasswordPlaceholder')}
                status={errors.newPassword ? 'error' : undefined}
              />
            )}
          />
          {errors.newPassword && (
            <Text type="danger" style={{ fontSize: 12 }}>{errors.newPassword.message}</Text>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{t('security.changePassword.confirmPassword')}</label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder={t('security.changePassword.confirmPasswordPlaceholder')}
                status={errors.confirmPassword ? 'error' : undefined}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text type="danger" style={{ fontSize: 12 }}>{errors.confirmPassword.message}</Text>
          )}
        </div>

        <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
          {t('security.changePassword.submit')}
        </Button>
      </form>
    </Card>
  )
}

// -- Two-Factor Auth Tab -------------------------------------------------------

function TwoFactorSection() {
  const { t } = useTranslation('user')
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
    return <Spin />
  }

  const is2FAEnabled = user?.twoFactorEnabled

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <SafetyOutlined /> {t('security.twoFactor.title')}
          </Title>
          <Text type="secondary">
            {t('security.twoFactor.description')}
          </Text>
        </div>

        {is2FAEnabled ? (
          <>
            <Alert
              type="success"
              showIcon
              message={t('security.twoFactor.enabled')}
              description={t('security.twoFactor.enabledDesc')}
            />

            {/* Disable 2FA */}
            <Card size="small" title={t('security.twoFactor.disableTitle')}>
              <form onSubmit={onDisable2FA}>
                <Space>
                  <Controller
                    name="code"
                    control={disableControl}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder={t('security.twoFactor.totpPlaceholder')}
                        maxLength={6}
                        status={disableErrors.code ? 'error' : undefined}
                      />
                    )}
                  />
                  <Button danger htmlType="submit" loading={disable2FA.isPending}>
                    {t('security.twoFactor.disableSubmit')}
                  </Button>
                </Space>
                {disableErrors.code && (
                  <div>
                    <Text type="danger" style={{ fontSize: 12 }}>{disableErrors.code.message}</Text>
                  </div>
                )}
              </form>
            </Card>

            {/* Regenerate Recovery Codes */}
            <Card size="small" title={t('security.twoFactor.recoveryTitle')}>
              <Paragraph type="secondary">
                {t('security.twoFactor.recoveryDesc')}
              </Paragraph>
              <Button onClick={() => { setRegenTotpCode(''); setRegenModalOpen(true) }}>
                {t('security.twoFactor.regenerate')}
              </Button>
              {recoveryCodes && (
                <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                  <Paragraph strong>{t('security.twoFactor.saveCodesWarning')}</Paragraph>
                  <div style={{ fontFamily: 'monospace', fontSize: 14 }}>
                    {recoveryCodes.map((code) => (
                      <div key={code}>{code}</div>
                    ))}
                  </div>
                  <Button
                    icon={<CopyOutlined />}
                    style={{ marginTop: 8 }}
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
            >
              <div style={{ marginBottom: 8 }}>
                <Text>{t('security.twoFactor.regenerateModalDesc')}</Text>
              </div>
              <Input
                value={regenTotpCode}
                onChange={(e) => setRegenTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={t('security.twoFactor.regenerateModalPlaceholder')}
                maxLength={6}
                style={{ fontSize: 18, letterSpacing: 4, textAlign: 'center' }}
              />
            </Modal>
          </>
        ) : (
          <>
            <Alert
              type="warning"
              showIcon
              message={t('security.twoFactor.disabled')}
              description={t('security.twoFactor.disabledDesc')}
            />

            {!totpData ? (
              <Button type="primary" onClick={onStartSetup} loading={enable2FA.isPending || setupTotp.isPending}>
                {t('security.twoFactor.enable')}
              </Button>
            ) : (
              <Card size="small" title={t('security.twoFactor.setupTitle')}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Paragraph>
                    {t('security.twoFactor.setupDesc')}
                  </Paragraph>

                  {/* QR Code */}
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <QRCode value={totpData.qrCodeUri} size={200} />
                  </div>

                  <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
                    <Text type="secondary">{t('security.twoFactor.manualKey')}</Text>
                    <br />
                    <Text code copyable>{totpData.secret}</Text>
                  </div>

                  <form onSubmit={onConfirmTotp}>
                    <Space>
                      <Controller
                        name="code"
                        control={confirmControl}
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder={t('security.twoFactor.codePlaceholder')}
                            maxLength={6}
                            status={confirmErrors.code ? 'error' : undefined}
                          />
                        )}
                      />
                      <Button type="primary" htmlType="submit" loading={confirmTotp.isPending}>
                        {t('security.twoFactor.confirm')}
                      </Button>
                    </Space>
                    {confirmErrors.code && (
                      <div>
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

// -- Sessions Tab --------------------------------------------------------------

function SessionsSection() {
  const { t } = useTranslation('user')
  const { data: sessions, isLoading } = useSessions()

  const columns: ColumnsType<UserSessionDto> = [
    {
      title: t('security.sessions.device'),
      dataIndex: 'userAgent',
      key: 'userAgent',
      render: (text: string) => (
        <Space>
          <DesktopOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: t('security.sessions.ipAddress'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: t('security.sessions.status'),
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: UserSessionDto) => (
        <Space>
          <Tag color={isActive ? 'green' : 'default'}>
            {isActive ? t('security.sessions.active') : t('security.sessions.inactive')}
          </Tag>
          {record.isCurrentDevice && <Tag color="blue">{t('security.sessions.currentDevice')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('security.sessions.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: t('security.sessions.expiresAt'),
      dataIndex: 'absoluteExpiresAt',
      key: 'absoluteExpiresAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
  ]

  return (
    <Card>
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

// -- Login History Tab ---------------------------------------------------------

function LoginHistorySection() {
  const { t } = useTranslation('user')
  const { t: tc } = useTranslation('common')
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
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: t('security.loginHistory.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={status === 'success' ? 'green' : 'red'}
          icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {status === 'success' ? t('security.loginHistory.success') : t('security.loginHistory.failed')}
        </Tag>
      ),
    },
    {
      title: t('security.loginHistory.device'),
      dataIndex: 'userAgent',
      key: 'userAgent',
    },
    {
      title: t('security.loginHistory.ipAddress'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
  ]

  return (
    <Card>
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

  const tabItems = [
    {
      key: 'password',
      label: (
        <span>
          <LockOutlined /> {t('security.tabs.password')}
        </span>
      ),
      children: <ChangePasswordSection />,
    },
    {
      key: '2fa',
      label: (
        <span>
          <SafetyOutlined /> {t('security.tabs.twoFactor')}
        </span>
      ),
      children: <TwoFactorSection />,
    },
    {
      key: 'sessions',
      label: (
        <span>
          <DesktopOutlined /> {t('security.tabs.sessions')}
        </span>
      ),
      children: <SessionsSection />,
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> {t('security.tabs.history')}
        </span>
      ),
      children: <LoginHistorySection />,
    },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={2}>{t('security.title')}</Title>
      <Tabs items={tabItems} />
    </div>
  )
}
