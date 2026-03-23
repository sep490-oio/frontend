/**
 * typography.tsx — shared typography primitives.
 * All styling via CSS classes in _global.scss — no inline styles.
 */

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="page-title">
      {children}
    </h1>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="section-title">
      {children}
    </h2>
  );
}

export function PageSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="page-subtitle">
      {children}
    </p>
  );
}