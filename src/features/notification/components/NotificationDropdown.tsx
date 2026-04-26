import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Popover, Badge, Button, Empty, Typography, Spin } from 'antd'
import {
  BellOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
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
  type NotificationAction,
} from '@/features/notification/api'
import { useRespondRunnerUpOffer, useAuctionDetail } from '@/features/auction/api'
import { useNotificationHub } from '@/features/notification/hooks/useNotificationHub'
import { useAuth } from '@/hooks/useAuth'
import { NotificationStatus } from '@/types/enums'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'
import type { NotificationDto } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

function getEntityColor(entityId?: string) {
  if (!entityId) return 'var(--color-accent)'
  let hash = 0
  for (let i = 0; i < entityId.length; i++) {
    hash = entityId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 60%, 45%)`
}

function AuctionGroupHeader({ auctionId, fallbackTitle, color }: { auctionId: string, fallbackTitle: string, color: string }) {
  const { user } = useAuth()
  const { data: auction, isLoading } = useAuctionDetail(auctionId, user?.id)
  
  return (
    <div
      style={{
        padding: '12px 16px 8px',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 8
      }}
    >
      <div style={{ width: 2, height: 12, borderRadius: 1, background: color }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Typography.Text strong style={{ 
          fontSize: 12, 
          color: 'var(--color-text-secondary)', 
          fontFamily: SANS_FONT,
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '70%'
        }}>
          {isLoading ? '...' : (auction?.item?.title || fallbackTitle)}
        </Typography.Text>
        <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: MONO_FONT, opacity: 0.6 }}>
          #{auctionId.slice(0, 6).toUpperCase()}
        </span>
      </div>
    </div>
  )
}

const ICON_MAP: Record<string, React.ReactNode> = {
  auction: <ThunderboltOutlined />,
  order: <ShoppingOutlined />,
  payment: <InfoCircleOutlined />,
}

// ─── Custom hook for responsive behavior ─────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

// ─── Mobile dropdown panel ────────────────────────────────────────────────────
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
        top: 56,
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
  onItemClick: (n: NotificationDto) => void
  onMarkAllRead: () => void
  onViewAll: () => void
  t: (key: string, fallback: string) => string
  navigate: (path: string) => void
  onAction?: (item: NotificationDto, action: NotificationAction) => void
  isActionPending?: boolean
  hoveredEntityId?: string | null
  setHoveredEntityId?: (id: string | null) => void
}

function NotificationContent({
  notifications,
  unreadCount,
  isLoading,
  onItemClick,
  onMarkAllRead,
  onViewAll,
  t,
  navigate,
  onAction,
  isActionPending,
  hoveredEntityId,
  setHoveredEntityId,
}: NotificationContentProps) {
  const isMobile = useIsMobile()
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: isMobile ? 'calc(100vh - 60px)' : 540, background: 'var(--color-bg-card)' }}>
      {/* Header */}
      <div
        style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-bg-card)',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: SANS_FONT }}>
          {t('notifications', 'Notifications')}
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              style={{
                backgroundColor: 'var(--color-accent)',
                marginLeft: 10,
                boxShadow: 'none',
                fontSize: 10,
                height: 18,
                minWidth: 18,
                lineHeight: '18px',
                border: 'none'
              }}
            />
          )}
        </span>
        <button
          type="button"
          onClick={onMarkAllRead}
          style={{
            fontSize: 12,
            color: 'var(--color-accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontWeight: 600,
            fontFamily: SANS_FONT,
            opacity: 0.9
          }}
        >
          {t('markAllAsRead', 'Mark all read')}
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('noNotifications', 'No notifications')} />
          </div>
        ) : (
          notifications.map((item, index) => {
            const isUnread = item.status === NotificationStatus.Unread
            const isAuction = item.entityType?.toLowerCase() === 'auction' && item.entityId
            const entityColor = isAuction ? getEntityColor(item.entityId) : 'transparent'
            const isHovered = hoveredEntityId === item.entityId && isAuction

            const showGroupHeader = isAuction && (index === 0 || notifications[index - 1].entityId !== item.entityId)

            return (
              <div key={item.id} style={{ 
                background: isHovered ? 'rgba(0,0,0,0.02)' : 'transparent',
                transition: 'background 0.2s'
              }}>
                {showGroupHeader && (
                  <AuctionGroupHeader 
                    auctionId={item.entityId!} 
                    fallbackTitle={item.title} 
                    color={entityColor} 
                  />
                )}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onItemClick(item)}
                  onMouseEnter={() => isAuction && setHoveredEntityId?.(item.entityId!)}
                  onMouseLeave={() => isAuction && setHoveredEntityId?.(null)}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: showGroupHeader ? '8px 16px 16px 26px' : '12px 16px 12px 26px',
                    cursor: 'pointer',
                    background: isUnread ? 'rgba(139, 115, 85, 0.04)' : 'transparent',
                    borderBottom: '1px solid var(--color-border-light)',
                    transition: 'all 0.2s',
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                >
                  {/* Unread Indicator Dot */}
                  {isUnread && (
                    <div style={{
                      position: 'absolute',
                      left: 10,
                      top: 30,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      boxShadow: '0 0 8px var(--color-accent)'
                    }} />
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isUnread ? 'rgba(139, 115, 85, 0.12)' : 'var(--color-bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 16,
                      color: isUnread ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                      border: '1px solid var(--color-border-light)',
                      marginTop: 2,
                    }}
                  >
                    {ICON_MAP[item.notificationType] ?? <InfoCircleOutlined />}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {!showGroupHeader && !isAuction && (
                      <div style={{ marginBottom: 4 }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          fontFamily: SANS_FONT,
                          display: 'block'
                        }}>
                          {item.title}
                        </span>
                      </div>
                    )}

                    <p style={{
                      fontSize: 13,
                      color: isUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      margin: '0 0 4px',
                      lineHeight: 1.5,
                      fontFamily: SANS_FONT,
                      fontWeight: isUnread ? 500 : 400
                    }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', opacity: 0.7 }}>
                        {dayjs(item.createdAt).fromNow()}
                      </span>
                    </div>

                    {/* Action buttons */}
                    {(() => {
                      const actions = parseNotificationActions(item.actions)
                      if (actions.length === 0) return null
                      return (
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          {actions.slice(0, 2).map((action, i) => {
                            const route = getActionRoute(action, item.entityId)
                            return (
                              <Button
                                key={i}
                                size="small"
                                type={i === 0 ? 'primary' : 'default'}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onAction) onAction(item, action)
                                  else if (route) navigate(route)
                                }}
                                loading={(action.type === 'accept_offer' || action.type === 'decline_offer') && isActionPending}
                                disabled={!route}
                                style={{
                                  borderRadius: 8,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  height: 30,
                                  padding: '0 14px',
                                  ...(i === 0 ? {
                                    background: 'var(--color-accent)',
                                    borderColor: 'var(--color-accent)',
                                  } : {})
                                }}
                              >
                                {action.label}
                              </Button>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--color-border-light)', flexShrink: 0, padding: '8px' }}>
        <button
          type="button"
          onClick={onViewAll}
          style={{
            width: '100%',
            padding: '10px',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: SANS_FONT,
            borderRadius: 8,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
            e.currentTarget.style.color = 'var(--color-accent)'
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
        >
          {t('viewAllNotifications', 'View all notifications')}
        </button>
      </div>
    </div>
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
  const respondOffer = useRespondRunnerUpOffer()
  const hub = useNotificationHub()

  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null)

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

  const handleAction = useCallback(
    (item: NotificationDto, action: NotificationAction) => {
      if (action.type === 'accept_offer' || action.type === 'decline_offer') {
        const accept = action.type === 'accept_offer'
        if (!item.entityId) return

        respondOffer.mutate(
          { auctionId: item.entityId, accept },
          {
            onSuccess: (result) => {
              if (item.status === NotificationStatus.Unread) {
                markAsRead.mutate(item.id)
              }
              if (accept) {
                const orderId = (result as any)?.orderId
                if (orderId) navigate(`/checkout/${orderId}`)
                else navigate(`/auctions/${item.entityId}`)
              }
              if (isMobile) setMobileOpen(false)
            },
          }
        )
        return
      }

      const route = getActionRoute(action, item.entityId)
      if (route) {
        navigate(route)
        if (item.status === NotificationStatus.Unread) {
          markAsRead.mutate(item.id)
        }
        if (isMobile) setMobileOpen(false)
      }
    },
    [markAsRead, respondOffer, navigate, isMobile]
  )

  const sharedProps = {
    notifications,
    unreadCount,
    isLoading,
    onItemClick: handleItemClick,
    onMarkAllRead: () => markAllAsRead.mutate(),
    onViewAll: handleViewAll,
    onAction: handleAction,
    isActionPending: respondOffer.isPending,
    hoveredEntityId,
    setHoveredEntityId,
    t,
    navigate,
  }

  const desktopContent = useMemo(
    () => (
      <div style={{ width: 380 }}>
        <NotificationContent {...sharedProps} />
      </div>
    ),
    [notifications, unreadCount, isLoading, t, navigate, hoveredEntityId, respondOffer.isPending],
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
          <NotificationContent {...sharedProps} />
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
      overlayInnerStyle={{ padding: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
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