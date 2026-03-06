/**
 * AddressFormModal — modal for adding or editing an address.
 *
 * Dynamic title based on mode (add vs edit).
 * Uses React Hook Form + Zod, same pattern as RegisterPage.
 */
import { useEffect } from 'react';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  message,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAddAddress, useUpdateAddress } from '@/hooks/useUser';
import type { UserAddress } from '@/types/user';

const addressSchema = z.object({
  type: z.enum(['home', 'work', 'other']),
  recipientName: z.string().min(1, 'profile.recipientNameRequired'),
  street: z.string().min(1, 'profile.streetRequired'),
  ward: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(1, 'profile.cityRequired'),
  postalCode: z.string().optional(),
  phoneNumber: z.string().min(1, 'profile.phoneRequired'),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  editingAddress?: UserAddress | null;
}

export function AddressFormModal({ open, onClose, editingAddress }: AddressFormModalProps) {
  const { t } = useTranslation();
  const { isMobile } = useBreakpoint();
  const addMutation = useAddAddress();
  const updateMutation = useUpdateAddress();

  const isEditing = !!editingAddress;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'home',
      recipientName: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      postalCode: '',
      phoneNumber: '',
      isDefault: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingAddress) {
      reset({
        type: editingAddress.type,
        recipientName: editingAddress.recipientName ?? '',
        street: editingAddress.street ?? '',
        ward: editingAddress.ward ?? '',
        district: editingAddress.district ?? '',
        city: editingAddress.city ?? '',
        postalCode: editingAddress.postalCode ?? '',
        phoneNumber: editingAddress.phoneNumber ?? '',
        isDefault: editingAddress.isDefault,
      });
    } else {
      reset({
        type: 'home',
        recipientName: '',
        street: '',
        ward: '',
        district: '',
        city: '',
        postalCode: '',
        phoneNumber: '',
        isDefault: false,
      });
    }
  }, [editingAddress, reset]);

  const onSubmit = async (data: AddressFormData) => {
    try {
      if (isEditing && editingAddress) {
        await updateMutation.mutateAsync({
          id: editingAddress.id,
          data: {
            type: data.type,
            recipientName: data.recipientName,
            street: data.street,
            ward: data.ward || undefined,
            district: data.district || undefined,
            city: data.city,
            postalCode: data.postalCode || undefined,
            phoneNumber: data.phoneNumber,
            isDefault: data.isDefault,
          },
        });
        message.success(t('profile.addressUpdated'));
      } else {
        await addMutation.mutateAsync({
          type: data.type,
          recipientName: data.recipientName,
          street: data.street,
          ward: data.ward || undefined,
          district: data.district || undefined,
          city: data.city,
          postalCode: data.postalCode || undefined,
          phoneNumber: data.phoneNumber,
          isDefault: data.isDefault,
        });
        message.success(t('profile.addressAdded'));
      }
      onClose();
    } catch {
      message.error(t('common.error'));
    }
  };

  const typeOptions = [
    { value: 'home', label: t('profile.addressType_home') },
    { value: 'work', label: t('profile.addressType_work') },
    { value: 'other', label: t('profile.addressType_other') },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={isEditing ? t('profile.editAddress') : t('profile.addAddress')}
      footer={null}
      width={isMobile ? '100%' : 520}
      style={isMobile ? { top: 20 } : undefined}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Address type */}
        <Form.Item
          validateStatus={errors.type ? 'error' : undefined}
          help={errors.type?.message ? t(errors.type.message) : undefined}
          className="profile-form-item"
        >
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={typeOptions}
                placeholder={t('profile.addressType')}
                size="large"
                variant="borderless"
                className="profile-select"
              />
            )}
          />
        </Form.Item>

        {/* Recipient name */}
        <Form.Item
          validateStatus={errors.recipientName ? 'error' : undefined}
          help={errors.recipientName?.message ? t(errors.recipientName.message) : undefined}
          className="profile-form-item"
        >
          <Controller
            name="recipientName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('profile.recipientName')}
                size="large"
                variant="borderless"
                className="profile-input"
              />
            )}
          />
        </Form.Item>

        {/* Street */}
        <Form.Item
          validateStatus={errors.street ? 'error' : undefined}
          help={errors.street?.message ? t(errors.street.message) : undefined}
          className="profile-form-item"
        >
          <Controller
            name="street"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('profile.street')}
                size="large"
                variant="borderless"
                className="profile-input"
              />
            )}
          />
        </Form.Item>

        {/* Ward + District side by side */}
        <Row gutter={16}>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.ward ? 'error' : undefined}
              help={errors.ward?.message ? t(errors.ward.message) : undefined}
              className="profile-form-item"
            >
              <Controller
                name="ward"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('profile.ward')}
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
              validateStatus={errors.district ? 'error' : undefined}
              help={errors.district?.message ? t(errors.district.message) : undefined}
              className="profile-form-item"
            >
              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('profile.district')}
                    size="large"
                    variant="borderless"
                    className="profile-input"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* City + Postal Code */}
        <Row gutter={16}>
          <Col xs={24} xl={12}>
            <Form.Item
              validateStatus={errors.city ? 'error' : undefined}
              help={errors.city?.message ? t(errors.city.message) : undefined}
              className="profile-form-item"
            >
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('profile.city')}
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
              validateStatus={errors.postalCode ? 'error' : undefined}
              help={errors.postalCode?.message ? t(errors.postalCode.message) : undefined}
              className="profile-form-item"
            >
              <Controller
                name="postalCode"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={t('profile.postalCode')}
                    size="large"
                    variant="borderless"
                    className="profile-input"
                  />
                )}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Phone number */}
        <Form.Item
          validateStatus={errors.phoneNumber ? 'error' : undefined}
          help={errors.phoneNumber?.message ? t(errors.phoneNumber.message) : undefined}
          className="profile-form-item"
        >
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={t('profile.phoneNumber')}
                size="large"
                variant="borderless"
                className="profile-input"
              />
            )}
          />
        </Form.Item>

        {/* Default checkbox */}
        <Form.Item className="profile-form-item">
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                {t('profile.setAsDefault')}
              </Checkbox>
            )}
          />
        </Form.Item>

        {/* Submit */}
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting || addMutation.isPending || updateMutation.isPending}
          block
          size="large"
          className="profile-save-button"
        >
          {isEditing ? t('profile.updateAddress') : t('profile.addAddress')}
        </Button>
      </form>
    </Modal>
  );
}
