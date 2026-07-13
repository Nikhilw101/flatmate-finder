import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import listingService from '../../services/listing.service';
import ImageUploader from '../../components/listing/ImageUploader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { ROOM_TYPES, FURNISHING_STATUS } from '../../config/constants';

function Field({ label, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [original, setOriginal] = useState(null);
  const [form, setForm] = useState({});
  const [newImages, setNewImages] = useState([]); // New File[] to upload
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await listingService.getById(id);
        if (res.success) {
          const l = res.data;
          setOriginal(l);
          setForm({
            location: l.location || '',
            rent: l.rent || '',
            availableFrom: l.availableFrom ? l.availableFrom.split('T')[0] : '',
            roomType: l.roomType || '',
            furnishingStatus: l.furnishingStatus || '',
            description: l.description || '',
          });
        }
      } catch (err) {
        setLoadError(err.message);
      }
    };
    load();
  }, [id]);

  const handleChange = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (form.location !== undefined && form.location.trim().length < 2) e.location = 'Location must be at least 2 characters.';
    if (form.rent !== undefined && (isNaN(form.rent) || Number(form.rent) <= 0)) e.rent = 'Rent must be positive.';
    if (form.description && form.description.length > 1000) e.description = 'Max 1000 characters.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const fd = new FormData();
    if (form.location) fd.append('location', form.location.trim());
    if (form.rent) fd.append('rent', form.rent);
    if (form.availableFrom) fd.append('availableFrom', form.availableFrom);
    if (form.roomType) fd.append('roomType', form.roomType);
    if (form.furnishingStatus) fd.append('furnishingStatus', form.furnishingStatus);
    if (form.description !== undefined) fd.append('description', form.description);
    newImages.forEach((f) => fd.append('images', f));

    try {
      setSubmitting(true);
      setApiError(null);
      const res = await listingService.update(id, fd);
      if (res.success) navigate('/owner/listings');
    } catch (err) {
      setApiError(err.message || 'Failed to update listing.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <DashboardLayout><ErrorMessage message={loadError} onRetry={() => window.location.reload()} /></DashboardLayout>;
  if (!original) return <DashboardLayout><LoadingSpinner message="Loading listing…" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Edit Listing</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Update Your Room</h1>
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <div className="dash-card" style={{ padding: '36px 40px' }}>
          <form onSubmit={handleSubmit} noValidate>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--divider)' }}>Basic Info</h3>
            
            <Field label="Location" error={errors.location}>
              <input className="form-input" type="text" value={form.location || ''} onChange={(e) => handleChange('location', e.target.value)} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Monthly Rent (₹)" error={errors.rent}>
                <input className="form-input" type="number" min="1" value={form.rent || ''} onChange={(e) => handleChange('rent', e.target.value)} />
              </Field>
              <Field label="Available From">
                <input className="form-input" type="date" value={form.availableFrom || ''} onChange={(e) => handleChange('availableFrom', e.target.value)} />
              </Field>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--divider)' }}>Amenities & Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Room Type">
                <select className="form-input" value={form.roomType || ''} onChange={(e) => handleChange('roomType', e.target.value)}>
                  {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Furnishing Status">
                <select className="form-input" value={form.furnishingStatus || ''} onChange={(e) => handleChange('furnishingStatus', e.target.value)}>
                  {FURNISHING_STATUS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Description" error={errors.description}>
              <textarea
                className="form-input"
                style={{ resize: 'vertical', minHeight: 100 }}
                maxLength={1000}
                value={form.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{(form.description || '').length}/1000</div>
            </Field>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 32, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--divider)' }}>Media</h3>

            <Field label="Add New Photos (appended to existing)">
              <ImageUploader value={newImages} onChange={setNewImages} />
              {original.images?.length > 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                  Currently {original.images.length} image(s) on this listing. New uploads will be appended.
                </p>
              )}
            </Field>

            <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1, padding: 15, borderRadius: 14 }} onClick={() => navigate('/owner/listings')}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-submit" style={{ flex: 2, margin: 0 }}>
                {submitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
