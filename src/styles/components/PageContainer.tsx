/**
 * PageContainer
 * Moved from: @/design-system/components/PageContainer
 * Moved to:   @/styles/components/PageContainer
 *
 * Styling via .page-container class in _global.scss
 * No inline styles — fully controlled by the SCSS design-system.
 */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-container">
      {children}
    </div>
  );
}