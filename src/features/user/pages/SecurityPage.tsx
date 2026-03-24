import { useState } from 'react'
import {
  Typography,
  Card,
  Button,
  Input,
  Space,
  Spin,
  Alert,
  Tabs,
  Table,
  Tag,
  App,
  QRCode,
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
import { passwordSchema } from '@/utils/validation'
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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui long nhap mat khau hien tai'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui long nhap lai mat khau'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mat khau nhap lai khong khop',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

const totpCodeSchema = z.object({
  code: z.string().length(6, 'Ma xac nhan phai gom 6 chu so'),
})

type TotpCodeFormValues = z.infer<typeof totpCodeSchema>

// -- Change Password Tab -------------------------------------------------------

function ChangePasswordSection() {
  const { message } = App.useApp()
  const changePassword = useChangePassword()

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
      message.success('Doi mat khau thanh cong')
      reset()
    } catch {
      message.error('Khong the doi mat khau. Vui long kiem tra lai mat khau hien tai.')
    }
  })

  return (
    <Card>
      <form onSubmit={onSubmit} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 16 }}>
          <label>Mat khau hien tai</label>
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder="Nhap mat khau hien tai"
                status={errors.currentPassword ? 'error' : undefined}
              />
            )}
          />
          {errors.currentPassword && (
            <Text type="danger" style={{ fontSize: 12 }}>{errors.currentPassword.message}</Text>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Mat khau moi</label>
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder="Nhap mat khau moi"
                status={errors.newPassword ? 'error' : undefined}
              />
            )}
          />
          {errors.newPassword && (
            <Text type="danger" style={{ fontSize: 12 }}>{errors.newPassword.message}</Text>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Nhap lai mat khau moi</label>
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder="Nhap lai mat khau moi"
                status={errors.confirmPassword ? 'error' : undefined}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text type="danger" style={{ fontSize: 12 }}>{errors.confirmPassword.message}</Text>
          )}
        </div>

        <Button type="primary" htmlType="submit" loading={changePassword.isPending}>
          Doi mat khau
        </Button>
      </form>
    </Card>
  )
}

// -- Two-Factor Auth Tab -------------------------------------------------------

