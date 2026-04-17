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
  SafetyCertificateOutlined,
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
import { useTheme } from '@/hooks/useTheme'
import { useBreakpoint } from '@/hooks/useBreakpoint'
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
  const { isDark, toggle: toggleTheme } = useTheme()

  // On tablet: force icon-only sidebar
  const effectiveCollapsed = isTablet ? true : collapsed
  const sidebarWidth = effectiveCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH

  const menuEntries: MenuEntry[] = [
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* ── Sidebar ── */}
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
          display: isMobile ? 'none' : 'flex',
          flexDirection: 'column',
          zIndex: 100,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            padding: effectiveCollapsed ? '0' : '0 20px',
            borderBottom: '1px solid var(--color-border)',
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
          top: 0,
          left: isMobile ? 0 : sidebarWidth,
          right: 0,
          height: HEADER_HEIGHT,
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 24px',
          transition: 'left 200ms ease',
          zIndex: 99,
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, minWidth: 0 }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 8, flexShrink: 0 }}>
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
            {!isMobile && tc('layout.backToPlatform')}
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
              {!isMobile && (i18n.language === 'vi' ? 'EN' : 'VI')}
            </button>
          </Tooltip>

          <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', borderRadius: 8 }}>
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

      {/* ── Content area ── */}
      <main
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          marginTop: HEADER_HEIGHT,
          transition: 'margin-left 200ms ease',
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          background: 'var(--color-bg-primary)',
        }}
      >
        <Content style={{ padding: isMobile ? 12 : isTablet ? 20 : 32 }}>
          <Outlet />
        </Content>
      </main>
    </div>
  )
}