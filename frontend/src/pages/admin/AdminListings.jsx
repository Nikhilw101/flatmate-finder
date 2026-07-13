import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/admin.service';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { DEFAULT_PAGE_LIMIT } from '../../config/constants';
import { Trash2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListings = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getListings({ page, limit: DEFAULT_PAGE_LIMIT });
      if (res.success) {
        setListings(res.data.listings);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const handleToggleStatus = async (id, isFilled) => {
    try {
      const res = await adminService.toggleListingStatus(id, !isFilled);
      if (res.success) {
        setListings(prev => prev.map(l => l._id === id ? { ...l, isFilled: !isFilled } : l));
      }
    } catch (err) {
      alert(err.message || 'Failed to update listing status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
    try {
      const res = await adminService.deleteListing(id);
      if (res.success) {
        fetchListings(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Manage Listings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Monitor properties, hide them from public view, or delete them.</p>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <ErrorMessage message={error} onRetry={() => fetchListings(pagination.page)} />
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--divider)' }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Owner</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rent</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l._id} style={{ borderBottom: '1px solid var(--divider)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{l.location}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.roomType}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14 }}>
                      <div style={{ color: 'var(--text)' }}>{l.owner?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.owner?.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600 }}>₹{l.rent?.toLocaleString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: l.isFilled ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: l.isFilled ? '#ef4444' : '#22c55e' }}>
                        {l.isFilled ? 'Filled' : 'Available'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Link to={`/listings/${l._id}`} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} title="View Details">
                          View
                        </Link>
                        <button 
                          onClick={() => handleToggleStatus(l._id, l.isFilled)}
                          className="btn btn-outline" 
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          title={l.isFilled ? 'Mark as Available' : 'Mark as Filled'}
                        >
                          {l.isFilled ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(l._id)}
                          className="btn btn-outline" 
                          style={{ padding: '6px 12px', fontSize: 12, borderColor: 'var(--error)', color: 'var(--error)' }}
                          title="Delete Listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchListings} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
