import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export default function CompatibilityBadge({ score, explanation, style = {} }) {
  if (score === undefined || score === null) return null;

  if (score === 0 && explanation && explanation.includes('Location mismatch')) {
    return (
      <div
        title={explanation}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger, #ef4444)', padding: '6px 12px',
          borderRadius: 999, fontSize: 13, fontWeight: 700,
          cursor: explanation ? 'help' : 'default',
          backdropFilter: 'blur(4px)',
          border: `1px solid rgba(239, 68, 68, 0.4)`,
          ...style
        }}
      >
        <Info size={14} />
        <span>Location Mismatch</span>
      </div>
    );
  }

  let color = 'var(--ai)';
  let bg = 'rgba(124, 58, 237, 0.15)'; // AI purple light background

  return (
    <div
      title={explanation}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: bg, color: color, padding: '6px 12px',
        borderRadius: 999, fontSize: 13, fontWeight: 700,
        cursor: explanation ? 'help' : 'default',
        backdropFilter: 'blur(4px)',
        border: `1px solid rgba(124, 58, 237, 0.4)`,
        ...style
      }}
    >
      <Sparkles size={14} />
      <span>{score}% Match</span>
    </div>
  );
}
