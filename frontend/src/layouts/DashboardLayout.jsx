import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Home, Plus, User, Search, LogOut, Inbox, Menu } from 'lucide-react';

import NotificationBell from '../components/common/NotificationBell';

const ownerNav = [
  { to: '/owner/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/owner/listings', icon: <Home size={20} />, label: 'My Rooms' },
  { to: '/owner/listings/create', icon: <Plus size={20} />, label: 'Create Listing' },
  { to: '/owner/requests', icon: <Inbox size={20} />, label: 'Requests' },
  { to: '/listings', icon: <Search size={20} />, label: 'Browse Listings' },
  { to: '/owner/profile', icon: <User size={20} />, label: 'Profile' },
];

const tenantNav = [
  { to: '/tenant/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/listings', icon: <Search size={20} />, label: 'Browse Listings' },
  { to: '/tenant/requests', icon: <Inbox size={20} />, label: 'My Requests' },
  { to: '/tenant/profile', icon: <User size={20} />, label: 'My Profile' },
];

const adminNav = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/admin/users', icon: <User size={20} />, label: 'Manage Users' },
  { to: '/admin/listings', icon: <Home size={20} />, label: 'Manage Listings' },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = user?.role === 'OWNER' ? ownerNav : user?.role === 'ADMIN' ? adminNav : tenantNav;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);



  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-section)' }}>
      {/* Mobile Overlay */}
      <div 
        className={`dashboard-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside style={{
        width: 260, flexShrink: 0, background: '#fff',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}
        className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}
      >
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link className="logo" to="/">
            <span className="mark"></span>
            HomeSync
          </Link>
        </div>

        {/* Role badge */}
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{
            background: user?.role === 'OWNER' ? 'rgba(124,58,237,0.09)' : user?.role === 'ADMIN' ? 'rgba(239,68,68,0.09)' : 'rgba(37,99,235,0.09)',
            color: user?.role === 'OWNER' ? 'var(--ai)' : user?.role === 'ADMIN' ? 'var(--error)' : 'var(--brand)',
            fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
            textTransform: 'uppercase', letterSpacing: '.06em', display: 'inline-block',
          }}>
            {user?.role}
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '0 16px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end className="dash-nav-link">
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User + Logout */}
        <div style={{ padding: 20, borderTop: '1px solid var(--divider)', margin: '0 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ width: '100%', fontSize: 14, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header className="dashboard-header-pad" style={{ height: 72, background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              className="btn btn-ghost dashboard-hamburger" 
              style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 40, padding: 0, marginRight: 16 }}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} color="var(--text)" />
            </button>
          </div>
          <NotificationBell />
        </header>

        {/* Page Content */}
        <div className="dashboard-header-pad" style={{ padding: '40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
