/**
 * ItemDetailPage — Shows item details for the seller.
 *
 * Displays: title, condition, status, description, images, creation date.
 * Accessed from MyListingsPage "View" action → /item/:id
 */

import {
  Card,
  Typography,
  Tag,
  Image,
  Flex,
  Spin,
  Result,
  Descriptions,
  Button,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useItem } from '@/hooks/useItems';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const { Title, Text } = Typography;

const CONDITION_LABELS: Record<string, string> = {
  new: 'createItem.conditionNew',
  like_new: 'createItem.conditionLikeNew',
  very_good: 'createItem.conditionVeryGood',
  good: 'createItem.conditionGood',
  acceptable: 'createItem.conditionAcceptable',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  pending_review: 'processing',
  pending_verify: 'gold',
  approved: 'cyan',
  active: 'green',
  in_auction: 'blue',
  sold: 'purple',
  removed: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'myListings.itemStatusDraft',
  pending_review: 'myListings.itemStatusPendingReview',
  pending_verify: 'myListings.itemStatusPendingVerify',
  approved: 'myListings.itemStatusApproved',
  active: 'myListings.itemStatusActive',
  in_auction: 'myListings.itemStatusInAuction',
  sold: 'myListings.itemStatusSold',
  removed: 'myListings.itemStatusRemoved',
};

export function ItemDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isMobile } = useBreakpoint();
  const { data: item, isLoading, isError } = useItem(id);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: 300 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (isError || !item) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <Result
          status="404"
          title="404"
          subTitle={t('common.noData')}
          extra={
            <Button type="primary" onClick={() => navigate('/my-listings')}>
              {t('myListings.title')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? 16 : 24 }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/my-listings')}
        style={{ padding: 0, marginBottom: 16 }}
      >
        {t('myListings.title')}
      </Button>

      <Card>
        {/* Image */}
        {item.primaryImageUrl && (
          <Flex justify="center" style={{ marginBottom: 24 }}>
            <Image
              src={item.primaryImageUrl}
              alt={item.title}
              style={{ maxHeight: 300, objectFit: 'contain', borderRadius: 8 }}
              fallback="/placeholder-item.svg"
            />
          </Flex>
        )}

        {/* Title + Status */}
        <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>{item.title}</Title>
          <Tag color={STATUS_COLORS[item.status] ?? 'default'}>
            {STATUS_LABELS[item.status] ? t(STATUS_LABELS[item.status]) : item.status}
          </Tag>
        </Flex>

        {/* Details */}
        <Descriptions
          bordered
          column={isMobile ? 1 : 2}
          size={isMobile ? 'small' : 'middle'}
        >
          <Descriptions.Item label={t('createItem.condition')}>
            {CONDITION_LABELS[item.condition]
              ? t(CONDITION_LABELS[item.condition])
              : item.condition}
          </Descriptions.Item>
          <Descriptions.Item label={t('myListings.createdAt')}>
            {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          {item.quantity > 1 && (
            <Descriptions.Item label={t('common.quantity')}>
              {item.quantity}
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* Description */}
        {item.condition && (
          <div style={{ marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('createItem.description')}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text>{(item as Record<string, unknown>).description as string ?? '—'}</Text>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
