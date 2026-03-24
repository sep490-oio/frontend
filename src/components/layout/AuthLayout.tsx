import { Outlet, Link } from 'react-router'

const SERIF_FONT = "'DM Serif Display', Georgia, serif"

export function AuthLayout() {
  return (
    <div
      className="oio-grain"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        padding: 24,
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: SERIF_FONT,
          fontSize: 36,
          letterSpacing: '0.15em',
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          fontWeight: 400,
          marginBottom: 40,
        }}
      >
        OIO
      </Link>

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 440,
          padding: 40,
          borderRadius: 4,
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
          boxShadow: '0 4px 12px rgba(26, 26, 26, 0.06)',
        }}
      >
        <Outlet />
      </div>

      {/* Back to home */}
      <Link
        to="/"
        style={{
          position: 'relative',
          zIndex: 1,
          marginTop: 24,
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          textDecoration: 'none',
        }}
      >
        ← Về trang chủ
      </Link>
    </div>
  )
}
