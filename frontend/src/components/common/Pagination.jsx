import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || i === totalPages ||
      (i >= page - 1 && i <= page + 1)
    ) {
      pages.push(i);
    } else if (i === page - 2 || i === page + 2) {
      pages.push('...');
    }
  }
  // Remove duplicate '...'
  const dedupe = pages.filter((p, idx) => p !== '...' || pages[idx - 1] !== '...');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40 }}>
      <button
        className="btn btn-outline"
        style={{ padding: '8px 16px', fontSize: 14 }}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </button>

      {dedupe.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
          : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              style={{
                width: 38, height: 38, borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: p === page ? 'var(--brand)' : '#fff',
                color: p === page ? '#fff' : 'var(--text)',
                border: `1.5px solid ${p === page ? 'var(--brand)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all .2s',
              }}
            >
              {p}
            </button>
          )
      )}

      <button
        className="btn btn-outline"
        style={{ padding: '8px 16px', fontSize: 14 }}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}
