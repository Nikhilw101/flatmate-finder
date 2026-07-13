import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILES = 5;
const MAX_MB = 5;

export default function ImageUploader({ value = [], onChange }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    const invalid = files.find((f) => !ALLOWED.includes(f.type));
    if (invalid) { setError('Only JPEG, PNG, and WEBP files are allowed.'); return; }

    const tooBig = files.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig) { setError(`Each image must be under ${MAX_MB}MB.`); return; }

    const combined = [...value, ...files];
    if (combined.length > MAX_FILES) { setError(`Maximum ${MAX_FILES} images allowed.`); return; }

    onChange(combined);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeFile = (idx) => {
    const updated = value.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>
      )}

      {/* Preview grid */}
      {value.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {value.map((file, idx) => {
            const src = file instanceof File ? URL.createObjectURL(file) : file.url;
            return (
              <div key={idx} style={{ position: 'relative', width: 90, height: 90, borderRadius: 12, overflow: 'hidden', border: '2px solid var(--border)' }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  style={{
                    position: 'absolute', top: 3, right: 3, width: 22, height: 22,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.65)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: 'none', cursor: 'pointer', fontSize: 13, lineHeight: 1
                  }}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload area */}
      {value.length < MAX_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%', padding: '20px', borderRadius: 14,
            border: '2px dashed var(--border)', background: 'var(--bg-section)',
            cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)',
            transition: 'all .2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Camera size={16} /> Click to upload images ({value.length}/{MAX_FILES}) — JPEG, PNG, WEBP, max 5MB each
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />
    </div>
  );
}
