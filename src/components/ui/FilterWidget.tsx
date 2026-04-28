import React from 'react';

interface FilterWidgetProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

const FilterWidget: React.FC<FilterWidgetProps> = ({ title, icon, children, noPadding = false }) => (
  <div style={{
    background: 'var(--color-bg-card)',
    borderRadius: 16,
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  }}>
    {title && (
      <div style={{
        padding: '16px 20px',
        borderBottom: '0px solid var(--color-border)',
        fontWeight: 600,
        fontSize: 15,
        color: 'var(--color-text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {icon && <span style={{ color: 'var(--color-accent)', display: 'flex', fontSize: 16 }}>{icon}</span>}
        {title}
      </div>
    )}
    <div style={{ padding: noPadding ? 0 : '20px' }}>
      {children}
    </div>
  </div>
);

export default FilterWidget;
