import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import listingService from '../../services/listing.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { Home, CheckCircle, XCircle } from 'lucide-react';

import StatCard from '../../components/common/StatCard';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listingService.getMyListings({ limit: 200 });
      if (res.success) {
        const all = res.data.listings;
        setStats({
          total: res.data.pagination.total,
          filled: all.filter((l) => l.isFilled).length,
          active: all.filter((l) => !l.isFilled).length,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Owner Dashboard</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>Manage your room listings and track availability.</p>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={fetchStats} /> : (
        <>
          {/* Stats */}
          <div className="dash-stat-grid">
            <StatCard title="Total Listings" value={stats.total} color="var(--brand)" icon={<Home />} />
            <StatCard title="Active" value={stats.active} color="var(--success)" icon={<CheckCircle />} />
            <StatCard title="Filled" value={stats.filled} color="var(--error)" icon={<XCircle />} />
          </div>

          {/* Quick actions & Empty State logic */}
          <div className="dash-card" style={{ marginBottom: 40 }}>
            {stats.total === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-section)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Home size={32} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No listings yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>Get started by creating your first room listing to match with great flatmates.</p>
                <Link to="/owner/listings/create" className="btn btn-primary">Create First Listing</Link>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Quick Actions</h2>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <Link to="/owner/listings/create" className="btn btn-primary">Create New Listing</Link>
                  <Link to="/owner/listings" className="btn btn-outline">View My Listings</Link>
                  <Link to="/listings" className="btn btn-outline">Browse All Rooms</Link>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
