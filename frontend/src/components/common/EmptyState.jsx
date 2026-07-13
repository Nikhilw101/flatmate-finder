import React from 'react';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 20px', textAlign: 'center',
      background: 'var(--bg-section)', borderRadius: 24, border: '1px dashed var(--border)',
      margin: '20px 0'
    }}>
      <div style={{ marginBottom: 16 }}>
        {typeof icon === 'string' ? <span style={{ fontSize: 40 }}>{icon}</span> : icon}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 360, lineHeight: 1.6, marginBottom: action ? 24 : 0 }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
