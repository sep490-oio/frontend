/**
 * ProfileInfoTab — displays and edits the user's profile information.
 *
 * Read-only fields: email (with confirmed badge), username
 * Editable fields: firstName, lastName, displayName, dateOfBirth, gender
 * Uses React Hook Form + Zod for validation, same pattern as RegisterPage.
 */
import { useEffect } from 'react';
import {
  Avatar,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Tag,
  Typography,
  message,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useUpdateProfile } from '@/hooks/useUser';
import type { ApiUserDto } from '@/types';
import type { UserProfile } from '@/types/user';

const { Text } = Typography;

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileInfoTabProps {
  currentUser: ApiUserDto | undefined;
  userProfile: UserProfile | undefined;
}

export function ProfileInfoTab({ currentUser, userProfile }: ProfileInfoTabProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const updateProfileMutation = useUpdateProfile();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      dateOfBirth: '',
      gender: '',
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (userProfile) {
      reset({
        firstName: userProfile.firstName ?? '',
        lastName: userProfile.lastName ?? '',
        displayName: userProfile.displayName ?? '',
        dateOfBirth: userProfile.dateOfBirth ?? '',
        gender: userProfile.gender ?? '',
      });
    }
  }, [userProfile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync({
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        displayName: data.displayName || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
      });
      message.success(t('profile.updateSuccess'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const genderOptions = [
    { value: 'male', label: t('profile.genderMale') },
    { value: 'female', label: t('profile.genderFemale') },
    { value: 'other', label: t('profile.genderOther') },
  ];

  return (
    <div className="profile-info-tab">
      {/* Avatar section */}
      <div className="profile-avatar-section">
        <Avatar
          size={80}
          src={userProfile?.avatarUrl}
          icon={!userProfile?.avatarUrl ? <UserOutlined /> : undefined}
        />
        <div className="profile-avatar-info">
          <Text strong style={{ fontSize: 16 }}>
            {userProfile?.displayName || userProfile?.fullName || currentUser?.userName}
          </Text>
          <Text type="secondary" style={{ fontSize: 13 }}>
            @{currentUser?.userName}
          </Text>
        </div>
      </div>

      {/* Read-only fields */}
      <div className="profile-readonly-section">
        <Text className="profile-field-label">{t('profile.email')}</Text>
        <div className="profile-readonly-value">
          <Text>{currentUser?.email}</Text>
          {currentUser?.emailConfirmed ? (
            <Tag className="profile-tag profile-tag-confirmed">{t('profile.confirmed')}</Tag>
          ) : (
            <Tag className="profile-tag profile-tag-unconfirmed">{t('profile.unconfirmed')}</Tag>
          )}
        </div>

        <Text className="profile-field-label">{t('profile.username')}</Text>
        <div className="profile-readonly-value">
          <Text>{currentUser?.userName}</Text>
        </div>
      </div>

      {/* Editable form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Text className="profile-field-label">{t('profile.personalInfo')}</Text>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.firstName ? 'error' : undefined}
              help={errors.firstName?.message ? t(errors.firstName.message) : undefined}
              style={{ marginBottom: isMobile ? 16 : 0 }}
            >
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('profile.firstName')}
                    size="large"
                    variant="borderless"
                    className="profile-input"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.lastName ? 'error' : undefined}
              help={errors.lastName?.message ? t(errors.lastName.message) : undefined}
              style={{ marginBottom: 0 }}
            >
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('profile.lastName')}
                    size="large"
                    variant="borderless"
                    className="profile-input"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.displayName ? 'error' : undefined}
              help={errors.displayName?.message ? t(errors.displayName.message) : undefined}
              style={{ marginBottom: isMobile ? 16 : 0 }}
            >
              <Controller
                name="displayName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('profile.displayName')}
                    size="large"
                    variant="borderless"
                    className="profile-input"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.gender ? 'error' : undefined}
              help={errors.gender?.message ? t(errors.gender.message) : undefined}
              style={{ marginBottom: 0 }}
            >
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder={t('profile.gender')}
                    size="large"
                    variant="borderless"
                    options={genderOptions}
                    allowClear
                    className="profile-select"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.dateOfBirth ? 'error' : undefined}
              help={errors.dateOfBirth?.message ? t(errors.dateOfBirth.message) : undefined}
              style={{ marginBottom: 0 }}
            >
              <Controller
                name="dateOfBirth"
                control={control}
                render={({ field }) =>
                  isMobile ? (
                    <Input
                      type="date"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder={t('profile.dateOfBirth')}
                      size="large"
                      variant="borderless"
                      className="profile-input"
                    />
                  ) : (
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                      placeholder={t('profile.dateOfBirth')}
                      size="large"
                      variant="borderless"
                      style={{ width: '100%' }}
                      className="profile-input"
                    />
                  )
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting || updateProfileMutation.isPending}
          disabled={!isDirty}
          size="large"
          className="profile-save-button"
        >
          {t('profile.saveChanges')}
        </Button>
      </form>
    </div>
  );
}
