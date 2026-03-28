import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router'
import { Layout, Avatar, Dropdown, Button, Space, Drawer } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, HistoryOutlined, SunOutlined, MoonOutlined, HeartOutlined, WalletOutlined, ShoppingOutlined, CommentOutlined, SafetyCertificateOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAppSelector } from '@/app/store'
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown'
import { TermsAcceptanceBanner } from '@/features/user/components/TermsAcceptanceBanner'
import { usePendingTerms } from '@/features/user/api'

function getRolesFromToken(token: string | null): string[] {
  if (!token) return []
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const roles: string[] = Array.isArray(payload.role) ? payload.role : payload.role ? [payload.role] : []
    return roles.map((r) => r.toLowerCase())
  } catch {
    return []
  }
}

const { Header, Content, Footer } = Layout

const SERIF_FONT = "'DM Serif Display', Georgia, serif"
const SANS_FONT = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout: handleLogout } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const roles = getRolesFromToken(accessToken)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isMobile } = useBreakpoint()

  // Platform terms redirect — enforce before any app usage
  const { data: platformTerms } = usePendingTerms('platform')
  useEffect(() => {
    if (isAuthenticated && platformTerms?.hasPending && !location.pathname.startsWith('/me/terms')) {
      navigate(`/me/terms?type=platform&returnTo=${encodeURIComponent(location.pathname)}`)
    }
  }, [isAuthenticated, platformTerms?.hasPending, location.pathname, navigate])

  const userMenuItems = [
    { key: 'dashboard', icon: <UserOutlined />, label: t('common:menu.home', 'Dashboard') },
    { key: 'profile', icon: <UserOutlined />, label: t('common:menu.profile', 'Profile') },
    { key: 'bids', icon: <HistoryOutlined />, label: t('common:menu.bids', 'My Bids') },
    { key: 'watchlist', icon: <HeartOutlined />, label: t('common:menu.watchlist', 'Watchlist') },
    { key: 'orders', icon: <ShoppingOutlined />, label: t('common:menu.myOrders', 'Orders') },
    { key: 'wallet', icon: <WalletOutlined />, label: t('common:menu.wallet', 'Wallet') },
    { key: 'disputes', icon: <CommentOutlined />, label: t('common:menu.disputes', 'Disputes') },
    { type: 'divider' as const },
    { key: 'verification', icon: <SafetyCertificateOutlined />, label: t('common:menu.verification', 'Verification') },
    { key: 'security', icon: <SettingOutlined />, label: t('common:menu.security', 'Security') },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: t('common:menu.logout', 'Sign Out'), danger: true },
  ]

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'dashboard': navigate('/me/dashboard'); break
      case 'profile': navigate('/me/profile'); break
      case 'bids': navigate('/me/bids'); break
      case 'watchlist': navigate('/me/watchlist'); break
      case 'orders': navigate('/me/orders'); break
      case 'wallet': navigate('/me/wallet'); break
      case 'disputes': navigate('/me/disputes'); break
      case 'security': navigate('/me/security'); break
      case 'verification': navigate('/me/verification'); break
      case 'logout': handleLogout().then(() => navigate('/')); break
    }
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      <a href="#main-content" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden', zIndex: 9999 }} onFocus={(e) => { e.currentTarget.style.position = 'static'; e.currentTarget.style.width = 'auto'; e.currentTarget.style.height = 'auto'; }}>Skip to main content</a>
      {/* ─── Header ─── */}
      <Header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 64,
          lineHeight: '64px',
          padding: isMobile ? '0 16px' : '0 48px',
          background: isDark ? 'rgba(15, 15, 15, 0.95)' : 'rgba(250, 250, 247, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Hamburger (mobile) + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              style={{ color: 'var(--color-text-primary)', fontSize: 18 }}
            />
          )}
          <Link
            to="/"
            style={{
              fontFamily: SERIF_FONT,
              fontSize: 24,
              letterSpacing: '0.1em',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              fontWeight: 400,
            }}
          >
            OIO
          </Link>
        </div>

        {/* Center: Nav links (hidden on mobile) */}
        <nav
          style={{
            display: isMobile ? 'none' : 'flex',
            gap: 32,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <Link
            to="/auctions"
            style={{
              fontFamily: SANS_FONT,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              transition: 'color 200ms ease',
            }}
          >
            {t('common:menu.auctions', 'Auctions')}
          </Link>
          <Link
            to="/items"
            style={{
              fontFamily: SANS_FONT,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              transition: 'color 200ms ease',
            }}
          >
            {t('common:menu.items', 'Items')}
          </Link>
          <Link
            to="/sellers"
            style={{
              fontFamily: SANS_FONT,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              transition: 'color 200ms ease',
            }}
          >
            {t('common:menu.sellers', 'Sellers')}
          </Link>
          <Link
            to="/about"
            style={{
              fontFamily: SANS_FONT,
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              transition: 'color 200ms ease',
            }}
          >
            {t('common:menu.about', 'Về chúng tôi')}
          </Link>
          {isAuthenticated && roles.includes('admin') && (
            <Link
              to="/admin"
              style={{
                fontFamily: SANS_FONT,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }}
            >
              {t('common:menu.admin', 'Admin')}
            </Link>
          )}
          {isAuthenticated && (roles.includes('inspector') || roles.includes('warehousemanager')) && (
            <Link
              to="/inspector"
              style={{
                fontFamily: SANS_FONT,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }}
            >
              {t('common:menu.inspector', 'Inspector')}
            </Link>
          )}
          {isAuthenticated && roles.includes('seller') && (
            <Link
              to="/seller"
              style={{
                fontFamily: SANS_FONT,
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-accent)',
                textDecoration: 'none',
                transition: 'color 200ms ease',
              }}
            >
              {t('common:menu.seller', 'Seller')}
            </Link>
          )}
        </nav>

        {/* Right: Actions */}
        <Space size="middle">
          {/* Language toggle */}
          <Button
            type="text"
            aria-label="Switch language"
            onClick={() => {
              const next = i18n.language === 'vi' ? 'en' : 'vi'
              i18n.changeLanguage(next)
            }}
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              padding: '4px 8px',
            }}
          >
            {i18n.language === 'vi' ? 'EN' : 'VI'}
          </Button>
          {/* Theme toggle */}
          <Button
            type="text"
            aria-label="Toggle dark mode"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ color: 'var(--color-text-primary)' }}
          />
          {isAuthenticated ? (
            <>
              <NotificationDropdown />
              <Dropdown
                menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar
                    size={32}
                    src={user?.profile?.avatarUrl}
                    icon={<UserOutlined />}
                    style={{ border: '1px solid var(--color-border)' }}
                  />
                </Space>
              </Dropdown>
            </>
          ) : (
            <Space size={12}>
              <Button
                type="text"
                onClick={() => navigate('/login')}
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  height: 36,
                }}
              >
                {t('common:action.login', 'Sign In')}
              </Button>
              <Button
                type="primary"
                onClick={() => navigate('/register')}
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 14,
                  fontWeight: 500,
                  height: 36,
                  borderRadius: 2,
                }}
              >
                {t('common:action.register', 'Register')}
              </Button>
            </Space>
          )}
        </Space>
      </Header>

      {/* ─── Mobile Navigation Drawer ─── */}
      <Drawer
        title={
          <span style={{ fontFamily: SERIF_FONT, fontSize: 20, letterSpacing: '0.1em' }}>
            OIO
          </span>
        }
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: 0 } }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
          {[
            { to: '/auctions', label: t('common:menu.auctions', 'Auctions') },
            { to: '/items', label: t('common:menu.items', 'Items') },
            { to: '/sellers', label: t('common:menu.sellers', 'Sellers') },
            { to: '/about', label: t('common:menu.about', 'About') },
            ...(isAuthenticated && roles.includes('admin')
              ? [{ to: '/admin', label: t('common:menu.admin', 'Admin') }]
              : []),
            ...(isAuthenticated && (roles.includes('inspector') || roles.includes('warehousemanager'))
              ? [{ to: '/inspector', label: t('common:menu.inspector', 'Inspector') }]
              : []),
            ...(isAuthenticated && roles.includes('seller')
              ? [{ to: '/seller', label: t('common:menu.seller', 'Seller') }]
              : []),
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontFamily: SANS_FONT,
                fontSize: 15,
                fontWeight: 500,
                color: location.pathname.startsWith(item.to)
                  ? 'var(--color-accent)'
                  : 'var(--color-text-primary)',
                textDecoration: 'none',
                padding: '12px 24px',
                borderLeft: location.pathname.startsWith(item.to)
                  ? '3px solid var(--color-accent)'
                  : '3px solid transparent',
                background: location.pathname.startsWith(item.to)
                  ? 'var(--color-accent-light, rgba(196, 147, 61, 0.08))'
                  : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>

      {/* ─── Terms Acceptance Banner ─── */}
      {isAuthenticated && (
        <div style={{ marginTop: 64 }}>
          <TermsAcceptanceBanner />
        </div>
      )}

      {/* ─── Content ─── */}
      <Content
        id="main-content"
        style={{
          marginTop: 64,
          width: '100%',
          maxWidth: 1440,
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: isMobile ? '0 16px' : '0 48px',
          minHeight: 'calc(100vh - 64px - 200px)',
        }}
      >
        <div key={location.pathname} className="oio-page-enter">
          <Outlet />
        </div>
      </Content>

      {/* ─── Footer ─── */}
      <Footer
        style={{
          background: 'var(--color-bg-primary)',
          borderTop: '1px solid var(--color-border)',
          padding: isMobile ? '32px 16px' : '64px 48px',
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 24 : 48,
          }}
        >
          {/* Column 1 */}
          <div>
            <div
              style={{
                fontFamily: SERIF_FONT,
                fontSize: 20,
                letterSpacing: '0.1em',
                color: 'var(--color-text-primary)',
                marginBottom: 16,
              }}
            >
              OIO
            </div>
            <p style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              {t('common:footer.tagline', 'Premium auction platform for discerning collectors.')}
            </p>
          </div>

          {/* Column 2 */}
          <div>
            <div
              style={{
                fontFamily: SANS_FONT,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--color-text-secondary)',
                marginBottom: 16,
              }}
            >
              {t('common:footer.platform', 'Platform')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/auctions" style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                {t('common:menu.auctions', 'Auctions')}
              </Link>
              <Link to="/categories" style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                {t('common:menu.categories', 'Categories')}
              </Link>
            </div>
          </div>

          {/* Column 3 */}
          <div>
            <div
              style={{
                fontFamily: SANS_FONT,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: 'var(--color-text-secondary)',
                marginBottom: 16,
              }}
            >
              {t('common:footer.support', 'Support')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/help" style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                {t('common:footer.help', 'Help Center')}
              </Link>
              <Link to="/terms" style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                {t('common:footer.terms', 'Terms of Service')}
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            paddingTop: 32,
            marginTop: 48,
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            fontFamily: SANS_FONT,
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          &copy; {new Date().getFullYear()} OIO. All rights reserved.
        </div>
      </Footer>
    </Layout>
  )
}
