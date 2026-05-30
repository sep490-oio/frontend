import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import {
  Typography,
  Button,
  Input,
  DatePicker,
  Select,
  Upload,
  Spin,
  Alert,
  Avatar,
  Row,
  Col,
  App,
  Flex,
  Space,
} from 'antd'
import { UserOutlined, UploadOutlined, PhoneOutlined, CheckCircleOutlined, CameraOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCurrentUser, useCurrentUserProfile, useUpdateProfile, useSetPhoneNumber, useConfirmPhoneNumber } from '../api'
import { useResendConfirmEmail } from '@/features/auth/api'
import { AddressesSection } from '../components/AddressesSection'
import type { Gender } from '@/types/enums'
import { MONO_FONT, SANS_FONT } from '@/styles/tokens'

const { Title, Text } = Typography

// -- Schema types (schemas created inside component to access i18n) ----------

type ProfileFormValues = {
  firstName: string
  lastName: string
  displayName: string
  dateOfBirth?: string
  gender?: string
  avatarMediaUploadId?: string
}

type PhoneFormValues = {
  phoneNumber: string
  countryCode: string
}

type ConfirmPhoneFormValues = {
  code: string
}

// -- Styles --------------------------------------------------------------------



const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

// -- Component -----------------------------------------------------------------

export default function ProfilePage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  // Schemas defined inside component so validation messages use i18n
  const profileSchema = z.object({
    firstName: z.string().min(1, t('profile.validation.firstNameRequired')).max(50, t('profile.validation.maxChars', { max: 50 })),
    lastName: z.string().min(1, t('profile.validation.lastNameRequired')).max(50, t('profile.validation.maxChars', { max: 50 })),
    displayName: z.string().min(1, t('profile.validation.displayNameRequired')).max(100, t('profile.validation.maxChars', { max: 100 })),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    avatarMediaUploadId: z.string().optional(),
  })

  const phoneSchema = z.object({
    phoneNumber: z.string().regex(/^[0-9]{9,11}$/, t('profile.validation.phoneInvalid')),
    countryCode: z.string().min(1, t('profile.validation.countryCodeRequired')),
  })

  const confirmPhoneSchema = z.object({
    code: z.string().length(6, t('profile.validation.otpLength')),
  })

  const [showPhoneVerify, setShowPhoneVerify] = useState(false)
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(null)
  const avatarUpload = useMediaUpload('user_avatar')
  const [avatarHover, setAvatarHover] = useState(false)

  const queryClient = useQueryClient()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: profile, isLoading: profileLoading } = useCurrentUserProfile()
  const resendEmail = useResendConfirmEmail()
  const updateProfile = useUpdateProfile()
  const setPhoneNumber = useSetPhoneNumber()
  const confirmPhone = useConfirmPhoneNumber()

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    setValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      displayName: profile?.displayName ?? '',
      dateOfBirth: profile?.dateOfBirth ?? '',
      gender: profile?.gender ?? '',
    },
  })

  const {
    control: phoneControl,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phoneNumber: '',
      countryCode: '+84',
    },
  })

  const {
    control: confirmControl,
    handleSubmit: handleConfirmSubmit,
    formState: { errors: confirmErrors },
  } = useForm<ConfirmPhoneFormValues>({
    resolver: zodResolver(confirmPhoneSchema),
    defaultValues: { code: '' },
  })

  const onProfileSave = handleProfileSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync({
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        displayName: values.displayName || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: (values.gender || undefined) as Gender | undefined,
        avatarMediaUploadId: values.avatarMediaUploadId || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() })
      setUploadedAvatarUrl(null)
      setValue('avatarMediaUploadId', undefined)
      message.success(t('profile.updateSuccess', 'Profile updated successfully'))
    } catch {
      message.error(t('profile.updateError', 'Failed to update profile'))
    }
  })

  const onPhoneSave = handlePhoneSubmit(async (values) => {
    try {
      await setPhoneNumber.mutateAsync(values)
      setShowPhoneVerify(true)
      message.success(t('profile.otpSent', 'Verification code sent'))
    } catch {
      message.error(t('profile.otpSendError', 'Failed to send verification code'))
    }
  })

  const onConfirmPhone = handleConfirmSubmit(async (values) => {
    try {
      await confirmPhone.mutateAsync({ verificationCode: values.code })
      setShowPhoneVerify(false)
      message.success(t('profile.phoneVerified', 'Phone verified successfully'))
    } catch {
      message.error(t('profile.otpInvalid', 'Invalid verification code'))
    }
  })

  const handleAvatarUpload = async (file: File) => {
    try {
      const result = await avatarUpload.upload(file)
      setValue('avatarMediaUploadId', result.mediaUploadId)
      setUploadedAvatarUrl(result.secureUrl)
      message.success(t('profile.avatarUploaded', 'Avatar uploaded'))
    } catch {
      message.error(t('profile.avatarUploadError', 'Failed to upload avatar'))
    }
    return false
  }

  if (userLoading || profileLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 64 : 120 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: isMobile ? '24px 16px 80px' : '40px 32px 80px',
      fontFamily: SANS_FONT
    }}>
      {/* Header with Background Accent */}
      <div style={{ 
        position: 'relative',
        marginBottom: 48,
        padding: isMobile ? '32px 24px' : '48px 40px',
        background: 'var(--color-bg-card)',
        borderRadius: 32,
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}>
        {/* Decorative background element */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, var(--color-accent-light) 0%, transparent 70%)',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        <Flex align="center" gap={isMobile ? 16 : 32} vertical={isMobile}>
          <div
            style={{ position: 'relative', flexShrink: 0 }}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            <Avatar
              size={isMobile ? 100 : 140}
              icon={<UserOutlined />}
              src={uploadedAvatarUrl || profile?.avatarUrl}
              style={{
                border: '4px solid var(--color-bg-card)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                background: 'var(--color-bg-surface)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: avatarHover ? 'scale(1.02)' : 'none'
              }}
            />
            <Upload
              showUploadList={false}
              accept="image/*"
              beforeUpload={handleAvatarUpload}
            >
              <Button
                icon={<CameraOutlined />}
                shape="circle"
                size="large"
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  background: 'var(--color-accent)',
                  color: '#fff',
                  border: '4px solid var(--color-bg-card)',
                  boxShadow: 'var(--shadow-md)',
                  opacity: avatarHover || isMobile ? 1 : 0.8,
                  transform: avatarHover ? 'scale(1.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              />
            </Upload>
          </div>

          <div style={{ textAlign: isMobile ? 'center' : 'left', flex: 1 }}>
            <Title
              level={1}
              style={{
                margin: 0,
                fontSize: isMobile ? 28 : 40,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-primary)'
              }}
            >
              {profile?.displayName || user?.email?.split('@')[0]}
            </Title>
            <Flex align="center" gap={8} justify={isMobile ? 'center' : 'flex-start'} style={{ marginTop: 8 }}>
              <Text style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: 16,
                fontFamily: MONO_FONT 
              }}>
                {user?.email}
              </Text>
              {user?.emailConfirmed && (
                <CheckCircleOutlined style={{ color: 'var(--color-success)', fontSize: 16 }} />
              )}
            </Flex>
          </div>

          {!isMobile && (
             <Button 
                icon={<UploadOutlined />} 
                onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                style={{ borderRadius: 12, height: 44, padding: '0 24px' }}
             >
                {t('profile.changeAvatar', 'Update Photo')}
             </Button>
          )}
        </Flex>
      </div>

      {/* Email not confirmed banner */}
      {user && !user.emailConfirmed && (
        <Alert
          type="warning"
          showIcon
          style={{ 
            marginBottom: 40, 
            borderRadius: 24, 
            padding: '20px 24px',
            background: 'rgba(250, 173, 20, 0.05)',
            border: '1px solid rgba(250, 173, 20, 0.2)'
          }}
          message={<Text strong style={{ fontSize: 16 }}>{t('profile.emailNotConfirmed', 'Email Verification Required')}</Text>}
          description={
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {t('profile.emailNotConfirmedDesc', 'Please verify your email address to unlock all platform features.')}
              </Text>
              <Button
                type="primary"
                loading={resendEmail.isPending}
                onClick={async () => {
                  try {
                    await resendEmail.mutateAsync({ email: user.email })
                    message.success(t('profile.resendSuccess', 'Verification email sent!'))
                  } catch {
                    message.error(t('profile.resendError', 'Failed to send verification email.'))
                  }
                }}
                style={{ 
                  background: '#faad14', 
                  borderColor: '#faad14', 
                  color: '#000', 
                  fontWeight: 600,
                  borderRadius: 10
                }}
              >
                {t('profile.resendEmail', 'Resend Verification Email')}
              </Button>
            </div>
          }
        />
      )}

      <Row gutter={[40, 40]}>
        {/* Main Content: Personal Information */}
        <Col xs={24} lg={16}>
          <div style={{ 
            background: 'var(--color-bg-card)', 
            borderRadius: 32, 
            border: '1px solid var(--color-border)',
            padding: isMobile ? '32px 24px' : '40px',
            boxShadow: 'var(--shadow-sm)'
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
                <UserOutlined style={{ fontSize: 20 }} />
              </div>
              <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                {t('profile.personalInfo', 'Personal Details')}
              </Title>
            </Flex>

            <form onSubmit={onProfileSave}>
              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>{t('profile.firstName', 'First Name')}</label>
                    <Controller
                      name="firstName"
                      control={profileControl}
                      render={({ field }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Input
                            {...field}
                            size="large"
                            placeholder={t('profile.firstNamePlaceholder', 'First name')}
                            status={profileErrors.firstName ? 'error' : undefined}
                            style={{ borderRadius: 12 }}
                          />
                          {profileErrors.firstName && (
                            <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.firstName.message}</Text>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>{t('profile.lastName', 'Last Name')}</label>
                    <Controller
                      name="lastName"
                      control={profileControl}
                      render={({ field }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Input
                            {...field}
                            size="large"
                            placeholder={t('profile.lastNamePlaceholder', 'Last name')}
                            status={profileErrors.lastName ? 'error' : undefined}
                            style={{ borderRadius: 12 }}
                          />
                          {profileErrors.lastName && (
                            <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.lastName.message}</Text>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </Col>
              </Row>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>{t('profile.displayName', 'Public Display Name')}</label>
                <Controller
                  name="displayName"
                  control={profileControl}
                  render={({ field }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Input
                        {...field}
                        size="large"
                        placeholder={t('profile.displayNamePlaceholder', 'How others see you')}
                        status={profileErrors.displayName ? 'error' : undefined}
                        style={{ borderRadius: 12 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
                        {t('profile.displayNameHint', 'This name will be shown on your auction activity and public profile.')}
                      </Text>
                      {profileErrors.displayName && (
                        <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.displayName.message}</Text>
                      )}
                    </div>
                  )}
                />
              </div>

              <Row gutter={24}>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 32 }}>
                    <label style={labelStyle}>{t('profile.dateOfBirth', 'Date of Birth')}</label>
                    <Controller
                      name="dateOfBirth"
                      control={profileControl}
                      render={({ field }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <DatePicker
                            size="large"
                            style={{ width: '100%', borderRadius: 12 }}
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                            placeholder={t('profile.dateOfBirthPlaceholder', 'Select date')}
                            format="DD/MM/YYYY"
                            disabledDate={(current) => current && current > dayjs().endOf('day')}
                          />
                          {profileErrors.dateOfBirth && (
                            <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.dateOfBirth.message}</Text>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div style={{ marginBottom: 32 }}>
                    <label style={labelStyle}>{t('profile.gender', 'Gender')}</label>
                    <Controller
                      name="gender"
                      control={profileControl}
                      render={({ field }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Select
                            {...field}
                            size="large"
                            style={{ width: '100%' }}
                            placeholder={t('profile.genderPlaceholder', 'Select gender')}
                            allowClear
                            className="oio-select"
                            options={[
                              { value: 'male', label: t('profile.genderMale', 'Male') },
                              { value: 'female', label: t('profile.genderFemale', 'Female') },
                              { value: 'other', label: t('profile.genderOther', 'Other') },
                            ]}
                          />
                          {profileErrors.gender && (
                            <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.gender.message}</Text>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </Col>
              </Row>

              <Button
                type="primary"
                htmlType="submit"
                loading={updateProfile.isPending}
                size="large"
                block={isMobile}
                style={{
                  height: 52,
                  borderRadius: 14,
                  padding: '0 40px',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px -6px rgba(var(--color-accent-rgb, 2, 132, 199), 0.4)'
                }}
              >
                {t('profile.saveChanges', 'Save Changes')}
              </Button>
            </form>
          </div>
          
          <AddressesSection />
        </Col>

        {/* Sidebar Content: Security & Verification */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={32} style={{ width: '100%' }}>
            {/* Phone Verification Card */}
            <div style={{ 
              background: 'var(--color-bg-card)', 
              borderRadius: 32, 
              border: '1px solid var(--color-border)',
              padding: '32px 24px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 10, 
                  background: user?.phoneNumberConfirmed ? 'var(--color-success-soft)' : 'var(--color-warning-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: user?.phoneNumberConfirmed ? 'var(--color-success)' : 'var(--color-warning)'
                }}>
                  <PhoneOutlined style={{ fontSize: 18 }} />
                </div>
                <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                  {t('profile.phoneSection', 'Security Contact')}
                </Title>
              </Flex>

              {user?.phoneNumberConfirmed ? (
                <div style={{ 
                  padding: 16, 
                  background: 'var(--color-bg-surface)', 
                  borderRadius: 16,
                  border: '1px solid var(--color-border-light)'
                }}>
                  <Flex align="center" gap={10} style={{ marginBottom: 4 }}>
                    <CheckCircleOutlined style={{ color: 'var(--color-success)' }} />
                    <Text strong>{t('profile.verified', 'Verified')}</Text>
                  </Flex>
                  <Text style={{ fontFamily: MONO_FONT, fontSize: 16, display: 'block' }}>
                    {user.countryCode} {user.phoneNumber}
                  </Text>
                </div>
              ) : (
                <>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
                    {t('profile.phoneHint', 'Add your phone number to enable 2FA and receive important auction alerts.')}
                  </Text>
                  
                  <form onSubmit={onPhoneSave}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Controller
                        name="countryCode"
                        control={phoneControl}
                        render={({ field }) => (
                          <Select
                            {...field}
                            size="large"
                            style={{ width: '100%' }}
                            options={[
                              { value: '+84', label: '🇻🇳 +84' },
                              { value: '+1', label: '🇺🇸 +1' },
                              { value: '+81', label: '🇯🇵 +81' },
                            ]}
                          />
                        )}
                      />
                      <Controller
                        name="phoneNumber"
                        control={phoneControl}
                        render={({ field }) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Input
                              {...field}
                              size="large"
                              placeholder={t('profile.phonePlaceholder', 'Phone number')}
                              status={phoneErrors.phoneNumber ? 'error' : undefined}
                              style={{ borderRadius: 12 }}
                            />
                            {phoneErrors.phoneNumber && (
                              <Text type="danger" style={{ fontSize: 11 }}>{phoneErrors.phoneNumber.message}</Text>
                            )}
                          </div>
                        )}
                      />
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={setPhoneNumber.isPending}
                        block
                        style={{ height: 44, borderRadius: 12, fontWeight: 600, marginTop: 4 }}
                      >
                        {t('profile.verifyPhone', 'Verify Phone')}
                      </Button>
                    </Space>
                  </form>

                  {showPhoneVerify && (
                    <div style={{ 
                      marginTop: 20, 
                      padding: 20, 
                      background: 'var(--color-bg-surface)', 
                      borderRadius: 20,
                      border: '1px solid var(--color-accent-light)'
                    }}>
                      <form onSubmit={onConfirmPhone}>
                        <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                          {t('profile.enterCode', 'Verification Code')}
                        </Text>
                        <Flex gap={8}>
                          <Controller
                            name="code"
                            control={confirmControl}
                            render={({ field }) => (
                              <Input
                                {...field}
                                size="large"
                                placeholder="000000"
                                maxLength={6}
                                style={{ 
                                  textAlign: 'center', 
                                  fontFamily: MONO_FONT, 
                                  letterSpacing: '0.2em',
                                  fontSize: 16,
                                  borderRadius: 10
                                }}
                              />
                            )}
                          />
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={confirmPhone.isPending}
                            style={{ 
                              height: 40, 
                              borderRadius: 10,
                              background: 'var(--color-success)',
                              borderColor: 'var(--color-success)'
                            }}
                          >
                            {t('profile.confirm', 'OK')}
                          </Button>
                        </Flex>
                        {confirmErrors.code && (
                          <Text type="danger" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>{confirmErrors.code.message}</Text>
                        )}
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Stats / Info Card */}
            <div style={{ 
              background: 'var(--color-bg-card)', 
              borderRadius: 32, 
              border: '1px solid var(--color-border)',
              padding: '24px',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle background decoration */}
              <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                background: 'var(--color-accent-light)',
                borderRadius: '50%',
                filter: 'blur(30px)',
                zIndex: 0
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
                  <div style={{ 
                    padding: 8, 
                    background: 'var(--color-accent-light)', 
                    borderRadius: 10,
                    color: 'var(--color-accent)',
                    display: 'flex'
                  }}>
                    <SafetyCertificateOutlined style={{ fontSize: 18 }} />
                  </div>
                  <Title level={5} style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                    {t('profile.membership', 'OIO Member')}
                  </Title>
                </Flex>

                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Flex justify="space-between" align="center">
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('profile.memberSince', 'Joined')}
                    </Text>
                    <Text strong style={{ fontSize: 14 }}>
                      {user?.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY') : '-'}
                    </Text>
                  </Flex>
                  
                  <Flex justify="space-between" align="center">
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {t('profile.accountStatus', 'Status')}
                    </Text>
                    <Flex align="center" gap={6}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)' }} />
                      <Text strong style={{ fontSize: 14, color: '#22c55e' }}>{t('profile.active', 'Active Account')}</Text>
                    </Flex>
                  </Flex>
                </Space>
              </div>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
