import { useMemo, useEffect, useState, useCallback } from 'react'
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
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  parseNotificationActions,
  getActionRoute,
  getEntityRoute,
} from '@/features/notification/api'
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

// ─── Hook: detect mobile breakpoint ───────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    // Sync immediately in case the initial state was wrong (e.g. SSR mismatch)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

// ─── Mobile dropdown panel (fixed full-width, below navbar) ───────────────────
interface MobileDropdownProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

function MobileDropdown({ open, onClose, children }: MobileDropdownProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('[data-notification-panel]') &&
        !target.closest('[data-notification-trigger]')
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      data-notification-panel=""
      style={{
        position: 'fixed',
        top: 56, // adjust to match your navbar height
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'var(--color-bg-surface, #fff)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100dvh - 56px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {children}
    </div>
  )
}

// ─── Shared notification list content ─────────────────────────────────────────
interface NotificationContentProps {
  notifications: NotificationDto[]
  unreadCount: number
  isLoading: boolean
  isMobile: boolean
  onItemClick: (n: NotificationDto) => void
  onMarkAllRead: () => void
  onViewAll: () => void
  t: (key: string, fallback: string) => string
  navigate: (path: string) => void
}

function NotificationContent({
  notifications,
  unreadCount,
  isLoading,
  isMobile,
  onItemClick,
  onMarkAllRead,
  onViewAll,
  t,
  navigate,
}: NotificationContentProps) {
  const headerPaddingV = isMobile ? 14 : 12
  const itemPaddingV = isMobile ? 14 : 12
  const iconSize = isMobile ? 38 : 32
  const titleFontSize = isMobile ? 14 : 13
  const msgFontSize = isMobile ? 13 : 12
  const timeFontSize = isMobile ? 12 : 11

  return (
    <>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${headerPaddingV}px 16px`,
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: isMobile ? 17 : 15,
            color: 'var(--color-text-primary)',
          }}
        >
          {t('notifications', 'Thông báo')}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-accent)',
                fontSize: isMobile ? 13 : 12,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: isMobile ? '6px 0' : 0,
                // Enlarge touch target
                minHeight: isMobile ? 44 : 'auto',
              }}
            >
              <CheckOutlined style={{ fontSize: isMobile ? 13 : 11 }} />
              {t('markAllAsRead', 'Đánh dấu tất cả đã đọc')}
            </button>
          )}

          {/* Close button removed — panel closes by clicking the bell again or outside */}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: isMobile ? '48px 24px' : '32px 16px',
              color: 'var(--color-text-secondary)',
              fontSize: isMobile ? 14 : 13,
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
                role="button"
                tabIndex={0}
                onClick={() => onItemClick(item)}
                onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
                style={{
                  display: 'flex',
                  gap: isMobile ? 14 : 12,
                  padding: `${itemPaddingV}px 16px`,
                  cursor: 'pointer',
                  background: isUnread ? 'var(--color-accent-light)' : 'transparent',
                  borderBottom: '1px solid var(--color-border-light)',
                  transition: 'background 150ms',
                  // Ensure comfortable tap height on mobile
                  minHeight: isMobile ? 72 : 'auto',
                  alignItems: 'flex-start',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-accent-light)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isUnread
                    ? 'var(--color-accent-light)'
                    : 'transparent'
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: '50%',
                    background: isUnread
                      ? 'rgba(139,115,85,0.12)'
                      : 'var(--color-bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: isMobile ? 16 : 14,
                    color: isUnread
                      ? 'var(--color-accent)'
                      : 'var(--color-text-secondary)',
                    marginTop: 2,
                  }}
                >
                  {ICON_MAP[item.notificationType] ?? <InfoCircleOutlined />}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: titleFontSize,
                        fontWeight: isUnread ? 600 : 400,
                        color: 'var(--color-text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                        lineHeight: 1.4,
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
                          padding: '2px 7px',
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
                      fontSize: msgFontSize,
                      color: 'var(--color-text-secondary)',
                      margin: '0 0 4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.message}
                  </p>

                  {/* Time */}
                  <span
                    style={{
                      fontSize: timeFontSize,
                      color: 'var(--color-text-secondary)',
                      opacity: 0.7,
                    }}
                  >
                    {dayjs(item.createdAt).fromNow()}
                  </span>

                  {/* Action buttons */}
                  {(() => {
                    const actions = parseNotificationActions(item.actions)
                    if (actions.length === 0) return null
                    return (
                      <div
                        style={{
                          marginTop: 8,
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
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
                                fontSize: isMobile ? 12 : 11,
                                fontWeight: 500,
                                // Minimum 44px touch target height on mobile
                                padding: isMobile ? '8px 14px' : '3px 10px',
                                borderRadius: 6,
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

      {/* ── Footer ── */}
      <div
        style={{
          textAlign: 'center',
          padding: '8px 16px',
          borderTop: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onViewAll}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-accent)',
            fontSize: 12,
            fontWeight: 400,
            padding: '4px 8px',
            opacity: 0.8,
          }}
        >
          {t('viewAll', 'Xem tất cả thông báo')}
        </button>
      </div>
    </>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export function NotificationDropdown() {
  const { t } = useTranslation('notification')
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const isMobile = useIsMobile()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { data: notificationsData, isLoading } = useNotifications(
    isAuthenticated ? { pageNumber: 1, pageSize: 5 } : undefined,
  )
  const { data: unreadData } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const hub = useNotificationHub()

  const unreadCount = hub.unreadCount || unreadData?.count || 0
  const notifications = notificationsData?.items ?? []

  const handleItemClick = useCallback(
    (n: NotificationDto) => {
      if (n.status === NotificationStatus.Unread) {
        markAsRead.mutate(n.id)
      }
      const route = getEntityRoute(n.entityType, n.entityId)
      if (route) navigate(route)
      if (isMobile) setMobileOpen(false)
    },
    [markAsRead, navigate, isMobile],
  )

  const handleViewAll = useCallback(() => {
    navigate('/me/notifications')
    if (isMobile) setMobileOpen(false)
  }, [navigate, isMobile])

  const sharedProps: Omit<NotificationContentProps, 'isMobile'> = {
    notifications,
    unreadCount,
    isLoading,
    onItemClick: handleItemClick,
    onMarkAllRead: () => markAllAsRead.mutate(),
    onViewAll: handleViewAll,
    t,
    navigate,
  }


  const desktopContent = useMemo(
    () => (
      <div style={{ width: 400 }}>
        <NotificationContent {...sharedProps} isMobile={false} />
      </div>
    ),

    [notifications, unreadCount, isLoading, t, navigate],
  )


  if (isMobile) {
    return (
      <>
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button
            data-notification-trigger
            type="text"
            aria-label="Notifications"
            icon={<BellOutlined style={{ fontSize: 20 }} />}
            style={{ width: 44, height: 44 }}
            onClick={() => setMobileOpen((prev) => !prev)}
          />
        </Badge>
        <MobileDropdown open={mobileOpen} onClose={() => setMobileOpen(false)}>
          <NotificationContent
            {...sharedProps}
            isMobile
          />
        </MobileDropdown>
      </>
    )
  }


  return (
    <Popover
      content={desktopContent}
      trigger="click"
      placement="bottomRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0, borderRadius: 4, overflow: 'hidden' }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          aria-label="Notifications"
          icon={<BellOutlined style={{ fontSize: 20 }} />}
        />
      </Badge>
    </Popover>
  )
}