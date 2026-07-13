import React from 'react';
import Skeleton from '../common/Skeleton';

export default function SkeletonListingCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-img-wrap">
        <Skeleton width="100%" height="210px" borderRadius={0} />
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 22px 24px' }}>
        <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <Skeleton width="40%" height="28px" />
          <Skeleton width="25%" height="20px" />
        </div>
        <Skeleton width="85%" height="20px" style={{ marginBottom: '12px' }} />
        <Skeleton width="50%" height="16px" style={{ marginBottom: '16px' }} />
        
        <div className="tag-row" style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <Skeleton width="60px" height="26px" borderRadius="999px" />
          <Skeleton width="80px" height="26px" borderRadius="999px" />
        </div>
      </div>
    </div>
  );
}
