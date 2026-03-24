import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router'
import { Layout, Avatar, Tooltip } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  PlusCircleOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  HistoryOutlined,
  OrderedListOutlined,
  WalletOutlined,
  ImportOutlined,
  ExportOutlined,
  DatabaseOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'

const { Content } = Layout

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const SIDEBAR_WIDTH = 260
const SIDEBAR_COLLAPSED = 72
const HEADER_HEIGHT = 64

interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
}

interface MenuGroup {
  type: 'group'
  label: string
  children: MenuItem[]
}

type MenuEntry = MenuItem | MenuGroup

export function SellerLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { t, i18n } = useTranslation('seller')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH

  const menuEntries: MenuEntry[] = [
    { key: '/seller', icon: <DashboardOutlined />, label: t('menu.dashboard', 'Dashboard') },
    {
      type: 'group',
      label: t('menu.groupProducts', 'San pham'),
      children: [
        { key: '/seller/items', icon: <ShoppingOutlined />, label: t('menu.myItems', 'My Items') },
        { key: '/seller/items/create', icon: <PlusCircleOutlined />, label: t('menu.createItem', 'Create Item') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupAuctions', 'Dau gia'),
      children: [
        { key: '/seller/auctions', icon: <ThunderboltOutlined />, label: t('menu.myAuctions', 'My Auctions') },
        { key: '/seller/auctions/create', icon: <PlusOutlined />, label: t('menu.createAuction', 'Create Auction') },
        { key: '/seller/bids', icon: <HistoryOutlined />, label: t('menu.myBids', 'My Bids') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupBusiness', 'Kinh doanh'),
      children: [
        { key: '/seller/orders', icon: <OrderedListOutlined />, label: t('menu.orders', 'Orders') },
        { key: '/seller/wallet', icon: <WalletOutlined />, label: t('menu.wallet', 'Wallet') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupWarehouse', 'Kho hang'),
      children: [
        { key: '/seller/warehouse/inbound', icon: <ImportOutlined />, label: t('menu.inbound', 'Inbound Shipments') },
        { key: '/seller/warehouse/outbound', icon: <ExportOutlined />, label: t('menu.outbound', 'Outbound Shipments') },
        { key: '/seller/warehouse/items', icon: <DatabaseOutlined />, label: t('menu.warehouseItems', 'Warehouse Items') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupSettings', 'Cai dat'),
      children: [
        { key: '/seller/profile', icon: <UserOutlined />, label: t('menu.profile', 'Profile') },
        { key: '/seller/verification', icon: <SafetyCertificateOutlined />, label: t('menu.verification', 'Verification') },
      ],
    },
  ]

  const isActive = (key: string) => {
    if (key === '/seller') return location.pathname === '/seller'
    return location.pathname.startsWith(key)
  }

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'uk' : 'en'
    i18n.changeLanguage(next)
  }

  const displayName = user?.profile?.displayName || user?.profile?.firstName || user?.userName || 'Seller'
  const avatarUrl = user?.profile?.avatarUrl

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.key)
    const menuItem = (
      <div
        key={item.key}
        onClick={() => navigate(item.key)}
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 0 0 0' : '0 16px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          margin: '2px 8px',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: SANS_FONT,
          fontSize: 13,
          fontWeight: active ? 500 : 400,
          color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          background: active ? 'var(--color-accent-light)' : 'transparent',
          borderLeft: active ? '3px solid var(--color-accent)' : '3px solid transparent',
          transition: 'all 150ms ease',
          whiteSpace: 'nowrap',
          gap: collapsed ? 0 : 12,
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'var(--color-accent-light)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {item.icon}
        </span>
        {!collapsed && <span>{item.label}</span>}
      </div>
    )
    if (collapsed) {
      return (
        <Tooltip key={item.key} title={item.label} placement="right">
          {menuItem}
        </Tooltip>
      )
    }
    return menuItem
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: sidebarWidth,
          background: 'var(--color-bg-card)',
          borderRight: '1px solid var(--color-border)',
          transition: 'width 200ms ease',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <Link
            to="/seller"
            style={{
              fontFamily: SERIF_FONT,
              fontSize: collapsed ? 18 : 22,
              letterSpacing: '0.1em',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              fontWeight: 400,
              display: 'flex',
              alignItems: 'baseline',
              whiteSpace: 'nowrap',
            }}
          >
            OIO
            {!collapsed && (
              <span
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  marginLeft: 8,
                }}
              >
                Seller
              </span>
            )}
          </Link>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
          {menuEntries.map((entry, idx) => {
            if ('type' in entry && entry.type === 'group') {
              return (
                <div key={`group-${idx}`}>
                  {!collapsed && (
                    <div
                      style={{
                        padding: '16px 20px 4px',
                        fontFamily: SANS_FONT,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)',
                        opacity: 0.6,
                      }}
                    >
                      {entry.label}
                    </div>
                  )}
                  {collapsed && (
                    <div
                      style={{
                        height: 1,
                        background: 'var(--color-border)',
                        margin: '8px 12px',
                        opacity: 0.5,
                      }}
                    />
                  )}
                  {entry.children.map(renderMenuItem)}
                </div>
              )
            }
            return renderMenuItem(entry as MenuItem)
          })}
        </nav>

        {/* Sidebar footer */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <span
            style={{
              fontFamily: SANS_FONT,
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              opacity: 0.6,
            }}
          >
            {collapsed ? 'v1' : 'v1.0'}
          </span>
        </div>
      </aside>

      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: sidebarWidth,
          right: 0,
          height: HEADER_HEIGHT,
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          transition: 'left 200ms ease',
          zIndex: 99,
        }}
      >
        {/* Left side: collapse toggle + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: 18,
            }}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <span
            style={{
              fontFamily: SANS_FONT,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            OIO Seller
          </span>
        </div>

        {/* Right side: back link, theme, lang, user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              cursor: 'pointer',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: SANS_FONT,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)'
              e.currentTarget.style.color = 'var(--color-accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.color = 'var(--color-text-secondary)'
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: 11 }} />
            Back to Platform
          </button>

          <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 16,
                borderRadius: 6,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </button>
          </Tooltip>

          <Tooltip title="Switch language">
            <button
              onClick={toggleLanguage}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--color-text-secondary)',
                fontSize: 12,
                fontFamily: SANS_FONT,
                fontWeight: 500,
                borderRadius: 6,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              <GlobalOutlined style={{ fontSize: 14 }} />
              {i18n.language === 'en' ? 'EN' : 'UK'}
            </button>
          </Tooltip>

          <div
            style={{
              width: 1,
              height: 24,
              background: 'var(--color-border)',
              margin: '0 4px',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            <Avatar
              size={32}
              src={avatarUrl}
              icon={!avatarUrl ? <UserOutlined /> : undefined}
              style={{
                backgroundColor: avatarUrl ? undefined : 'var(--color-accent-light)',
                color: avatarUrl ? undefined : 'var(--color-accent)',
              }}
            />
            {!collapsed && (
              <span
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content area */}
      <main
        style={{
          marginLeft: sidebarWidth,
          marginTop: HEADER_HEIGHT,
          transition: 'margin-left 200ms ease',
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          background: 'var(--color-bg-primary)',
        }}
      >
        <Content style={{ padding: 32 }}>
          <Outlet />
        </Content>
      </main>
    </div>
  )
}
