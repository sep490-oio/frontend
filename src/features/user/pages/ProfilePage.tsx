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
} from 'antd'
import { UserOutlined, UploadOutlined, PhoneOutlined, CheckCircleOutlined, CameraOutlined, IdcardOutlined } from '@ant-design/icons'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCurrentUser, useCurrentUserProfile, useUpdateProfile, useSetPhoneNumber, useConfirmPhoneNumber } from '../api'
import { useResendConfirmEmail } from '@/features/auth/api'
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
}

type PhoneFormValues = {
  phoneNumber: string
  countryCode: string
}

type ConfirmPhoneFormValues = {
  code: string
}

// -- Styles --------------------------------------------------------------------

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: SANS_FONT,
  fontWeight: 600,
  fontSize: 18,
  color: 'var(--color-text-primary)',
  margin: 0,
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

// -- Component -----------------------------------------------------------------

export default function ProfilePage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()

  // Schemas defined inside component so validation messages use i18n
  // Schemas defined inside component so validation messages use i18n
  const profileSchema = z.object({
    firstName: z.string().min(1, t('profile.validation.firstNameRequired')).max(50, t('profile.validation.maxChars', { max: 50 })),
    lastName: z.string().min(1, t('profile.validation.lastNameRequired')).max(50, t('profile.validation.maxChars', { max: 50 })),
    displayName: z.string().min(1, t('profile.validation.displayNameRequired')).max(100, t('profile.validation.maxChars', { max: 100 })),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
  })

  const phoneSchema = z.object({
    phoneNumber: z.string().regex(/^[0-9]{9,11}$/, t('profile.validation.phoneInvalid')),
    countryCode: z.string().min(1, t('profile.validation.countryCodeRequired')),
  })

  const confirmPhoneSchema = z.object({
    code: z.string().length(6, t('profile.validation.otpLength')),
  })

  const [showPhoneVerify, setShowPhoneVerify] = useState(false)
  const [avatarUploadId, setAvatarUploadId] = useState<string | null>(null)
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
        avatarMediaUploadId: avatarUploadId || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() })
      setAvatarUploadId(null)
      setUploadedAvatarUrl(null)
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
      setAvatarUploadId(result.mediaUploadId)
      setUploadedAvatarUrl(result.secureUrl)
      message.success(t('profile.avatarUploaded', 'Avatar uploaded'))
    } catch {
      message.error(t('profile.avatarUploadError', 'Failed to upload avatar'))
    }
    return false
  }

  if (userLoading || profileLoading) {
    return (
      <div style={{ textAlign: 'center', padding: isMobile ? 48 : 80 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '48px 24px 80px' }}>
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
          <IdcardOutlined style={{ marginRight: 12, color: 'var(--color-accent)' }} />
          {t('profile.title', 'My Profile')}
        </Title>
        <Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
          {t('profile.subtitle', 'Manage your account information and preferences')}
        </Text>
      </div>

      {/* Email not confirmed banner */}
      {user && !user.emailConfirmed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 32, borderRadius: 20, padding: 20, border: '1px solid var(--color-warning)' }}
          message={<span style={{ fontWeight: 700, fontSize: 15 }}>{t('profile.emailNotConfirmed', 'Your email is not verified')}</span>}
          description={<div style={{ marginTop: 4, fontSize: 14 }}>{t('profile.emailNotConfirmedDesc', 'Please verify your email address to access all features.')}</div>}
          action={
            <Button
              size="large"
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
              style={{ background: 'var(--color-warning)', borderColor: 'var(--color-warning)', color: '#000', fontWeight: 700, borderRadius: 10, height: 44 }}
            >
              {t('profile.resendEmail', 'Resend Email')}
            </Button>
          }
        />
      )}

      <Row gutter={isMobile ? [24, 24] : [32, 32]}>
        {/* Left Col: Avatar & Status */}
        <Col xs={24} lg={8}>
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              textAlign: 'center',
              boxShadow: 'var(--shadow-sm)',
              position: 'sticky',
              top: 'var(--navbar-offset-desktop)',
              maxHeight: 'calc(100vh - var(--navbar-offset-desktop) - 20px)',
              padding: isMobile ? '40px 24px' : '48px 32px'
            }}
          >
            <div
              style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 24px' }}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
            >
              <Avatar
                size={140}
                icon={<UserOutlined />}
                src={uploadedAvatarUrl || profile?.avatarUrl}
                style={{
                  border: '6px solid var(--color-border)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'var(--color-bg-surface)',
                  boxShadow: 'var(--shadow-md)',
                  ...(avatarHover ? { borderColor: 'var(--color-accent)', transform: 'scale(1.02)' } : {}),
                }}
              />
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={handleAvatarUpload}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: avatarHover || isMobile ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    cursor: 'pointer',
                    border: '2px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <CameraOutlined style={{ color: '#fff', fontSize: 28 }} />
                </div>
              </Upload>
            </div>

            <Title level={4} style={{ margin: '0 0 4px 0', fontFamily: SANS_FONT, fontWeight: 700, fontSize: 20 }}>
              {profile?.displayName || user?.email?.split('@')[0]}
            </Title>
            <Text style={{ display: 'block', marginBottom: 32, color: 'var(--color-text-tertiary)', fontSize: 14, fontFamily: MONO_FONT }}>{user?.email}</Text>

            <Upload
              showUploadList={false}
              accept="image/*"
              beforeUpload={handleAvatarUpload}
            >
              <Button
                icon={<UploadOutlined />}
                loading={avatarUpload.uploading}
                block
                style={{ borderRadius: 14, fontWeight: 700, height: 48, background: 'var(--color-bg-surface)' }}
              >
                {t('profile.changeAvatar', 'Change Avatar')}
              </Button>
            </Upload>
          </div>
        </Col>

        {/* Right Col: Forms */}
        <Col xs={24} lg={16}>
          {/* Personal Info Form */}
          <div style={{ marginBottom: 20 }}>
            <span style={sectionHeadingStyle}>{t('profile.personalInfo', 'Personal Information')}</span>
          </div>
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              marginBottom: 32,
              boxShadow: 'var(--shadow-sm)',
              padding: isMobile ? '24px 20px' : '40px'
            }}
          >
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
                            placeholder={t('profile.firstNamePlaceholder', 'First name')}
                            status={profileErrors.firstName ? 'error' : undefined}
                            style={{ height: 52, borderRadius: 14 }}
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
                            placeholder={t('profile.lastNamePlaceholder', 'Last name')}
                            status={profileErrors.lastName ? 'error' : undefined}
                            style={{ height: 52, borderRadius: 14 }}
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
                <label style={labelStyle}>{t('profile.displayName', 'Display Name')}</label>
                <Controller
                  name="displayName"
                  control={profileControl}
                  render={({ field }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Input
                        {...field}
                        placeholder={t('profile.displayNamePlaceholder', 'Display name')}
                        status={profileErrors.displayName ? 'error' : undefined}
                        style={{ height: 52, borderRadius: 14 }}
                      />
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
                            style={{ width: '100%', height: 52, borderRadius: 14 }}
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
                            style={{ width: '100%', height: 52 }}
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
                  background: 'var(--color-accent)',
                  borderColor: 'var(--color-accent)',
                  fontWeight: 700,
                  height: 52,
                  borderRadius: 14,
                  padding: '0 48px'
                }}
              >
                {t('profile.saveChanges', 'Update Profile')}
              </Button>
            </form>
          </div>

          {/* Phone Number Section */}
          <div style={{ marginBottom: 20 }}>
            <span style={sectionHeadingStyle}>{t('profile.phoneNumber', 'Security Contact')}</span>
          </div>
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              boxShadow: 'var(--shadow-sm)',
              padding: isMobile ? '24px 20px' : '40px'
            }}
          >
            {user?.phoneNumberConfirmed ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={<span style={{ fontWeight: 700 }}>{t('profile.phoneConfirmed', 'Phone number verified')}</span>}
                description={<div style={{ fontFamily: MONO_FONT, marginTop: 4 }}>{user.countryCode} {user.phoneNumber}</div>}
                style={{ borderRadius: 20, padding: 20 }}
              />
            ) : (
              <>
                <Text style={{ display: 'block', marginBottom: 24, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                  {t('profile.addPhoneHint', 'Add a phone number for two-factor authentication and important security alerts.')}
                </Text>
                <form onSubmit={onPhoneSave}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={6}>
                       <Controller
                          name="countryCode"
                          control={phoneControl}
                          render={({ field }) => (
                             <Select
                                {...field}
                                style={{ width: '100%', height: 52 }}
                                className="oio-select"
                                options={[
                                   { value: '+84', label: '🇻🇳 +84' },
                                   { value: '+1', label: '🇺🇸 +1' },
                                   { value: '+81', label: '🇯🇵 +81' },
                                ]}
                             />
                          )}
                       />
                    </Col>
                    <Col xs={24} sm={12}>
                      <Controller
                        name="phoneNumber"
                        control={phoneControl}
                        render={({ field }) => (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Input
                              {...field}
                              prefix={<PhoneOutlined style={{ color: 'var(--color-accent)' }} />}
                              placeholder={t('profile.phonePlaceholder', 'Phone number')}
                              status={phoneErrors.phoneNumber ? 'error' : undefined}
                              style={{ height: 52, borderRadius: 14 }}
                            />
                            {phoneErrors.phoneNumber && (
                              <Text type="danger" style={{ fontSize: 12 }}>{phoneErrors.phoneNumber.message}</Text>
                            )}
                          </div>
                        )}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={setPhoneNumber.isPending}
                        block
                        style={{ background: 'var(--color-accent)', fontWeight: 700, height: 52, borderRadius: 14 }}
                      >
                        {t('profile.sendCode', 'Verify')}
                      </Button>
                    </Col>
                  </Row>
                </form>

                {showPhoneVerify && (
                  <div style={{ marginTop: 24, padding: 32, background: 'var(--color-bg-surface)', borderRadius: 24, border: '1px solid var(--color-border)' }}>
                    <form onSubmit={onConfirmPhone}>
                      <Flex vertical gap={20}>
                        <Text strong style={{ fontSize: 15, color: 'var(--color-text-primary)' }}>{t('profile.enterOtp', 'Enter the 6-digit code')}</Text>
                        <Flex gap={12} vertical={isMobile}>
                           <Controller
                             name="code"
                             control={confirmControl}
                             render={({ field }) => (
                               <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                 <Input
                                   {...field}
                                   placeholder="000000"
                                   maxLength={6}
                                   status={confirmErrors.code ? 'error' : undefined}
                                   style={{ 
                                     height: 52, 
                                     borderRadius: 14, 
                                     fontFamily: MONO_FONT, 
                                     letterSpacing: '0.4em', 
                                     textAlign: 'center', 
                                     width: isMobile ? '100%' : 200,
                                     fontSize: 20,
                                     fontWeight: 700
                                   }}
                                 />
                                 {confirmErrors.code && (
                                   <Text type="danger" style={{ fontSize: 12 }}>{confirmErrors.code.message}</Text>
                                 )}
                               </div>
                             )}
                           />
                           <Button
                             type="primary"
                             htmlType="submit"
                             loading={confirmPhone.isPending}
                             block={isMobile}
                             style={{ 
                               height: 52, 
                               borderRadius: 14, 
                               fontWeight: 700, 
                               background: 'var(--color-success)', 
                               borderColor: 'var(--color-success)',
                               padding: '0 40px'
                             }}
                           >
                             {t('profile.confirm', 'Confirm')}
                           </Button>
                        </Flex>
                      </Flex>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}
