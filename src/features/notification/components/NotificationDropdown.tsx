import { useMemo } from 'react'
import { Badge, Popover, Button, Spin } from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, parseNotificationActions, getActionRoute, getEntityRoute } from '@/features/notification/api'
import { useNotificationHub } from '@/features/notification/hooks/useNotificationHub'
import { useAuth } from '@/hooks/useAuth'
import { NotificationStatus } from '@/types/enums'
import type { NotificationDto } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const ICON_MAP: Record<string, React.ReactNode> = {
  auction: <ThunderboltOutlined />,
  order: <ShoppingOutlined />,
  payment: <DollarOutlined />,
  warning: <WarningOutlined />,
}

export function NotificationDropdown() {
  const { t } = useTranslation('notification')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { data: notificationsData, isLoading } = useNotifications(
    isAuthenticated ? { pageNumber: 1, pageSize: 5 } : undefined,
  )
  const { data: unreadData } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const hub = useNotificationHub()

  const unreadCount = hub.unreadCount || unreadData?.count || 0
  const notifications = notificationsData?.items ?? []

  const handleClick = (n: NotificationDto) => {
    if (n.status === NotificationStatus.Unread) {
      markAsRead.mutate(n.id)
    }
    // Navigate to entity if available
    const route = getEntityRoute(n.entityType, n.entityId)
    if (route) navigate(route)
  }

  const content = useMemo(
    () => (
      <div style={{ width: 400 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text-primary)' }}>
            {t('notifications', 'Thông báo')}
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-accent)',
                fontSize: 12,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
              }}
            >
              <CheckOutlined style={{ fontSize: 11 }} />
              {t('markAllAsRead', 'Đánh dấu tất cả đã đọc')}
            </button>
          )}
        </div>

        {/* List */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin />
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--color-text-secondary)',
                fontSize: 13,
              }}
            >
              {t('noNotifications', 'Không có thông báo')}
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = item.status === NotificationStatus.Unread
              return (
                <div
                  key={item.id}
                  onClick={() => handleClick(item)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: isUnread ? 'var(--color-accent-light)' : 'transparent',
                    borderBottom: '1px solid var(--color-border-light)',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent-light)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isUnread ? 'var(--color-accent-light)' : 'transparent' }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isUnread ? 'rgba(139,115,85,0.12)' : 'var(--color-bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 14,
                      color: isUnread ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {ICON_MAP[item.notificationType] ?? <InfoCircleOutlined />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isUnread ? 600 : 400,
                          color: 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {item.title}
                      </span>
                      {isUnread && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'var(--color-accent)',
                            background: 'rgba(139,115,85,0.12)',
                            borderRadius: 100,
                            padding: '1px 6px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {t('new', 'Mới')}
                        </span>
                      )}
                    </div>

                    {/* Message */}
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        margin: '0 0 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.message}
                    </p>

                    {/* Time */}
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                      {dayjs(item.createdAt).fromNow()}
                    </span>

                    {/* Action buttons */}
                    {(() => {
                      const actions = parseNotificationActions(item.actions)
                      if (actions.length === 0) return null
                      return (
                        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                          {actions.slice(0, 2).map((action, i) => {
                            const route = getActionRoute(action, item.entityId)
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (route) navigate(route)
                                }}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 500,
                                  padding: '3px 10px',
                                  borderRadius: 4,
                                  border: '1px solid var(--color-accent)',
                                  background: 'transparent',
                                  color: 'var(--color-accent)',
                                  cursor: route ? 'pointer' : 'not-allowed',
                                  opacity: route ? 1 : 0.5,
                                }}
                              >
                                {action.label}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            padding: '10px 16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/me/notifications')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-accent)',
              fontSize: 13,
              fontWeight: 500,
              padding: 0,
            }}
          >
            {t('viewAll', 'Xem tất cả thông báo')}
          </button>
        </div>
      </div>
    ),
    [notifications, unreadCount, isLoading, t, navigate],
  )

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0, borderRadius: 4, overflow: 'hidden' }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" aria-label="Notifications" icon={<BellOutlined style={{ fontSize: 20 }} />} />
      </Badge>
    </Popover>
  )
}
