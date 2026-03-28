import { useState } from 'react'
import { Typography, List, Button, Space, Spin, Empty, Pagination, Radio, Tag } from 'antd'
import {
  CheckOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useNotifications, useMarkAsRead, useMarkAllAsRead, parseNotificationActions, getActionRoute, getEntityRoute } from '@/features/notification/api'
import type { NotificationFilterParams } from '@/features/notification/api'
import { NotificationStatus } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { NotificationDto } from '@/types'
import dayjs from 'dayjs'

const NOTIFICATION_TYPE_ICONS: Record<string, React.ReactNode> = {
  auction: <ThunderboltOutlined />,
  order: <ShoppingOutlined />,
  payment: <DollarOutlined />,
  warning: <WarningOutlined />,
}

function getNotificationIcon(type: string): React.ReactNode {
  return NOTIFICATION_TYPE_ICONS[type] ?? <InfoCircleOutlined />
}

export default function NotificationsPage() {
  const { t } = useTranslation('notification')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { isMobile } = useBreakpoint()

  const [filters, setFilters] = useState<NotificationFilterParams>({
    pageNumber: 1,
    pageSize: 20,
  })

  const { data, isLoading } = useNotifications(filters)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const handleFilterChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status || undefined,
      pageNumber: 1,
    }))
  }

  const handleNotificationClick = (notification: NotificationDto) => {
    if (notification.status === NotificationStatus.Unread) {
      markAsRead.mutate(notification.id)
    }
    const route = getEntityRoute(notification.entityType, notification.entityId)
    if (route) navigate(route)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  return (
    <div style={{ padding: isMobile ? 16 : 0 }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 0, marginBottom: isMobile ? 16 : 24 }}>
        <Typography.Title level={2} style={{ margin: 0, fontSize: isMobile ? 22 : undefined }}>
          {t('notifications', 'Notifications')}
        </Typography.Title>
        <Button type="primary" icon={<CheckOutlined />} onClick={handleMarkAllAsRead} loading={markAllAsRead.isPending} size={isMobile ? 'middle' : 'large'}>
          {t('markAllAsRead', 'Mark all as read')}
        </Button>
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Radio.Group
          value={filters.status ?? ''}
          onChange={(e) => handleFilterChange(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
          <Radio.Button value="">{t('filter.all', 'All')}</Radio.Button>
          <Radio.Button value={NotificationStatus.Unread}>{t('filter.unread', 'Unread')}</Radio.Button>
          <Radio.Button value={NotificationStatus.Read}>{t('filter.read', 'Read')}</Radio.Button>
        </Radio.Group>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : !data?.items?.length ? (
          <Empty description={t('noNotifications', 'No notifications')} />
        ) : (
          <>
            <List
              dataSource={data?.items ?? []}
              renderItem={(item: NotificationDto) => (
                <List.Item
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    cursor: 'pointer',
                    padding: isMobile ? '8px 12px' : '12px 16px',
                    backgroundColor: item.status === NotificationStatus.Unread ? '#f0f5ff' : 'transparent',
                    borderRadius: 6,
                    marginBottom: 4,
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <span
                        style={{
                          fontSize: 22,
                          color: item.status === NotificationStatus.Unread ? '#1677ff' : '#999',
                        }}
                      >
                        {getNotificationIcon(item.notificationType)}
                      </span>
                    }
                    title={
                      <Space size={8}>
                        <Typography.Text strong={item.status === NotificationStatus.Unread}>
                          {item.title}
                        </Typography.Text>
                        {item.status === NotificationStatus.Unread && <Tag color="blue">{t('new', 'New')}</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 4 }}>
                          {item.message}
                        </Typography.Paragraph>
                        {(() => {
                          const actions = parseNotificationActions(item.actions)
                          if (actions.length === 0) return null
                          return (
                            <Space size={8} style={{ marginBottom: 8 }}>
                              {actions.map((action, i) => {
                                const route = getActionRoute(action, item.entityId)
                                return (
                                  <Button
                                    key={i}
                                    size="small"
                                    type={i === 0 ? 'primary' : 'default'}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (route) navigate(route)
                                    }}
                                    disabled={!route}
                                    style={i === 0 ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)' } : undefined}
                                  >
                                    {action.label}
                                  </Button>
                                )
                              })}
                            </Space>
                          )
                        })()}
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                          {item.readAt && (
                            <>
                              {' '}
                              &middot; {t('readAt', 'Read')}: {dayjs(item.readAt).format('DD/MM/YYYY HH:mm')}
                            </>
                          )}
                        </Typography.Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={data.metadata.currentPage}
                pageSize={data.metadata.pageSize}
                total={data.metadata.totalCount}
                showSizeChanger
                showTotal={(total) => tc('pagination.total', { total })}
                onChange={(page, pageSize) => setFilters((prev) => ({ ...prev, pageNumber: page, pageSize }))}
              />
            </div>
          </>
        )}
      </Space>
    </div>
  )
}
