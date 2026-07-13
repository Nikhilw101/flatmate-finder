import React from 'react';

export default function StatCard({ title, value, color, icon: Icon }) {
  return (
    <div className="dash-card stat-card reveal in" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '16px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.3s' }}>
        {React.isValidElement(Icon) ? React.cloneElement(Icon, { size: 26, color: 'currentColor' }) : <Icon size={26} />}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '6px' }}>{title}</div>
        {value === undefined ? (
          <div className="skeleton" style={{ height: 32, width: 60, borderRadius: 6 }}></div>
        ) : (
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
        )}
      </div>
    </div>
  );
}
