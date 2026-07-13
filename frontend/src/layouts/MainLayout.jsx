import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from '../components/common/NotificationBell';
import BottomNav from '../components/layout/BottomNav';
import { LayoutDashboard, UserPlus, LogIn, LogOut } from 'lucide-react';

export default function MainLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sticky header
  useEffect(() => {
    const header = document.getElementById('siteHeader');
    const onScroll = () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-section)' }}>
      <header id="siteHeader">
        <div className="wrap">
          <nav>
            <Link className="logo" to="/">
              <img src="/logo.png" alt="HomeSync Logo" className="logo-img" />
              <span>HomeSync</span>
            </Link>
            <div className="nav-links">
              <Link to="/">Home</Link>
              <Link to="/listings">Rooms</Link>
              <Link to="/listings">Search</Link>
            </div>
            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isAuthenticated ? (
                <>
                  <NotificationBell />
                  <Link className="btn btn-primary" to={`/${user?.role?.toLowerCase()}/dashboard`}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <button className="btn btn-ghost" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="btn btn-ghost" to="/login">
                    <LogIn size={16} /> Sign in
                  </Link>
                  <Link className="btn btn-primary" to="/register">
                    <UserPlus size={16} /> Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      
      <main style={{ 
        flex: 1, 
        paddingTop: location.pathname === '/' ? 0 : 100,
        paddingBottom: location.pathname === '/' ? 0 : 40 
      }}>
        {children}
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <Link className="logo" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
                <img src="/logo.png" alt="HomeSync Logo" className="logo-img footer-logo" />
                <span>HomeSync</span>
              </Link>
              <p className="foot-desc" style={{ marginTop: 14 }}>
                HomeSync pairs verified rentals with flatmates who actually fit your budget, habits, and daily rhythm.
              </p>
            </div>
            <div className="foot-col">
              <h4>Platform</h4>
              <Link to="/listings">Browse Rooms</Link>
              <Link to="/tenant/dashboard">Tenant Portal</Link>
              <Link to="/owner/dashboard">Owner Portal</Link>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <Link to="/">About Us</Link>
              <Link to="/">Careers</Link>
              <Link to="/">Contact</Link>
            </div>
            <div className="foot-col">
              <h4>Legal</h4>
              <Link to="/">Terms of Service</Link>
              <Link to="/">Privacy Policy</Link>
              <Link to="/">Trust & Safety</Link>
            </div>
            <div className="foot-col">
              <h4>Connect</h4>
              <div className="foot-social">
                <a href="#" aria-label="Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5 2.8 9 2.8 9s1.5.8 3.3.4C3.4 7.6 4.6 3 4.6 3s1.9 1.6 4.2 2c-1.8-3.6 5.4-6.5 8-3.4 1.3-.2 2.6-.9 3.2-1.6z"/></svg>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 HomeSync. All rights reserved.</span>
            <span>Made for people who share more than rent.</span>
          </div>
        </div>
      </footer>
      
      <BottomNav />
    </div>
  );
}

