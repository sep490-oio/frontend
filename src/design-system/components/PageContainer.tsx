export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '64px 24px' }}>
      {children}
    </div>
  );
}