function TwoFactorSection() {
  const { message } = App.useApp()
  const { data: user, isLoading } = useCurrentUser()

  const [totpData, setTotpData] = useState<{ secret: string; qrCodeUri: string } | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  const enable2FA = useEnable2FA()
  const setupTotp = useSetupTotp()
  const confirmTotp = useConfirmTotp()
  const disable2FA = useDisable2FA()
  const regenCodes = useRegenerateRecoveryCodes()

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
      message.error('Khong the kich hoat 2FA')
    }
  }

  const onConfirmTotp = handleConfirmSubmit(async (values) => {
    try {
      await confirmTotp.mutateAsync(values)
      setTotpData(null)
      resetConfirm()
      message.success('Kich hoat xac thuc hai lop thanh cong')
    } catch {
      message.error('Ma xac nhan khong chinh xac')
    }
  })

  const onDisable2FA = handleDisableSubmit(async (values) => {
    try {
      await disable2FA.mutateAsync(values)
      resetDisable()
      message.success('Da tat xac thuc hai lop')
    } catch {
      message.error('Khong the tat xac thuc hai lop')
    }
  })

  const onRegenerateCodes = async () => {
    try {
      const data = await regenCodes.mutateAsync()
      setRecoveryCodes(data.recoveryCodes)
      message.success('Da tao lai ma khoi phuc')
    } catch {
      message.error('Khong the tao ma khoi phuc')
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
            <SafetyOutlined /> Xac thuc hai lop (2FA)
          </Title>
          <Text type="secondary">
            Bao ve tai khoan bang ung dung xac thuc TOTP (Google Authenticator, Authy, ...)
          </Text>
        </div>

        {is2FAEnabled ? (
          <>
            <Alert
              type="success"
              showIcon
              message="Xac thuc hai lop dang duoc bat"
              description="Tai khoan cua ban duoc bao ve boi xac thuc hai lop."
            />

            {/* Disable 2FA */}
            <Card size="small" title="Tat xac thuc hai lop">
              <form onSubmit={onDisable2FA}>
                <Space>
                  <Controller
                    name="code"
                    control={disableControl}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Nhap ma TOTP"
                        maxLength={6}
                        status={disableErrors.code ? 'error' : undefined}
                      />
                    )}
                  />
                  <Button danger htmlType="submit" loading={disable2FA.isPending}>
                    Tat 2FA
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
            <Card size="small" title="Ma khoi phuc">
              <Paragraph type="secondary">
                Ma khoi phuc giup ban truy cap tai khoan khi khong co ung dung xac thuc.
              </Paragraph>
              <Button onClick={onRegenerateCodes} loading={regenCodes.isPending}>
                Tao lai ma khoi phuc
              </Button>
              {recoveryCodes && (
                <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                  <Paragraph strong>Hay luu lai cac ma nay o noi an toan:</Paragraph>
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
                      message.success('Da sao chep ma khoi phuc')
                    }}
                  >
                    Sao chep
                  </Button>
                </div>
              )}
            </Card>
          </>
        ) : (
          <>
            <Alert
              type="warning"
              showIcon
              message="Xac thuc hai lop chua duoc bat"
              description="Bat xac thuc hai lop de tang cuong bao mat cho tai khoan."
            />

            {!totpData ? (
              <Button type="primary" onClick={onStartSetup} loading={enable2FA.isPending || setupTotp.isPending}>
                Bat xac thuc hai lop
              </Button>
            ) : (
              <Card size="small" title="Thiet lap TOTP">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Paragraph>
                    Quet ma QR duoi day bang ung dung xac thuc hoac nhap khoa thu cong:
                  </Paragraph>

                  {/* QR Code */}
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <QRCode value={totpData.qrCodeUri} size={200} />
                  </div>

                  <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 8, textAlign: 'center' }}>
                    <Text type="secondary">Khoa thu cong:</Text>
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
                            placeholder="Nhap ma 6 chu so"
                            maxLength={6}
                            status={confirmErrors.code ? 'error' : undefined}
                          />
                        )}
                      />
                      <Button type="primary" htmlType="submit" loading={confirmTotp.isPending}>
                        Xac nhan
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
  const { data: sessions, isLoading } = useSessions()

  const columns: ColumnsType<UserSessionDto> = [
    {
      title: 'Thiet bi',
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
      title: 'Dia chi IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Trang thai',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: UserSessionDto) => (
        <Space>
          <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Dang hoat dong' : 'Khong hoat dong'}</Tag>
          {record.isCurrentDevice && <Tag color="blue">Thiet bi hien tai</Tag>}
        </Space>
      ),
    },
    {
      title: 'Tao luc',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Het han tuyet doi',
      dataIndex: 'absoluteExpiresAt',
      key: 'absoluteExpiresAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
  ]

  return (
    <Card>
      <Table<UserSessionDto>
        columns={columns}
        dataSource={sessions?.items ?? []}
        rowKey="sessionId"
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: 'Khong co phien dang nhap nao' }}
      />
    </Card>
  )
}

// -- Login History Tab ---------------------------------------------------------

function LoginHistorySection() {
  const [params, setParams] = useState<PaginationParams>({
    pageNumber: 1,
    pageSize: 10,
  })

  const { data, isLoading } = useLoginHistory(params)

  const columns: ColumnsType<LoginHistoryDto> = [
    {
      title: 'Thoi gian dang nhap',
      dataIndex: 'loginAt',
      key: 'loginAt',
      render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Trang thai',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={status === 'success' ? 'green' : 'red'}
          icon={status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {status === 'success' ? 'Thanh cong' : 'That bai'}
        </Tag>
      ),
    },
    {
      title: 'Thiet bi',
      dataIndex: 'userAgent',
      key: 'userAgent',
    },
    {
      title: 'Dia chi IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
  ]

  return (
    <Card>
      <Table<LoginHistoryDto>
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: data?.metadata?.currentPage,
          pageSize: data?.metadata?.pageSize,
          total: data?.metadata?.totalCount,
          showSizeChanger: true,
          showTotal: (total) => `Tong ${total} muc`,
          onChange: (page, pageSize) => setParams({ pageNumber: page, pageSize }),
        }}
        locale={{ emptyText: 'Chua co lich su dang nhap' }}
      />
    </Card>
  )
}

// -- Main Component ------------------------------------------------------------

export default function SecurityPage() {
  const { t: _t } = useTranslation('common')

  const tabItems = [
    {
      key: 'password',
      label: (
        <span>
          <LockOutlined /> Mat khau
        </span>
      ),
      children: <ChangePasswordSection />,
    },
    {
      key: '2fa',
      label: (
        <span>
          <SafetyOutlined /> Xac thuc hai lop
        </span>
      ),
      children: <TwoFactorSection />,
    },
    {
      key: 'sessions',
      label: (
        <span>
          <DesktopOutlined /> Phien dang nhap
        </span>
      ),
      children: <SessionsSection />,
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Lich su dang nhap
        </span>
      ),
      children: <LoginHistorySection />,
    },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Title level={2}>Bao mat</Title>
      <Tabs items={tabItems} />
    </div>
  )
}
