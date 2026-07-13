import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'TENANT' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const setRole = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const validate = () => {
    if (!formData.name.trim() || formData.name.length < 2) return 'Name must be at least 2 characters.';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) return 'Please enter a valid email address.';
    if (!formData.password || formData.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    try {
      setLoading(true);
      setError(null);
      const res = await authService.register(formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <a className="auth-logo" href="/">
        <span className="mark"></span>
        HomeSync
      </a>

      <div className="auth-heading">
        <h2>Create an account</h2>
        <p>Join the community to find your perfect match</p>
      </div>

      <div className="form-card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">Registration successful! Redirecting to login…</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">I am a…</label>
            <div className="role-grid">
              <div
                className={`role-option${formData.role === 'TENANT' ? ' selected-tenant' : ''}`}
                onClick={() => setRole('TENANT')}
              >
                <div className="role-name">Tenant</div>
                <div className="role-sub">Looking for a home</div>
              </div>
              <div
                className={`role-option${formData.role === 'OWNER' ? ' selected-owner' : ''}`}
                onClick={() => setRole('OWNER')}
              >
                <div className="role-name">Owner</div>
                <div className="role-sub">Listing a home</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              required
              className="form-input"
              placeholder="Priya Sharma"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="form-input"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading || success} className="btn-submit">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in instead</Link>
        </p>
      </div>
    </div>
  );
}
