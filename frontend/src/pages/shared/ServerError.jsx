import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';

export default function ServerError() {
  return (
    <MainLayout>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '100px 20px',
        minHeight: '60vh'
      }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--error)', lineHeight: 1 }}>500</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '16px 0 12px' }}>Something went wrong</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
          We're experiencing some technical difficulties on our end. Please try refreshing the page or come back later.
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ minWidth: 120 }}>
            Refresh Page
          </button>
          <Link to="/" className="btn btn-outline" style={{ minWidth: 120 }}>
            Return Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
