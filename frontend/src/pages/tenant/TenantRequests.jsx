import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import interestService from '../../services/interest.service';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import { DEFAULT_PAGE_LIMIT } from '../../config/constants';
import { Mail, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TenantRequests() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await interestService.getMy({ page, limit: DEFAULT_PAGE_LIMIT });
      if (res.success) {
        setRequests(res.data.interests);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED': return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 999, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: 12, fontWeight: 700 }}><CheckCircle size={14} /> Accepted</span>;
      case 'DECLINED': return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 12, fontWeight: 700 }}><XCircle size={14} /> Declined</span>;
      default: return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 999, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: 12, fontWeight: 700 }}><Clock size={14} /> Pending</span>;
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>My Activity</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Interest Requests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Track the status of properties you've applied for.</p>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <ErrorMessage message={error} onRetry={() => fetchRequests(pagination.page)} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Mail size={48} color="var(--text-muted)" />}
          title="No requests sent yet"
          description="Browse available listings and send interest to owners."
          action={<Link to="/browse" className="btn btn-primary">Browse Listings</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(req => (
            <div key={req._id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  {getStatusBadge(req.status)}
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={18} color="var(--text-muted)" />
                  {req.listing?.location || 'Unknown Location'}
                </h3>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {req.listing?.roomType} • {req.listing?.furnishingStatus} • ₹{req.listing?.rent?.toLocaleString('en-IN')}/mo
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', gap: 8 }}>
                <Link to={`/listings/${req.listing?._id}`} className="btn btn-outline" style={{ fontSize: 13 }}>
                  View Listing
                </Link>
                {req.status === 'ACCEPTED' && (
                  <Link to={`/chats`} className="btn btn-primary" style={{ fontSize: 13, background: 'var(--success)' }}>
                    Chat with Owner
                  </Link>
                )}
              </div>
            </div>
          ))}
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchRequests(p)}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
