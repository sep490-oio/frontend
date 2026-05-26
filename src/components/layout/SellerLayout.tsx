import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router'
import { Layout, Avatar, Tooltip, Drawer } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  PlusCircleOutlined,
  ThunderboltOutlined,
  OrderedListOutlined,
  WalletOutlined,
  ImportOutlined,
  ExportOutlined,
  DatabaseOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useMySellerProfile } from '@/features/seller/api'
import { useTheme } from '@/hooks/useTheme'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown'
import { UserDropdown } from './UserDropdown'
import { SellerProfileStatus } from '@/types/enums'
import { SERIF_FONT, SANS_FONT } from '@/styles/tokens'

const { Content } = Layout

const SIDEBAR_WIDTH = 240
const SIDEBAR_COLLAPSED = 72
const HEADER_HEIGHT = 64

const iconBtnStyle = (): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 8,
  minWidth: 44,
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-secondary)',
  fontSize: 16,
  borderRadius: 6,
  transition: 'color 150ms ease',
})

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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const { isMobile, isTablet } = useBreakpoint()
  const { t, i18n } = useTranslation('seller')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { data: sellerProfile } = useMySellerProfile()
  const { isDark, toggle: toggleTheme } = useTheme()

  // On tablet: force icon-only sidebar
  const effectiveCollapsed = isTablet ? true : collapsed
  const sidebarWidth = effectiveCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH

  const isVerified = sellerProfile?.status === SellerProfileStatus.Verified

  const allMenuEntries: MenuEntry[] = [
    { key: '/seller', icon: <DashboardOutlined />, label: t('menu.dashboard', 'Dashboard') },
    {
      type: 'group',
      label: t('menu.groupProducts'),
      children: [
        { key: '/seller/items', icon: <ShoppingOutlined />, label: t('menu.myItems', 'My Items') },
        { key: '/seller/items/create', icon: <PlusCircleOutlined />, label: t('menu.createItem', 'Create Item') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupAuctions'),
      children: [
        { key: '/seller/auctions', icon: <ThunderboltOutlined />, label: t('menu.myAuctions', 'My Auctions') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupBusiness'),
      children: [
        { key: '/seller/orders', icon: <OrderedListOutlined />, label: t('menu.orders', 'Orders') },
        { key: '/seller/returns', icon: <OrderedListOutlined />, label: t('menu.returns', 'Returns') },
        { key: '/seller/shipments', icon: <ExportOutlined />, label: t('menu.directShipments', 'Direct Shipments') },
        { key: '/seller/wallet', icon: <WalletOutlined />, label: t('menu.wallet', 'Wallet') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupWarehouse'),
      children: [
        { key: '/seller/warehouse/inbound', icon: <ImportOutlined />, label: t('menu.inbound', 'Inbound Shipments') },
        { key: '/seller/warehouse/outbound', icon: <ExportOutlined />, label: t('menu.outbound', 'Outbound Shipments') },
        { key: '/seller/warehouse/items', icon: <DatabaseOutlined />, label: t('menu.warehouseItems', 'Warehouse Items') },
      ],
    },
    {
      type: 'group',
      label: t('menu.groupSettings'),
      children: [
        { key: '/seller/profile', icon: <UserOutlined />, label: t('menu.profile', 'Store Profile') },
      ],
    },
  ]

  // If not verified, only show Profile in sidebar
  const menuEntries = isVerified
    ? allMenuEntries
    : allMenuEntries
      .map((entry) => {
        if ('type' in entry && entry.type === 'group') {
          const filteredChildren = entry.children.filter(
            (child) => child.key === '/seller/profile'
          )
          return filteredChildren.length > 0 ? { ...entry, children: filteredChildren } : null
        }
        const item = entry as MenuItem
        return item.key === '/seller/profile' ? entry : null
      })
      .filter((entry): entry is MenuEntry => entry !== null)

  const isActive = (key: string) => {
    if (key === '/seller') return location.pathname === '/seller'
    return location.pathname.startsWith(key)
  }

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'vi' : 'en'
    i18n.changeLanguage(next)
  }

  const displayName = user?.profile?.displayName || user?.profile?.firstName || user?.userName || 'Seller'
  const avatarUrl = user?.profile?.avatarUrl

  const renderMenuItem = (item: MenuItem, inDrawer = false) => {
    const active = isActive(item.key)
    const isIconOnly = !inDrawer && effectiveCollapsed
    const menuItem = (
      <div
        key={item.key}
        onClick={() => { navigate(item.key); if (inDrawer) setMobileDrawerOpen(false) }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate(item.key)}
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: isIconOnly ? '0' : '0 16px',
          justifyContent: isIconOnly ? 'center' : 'flex-start',
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
          gap: isIconOnly ? 0 : 12,
          position: 'relative',
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--color-accent-light)' }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {item.icon}
        </span>
        {!isIconOnly && <span>{item.label}</span>}
      </div>
    )

    if (isIconOnly) {
      return (
        <Tooltip key={item.key} title={item.label} placement="right">
          {menuItem}
        </Tooltip>
      )
    }
    return menuItem
  }

  const renderEntries = (inDrawer = false) =>
    menuEntries.map((entry, idx) => {
      if ('type' in entry && entry.type === 'group') {
        const isIconOnly = !inDrawer && effectiveCollapsed
        return (
          <div key={`group-${idx}`}>
            {!isIconOnly ? (
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
            ) : (
              <div
                style={{
                  height: 1,
                  background: 'var(--color-border)',
                  margin: '8px 12px',
                  opacity: 0.5,
                }}
              />
            )}
            {entry.children.map((item) => renderMenuItem(item, inDrawer))}
          </div>
        )
      }
      return renderMenuItem(entry as MenuItem, inDrawer)
    })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      '--navbar-offset-desktop': '80px',
      '--navbar-offset-mobile': '80px'
    } as React.CSSProperties}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          position: 'fixed',
          left: isMobile ? -sidebarWidth : 16,
          top: 16,
          bottom: 16,
          width: sidebarWidth,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          transition: 'all 200ms ease',
          display: isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          zIndex: 100,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            padding: effectiveCollapsed ? '0' : '0 20px',
            borderBottom: '0px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <Link
            to="/seller"
            style={{
              fontFamily: SERIF_FONT,
              fontSize: effectiveCollapsed ? 18 : 22,
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
            {!effectiveCollapsed && (
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

        <nav
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}
          aria-label="Seller navigation"
        >
          {renderEntries()}
        </nav>

        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
          }}
        >
          <span style={{ fontFamily: SANS_FONT, fontSize: 11, color: 'var(--color-text-secondary)', opacity: 0.6 }}>
            {effectiveCollapsed ? 'v1' : 'v1.0'}
          </span>
        </div>
      </aside>

      {/* ── Mobile Drawer ── */}
      <Drawer
        title={
          <span style={{ fontFamily: SERIF_FONT, fontSize: 20, letterSpacing: '0.1em' }}>
            OIO{' '}
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
          </span>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={Math.min(280, window.innerWidth * 0.85)}
        styles={{ body: { padding: 0 } }}
      >
        <nav style={{ padding: '8px 0' }} aria-label="Seller navigation (mobile)">
          {renderEntries(true)}
        </nav>
      </Drawer>

      {/* ── Header ── */}
      <header
        style={{
          position: 'fixed',
          top: 16,
          left: isMobile ? 12 : sidebarWidth + 32,
          right: isMobile ? 12 : 16,
          height: HEADER_HEIGHT,
          background: 'var(--color-bg-container)',
          backdropFilter: 'var(--oio-blur)',
          WebkitBackdropFilter: 'var(--oio-blur)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 24px',
          transition: 'all 200ms ease',
          zIndex: 99,
          gap: 8,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, minWidth: 0, flexShrink: 0 }}>
          {isMobile ? (
            <button onClick={() => setMobileDrawerOpen(true)} style={{ ...iconBtnStyle(), padding: 4 }} aria-label="Open menu">
              <MenuOutlined />
            </button>
          ) : (
            !isTablet && (
              <button onClick={() => setCollapsed(!collapsed)} style={{ ...iconBtnStyle(), padding: 4 }} aria-label="Toggle sidebar">
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            )
          )}
          <span
            style={{
              fontFamily: SANS_FONT,
              fontSize: isMobile ? 13 : 14,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isMobile ? 'Seller' : 'OIO Seller'}
          </span>
        </div>

        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 8, flexShrink: 0, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              cursor: 'pointer',
              padding: isMobile ? '6px 10px' : '6px 12px',
              minHeight: 36,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: SANS_FONT,
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
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
            {!isMobile && <span>{tc('layout.backToPlatform')}</span>}
          </button>

          <Tooltip title={isDark ? tc('layout.lightMode') : tc('layout.darkMode')}>
            <button
              onClick={toggleTheme}
              style={iconBtnStyle()}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </button>
          </Tooltip>

          <Tooltip title={tc('layout.switchLanguage')}>
            <button
              onClick={toggleLanguage}
              style={{ ...iconBtnStyle(), gap: 4, fontSize: 12, fontFamily: SANS_FONT, fontWeight: 500 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)' }}
            >
              <GlobalOutlined style={{ fontSize: 14 }} />
              {!isMobile && <span>{i18n.language === 'vi' ? 'EN' : 'VI'}</span>}
            </button>
          </Tooltip>

          <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px', flexShrink: 0 }} />

          <NotificationDropdown />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', borderRadius: 8 }}>
            <UserDropdown mode="portal">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar
                  size={32}
                  src={avatarUrl}
                  icon={!avatarUrl ? <UserOutlined /> : undefined}
                  style={{
                    backgroundColor: avatarUrl ? undefined : 'var(--color-accent-light)',
                    color: avatarUrl ? undefined : 'var(--color-accent)',
                    flexShrink: 0,
                  }}
                />
                {!isMobile && !isTablet && (
                  <span
                    style={{
                      fontFamily: SANS_FONT,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{displayName}</span> <span style={{ opacity: 0.6, fontSize: 11, fontWeight: 400 }}>(@{user?.userName})</span>
                  </span>
                )}
              </div>
            </UserDropdown>
          </div>
        </div>
      </header>

      {/* ── Content area ── */}
      <main
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth + 16,
          paddingTop: HEADER_HEIGHT + 24,
          transition: 'margin-left 200ms ease',
          minHeight: '100vh',
          background: 'transparent',
        }}
      >
        <Content style={{ padding: isMobile ? 12 : isTablet ? 20 : 32 }}>
          <Outlet />
        </Content>
      </main>
    </div>
  )
}
