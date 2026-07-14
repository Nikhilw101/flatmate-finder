import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MapPin } from 'lucide-react';

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=700&auto=format&fit=crop&q=70';

export default function ListingCard({ listing, actions, compatibility }) {
  const { user } = useAuth();
  const { _id, location, rent, roomType, furnishingStatus, isFilled, images, description } = listing;
  const imgSrc = images?.[0]?.url || PLACEHOLDER_IMG;
  const isOwner = user?._id === listing.owner?._id;

  // Derive a short title from description or roomType for card-title
  const shortTitle = description 
    ? (description.split('.')[0].length > 40 ? `${description.substring(0, 40)}...` : description.split('.')[0]) 
    : `${roomType} in ${location}`;

  const handleLinkClick = (e) => {
    // Enable view transitions if supported
    if (!document.startViewTransition) return;
    // Let the browser handle standard link navigation but we'll try to trigger view transition in ListingDetail? 
    // Actually, view transitions in React Router require setup in the router, 
    // or just wrapping the state update. Since we're using Link, react-router v6 supports <Link viewTransition> but it needs to be enabled.
    // For standard CSS transitions, the viewTransitionName will match.
  };

  return (
    <div className="card reveal in" style={{ position: 'relative' }}>
      <Link 
        to={`/listings/${_id}`} 
        state={{ compatibility }} 
        style={{ display: 'block' }}
        onClick={handleLinkClick}
      >
        <div className="card-img-wrap">
          <img 
            src={imgSrc} 
            alt={`${roomType} in ${location}`} 
            loading="lazy" 
            style={{ viewTransitionName: `listing-img-${_id}` }} 
          />
          {isFilled && (
            <div className="fit-badge" style={{ background: 'rgba(239,68,68,0.9)', left: 14 }}>
              <span className="dot" style={{ background: '#fff', boxShadow: 'none' }}></span>Filled
            </div>
          )}
          {!isFilled && compatibility && (
            compatibility.score === 0 && compatibility.explanation && compatibility.explanation.includes('Location mismatch') ? (
              <div className="fit-badge" style={{ background: 'rgba(239,68,68,0.9)', padding: '6px 12px' }}>
                Location Mismatch
              </div>
            ) : (
              <div className="fit-badge">
                <span className="dot"></span>{compatibility.score}% Fit
              </div>
            )
          )}
          {isOwner && !isFilled && !compatibility && (
            <div className="fit-badge" style={{ background: 'var(--brand)' }}>
              Your Property
            </div>
          )}
        </div>
        <div className="card-body">
          <div className="card-top-row">
            <div className="card-price">₹{rent?.toLocaleString('en-IN')}<span> /mo</span></div>
            <div className="card-rating">
              {isFilled ? <span style={{ color: 'var(--error)' }}>Not Available</span> : <span style={{ color: 'var(--success)' }}>Available</span>}
            </div>
          </div>
          <div className="card-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {shortTitle}
          </div>
          <div className="card-loc" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
            <MapPin size={14} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location}</span>
          </div>
          <div className="tag-row">
            <span className="tag">{furnishingStatus}</span>
            <span className="tag">{roomType}</span>
          </div>
        </div>
      </Link>
      {actions && (
        <div style={{ padding: '0 22px 24px', display: 'flex', gap: 8 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
