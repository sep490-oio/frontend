/**
 * AddressesTab — displays user's address list with add/edit/delete/set-default.
 *
 * Grid layout: 2 columns on desktop, 1 column on mobile.
 * "Add Address" button opens AddressFormModal.
 */
import { useState } from 'react';
import { Button, Col, Empty, Flex, Row, Spin, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/hooks/useUser';
import { AddressCard } from './AddressCard';
import { AddressFormModal } from './AddressFormModal';
import type { UserAddress } from '@/types/user';

const { Text } = Typography;

export function AddressesTab() {
  const { t } = useTranslation();
  const { data: addresses, isLoading } = useAddresses();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    try {
      await deleteMutation.mutateAsync(addressId);
      message.success(t('profile.addressDeleted'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultMutation.mutateAsync(addressId);
      message.success(t('profile.addressSetDefault'));
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <Flex justify="center" style={{ padding: 64 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <div>
      {/* Header with add button */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
        <Text className="profile-field-label" style={{ marginBottom: 0 }}>
          {t('profile.savedAddresses')}
        </Text>
        <Button
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="profile-save-button"
          type="primary"
        >
          {t('profile.addAddress')}
        </Button>
      </Flex>

      {/* Address grid */}
      {addresses && addresses.length > 0 ? (
        <Row gutter={[16, 16]}>
          {addresses.map((address) => (
            <Col xs={24} lg={12} key={address.id}>
              <AddressCard
                address={address}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description={t('profile.noAddresses')} />
      )}

      {/* Add/Edit modal */}
      <AddressFormModal
        open={modalOpen}
        onClose={handleModalClose}
        editingAddress={editingAddress}
      />
    </div>
  );
}
