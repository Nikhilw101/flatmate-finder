import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import listingService from '../../services/listing.service';
import ListingCard from '../../components/listing/ListingCard';
import Pagination from '../../components/common/Pagination';
import SkeletonListingCard from '../../components/listing/SkeletonListingCard';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import ConfirmModal from '../../components/common/ConfirmModal';
import { DEFAULT_PAGE_LIMIT } from '../../config/constants';
import { Home, Trash2 } from 'lucide-react';

export default function MyListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fill loading per-listing
  const [fillingId, setFillingId] = useState(null);

  const fetchListings = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await listingService.getMyListings({ page, limit: DEFAULT_PAGE_LIMIT });
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await listingService.delete(deleteTarget);
      setDeleteTarget(null);
      fetchListings(pagination.page);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkFilled = async (id) => {
    try {
      setFillingId(id);
      await listingService.markFilled(id);
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, isFilled: true } : l));
    } catch (err) {
      alert(err.message);
    } finally {
      setFillingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>My Listings</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>All Your Rooms</h1>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/owner/listings/create')}>
          + Create Listing
        </button>
      </div>

      {loading ? (
        <div className="listing-grid">
          {[...Array(3)].map((_, i) => <SkeletonListingCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetchListings()} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<Home size={48} color="var(--text-muted)" />}
          title="No listings yet"
          description="Create your first room listing to start attracting tenants."
          action={<button className="btn btn-primary" onClick={() => navigate('/owner/listings/create')}>Create Your First Listing</button>}
        />
      ) : (
        <>
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard
                key={listing._id}
                listing={listing}
                actions={
                  <>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, fontSize: 13 }}
                      onClick={() => navigate(`/owner/listings/${listing._id}/edit`)}
                    >
                      Edit
                    </button>
                    {!listing.isFilled && (
                      <button
                        className="btn btn-outline"
                        style={{ flex: 1, fontSize: 13, color: 'var(--success)', borderColor: 'var(--success)' }}
                        onClick={() => handleMarkFilled(listing._id)}
                        disabled={fillingId === listing._id}
                      >
                        {fillingId === listing._id ? '…' : 'Mark Filled'}
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: 13, padding: '10px 14px', color: 'var(--error)', borderColor: 'var(--error)' }}
                      onClick={() => setDeleteTarget(listing._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                }
              />
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => fetchListings(p)}
          />
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete this listing?"
        message="This will permanently remove the listing and all its images from Cloudinary. This cannot be undone."
        confirmLabel="Delete listing"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
