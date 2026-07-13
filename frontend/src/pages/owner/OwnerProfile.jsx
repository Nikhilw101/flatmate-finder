import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import tenantService from '../../services/tenant.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const inputStyle = {
  width: '100%', padding: '13px 16px', border: '1.5px solid var(--border)',
  borderRadius: 12, fontSize: 15, fontFamily: 'inherit', color: 'var(--text)',
  background: '#fff', transition: 'border-color .2s',
};

export default function OwnerProfile() {
  const { user, login } = useAuth();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (user) setName(user.name || '');
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) { setNameError('Name must be at least 2 characters.'); return; }
    try {
      setSaving(true);
      setApiError(null);
      setSuccess(false);
      const res = await tenantService.updateMe({ name: name.trim() });
      if (res.success) {
        login(localStorage.getItem('token'), res.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Profile</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Your Account</h1>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 24, padding: '36px 40px', boxShadow: 'var(--shadow-card)' }}>
          {apiError && <div className="alert alert-error">{apiError}</div>}
          {success && <div className="alert alert-success">Profile updated successfully!</div>}

          <form onSubmit={handleSave} noValidate>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>Full Name</label>
              <input
                style={inputStyle}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(null); }}
              />
              {nameError && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 5 }}>{nameError}</div>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>Email Address</label>
              <input style={{ ...inputStyle, background: 'var(--bg-section)', cursor: 'not-allowed' }} type="email" value={user.email} readOnly />
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 5 }}>Email cannot be changed.</div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 7 }}>Role</label>
              <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.2)', borderRadius: 12, color: 'var(--ai)', fontWeight: 700, fontSize: 14 }}>
                {user.role}
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
