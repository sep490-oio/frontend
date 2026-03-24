import {
  Typography,
  Row,
  Col,
  Card,
  Image,
  Descriptions,
  Spin,
  Empty,
  Space,
  Button,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useItemById } from '@/features/item/api'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/utils/format'
import { useCurrentUser } from '@/features/user/api'
import { ItemQA } from '@/features/item/components/ItemQA'

export default function ItemDetailPage() {
  const { t } = useTranslation('item')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: item, isLoading } = useItemById(id ?? '')
  const { data: currentUser } = useCurrentUser()

  const isSeller = currentUser?.id === item?.sellerId

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!item) {
    return <Empty description={t('notFound', 'Item not found')} />
  }

  const primaryImage = item.images?.find((img) => img.isPrimary) ?? item.images?.[0]
  const otherImages = item.images?.filter((img) => img.id !== primaryImage?.id) ?? []

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          {tc('action.back', 'Back')}
        </Button>
      </Space>

      <Row gutter={[24, 24]}>
        {/* Image Gallery */}
        <Col xs={24} md={12}>
          <Card styles={{ body: { padding: 0 } }}>
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={item.title}
                style={{ width: '100%', maxHeight: 500, objectFit: 'contain' }}
                preview
              />
            ) : (
              <Empty
                description={t('noImages', 'No images')}
                style={{ padding: 60 }}
              />
            )}
          </Card>
          {otherImages.length > 0 && (
            <Space wrap style={{ marginTop: 12 }}>
              <Image.PreviewGroup>
                {otherImages.map((img) => (
                  <Image
                    key={img.id}
                    src={img.thumbnailUrl ?? img.url}
                    alt={item.title}
                    width={80}
                    height={80}
                    style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                    preview={{ src: img.url }}
                  />
                ))}
              </Image.PreviewGroup>
            </Space>
          )}
        </Col>

        {/* Item Info */}
        <Col xs={24} md={12}>
          <Typography.Title level={2} style={{ marginTop: 0 }}>{item.title}</Typography.Title>

          <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label={t('condition', 'Condition')}>
              <StatusBadge status={item.condition} />
            </Descriptions.Item>
            <Descriptions.Item label={t('status', 'Status')}>
              <StatusBadge status={item.status} />
            </Descriptions.Item>
            <Descriptions.Item label={t('quantity', 'Quantity')}>
              {item.quantity}
            </Descriptions.Item>
            <Descriptions.Item label={t('createdAt', 'Listed')}>
              {formatDateTime(item.createdAt)}
            </Descriptions.Item>
          </Descriptions>

          {item.description && (
            <>
              <Typography.Title level={5}>{t('description', 'Description')}</Typography.Title>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {item.description}
              </Typography.Paragraph>
            </>
          )}
        </Col>
      </Row>

      {/* Q&A Section */}
      <ItemQA itemId={id ?? ''} isSeller={isSeller} />
    </div>
  )
}
