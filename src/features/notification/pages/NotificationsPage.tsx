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
import { useNotifications, useMarkAsRead, useMarkAllAsRead, parseNotificationActions, getActionRoute, getEntityRoute, type NotificationAction } from '@/features/notification/api'
import { useRespondRunnerUpOffer, useAuctionDetail } from '@/features/auction/api'
import { useAuth } from '@/hooks/useAuth'
import { NotificationStatus } from '@/types/enums'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import type { NotificationDto } from '@/types'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { SANS_FONT, MONO_FONT } from '@/styles/tokens'

function getEntityColor(entityId?: string) {
  if (!entityId) return 'var(--color-accent)'
  let hash = 0
  for (let i = 0; i < entityId.length; i++) {
    hash = entityId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 75%, 40%)`
}

function AuctionGroupHeader({ 
  auctionId, 
  fallbackTitle, 
  color 
}: { 
  auctionId: string; 
  fallbackTitle: string; 
  color: string 
}) {
  const { user } = useAuth()
  const { data: auction, isLoading } = useAuctionDetail(auctionId, user?.id)
  
  return (
    <div style={{
      padding: '20px 24px',
      background: 'rgba(0,0,0,0.02)',
      borderBottom: '1px solid var(--color-border-light)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      <div style={{ 
        width: 4, 
        height: 24, 
        borderRadius: 2, 
        background: color 
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Tag color="gold" style={{ 
            borderRadius: 100, 
            margin: 0, 
            fontWeight: 700, 
            fontSize: 10,
            border: 'none',
            background: 'rgba(212, 163, 115, 0.1)',
            color: '#b8860b'
          }}>
            AUCTION
          </Tag>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: MONO_FONT }}>
            #{auctionId.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <Typography.Text strong style={{ 
          fontSize: 18, 
          color: 'var(--color-text-primary)', 
          fontFamily: SANS_FONT,
          display: 'block'
        }}>
          {isLoading ? (
            <span style={{ opacity: 0.5 }}>Loading auction info...</span>
          ) : (
            auction?.item?.title || fallbackTitle
          )}
        </Typography.Text>
      </div>
    </div>
  )
}

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
  const respondOffer = useRespondRunnerUpOffer()

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

  const handleAction = (item: NotificationDto, action: NotificationAction) => {
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
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null)

  const groupedNotifications = useMemo(() => {
    if (!data?.items) return []
    const groups: { key: string; type: string; title: string; items: NotificationDto[] }[] = []

    data.items.forEach((item) => {
      const isAuction = item.entityType?.toLowerCase() === 'auction' && item.entityId
      if (isAuction) {
        const existing = groups.find((g) => g.key === item.entityId)
        if (existing) {
          existing.items.push(item)
          return
        }
        
        // Try to find a better title if the first one is just a status
        // Some notifications might have the auction name as the title
        groups.push({
          key: item.entityId!,
          type: 'auction',
          title: item.title,
          items: [item],
        })
      } else {
        groups.push({
          key: `gen-${item.id}`,
          type: 'general',
          title: item.title,
          items: [item],
        })
      }
    })
    return groups
  }, [data?.items])

  return (
    <div style={{ 
      maxWidth: 1400, 
      margin: '0 auto', 
      padding: isMobile ? '24px 16px 80px' : '48px 32px 80px',
      fontFamily: SANS_FONT
    }}>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'flex-end', 
        gap: 16, 
        marginBottom: 40 
      }}>
        <div>
          <Typography.Title level={1} style={{ 
            margin: 0, 
            fontSize: isMobile ? 28 : 36, 
            fontWeight: 700, 
            fontFamily: SANS_FONT,
            letterSpacing: '-0.02em'
          }}>
            {t('notifications', 'Notifications')}
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>
            {t('manageNotifications', 'Stay updated with your auction activity and account status')}
          </Typography.Text>
        </div>
        
        <Button 
          type="primary" 
          icon={<CheckOutlined />} 
          onClick={handleMarkAllAsRead} 
          loading={markAllAsRead.isPending} 
          size="large"
          style={{
            height: 48,
            padding: '0 24px',
            borderRadius: 12,
            fontWeight: 600,
            background: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
            boxShadow: '0 4px 12px rgba(139, 115, 85, 0.2)'
          }}
        >
          {t('markAllAsRead', 'Mark all as read')}
        </Button>
      </div>

      <Space direction="vertical" style={{ width: '100%' }} size={32}>
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: 8,
          background: 'var(--color-bg-card)',
          padding: 6,
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          width: 'fit-content'
        }}>
          {[
            { value: '', label: t('filter.all', 'All') },
            { value: NotificationStatus.Unread, label: t('filter.unread', 'Unread') },
            { value: NotificationStatus.Read, label: t('filter.read', 'Read') }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              style={{
                padding: '8px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: 'none',
                background: (filters.status ?? '') === opt.value ? 'var(--color-accent)' : 'transparent',
                color: (filters.status ?? '') === opt.value ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 120 }}>
            <Spin size="large" tip="Loading notifications..." />
          </div>
        ) : groupedNotifications.length === 0 ? (
          <div style={{ 
            background: 'var(--color-bg-card)', 
            borderRadius: 24, 
            border: '1px solid var(--color-border)',
            padding: 80,
            textAlign: 'center'
          }}>
            <Empty description={t('noNotifications', 'No notifications found')} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {groupedNotifications.map((group) => {
                const isAuctionGroup = group.type === 'auction'
                const entityColor = isAuctionGroup ? getEntityColor(group.key) : 'transparent'
                const isHovered = hoveredEntityId === group.key

                return (
                  <div
                    key={group.key}
                    onMouseEnter={() => isAuctionGroup && setHoveredEntityId(group.key)}
                    onMouseLeave={() => isAuctionGroup && setHoveredEntityId(null)}
                    style={{
                      background: 'var(--color-bg-card)',
                      borderRadius: 24,
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isHovered ? '0 12px 32px rgba(0,0,0,0.08)' : 'var(--shadow-sm)',
                      transform: isHovered ? 'translateY(-2px)' : 'none',
                      position: 'relative'
                    }}
                  >
                    {isAuctionGroup ? (
                      <AuctionGroupHeader 
                        auctionId={group.key} 
                        fallbackTitle={group.title} 
                        color={entityColor} 
                      />
                    ) : null}

                    <List
                      dataSource={group.items}
                      renderItem={(item: NotificationDto) => {
                        const isUnread = item.status === NotificationStatus.Unread
                        return (
                          <List.Item
                            onClick={() => handleNotificationClick(item)}
                            style={{
                              cursor: 'pointer',
                              padding: isMobile ? '20px' : '24px',
                              backgroundColor: isUnread ? 'rgba(139, 115, 85, 0.03)' : 'transparent',
                              borderBottom: '1px solid var(--color-border-light)',
                              transition: 'background 0.2s',
                              alignItems: 'flex-start'
                            }}
                          >
                            <div style={{ display: 'flex', gap: 20, width: '100%' }}>
                              {/* Icon */}
                              <div
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 16,
                                  background: isUnread ? 'rgba(139, 115, 85, 0.1)' : 'var(--color-bg-surface)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 22,
                                  color: isUnread ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                                  flexShrink: 0,
                                  border: isUnread ? '1px solid rgba(139, 115, 85, 0.2)' : '1px solid var(--color-border-light)'
                                }}
                              >
                                {getNotificationIcon(item.notificationType)}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {!isAuctionGroup && (
                                      <Typography.Text strong style={{ fontSize: 16, color: 'var(--color-text-primary)' }}>
                                        {item.title}
                                      </Typography.Text>
                                    )}
                                    {isUnread && (
                                      <div style={{ 
                                        width: 8, 
                                        height: 8, 
                                        borderRadius: '50%', 
                                        background: 'var(--color-accent)',
                                        boxShadow: '0 0 8px var(--color-accent)'
                                      }} />
                                    )}
                                  </div>
                                  <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                                    {dayjs(item.createdAt).fromNow()}
                                  </Typography.Text>
                                </div>

                                <Typography.Paragraph
                                  style={{
                                    margin: 0,
                                    color: isUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                    fontSize: 15,
                                    lineHeight: 1.6,
                                    maxWidth: 800
                                  }}
                                >
                                  {item.message}
                                </Typography.Paragraph>

                                {(() => {
                                  const actions = parseNotificationActions(item.actions)
                                  if (actions.length === 0) return null
                                  return (
                                    <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                                      {actions.map((action, i) => {
                                        const route = getActionRoute(action, item.entityId)
                                        return (
                                          <Button
                                            key={i}
                                            type={i === 0 ? 'primary' : 'default'}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleAction(item, action)
                                            }}
                                            loading={(action.type === 'accept_offer' || action.type === 'decline_offer') && respondOffer.isPending}
                                            disabled={!route}
                                            style={{
                                              height: 38,
                                              padding: '0 20px',
                                              borderRadius: 10,
                                              fontWeight: 600,
                                              fontSize: 13,
                                              ...(i === 0 ? {
                                                background: 'var(--color-accent)',
                                                borderColor: 'var(--color-accent)',
                                                boxShadow: '0 4px 10px rgba(139, 115, 85, 0.2)'
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
                          </List.Item>
                        )
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <Pagination
                current={data.metadata.currentPage}
                pageSize={data.metadata.pageSize}
                total={data.metadata.totalCount}
                showSizeChanger
                showTotal={(total) => tc('pagination.total', { total })}
                onChange={(page, pageSize) => setFilters((prev) => ({ ...prev, pageNumber: page, pageSize }))}
                className="oio-pagination"
              />
            </div>
          </>
        )}
      </Space>
    </div>
  )
}
