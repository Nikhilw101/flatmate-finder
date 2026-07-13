import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import MainLayout from '../../layouts/MainLayout';
import listingService from '../../services/listing.service';
import interestService from '../../services/interest.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import CompatibilityBadge from '../../components/listing/CompatibilityBadge';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationState = useLocation().state;
  const compatibility = locationState?.compatibility;
  const { user, isAuthenticated } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImg, setActiveImg] = useState(0);

  // Interest State
  const [existingInterest, setExistingInterest] = useState(null);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [interestError, setInterestError] = useState(null);

  useEffect(() => {
    // Scroll to top with fade in effect if view transition isn't active
    window.scrollTo(0, 0);

    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await listingService.getById(id);
        if (res.success) setListing(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load listing.');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    const checkInterest = async () => {
      if (user?.role === 'TENANT') {
        try {
          const res = await interestService.getMy({ limit: 100 });
          if (res.success) {
            const found = res.data.interests.find(i => i.listing?._id === id);
            if (found) setExistingInterest(found);
          }
        } catch (e) {
          console.error('Failed to check interests:', e);
        }
      }
    };
    checkInterest();
  }, [user, id]);

  const handleSendInterest = async () => {
    if (sendingInterest) return;
    try {
      setSendingInterest(true);
      setInterestError(null);
      const res = await interestService.express(id);
      if (res.success) {
        setExistingInterest(res.data);
      }
    } catch (err) {
      setInterestError(err.message || 'Failed to send interest.');
    } finally {
      setSendingInterest(false);
    }
  };

  const handleBack = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(-1));
    } else {
      navigate(-1);
    }
  };

  const content = loading ? <LoadingSpinner /> : error ? (
    <div style={{ padding: 40 }}><ErrorMessage message={error} onRetry={() => window.location.reload()} /></div>
  ) : !listing ? null : (
    <div className="reveal in pt-header" style={{ maxWidth: 1000, margin: '0 auto', padding: user?.role === 'TENANT' ? '0' : '0 20px', position: 'relative' }}>
      
      {/* Back button */}
      <button className="back-nav" aria-label="Back to listings" onClick={handleBack}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 24, marginTop: 70 }}>
        <div>
          <div className="tag-row" style={{ marginBottom: 16 }}>
            <span className="tag" style={{ background: 'var(--brand)', color: '#fff' }}>{listing.roomType}</span>
            <span className="tag" style={{ border: '1px solid var(--border)', background: '#fff' }}>{listing.furnishingStatus}</span>
            {listing.isFilled && <span className="tag" style={{ background: 'var(--error)', color: '#fff' }}>Filled</span>}
            {compatibility && (
              <CompatibilityBadge score={compatibility.score} style={{ background: 'var(--bg-section)' }} />
            )}
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px 0' }}>{listing.location}</h1>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Available from {new Date(listing.availableFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>
            ₹{listing.rent?.toLocaleString('en-IN')} <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>/ mo</span>
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      <div style={{ marginBottom: 40 }}>
        <div className="gallery-hero" style={{ marginBottom: 12 }}>
          <img
            src={listing.images?.[activeImg]?.url || PLACEHOLDER_IMG}
            alt="Room"
            style={{ width: '100%', height: '100%', objectFit: 'cover', viewTransitionName: `listing-img-${id}` }}
          />
        </div>
        {listing.images?.length > 1 && (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
            {listing.images.map((img, idx) => (
              <img
                key={img.publicId}
                src={img.url}
                alt="Thumbnail"
                onClick={() => setActiveImg(idx)}
                style={{
                  width: 120, height: 85, borderRadius: 16, objectFit: 'cover', cursor: 'pointer',
                  border: `2px solid ${idx === activeImg ? 'var(--brand)' : 'transparent'}`,
                  transition: 'all .2s', opacity: idx === activeImg ? 1 : 0.6,
                  boxShadow: idx === activeImg ? '0 4px 12px rgba(37,99,235,0.15)' : 'none'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="detail-grid">
        {/* Left Col: Details */}
        <div>
          {compatibility && (
            <div style={{ background: 'var(--bg-section)', borderRadius: 24, padding: '32px', marginBottom: 40, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <CompatibilityBadge score={compatibility.score} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ai)', animation: 'pulse 1.8s infinite' }}></span>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>AI Match Score</h3>
                </div>
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }}>
                {compatibility.explanation}
              </p>
            </div>
          )}

          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>About this place</h2>
          <div style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {listing.description || 'No description provided.'}
          </div>
        </div>

        {/* Right Col: Actions / Owner Info */}
        <div className="card" style={{ padding: 32, position: 'sticky', top: 90 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-muted)' }}>Listed by</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--brand)' }}>
              {listing.owner?.name?.charAt(0) || 'O'}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{listing.owner?.name}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ID Verified
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 24 }}>
            {user?.role === 'OWNER' && user?._id === listing.owner?._id ? (
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate(`/owner/listings/${listing._id}/edit`)}>Edit Listing</button>
            ) : user?.role === 'TENANT' ? (
              existingInterest ? (
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-section)', borderRadius: 16, fontWeight: 600, color: 'var(--text)' }}>
                  Request Status: <span style={{ color: existingInterest.status === 'ACCEPTED' ? 'var(--success)' : existingInterest.status === 'DECLINED' ? 'var(--error)' : 'var(--brand)' }}>{existingInterest.status}</span>
                </div>
              ) : (
                <>
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', opacity: sendingInterest ? 0.7 : 1, cursor: sendingInterest ? 'not-allowed' : 'pointer' }}
                    onClick={handleSendInterest}
                    disabled={sendingInterest}
                  >
                    {sendingInterest ? 'Sending Request...' : 'Send Interest'}
                  </button>
                  {interestError && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{interestError}</div>}
                </>
              )
            ) : !isAuthenticated ? (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login', { state: { from: { pathname: `/listings/${id}` } } })}>
                Sign in to apply
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return user?.role === 'TENANT' ? <DashboardLayout>{content}</DashboardLayout> : <MainLayout>{content}</MainLayout>;
}
