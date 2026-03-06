/**
 * AddressCard — displays a single user address with action buttons.
 *
 * Shows: recipient name, address type badge, default badge, full address, phone.
 * Actions: Edit, Delete (with Popconfirm), Set Default (hidden if already default).
 */
import { Button, Card, Flex, Popconfirm, Tag, Typography } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UserAddress } from '@/types/user';

const { Text } = Typography;

interface AddressCardProps {
  address: UserAddress;
  onEdit: (address: UserAddress) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const { t } = useTranslation();

  // Build the full address string from Vietnamese hierarchy
  const fullAddress = [address.street, address.ward, address.district, address.city]
    .filter(Boolean)
    .join(', ');

  const typeLabel = t(`profile.addressType_${address.type}`);

  return (
    <Card className="address-card" classNames={{ body: 'address-card-body' }}>
      {/* Header: recipient + badges */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Flex gap={8} align="center">
          <Text strong>{address.recipientName}</Text>
          <Tag className="address-card-tag">{typeLabel}</Tag>
          {address.isDefault && (
            <Tag className="address-card-tag address-card-tag-default">
              <StarOutlined /> {t('profile.default')}
            </Tag>
          )}
        </Flex>
      </Flex>

      {/* Address details */}
      {fullAddress && (
        <Flex gap={8} align="flex-start" style={{ marginBottom: 8 }}>
          <EnvironmentOutlined style={{ color: '#8c8c8c', marginTop: 3 }} />
          <Text style={{ fontSize: 13 }}>{fullAddress}</Text>
        </Flex>
      )}
      {address.postalCode && (
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 22, display: 'block', marginBottom: 8 }}>
          {t('profile.postalCode')}: {address.postalCode}
        </Text>
      )}
      {address.phoneNumber && (
        <Flex gap={8} align="center" style={{ marginBottom: 12 }}>
          <PhoneOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: 13 }}>{address.phoneNumber}</Text>
        </Flex>
      )}

      {/* Actions */}
      <Flex gap={8} wrap="wrap">
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => onEdit(address)}
          className="address-card-action"
        >
          {t('common.edit')}
        </Button>
        <Popconfirm
          title={t('profile.deleteAddressConfirm')}
          onConfirm={() => onDelete(address.id)}
          okText={t('common.yes')}
          cancelText={t('common.no')}
        >
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            className="address-card-action"
          >
            {t('common.delete')}
          </Button>
        </Popconfirm>
        {!address.isDefault && (
          <Button
            size="small"
            icon={<StarOutlined />}
            onClick={() => onSetDefault(address.id)}
            className="address-card-action"
          >
            {t('profile.setDefault')}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
