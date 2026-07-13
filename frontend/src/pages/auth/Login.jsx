import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/auth.service';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Both email and password are required.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await authService.login(formData);
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        if (from) {
          navigate(from, { replace: true });
        } else if (res.data.user.role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (res.data.user.role === 'OWNER') {
          navigate('/owner/dashboard', { replace: true });
        } else {
          navigate('/tenant/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
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
        <h2>Welcome back</h2>
        <p>Enter your credentials to access your account</p>
      </div>

      <div className="form-card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
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
            <div className="form-label-row">
              <label className="form-label" htmlFor="login-password">Password</label>
              <a className="forgot-link" href="#">Forgot password?</a>
            </div>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Create one now</Link>
        </p>
      </div>
    </div>
  );
}
