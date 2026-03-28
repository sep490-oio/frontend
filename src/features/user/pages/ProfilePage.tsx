import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryClient'
import {
  Typography,
  Card,
  Button,
  Input,
  DatePicker,
  Select,
  Upload,
  Space,
  Spin,
  Alert,
  Divider,
  Avatar,
  Row,
  Col,
  App,
} from 'antd'
import { UserOutlined, UploadOutlined, PhoneOutlined, CheckCircleOutlined, CameraOutlined } from '@ant-design/icons'
import { useMediaUpload } from '@/hooks/useMediaUpload'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCurrentUser, useCurrentUserProfile, useUpdateProfile, useSetPhoneNumber, useConfirmPhoneNumber } from '../api'
import type { Gender } from '@/types/enums'

const { Text } = Typography

// -- Schemas -------------------------------------------------------------------

const profileSchema = z.object({
  firstName: z.string().max(50, 'Toi da 50 ky tu').optional().or(z.literal('')),
  lastName: z.string().max(50, 'Toi da 50 ky tu').optional().or(z.literal('')),
  displayName: z.string().max(100, 'Toi da 100 ky tu').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^[0-9]{9,11}$/, 'So dien thoai khong hop le'),
  countryCode: z.string().min(1, 'Vui long chon ma quoc gia'),
})

type PhoneFormValues = z.infer<typeof phoneSchema>

const confirmPhoneSchema = z.object({
  code: z.string().length(6, 'Ma xac nhan phai gom 6 chu so'),
})

type ConfirmPhoneFormValues = z.infer<typeof confirmPhoneSchema>

// -- Styles --------------------------------------------------------------------

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "'DM Serif Display', Georgia, serif",
  fontWeight: 400,
  fontSize: 16,
  color: 'var(--color-text-primary)',
  margin: 0,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
}

// -- Component -----------------------------------------------------------------

