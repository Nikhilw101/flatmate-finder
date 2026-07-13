import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import notificationService from '../../services/notification.service';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import { DEFAULT_PAGE_LIMIT } from '../../config/constants';
import { Bell, Check } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationService.getNotifications(page, DEFAULT_PAGE_LIMIT);
      if (res.success) {
        setNotifications(res.data.notifications);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Account</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Notifications</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Stay updated on your activity and matches.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-outline" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? <LoadingSpinner /> : error ? (
        <ErrorMessage message={error} onRetry={() => fetchNotifications(pagination.page)} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} color="var(--text-muted)" />}
          title="No notifications yet"
          description="You're all caught up! New updates will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => (
            <div 
              key={n._id} 
              style={{ 
                background: '#fff', border: '1px solid var(--border)', borderRadius: 16, 
                padding: '20px 24px', boxShadow: 'var(--shadow-card)', display: 'flex', gap: 20, 
                alignItems: 'flex-start', position: 'relative', overflow: 'hidden' 
              }}
            >
              {!n.isRead && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: 'var(--brand)' }}></div>}
              
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: n.isRead ? 'var(--bg-section)' : 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: n.isRead ? 'var(--text-secondary)' : 'var(--brand)', flexShrink: 0 }}>
                <Bell size={18} />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {n.message}
                </div>
              </div>

              {!n.isRead && (
                <button 
                  onClick={() => handleMarkAsRead(n._id)}
                  className="btn btn-outline" 
                  style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
          
          <div style={{ marginTop: 16 }}>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchNotifications(p)}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
