export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: 32,
        letterSpacing: '-1px',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {children}
    </h1>
  );
}