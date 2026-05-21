import { useState } from 'react'
import '@/styles/admin-tokens.css'
import { Outlet, useNavigate, useLocation, Link } from 'react-router'
import { Layout, Avatar, Tooltip, Drawer, Menu } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserOutlined,
  GlobalOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown'
import { SERIF_FONT, SANS_FONT } from '@/styles/tokens'

const { Content } = Layout

const SIDEBAR_WIDTH = 240
const SIDEBAR_COLLAPSED = 72
const HEADER_HEIGHT = 64

// Shared icon-button style factory
const iconBtnStyle = (accent = false): React.CSSProperties => ({
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 8,
  minWidth: 44,
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: accent ? 'var(--color-accent)' : 'var(--color-text-secondary)',
  fontSize: 16,
  borderRadius: 6,
  transition: 'color 150ms ease',
})

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const { isMobile, isTablet } = useBreakpoint()
  const { t, i18n } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()

  // On tablet: always collapse sidebar
  const effectiveCollapsed = isTablet ? true : collapsed
  const sidebarWidth = effectiveCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH

  const menuItems: MenuProps['items'] = [
    { key: '/admin', icon: <DashboardOutlined />, label: t('menu.dashboard', 'Dashboard') },
    {
      key: 'users',
      label: t('menu.usersManagement', 'Users Management'),
      icon: <TeamOutlined />,
      children: [
        { key: '/admin/users', label: t('menu.users', 'Users') },
        { key: '/admin/sellers', label: t('menu.sellers', 'Sellers') },
        { key: '/admin/verifications', label: t('menu.verifications', 'Verifications') },
      ],
    },
    {
      key: 'catalog',
      label: t('menu.catalogAndAuctions', 'Catalog & Auctions'),
      icon: <ShopOutlined />,
      children: [
        { key: '/admin/items', label: t('menu.items', 'Items') },
        { key: '/admin/auctions', label: t('menu.auctions', 'Auctions') },
      ],
    },
    {
      key: 'moderation',
      label: t('menu.moderation', 'Moderation'),
      icon: <SafetyCertificateOutlined />,
      children: [
        { key: '/admin/items/review', label: t('menu.itemReview', 'Item Review') },
        { key: '/admin/moderation', label: t('menu.reportedContent', 'Reported Content') },
        { key: '/admin/disputes', label: t('menu.disputes', 'Disputes') },
      ],
    },
    {
      key: 'orders',
      label: t('menu.ordersAndFinances', 'Orders & Finances'),
      icon: <DollarOutlined />,
      children: [
        { key: '/admin/orders', label: t('menu.orders', 'Orders') },
        { key: '/admin/payments', label: t('menu.payments', 'Payments') },
      ],
    },
    {
      key: 'system',
      label: t('menu.systemAndSettings', 'System & Settings'),
      icon: <SettingOutlined />,
      children: [
        { key: '/admin/roles', label: t('menu.roles', 'Roles & Permissions') },
        { key: '/admin/monitoring', label: t('menu.monitoring', 'Monitoring') },
        { key: '/admin/terms', label: t('menu.terms', 'Terms') },
      ],
    },
  ]

  // Find which group contains the active item
  const activeKey = location.pathname === '/admin' ? '/admin' : location.pathname
  const openKeys = ['users', 'catalog', 'moderation', 'orders', 'system'].filter(key => {
    const group = menuItems.find(i => i?.key === key) as any
    return group?.children?.some((child: any) => location.pathname.startsWith(child.key))
  })

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key)
    if (mobileDrawerOpen) setMobileDrawerOpen(false)
  }

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'vi' : 'en'
    i18n.changeLanguage(next)
  }

  const displayName = user?.profile?.displayName || user?.profile?.firstName || user?.userName || 'Admin'
  const avatarUrl = user?.profile?.avatarUrl

  const renderMenuItems = (inDrawer = false) => (
    <Menu
      mode="inline"
      selectedKeys={[activeKey]}
      defaultOpenKeys={effectiveCollapsed && !inDrawer ? [] : openKeys}
      inlineCollapsed={effectiveCollapsed && !inDrawer}
      items={menuItems}
      onClick={handleMenuClick}
      style={{
        borderRight: 0,
        background: 'transparent',
        fontFamily: SANS_FONT,
      }}
    />
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      '--navbar-offset-desktop': '64px',
      '--navbar-offset-mobile': '64px'
    } as React.CSSProperties}>
      {/* ── Sidebar (desktop + tablet icon-only) ── */}
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
        {/* Logo area */}
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
            to="/admin"
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
                Admin
              </span>
            )}
          </Link>
        </div>

        {/* Menu */}
        <nav
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}
          aria-label="Admin navigation"
        >
          {renderMenuItems()}
        </nav>

        {/* Sidebar footer */}
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
              Admin
            </span>
          </span>
        }
        placement="left"
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={Math.min(280, window.innerWidth * 0.85)}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        maskClosable={true}
        zIndex={1010}
      >
        <nav style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }} aria-label="Admin navigation (mobile)">
          {renderMenuItems(true)}
        </nav>

        {/* ── Drawer footer: relocated controls from mobile header ── */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => { navigate('/'); setMobileDrawerOpen(false) }}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: SANS_FONT,
              fontSize: 13,
              color: 'var(--color-text-secondary)',
              width: '100%',
            }}
          >
            <ArrowLeftOutlined style={{ fontSize: 12 }} />
            {tc('layout.backToPlatform')}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleTheme}
              style={{
                ...iconBtnStyle(),
                flex: 1,
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '8px 0',
                gap: 8,
                fontSize: 13,
              }}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
              <span style={{ fontFamily: SANS_FONT, fontSize: 12 }}>{isDark ? tc('layout.lightMode') : tc('layout.darkMode')}</span>
            </button>

            <button
              onClick={toggleLanguage}
              style={{
                ...iconBtnStyle(),
                flex: 1,
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '8px 0',
                gap: 8,
                fontSize: 13,
              }}
            >
              <GlobalOutlined style={{ fontSize: 14 }} />
              <span style={{ fontFamily: SANS_FONT, fontSize: 12 }}>{i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}</span>
            </button>
          </div>
        </div>
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
          borderBottom: '0px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 12px' : '0 24px',
          transition: 'left 200ms ease',
          zIndex: 99,
          gap: 8,
        }}
      >
        {/* Left: toggle / hamburger + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, minWidth: 0 }}>
          {isMobile ? (
            <button
              onClick={() => setMobileDrawerOpen(true)}
              style={{ ...iconBtnStyle(), padding: 4 }}
              aria-label="Open menu"
            >
              <MenuOutlined />
            </button>
          ) : (
            !isTablet && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                style={{ ...iconBtnStyle(), padding: 4 }}
                aria-label="Toggle sidebar"
              >
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
            {isMobile ? 'Admin' : 'OIO Admin'}
          </span>
        </div>

        {/* Right: controls — on mobile only show avatar; full controls on desktop */}
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 8, flexShrink: 0, flex: 1, minWidth: 0, overflowX: 'auto', justifyContent: 'flex-end' }}>
          {/* Desktop-only: Back, Theme, Language */}
          {!isMobile && (
            <>
              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '6px 12px',
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
                {tc('layout.backToPlatform')}
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
                  {i18n.language === 'vi' ? 'EN' : 'VI'}
                </button>
              </Tooltip>

              <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 4px', flexShrink: 0 }} />
            </>
          )}

          <NotificationDropdown />

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', borderRadius: 8 }}
          >
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
                {displayName} <span style={{ opacity: 0.6, fontSize: 11, fontWeight: 400 }}>(@{user?.userName})</span>
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
          background: 'transparent',
        }}
      >
        <Content style={{ padding: isMobile ? 16 : isTablet ? 24 : 40 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', background: 'var(--color-bg-container)', padding: isMobile ? 16 : 24, borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
            <Outlet />
          </div>
        </Content>
      </main>
    </div>
  )
}
