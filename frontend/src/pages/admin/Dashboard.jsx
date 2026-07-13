import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import adminService from '../../services/admin.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import StatCard from '../../components/common/StatCard';
import { Users, Home, Mail, TrendingUp, Activity, Shield, CheckCircle, Handshake, MessageCircle } from 'lucide-react';

/* ── Animated Bar Chart ───────────────────────────────────────────── */
function BarChart({ bars }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 80); return () => clearTimeout(t); }, []);
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120, marginTop: 12 }}>
      {bars.map((bar) => {
        const pct = (bar.value / max) * 100;
        return (
          <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: bar.color }}>{bar.value}</div>
            <div style={{ width: '100%', borderRadius: '8px 8px 0 0', background: `${bar.color}20`, height: '80%', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
              <div style={{
                width: '100%',
                height: animate ? `${pct}%` : '0%',
                background: `linear-gradient(180deg, ${bar.color}, ${bar.color}99)`,
                borderRadius: '8px 8px 0 0',
                transition: 'height 0.9s cubic-bezier(.2,.8,.2,1)',
              }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em', textAlign: 'center' }}>{bar.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Donut Ring Chart ─────────────────────────────────────────────── */
function DonutChart({ segments, size = 140, stroke = 18 }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 120); return () => clearTimeout(t); }, []);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.value / total) * circ;
    const arc = { ...seg, dash, gap: circ - dash, offset };
    offset += dash;
    return arc;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--divider)" strokeWidth={stroke} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${animate ? arc.dash : 0} ${circ}`}
          strokeDashoffset={-(arc.offset) + circ / 4}
          style={{ transition: `stroke-dasharray 1s cubic-bezier(.2,.8,.2,1) ${i * 0.15}s` }}
        />
      ))}
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fontFamily="Outfit" fontWeight="700" fontSize="22" fill="var(--text)">{total}</text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontFamily="Inter" fontWeight="600" fontSize="10" fill="var(--text-muted)">TOTAL</text>
    </svg>
  );
}

/* ── Progress Row ─────────────────────────────────────────────────── */
function ProgressRow({ label, value, total, color }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimate(true), 200); return () => clearTimeout(t); }, []);
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 14 }}>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--divider)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          width: animate ? `${pct}%` : '0%',
          transition: 'width 1s cubic-bezier(.2,.8,.2,1)',
        }} />
      </div>
    </div>
  );
}

/* ── Activity Feed Skeleton ───────────────────────────────────────── */
function ActivityFeed({ stats }) {
  const items = [
    { icon: <Users size={16} />, label: 'Total registered users', value: stats?.users?.total, color: '#3b82f6' },
    { icon: <Home size={16} />, label: 'Listings on platform', value: stats?.listings?.total, color: '#8b5cf6' },
    { icon: <CheckCircle size={16} />, label: 'Rooms successfully filled', value: stats?.listings?.filled, color: '#10b981' },
    { icon: <Mail size={16} />, label: 'Interests expressed', value: stats?.interests?.total, color: '#f59e0b' },
    { icon: <Handshake size={16} />, label: 'Accepted connections', value: stats?.interests?.accepted, color: '#06b6d4' },
    { icon: <MessageCircle size={16} />, label: 'Total chats opened', value: stats?.chats?.total, color: '#ec4899' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 0', borderBottom: i < items.length - 1 ? '1px solid var(--divider)' : 'none'
        }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
            </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: item.color, letterSpacing: '-0.02em' }}>
            {item.value ?? '–'}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Dashboard ───────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminService.getStats();
        if (res.success) setStats(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  if (error) return <DashboardLayout><ErrorMessage message={error} /></DashboardLayout>;

  const fillRate = stats?.listings?.total > 0
    ? Math.round((stats.listings.filled / stats.listings.total) * 100)
    : 0;
  const acceptRate = stats?.interests?.total > 0
    ? Math.round((stats.interests.accepted / stats.interests.total) * 100)
    : 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Admin Control Panel</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Platform Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>Live metrics from your database — updated on every page load.</p>
      </div>

      {/* Stat Cards */}
      <div className="dash-stat-grid" style={{ marginBottom: 32 }}>
        <StatCard icon={<Users />} title="Total Users" value={stats?.users?.total} color="#3b82f6" />
        <StatCard icon={<Home />} title="Total Listings" value={stats?.listings?.total} color="#8b5cf6" />
        <StatCard icon={<Mail />} title="Total Interests" value={stats?.interests?.total} color="#f59e0b" />
        <StatCard icon={<TrendingUp />} title="Active Matches" value={stats?.interests?.accepted} color="#10b981" />
      </div>

      {/* Row 1: User Bar Chart + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* User breakdown bar chart */}
        <div className="dash-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Users size={18} color="var(--brand)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>User Breakdown</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 4px' }}>Registered accounts by role</p>
          <BarChart bars={[
            { label: 'Tenants', value: stats?.users?.tenants ?? 0, color: '#3b82f6' },
            { label: 'Owners', value: stats?.users?.owners ?? 0, color: '#8b5cf6' },
            { label: 'Admins', value: stats?.users?.admins ?? 0, color: '#ef4444' },
          ]} />
        </div>

        {/* Listing donut */}
        <div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Home size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Listing Status</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>Available vs filled rooms</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flex: 1 }}>
            <DonutChart segments={[
              { value: stats?.listings?.available ?? 0, color: '#10b981' },
              { value: stats?.listings?.filled ?? 0, color: '#ef4444' },
            ]} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Available</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 16 }}>{stats?.listings?.available}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: '#ef4444', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Filled</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 16 }}>{stats?.listings?.filled}</span>
              </div>
              <div style={{ background: 'var(--bg-section)', borderRadius: 12, padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>{fillRate}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Fill Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Interest pipeline + Activity feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Interest pipeline progress bars */}
        <div className="dash-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Activity size={18} color="#f59e0b" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Interest Pipeline</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px' }}>How interests convert to matches</p>
          <ProgressRow label="Pending" value={stats?.interests?.pending ?? 0} total={stats?.interests?.total ?? 1} color="#f59e0b" />
          <ProgressRow label="Accepted" value={stats?.interests?.accepted ?? 0} total={stats?.interests?.total ?? 1} color="#10b981" />
          <ProgressRow label="Declined" value={stats?.interests?.declined ?? 0} total={stats?.interests?.total ?? 1} color="#ef4444" />
          <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 2 }}>Overall acceptance rate</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>{acceptRate}%</div>
          </div>
        </div>

        {/* Full platform snapshot */}
        <div className="dash-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={18} color="var(--error)" />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Platform Snapshot</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>All metrics at a glance</p>
          <ActivityFeed stats={stats} />
        </div>
      </div>
    </DashboardLayout>
  );
}
