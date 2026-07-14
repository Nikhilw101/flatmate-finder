import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import notificationService from '../../services/notification.service';
import socketService from '../../services/socket.service';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res.success) setUnreadCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await notificationService.getNotifications(1, 5); // Just 5 for dropdown
      if (res.success) {
        setNotifications(res.data.notifications);
        // Also update unread count based on pagination metadata if we want,
        // but fetchUnreadCount is exact.
      }
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    
    const socket = socketService.connect();
    if (socket) {
      const handleNewNotification = (notification) => {
        setUnreadCount(prev => prev + 1);
        setNotifications(prev => [notification, ...prev].slice(0, 5));
      };
      
      socket.on('notification:new', handleNewNotification);
      
      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
    
    // Fallback polling for robustness
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) fetchRecent();
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background .2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className={unreadCount > 0 ? 'bell-anim' : ''} style={{ display: 'flex' }}>
          <Bell size={20} color="var(--text-secondary)" />
        </div>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            background: 'var(--error)', color: '#fff', fontSize: 10, fontWeight: 700,
            width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8,
          width: 320, background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
          boxShadow: 'var(--shadow-dropdown)', zIndex: 50, overflow: 'hidden'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
            {notifications.length > 0 && (
              <button 
                onClick={async () => {
                  await notificationService.markAllAsRead();
                  setUnreadCount(0);
                  setNotifications([]); // Visually clear them
                }}
                style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear all
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', background: n.isRead ? '#fff' : 'rgba(37,99,235,0.03)', display: 'flex', gap: 12, transition: 'background .2s' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: n.isRead ? 500 : 700, color: 'var(--text)', marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                  {!n.isRead && (
                    <button onClick={(e) => handleMarkAsRead(n._id, e)} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 4 }} title="Mark as read"></button>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--divider)', textAlign: 'center', background: '#fafafa' }}>
            <Link to="/notifications" onClick={() => setIsOpen(false)} style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