export default function ProfilePage() {
  const { t } = useTranslation('user')
  const { isMobile } = useBreakpoint()
  const { message } = App.useApp()
  const [showPhoneVerify, setShowPhoneVerify] = useState(false)
  const [avatarUploadId, setAvatarUploadId] = useState<string | null>(null)
  const avatarUpload = useMediaUpload('user_avatar')
  const [avatarHover, setAvatarHover] = useState(false)

  const queryClient = useQueryClient()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const { data: profile, isLoading: profileLoading } = useCurrentUserProfile()
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
      message.success(t('user:profile.updateSuccess', 'Profile updated successfully'))
    } catch {
      message.error(t('user:profile.updateError', 'Failed to update profile'))
    }
  })

  const onPhoneSave = handlePhoneSubmit(async (values) => {
    try {
      await setPhoneNumber.mutateAsync(values)
      setShowPhoneVerify(true)
      message.success(t('user:profile.otpSent', 'Verification code sent'))
    } catch {
      message.error(t('user:profile.otpSendError', 'Failed to send verification code'))
    }
  })

  const onConfirmPhone = handleConfirmSubmit(async (values) => {
    try {
      await confirmPhone.mutateAsync({ verificationCode: values.code })
      setShowPhoneVerify(false)
      message.success(t('user:profile.phoneVerified', 'Phone verified successfully'))
    } catch {
      message.error(t('user:profile.otpInvalid', 'Invalid verification code'))
    }
  })

  if (userLoading || profileLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '0 12px' : undefined }}>
      {/* Page Heading */}
      <h1
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontWeight: 400,
          fontSize: isMobile ? 22 : 28,
          color: 'var(--color-text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        {t('user:profile.title', 'My Profile')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: isMobile ? 20 : 32 }}>
        {t('user:profile.subtitle', 'Manage your account information')}
      </p>

      {/* Avatar Section */}
      <Card style={{ marginBottom: 32 }}>
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '8px 0' }}>
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            <Avatar
              size={96}
              icon={<UserOutlined />}
              src={profile?.avatarUrl}
              style={{
                border: '3px solid var(--color-border)',
                transition: 'border-color 200ms ease',
                ...(avatarHover ? { borderColor: 'var(--color-accent)' } : {}),
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: avatarHover ? 1 : 0,
                transition: 'opacity 200ms ease',
              }}
            >
              <CameraOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
          </div>
          <Upload
            showUploadList={false}
            accept="image/*"
            beforeUpload={async (file) => {
              try {
                const result = await avatarUpload.upload(file)
                setAvatarUploadId(result.mediaUploadId)
                message.success(t('user:profile.avatarUploaded', 'Avatar uploaded'))
              } catch {
                message.error(t('user:profile.avatarUploadError', 'Failed to upload avatar'))
              }
              return false
            }}
          >
            <Button icon={<UploadOutlined />} size="small" style={{ marginTop: 8 }} loading={avatarUpload.uploading}>
              {t('user:profile.changeAvatar', 'Change Avatar')}
            </Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: 13 }}>{user?.email}</Text>
        </Space>
      </Card>

      {/* Profile Form */}
      <Card
        style={{ marginBottom: 32 }}
        title={<span style={sectionHeadingStyle}>{t('user:profile.personalInfo', 'Personal Information')}</span>}
      >
        <form onSubmit={onProfileSave}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t('user:profile.firstName', 'First Name')}</label>
                <Controller
                  name="firstName"
                  control={profileControl}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('user:profile.firstNamePlaceholder', 'Enter first name')}
                      status={profileErrors.firstName ? 'error' : undefined}
                      style={{ height: 42 }}
                    />
                  )}
                />
                {profileErrors.firstName && (
                  <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.firstName.message}</Text>
                )}
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t('user:profile.lastName', 'Last Name')}</label>
                <Controller
                  name="lastName"
                  control={profileControl}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={t('user:profile.lastNamePlaceholder', 'Enter last name')}
                      status={profileErrors.lastName ? 'error' : undefined}
                      style={{ height: 42 }}
                    />
                  )}
                />
                {profileErrors.lastName && (
                  <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.lastName.message}</Text>
                )}
              </div>
            </Col>
          </Row>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>{t('user:profile.displayName', 'Display Name')}</label>
            <Controller
              name="displayName"
              control={profileControl}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t('user:profile.displayNamePlaceholder', 'Enter display name')}
                  status={profileErrors.displayName ? 'error' : undefined}
                  style={{ height: 42 }}
                />
              )}
            />
            {profileErrors.displayName && (
              <Text type="danger" style={{ fontSize: 12 }}>{profileErrors.displayName.message}</Text>
            )}
          </div>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t('user:profile.dateOfBirth', 'Date of Birth')}</label>
                <Controller
                  name="dateOfBirth"
                  control={profileControl}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: '100%', height: 42 }}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      placeholder={t('user:profile.dateOfBirthPlaceholder', 'Select date of birth')}
                      format="DD/MM/YYYY"
                    />
                  )}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{t('user:profile.gender', 'Gender')}</label>
                <Controller
                  name="gender"
                  control={profileControl}
                  render={({ field }) => (
                    <Select
                      {...field}
                      style={{ width: '100%' }}
                      placeholder={t('user:profile.genderPlaceholder', 'Select gender')}
                      allowClear
                      options={[
                        { value: 'male', label: t('user:profile.genderMale', 'Male') },
                        { value: 'female', label: t('user:profile.genderFemale', 'Female') },
                        { value: 'other', label: t('user:profile.genderOther', 'Other') },
                      ]}
                    />
                  )}
                />
              </div>
            </Col>
          </Row>

          <Button
            type="primary"
            htmlType="submit"
            loading={updateProfile.isPending}
            style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
          >
            {t('user:profile.saveChanges', 'Save Changes')}
          </Button>
        </form>
      </Card>

      {/* Phone Number Section */}
      <Card
        style={{ marginBottom: 32 }}
        title={<span style={sectionHeadingStyle}>{t('user:profile.phoneNumber', 'Phone Number')}</span>}
      >
        {user?.phoneNumberConfirmed ? (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={t('user:profile.phoneConfirmed', 'Phone number {{code}} {{number}} has been verified', { code: user.countryCode ?? '', number: user.phoneNumber ?? '' })}
            style={{ borderRadius: 2 }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
              {t('user:profile.addPhoneHint', 'Add a phone number for better account security.')}
            </Text>
            <form onSubmit={onPhoneSave}>
              <Row gutter={8}>
                <Col xs={8} sm={6}>
                  <Controller
                    name="countryCode"
                    control={phoneControl}
                    render={({ field }) => (
                      <Select
                        {...field}
                        style={{ width: '100%' }}
                        options={[
                          { value: '+84', label: '+84 (VN)' },
                          { value: '+1', label: '+1 (US)' },
                          { value: '+81', label: '+81 (JP)' },
                        ]}
                      />
                    )}
                  />
                </Col>
                <Col xs={16} sm={12}>
                  <Controller
                    name="phoneNumber"
                    control={phoneControl}
                    render={({ field }) => (
                      <Input
                        {...field}
                        prefix={<PhoneOutlined />}
                        placeholder={t('user:profile.phonePlaceholder', 'Enter phone number')}
                        status={phoneErrors.phoneNumber ? 'error' : undefined}
                        style={{ height: 42 }}
                      />
                    )}
                  />
                  {phoneErrors.phoneNumber && (
                    <Text type="danger" style={{ fontSize: 12 }}>{phoneErrors.phoneNumber.message}</Text>
                  )}
                </Col>
                <Col xs={24} sm={6} style={{ marginTop: 'auto' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={setPhoneNumber.isPending}
                    icon={<PhoneOutlined />}
                    style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                  >
                    {t('user:profile.sendCode', 'Send Code')}
                  </Button>
                </Col>
              </Row>
            </form>

            {showPhoneVerify && (
              <>
                <Divider />
                <form onSubmit={onConfirmPhone}>
                  <Space>
                    <Controller
                      name="code"
                      control={confirmControl}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder={t('user:profile.otpPlaceholder', 'Enter 6-digit code')}
                          maxLength={6}
                          status={confirmErrors.code ? 'error' : undefined}
                          style={{ height: 42, fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}
                        />
                      )}
                    />
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={confirmPhone.isPending}
                      style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                    >
                      {t('user:profile.confirm', 'Confirm')}
                    </Button>
                  </Space>
                  {confirmErrors.code && (
                    <div>
                      <Text type="danger" style={{ fontSize: 12 }}>{confirmErrors.code.message}</Text>
                    </div>
                  )}
                </form>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
