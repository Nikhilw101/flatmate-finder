import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import tenantService from '../../services/tenant.service';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROOM_TYPES, FURNISHING_STATUS } from '../../config/constants';

const inputStyle = {
  width: '100%', padding: '13px 16px', border: '1.5px solid var(--border)',
  borderRadius: 12, fontSize: 15, fontFamily: 'inherit', color: 'var(--text)',
  background: '#fff', transition: 'border-color .2s, box-shadow .2s',
};
const labelStyle = { display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 };

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

const INITIAL = { preferredLocation: '', minBudget: '', maxBudget: '', moveInDate: '', preferredRoomType: 'Any', preferredFurnishing: 'Any' };

export default function TenantProfile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [nameForm, setNameForm] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [nameSubmitting, setNameSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    if (user) setNameForm(user.name || '');
    tenantService.getProfile()
      .then((res) => {
        if (res.success && res.data) {
          const p = res.data;
          setForm({
            preferredLocation: p.preferredLocation || '',
            minBudget: p.minBudget ?? '',
            maxBudget: p.maxBudget ?? '',
            moveInDate: p.moveInDate ? p.moveInDate.split('T')[0] : '',
            preferredRoomType: p.preferredRoomType || 'Any',
            preferredFurnishing: p.preferredFurnishing || 'Any',
          });
          setIsExisting(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.preferredLocation.trim()) e.preferredLocation = 'Preferred location is required.';
    if (form.minBudget === '' || isNaN(form.minBudget) || Number(form.minBudget) < 0) e.minBudget = 'Min budget must be 0 or more.';
    if (form.maxBudget === '' || isNaN(form.maxBudget)) e.maxBudget = 'Max budget is required.';
    if (form.minBudget !== '' && form.maxBudget !== '' && Number(form.maxBudget) < Number(form.minBudget)) e.maxBudget = 'Max budget must be ≥ min budget.';
    if (!form.moveInDate) e.moveInDate = 'Move-in date is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setSubmitting(true);
      setApiError(null);
      setSuccess(false);
      const res = await tenantService.upsertProfile({
        preferredLocation: form.preferredLocation.trim(),
        minBudget: Number(form.minBudget),
        maxBudget: Number(form.maxBudget),
        moveInDate: form.moveInDate,
        preferredRoomType: form.preferredRoomType,
        preferredFurnishing: form.preferredFurnishing,
      });
      if (res.success) {
        setIsExisting(true);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!nameForm.trim() || nameForm.trim().length < 2) return;
    try {
      setNameSubmitting(true);
      const res = await tenantService.updateMe({ name: nameForm.trim() });
      if (res.success) login(localStorage.getItem('token'), res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setNameSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            {isExisting ? 'Update Profile' : 'Create Profile'}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Your Preferences</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 6 }}>
            These preferences drive your AI Fit Score matching in the next stage.
          </p>
        </div>

        {/* Name Section */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 24, padding: '28px 36px', boxShadow: 'var(--shadow-card)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>Account Info</h2>
          <form onSubmit={handleNameSave} noValidate>
            <Field label="Full Name">
              <input style={inputStyle} type="text" value={nameForm} onChange={(e) => setNameForm(e.target.value)} />
            </Field>
            <Field label="Email">
              <input style={{ ...inputStyle, background: 'var(--bg-section)', cursor: 'not-allowed' }} type="email" value={user?.email || ''} readOnly />
            </Field>
            <button type="submit" disabled={nameSubmitting} className="btn btn-outline" style={{ fontSize: 14 }}>
              {nameSubmitting ? 'Saving…' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Preferences Section */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 24, padding: '28px 36px', boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 18 }}>Room Preferences</h2>

          {apiError && <div className="alert alert-error">{apiError}</div>}
          {success && <div className="alert alert-success">Preferences saved successfully!</div>}

          <form onSubmit={handleSubmit} noValidate>
            <Field label="Preferred Location *" error={errors.preferredLocation}>
              <input
                style={inputStyle}
                type="text"
                placeholder="e.g. Koramangala, Bengaluru"
                value={form.preferredLocation}
                onChange={(e) => handleChange('preferredLocation', e.target.value)}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Min Budget (₹) *" error={errors.minBudget}>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  placeholder="e.g. 10000"
                  value={form.minBudget}
                  onChange={(e) => handleChange('minBudget', e.target.value)}
                />
              </Field>
              <Field label="Max Budget (₹) *" error={errors.maxBudget}>
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  placeholder="e.g. 25000"
                  value={form.maxBudget}
                  onChange={(e) => handleChange('maxBudget', e.target.value)}
                />
              </Field>
            </div>

              <Field label="Preferred Move-in Date *" error={errors.moveInDate}>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.moveInDate}
                  onChange={(e) => handleChange('moveInDate', e.target.value)}
                />
              </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Preferred Room Type">
                <select style={inputStyle} value={form.preferredRoomType} onChange={(e) => handleChange('preferredRoomType', e.target.value)}>
                  <option value="Any">Any</option>
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Preferred Furnishing">
                <select style={inputStyle} value={form.preferredFurnishing} onChange={(e) => handleChange('preferredFurnishing', e.target.value)}>
                  <option value="Any">Any</option>
                  {FURNISHING_STATUS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              {submitting ? 'Saving…' : isExisting ? 'Update Preferences' : 'Save Preferences'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
