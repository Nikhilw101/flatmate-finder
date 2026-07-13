import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/admin.service';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { DEFAULT_PAGE_LIMIT } from '../../config/constants';
import { Trash2, UserX, UserCheck } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getUsers({ page, limit: DEFAULT_PAGE_LIMIT });
      if (res.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleActive = async (id, isActive) => {
    if (!window.confirm(`Are you sure you want to ${isActive ? 'disable' : 'enable'} this user?`)) return;
    try {
      const res = isActive ? await adminService.disableUser(id) : await adminService.enableUser(id);
      if (res.success) {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !isActive } : u));
      }
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) return;
    try {
      const res = await adminService.deleteUser(id);
      if (res.success) {
        fetchUsers(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Manage Users</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>View, suspend, or delete users across the platform.</p>
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <ErrorMessage message={error} onRetry={() => fetchUsers(pagination.page)} />
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--divider)' }}>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined</th>
                  <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--divider)' }}>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--bg-section)', color: 'var(--text-secondary)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: u.isActive ? '#22c55e' : '#ef4444' }}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {u.role !== 'ADMIN' && (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleToggleActive(u._id, u.isActive)}
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            title={u.isActive ? 'Suspend User' : 'Activate User'}
                          >
                            {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(u._id)}
                            className="btn btn-outline" 
                            style={{ padding: '6px 12px', fontSize: 12, borderColor: 'var(--error)', color: 'var(--error)' }}
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={fetchUsers} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
