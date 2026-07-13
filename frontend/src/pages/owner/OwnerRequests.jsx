import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import interestService from '../../services/interest.service';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import CompatibilityBadge from '../../components/listing/CompatibilityBadge';
import { DEFAULT_PAGE_LIMIT } from '../../config/constants';
import { Mail, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function OwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null); // id of request being updated

  const fetchRequests = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await interestService.getIncoming({ page, limit: DEFAULT_PAGE_LIMIT });
      if (res.success) {
        setRequests(res.data.requests);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleRespond = async (id, status) => {
    try {
      setUpdating(id);
      const res = await interestService.respond(id, status);
      if (res.success) {
        // Optimistically update
        setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
      }
    } catch (err) {
      alert(err.message || 'Failed to update request.');
    } finally {
      setUpdating(null);
    }
  };

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
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Owner Inbox</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Incoming Requests</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Review tenants interested in your properties.</p>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <ErrorMessage message={error} onRetry={() => fetchRequests(pagination.page)} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Mail size={48} color="var(--text-muted)" />}
          title="No requests yet"
          description="When tenants apply for your listings, they will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {requests.map(req => (
            <div key={req._id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'flex-start' }}>
              
              {/* Tenant Info */}
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {req.tenant?.name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{req.tenant?.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{req.tenant?.email}</div>
                  </div>
                </div>
                
                {req.compatibility && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
                    <CompatibilityBadge score={req.compatibility.score} />
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--bg-section)', padding: '8px 12px', borderRadius: 8 }}>
                      {req.compatibility.explanation}
                    </div>
                  </div>
                )}
              </div>

              {/* Listing & Status */}
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  {getStatusBadge(req.status)}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Received {new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}><MapPin size={12} /> {req.listing?.location}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{req.listing?.roomType}</div>
                  <Link to={`/listings/${req.listing?._id}`} className="link" style={{ fontSize: 12, marginTop: 4, display: 'inline-block' }}>View Listing</Link>
                </div>

                {/* Actions */}
                {req.status === 'PENDING' ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ fontSize: 12, padding: '6px 12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                      disabled={updating === req._id}
                      onClick={() => handleRespond(req._id, 'DECLINED')}
                    >
                      {updating === req._id ? '...' : 'Decline'}
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ fontSize: 12, padding: '6px 12px', background: 'var(--success)' }}
                      disabled={updating === req._id}
                      onClick={() => handleRespond(req._id, 'ACCEPTED')}
                    >
                      {updating === req._id ? '...' : 'Accept'}
                    </button>
                  </div>
                ) : req.status === 'ACCEPTED' ? (
                  <Link to={`/chats`} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 12px', background: 'var(--success)' }}>
                    Open Chat
                  </Link>
                ) : null}
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
