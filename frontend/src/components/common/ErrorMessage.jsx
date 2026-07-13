import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 16, padding: '24px 28px', textAlign: 'center', margin: '24px 0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--error)' }}>
        <AlertTriangle size={32} />
      </div>
      <p style={{ color: 'var(--error)', fontWeight: 600, fontSize: 15, margin: '0 0 16px' }}>
        {message || 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ fontSize: 14 }}>
          Try again
        </button>
      )}
    </div>
  );
}
