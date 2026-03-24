import { useState } from 'react'
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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
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
  const { t: _t } = useTranslation('common')
  const { message } = App.useApp()
  const [showPhoneVerify, setShowPhoneVerify] = useState(false)
  const [avatarHover, setAvatarHover] = useState(false)

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
      })
      message.success('Cap nhat ho so thanh cong')
    } catch {
      message.error('Khong the cap nhat ho so')
    }
  })

  const onPhoneSave = handlePhoneSubmit(async (values) => {
    try {
      await setPhoneNumber.mutateAsync(values)
      setShowPhoneVerify(true)
      message.success('Ma xac nhan da duoc gui den so dien thoai cua ban')
    } catch {
      message.error('Khong the gui ma xac nhan')
    }
  })

  const onConfirmPhone = handleConfirmSubmit(async (values) => {
    try {
      await confirmPhone.mutateAsync(values)
      setShowPhoneVerify(false)
      message.success('Xac nhan so dien thoai thanh cong')
    } catch {
      message.error('Ma xac nhan khong chinh xac')
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Page Heading */}
      <h1
        style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontWeight: 400,
          fontSize: 28,
          color: 'var(--color-text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.01em',
        }}
      >
        Ho so ca nhan
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 32 }}>
        Quan ly thong tin tai khoan cua ban
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
            beforeUpload={() => false}
            disabled
          >
            <Button icon={<UploadOutlined />} disabled size="small" style={{ marginTop: 8 }}>
              Thay doi anh dai dien (sap ra mat)
            </Button>
          </Upload>
          <Text type="secondary" style={{ fontSize: 13 }}>{user?.email}</Text>
        </Space>
      </Card>

      {/* Profile Form */}
      <Card
        style={{ marginBottom: 32 }}
        title={<span style={sectionHeadingStyle}>Thong tin ca nhan</span>}
      >
        <form onSubmit={onProfileSave}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Ho</label>
                <Controller
                  name="firstName"
                  control={profileControl}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Nhap ho"
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
                <label style={labelStyle}>Ten</label>
                <Controller
                  name="lastName"
                  control={profileControl}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Nhap ten"
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
            <label style={labelStyle}>Ten hien thi</label>
            <Controller
              name="displayName"
              control={profileControl}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Nhap ten hien thi..."
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
                <label style={labelStyle}>Ngay sinh</label>
                <Controller
                  name="dateOfBirth"
                  control={profileControl}
                  render={({ field }) => (
                    <DatePicker
                      style={{ width: '100%', height: 42 }}
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      placeholder="Chon ngay sinh"
                      format="DD/MM/YYYY"
                    />
                  )}
                />
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Gioi tinh</label>
                <Controller
                  name="gender"
                  control={profileControl}
                  render={({ field }) => (
                    <Select
                      {...field}
                      style={{ width: '100%' }}
                      placeholder="Chon gioi tinh"
                      allowClear
                      options={[
                        { value: 'male', label: 'Nam' },
                        { value: 'female', label: 'Nu' },
                        { value: 'other', label: 'Khac' },
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
            Luu thay doi
          </Button>
        </form>
      </Card>

      {/* Phone Number Section */}
      <Card
        style={{ marginBottom: 32 }}
        title={<span style={sectionHeadingStyle}>So dien thoai</span>}
      >
        {user?.phoneNumberConfirmed ? (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={`So dien thoai ${user.countryCode ?? ''} ${user.phoneNumber ?? ''} da duoc xac nhan`}
            style={{ borderRadius: 2 }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
              Them so dien thoai de bao mat tai khoan tot hon.
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
                        placeholder="Nhap so dien thoai"
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
                    Gui ma
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
                          placeholder="Nhap ma 6 chu so"
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
                      Xac nhan
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
