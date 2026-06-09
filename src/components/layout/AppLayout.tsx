import { useState, useMemo, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router'
import { Layout, Avatar, Button, Space, Drawer, Alert } from 'antd'
import { FileProtectOutlined } from '@ant-design/icons'
import {
  UserOutlined,
  MenuOutlined,
  CloseOutlined,
  SearchOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import { UserDropdown } from './UserDropdown'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useAppDispatch, setUser } from '@/app/store'
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown'
import { TermsAcceptanceModal } from '@/components/terms/TermsAcceptanceModal'
import { SpotlightSearchModal } from '@/components/layout/SpotlightSearchModal'
import { TermsGateProvider } from '@/features/user/components/TermsGateProvider'
import { useActiveTermsByType, useAcceptedTerms, useCurrentUser } from '@/features/user/api'
import { SERIF_FONT, SANS_FONT } from '@/styles/tokens'

const { Header, Content, Footer } = Layout

export function AppLayout() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, isTablet } = useBreakpoint()
  const { isAuthenticated } = useAuth()
  const { data: currentUserData } = useCurrentUser({ enabled: isAuthenticated })
  const { isDark, toggle: toggleTheme } = useTheme()
  const dispatch = useAppDispatch()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isNarrow = isMobile || isTablet

  // Sync user data to redux store for global access (e.g. ownership checks)
  useEffect(() => {
    if (currentUserData) {
      dispatch(setUser(currentUserData))
    }
  }, [currentUserData, dispatch])

  // Platform terms — preview-first modal (no route redirect). The user can
  // dismiss the modal and keep browsing; gated actions still require acceptance
  // via their own local <TermsAcceptanceModal> instances.
  //
  // Source of truth: useActiveTermsByType('platform') confirms a publishable
  // document exists, and useAcceptedTerms checks the user hasn't already
  // accepted it. This avoids the stale-cache desync where usePendingTerms
  // reported hasPending=true but the modal's own fetch found no document.
  const { data: activePlatformTerm } = useActiveTermsByType('platform')
  const { data: acceptedTermsList } = useAcceptedTerms({ enabled: isAuthenticated })
  const [platformTermsModalOpen, setPlatformTermsModalOpen] = useState(false)

  const platformTermNeedsAcceptance = useMemo(() => {
    if (!activePlatformTerm || !acceptedTermsList) return false
    const acceptedDocIds = new Set(
      acceptedTermsList.map((a) => a.document?.id).filter(Boolean),
    )
    return !acceptedDocIds.has(activePlatformTerm.id)
  }, [activePlatformTerm, acceptedTermsList])


  // All nav links (public/general)
  const navLinks = [
    { to: '/auctions', label: t('common:menu.auctions', 'Auctions'), alwaysShow: true },
    { to: '/items', label: t('common:menu.items', 'Items'), alwaysShow: true },
    { to: '/sellers', label: t('common:menu.sellers', 'Sellers'), alwaysShow: true },
    { to: '/about', label: t('common:menu.about'), alwaysShow: true },
  ]

  return (
    <TermsGateProvider>
      <Layout style={{
        minHeight: '100vh',
        background: 'transparent',
        '--navbar-offset-desktop': '112px',
        '--navbar-offset-mobile': '96px'
      } as React.CSSProperties}>
        <a href="#main-content" className="skip-link">
          {t('common:layout.skipToContent')}
        </a>

        {/* ─── Header ─── */}
        <Header
          style={{
            position: 'fixed',
            top: isMobile ? 8 : 16,
            left: isMobile ? 8 : 16,
            right: isMobile ? 8 : 16,
            zIndex: 1000,
            height: 72,
            lineHeight: '72px',
            padding: isMobile ? '0 20px' : '0 40px',
            background: isDark ? 'rgba(5, 7, 10, 0.3)' : 'rgba(253, 251, 247, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Left: Hamburger (mobile/tablet) + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flex: '1 1 0%', minWidth: 0 }}>
            {isNarrow && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                aria-label={t('common:layout.openMenu')}
                style={{ color: 'var(--color-text-primary)', fontSize: 18, minWidth: 44, minHeight: 44 }}
              />
            )}
            <Link
              to="/"
              style={{
                fontFamily: SERIF_FONT,
                fontSize: isMobile ? 20 : 24,
                letterSpacing: '0.1em',
                color: 'var(--color-text-primary)',
                textDecoration: 'none',
                fontWeight: 400,
                flexShrink: 0,
              }}
            >
              OIO
            </Link>
          </div>

          {/* Center: Nav links (desktop only) */}
          {!isNarrow && (
            <nav
              style={{
                display: 'flex',
                gap: isTablet ? 20 : 32,
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    fontFamily: SANS_FONT,
                    fontSize: 14,
                    fontWeight: 500,
                    color: (link as any).accent ? 'var(--color-accent)' : 'var(--color-text-primary)',
                    textDecoration: 'none',
                    transition: 'color 200ms ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Right: Actions */}
          <div className="hide-scrollbar" style={{
            flex: '1 1 0%',
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: isMobile ? 4 : 12,
            overflowX: 'hidden'
          }}>
            {/* Search bar (desktop only) */}
            {!isNarrow && (
              <div style={{
                lineHeight: '36px',
                height: 36,
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: 100,

                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                flex: '0 0 auto',
                width: 200,
                transition: 'all 0.3s ease',
              }}>
                <div
                  style={{ width: '100%', cursor: 'text' }}
                  onClick={() => window.dispatchEvent(new Event('open-spotlight'))}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: 36,
                    padding: '0 12px',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: 13
                  }}>
                    <SearchOutlined style={{ marginRight: 8 }} />
                    <span>{t('common:action.search', 'Search...')}</span>
                    <div style={{
                      marginLeft: 'auto',
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',

                      boxShadow: '0 1px 0 rgba(0,0,0,0.1)'
                    }}>Ctrl B</div>
                  </div>
                </div>
              </div>
            )}

            {/* Language toggle — hidden on mobile */}
            {!isMobile && (
              <Button
                type="text"
                aria-label={t('common:layout.switchLanguage')}
                onClick={() => {
                  const next = i18n.language === 'vi' ? 'en' : 'vi'
                  i18n.changeLanguage(next)
                }}
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '4px 8px',
                  minHeight: 44,
                }}
              >
                <span>{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
              </Button>
            )}

            {/* Theme toggle */}
            <Button
              type="text"
              aria-label={isDark ? t('common:layout.lightMode') : t('common:layout.darkMode')}
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{ color: 'var(--color-text-primary)', minWidth: 44, minHeight: 44 }}
            />

            {isAuthenticated ? (
              <>
                <NotificationDropdown />
                <UserDropdown>
                  <Space style={{ cursor: 'pointer' }}>
                    {!isMobile && (
                      <span style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--color-text-primary)',
                        fontFamily: SANS_FONT,
                        display: 'inline-flex',
                        alignItems: 'center',
                        maxWidth: isTablet ? 120 : 250,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {currentUserData?.profile?.displayName ?? currentUserData?.userName}
                        </span>
                        {!isTablet && (
                          <span style={{ 
                            marginLeft: 6, 
                            opacity: 0.6, 
                            fontSize: 12, 
                            fontWeight: 400,
                            flexShrink: 0
                          }}>
                            (@{currentUserData?.userName})
                          </span>
                        )}
                      </span>
                    )}
                    <Avatar
                      size={32}
                      src={currentUserData?.profile?.avatarUrl}
                      icon={<UserOutlined />}
                      style={{ border: '1px solid var(--color-border)' }}
                    />
                  </Space>
                </UserDropdown>
              </>
            ) : (
              <Space size={isMobile ? 6 : 12}>
                <Button
                  type="text"
                  onClick={() => navigate('/login')}
                  style={{
                    fontFamily: SANS_FONT,
                    fontSize: isMobile ? 13 : 14,
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    height: 36,
                    padding: isMobile ? '0 8px' : '0 15px',
                  }}
                >
                  {t('common:action.login', 'Sign In')}
                </Button>
                {!isMobile && (
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
                )}
              </Space>
            )}
          </div>
        </Header>

        {/* ─── Mobile / Tablet Navigation Drawer ─── */}
        <Drawer
          title={
            <span style={{ fontFamily: SERIF_FONT, fontSize: 20, letterSpacing: '0.1em' }}>
              OIO
            </span>
          }
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={Math.min(280, window.innerWidth * 0.85)}
          closeIcon={<CloseOutlined />}
          styles={{ body: { padding: 0 } }}
        >
          {/* Drawer search */}
          <div style={{ padding: '12px 16px 8px' }}>
            <div style={{
              height: 40,
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 100,
              border: '1px solid var(--color-border-light)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}>
              <div
                style={{ width: '100%', cursor: 'text' }}
                onClick={() => {
                  setMobileMenuOpen(false)
                  window.dispatchEvent(new Event('open-spotlight'))
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: 40,
                  padding: '0 16px',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: 14
                }}>
                  <SearchOutlined style={{ marginRight: 8 }} />
                  <span>{t('common:action.search', 'Search...')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawer nav links */}
          <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontFamily: SANS_FONT,
                  fontSize: 15,
                  fontWeight: 500,
                  color: location.pathname.startsWith(link.to)
                    ? 'var(--color-accent)'
                    : 'var(--color-text-primary)',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderLeft: location.pathname.startsWith(link.to)
                    ? '3px solid var(--color-accent)'
                    : '3px solid transparent',
                  background: location.pathname.startsWith(link.to)
                    ? 'var(--color-accent-light, rgba(196, 147, 61, 0.08))'
                    : 'transparent',
                }}
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Language toggle in drawer (mobile only) */}
          <div style={{ padding: '8px 24px', borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
            <Button
              type="text"
              onClick={() => {
                const next = i18n.language === 'vi' ? 'en' : 'vi'
                i18n.changeLanguage(next)
              }}
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                padding: 0,
                height: 44,
              }}
            >
              <span>{i18n.language === 'vi' ? t('common:layout.switchToEn') : t('common:layout.switchToVi')}</span>
            </Button>
          </div>
        </Drawer>

        {/* ─── Platform Terms Modal ─── */}
        {isAuthenticated && (
          <TermsAcceptanceModal
            open={platformTermsModalOpen}
            onClose={() => setPlatformTermsModalOpen(false)}
            termType="platform"
          />
        )}

        {/* ─── Content ─── */}
        <Content
          id="main-content"
          style={{
            marginTop: isMobile ? 88 : 104,
            width: '100%',
            maxWidth: 1600,
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: isMobile ? '0 12px' : isTablet ? '0 24px' : '0 48px',
            minHeight: 'calc(100vh - 64px - 200px)',
          }}
        >
          <div>
            {isAuthenticated && platformTermNeedsAcceptance && (
              <Alert
                type="warning"
                showIcon
                icon={<FileProtectOutlined />}
                style={{ marginTop: 16, marginBottom: 8 }}
                message={t('common:terms.pendingBannerTitle', 'Action required: review updated Platform Terms', { type: t('common:terms.type.platform', 'Platform Terms') })}
                description={t('common:terms.pendingBannerDesc', 'You need to review and accept the current version before your account can perform gated actions.')}
                action={
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => setPlatformTermsModalOpen(true)}
                    style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                  >
                    {t('common:terms.reviewAndAccept', 'Review & Accept')}
                  </Button>
                }
              />
            )}
            <Outlet />
          </div>
        </Content>

        {/* ─── Footer ─── */}
        <Footer
          style={{
            background: 'transparent',
            padding: isMobile ? '32px 16px' : isTablet ? '48px 24px' : '64px 48px',
          }}
        >
          <div
            style={{
              maxWidth: 1600,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: isMobile ? 24 : isTablet ? 32 : 48,
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
              <p style={{ fontFamily: SANS_FONT, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
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
              maxWidth: 1600,
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

        {/* ─── Spotlight Search ─── */}
        <SpotlightSearchModal />
      </Layout>
    </TermsGateProvider>
  )
}
