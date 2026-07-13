import React from 'react';
import { ROOM_TYPES, FURNISHING_STATUS, SORT_OPTIONS } from '../../config/constants';

const inputStyle = {
  padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 12,
  fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', background: '#fff',
  width: '100%', cursor: 'pointer',
};

export default function ListingFilters({ filters, onChange, onReset }) {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 20,
      padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 12,
      alignItems: 'flex-end', marginBottom: 32, boxShadow: 'var(--shadow-card)',
    }}>
      {/* Location */}
      <div style={{ flex: '1 1 160px' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Location</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. Bengaluru"
          value={filters.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      {/* Min Rent */}
      <div style={{ flex: '1 1 110px' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Min Rent</label>
        <input
          style={inputStyle}
          type="number"
          placeholder="₹0"
          min="0"
          value={filters.minRent || ''}
          onChange={(e) => handleChange('minRent', e.target.value)}
        />
      </div>

      {/* Max Rent */}
      <div style={{ flex: '1 1 110px' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Max Rent</label>
        <input
          style={inputStyle}
          type="number"
          placeholder="Any"
          min="0"
          value={filters.maxRent || ''}
          onChange={(e) => handleChange('maxRent', e.target.value)}
        />
      </div>

      {/* Room Type */}
      <div style={{ flex: '1 1 150px' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Room Type</label>
        <select style={inputStyle} value={filters.roomType || ''} onChange={(e) => handleChange('roomType', e.target.value)}>
          <option value="">All types</option>
          {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Furnishing */}
      <div style={{ flex: '1 1 150px' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Furnishing</label>
        <select style={inputStyle} value={filters.furnishingStatus || ''} onChange={(e) => handleChange('furnishingStatus', e.target.value)}>
          <option value="">All</option>
          {FURNISHING_STATUS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Sort */}
      <div style={{ flex: '1 1 150px' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>Sort By</label>
        <select style={inputStyle} value={filters.sort || 'newest'} onChange={(e) => handleChange('sort', e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Reset */}
      <button
        className="btn btn-outline"
        style={{ fontSize: 13, padding: '10px 18px', alignSelf: 'flex-end', flexShrink: 0 }}
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
}
