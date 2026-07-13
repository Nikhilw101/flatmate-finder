import React from 'react';

export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', gap: 16 }}>
      <div className="spinner"></div>
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}
