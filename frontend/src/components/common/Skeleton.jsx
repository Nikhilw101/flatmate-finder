import React from 'react';

export default function Skeleton({ width, height, borderRadius, style, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width || '100%',
        height: height || '1em',
        borderRadius: borderRadius || 4,
        ...style
      }}
    />
  );
}
