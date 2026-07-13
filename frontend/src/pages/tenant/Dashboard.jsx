import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import tenantService from '../../services/tenant.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BrowseListings from '../shared/BrowseListings';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function TenantDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tenantService.getProfile()
      .then((res) => { if (res.success) setProfile(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isComplete = profile && profile.preferredLocation && profile.minBudget && profile.maxBudget && profile.moveInDate;

  return (
    <DashboardLayout>
      {/* Profile Completion Alert */}
      {!loading && !isComplete && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 20, padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 20, marginBottom: 40, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ color: 'var(--warning)', marginTop: 2 }}><AlertCircle size={28} /></div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
                Complete Your Profile
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Add your location, budget, and move-in date to unlock AI matching.
              </div>
            </div>
          </div>
          <Link to="/tenant/profile" className="btn btn-primary" style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
            Set Up Profile →
          </Link>
        </div>
      )}

      {/* Main Browse UI */}
      <div style={{ marginTop: loading ? 0 : -20 }}>
        <BrowseListings hideLayout={true} />
      </div>
    </DashboardLayout>
  );
}
