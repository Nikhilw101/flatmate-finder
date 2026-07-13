import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export default function CompatibilityBadge({ score, explanation, style = {} }) {
  if (score === undefined || score === null) return null;

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
