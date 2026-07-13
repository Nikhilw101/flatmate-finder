import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '100px 20px',
        minHeight: '60vh'
      }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--brand)', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '16px 0 12px' }}>Page not found</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 32, maxWidth: 400, lineHeight: 1.6 }}>
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed in the first place.
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ minWidth: 120 }}>
            Go Back
          </button>
          <Link to="/" className="btn btn-primary" style={{ minWidth: 120 }}>
            Return Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
