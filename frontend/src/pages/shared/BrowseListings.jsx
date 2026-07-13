import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import MainLayout from '../../layouts/MainLayout';
import listingService from '../../services/listing.service';
import compatibilityService from '../../services/compatibility.service';
import ListingCard from '../../components/listing/ListingCard';
import ListingFilters from '../../components/listing/ListingFilters';
import Pagination from '../../components/common/Pagination';
import SkeletonListingCard from '../../components/listing/SkeletonListingCard';
import ErrorMessage from '../../components/common/ErrorMessage';
import EmptyState from '../../components/common/EmptyState';
import { DEFAULT_PAGE_LIMIT } from '../../config/constants';
import { Search } from 'lucide-react';

const INITIAL_FILTERS = { location: '', minRent: '', maxRent: '', roomType: '', furnishingStatus: '', sort: 'newest', page: 1 };

export default function BrowseListings({ hideLayout = false }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // If user is TENANT, use compatibility engine
      if (user?.role === 'TENANT') {
        const res = await compatibilityService.getBrowseListings(filters);
        if (res.success) {
          // Backend returns array of { listing, score, explanation }
          // We map it to embed compatibility directly into the listing object for the card
          const mapped = res.data.map(item => ({
            ...item.listing,
            compatibility: { score: item.score, explanation: item.explanation }
          }));
          
          // Fallback frontend filtering since backend /browse currently doesn't apply filters
          // We apply basic filtering locally just so the UI remains functional as requested.
          let filtered = mapped;
          if (filters.location) {
            const loc = filters.location.toLowerCase();
            filtered = filtered.filter(l => (l.location || '').toLowerCase().includes(loc));
          }
          if (filters.minRent) filtered = filtered.filter(l => l.rent >= Number(filters.minRent));
          if (filters.maxRent) filtered = filtered.filter(l => l.rent <= Number(filters.maxRent));
          if (filters.roomType) filtered = filtered.filter(l => l.roomType === filters.roomType);
          if (filters.furnishingStatus) filtered = filtered.filter(l => l.furnishingStatus === filters.furnishingStatus);
          
          // Pagination logic (frontend side since backend returns all for /browse)
          const totalPages = Math.ceil(filtered.length / DEFAULT_PAGE_LIMIT) || 1;
          const page = filters.page || 1;
          const paginated = filtered.slice((page - 1) * DEFAULT_PAGE_LIMIT, page * DEFAULT_PAGE_LIMIT);

          setListings(paginated);
          setPagination({ page, totalPages, limit: DEFAULT_PAGE_LIMIT, total: filtered.length });
        }
      } else {
        // Guests or Owners use standard listing fetching (which supports backend filtering)
        const res = await listingService.getAll({ ...filters, limit: DEFAULT_PAGE_LIMIT });
        if (res.success) {
          setListings(res.data.listings);
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchListings(); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [filters, user]);

  const handleReset = () => setFilters(INITIAL_FILTERS);

  const content = (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: user?.role === 'TENANT' ? '0' : '0 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Find a home</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Browse Available Rooms</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Discover rooms that match your lifestyle.</p>
      </div>

      <ListingFilters filters={filters} onChange={setFilters} onReset={handleReset} />

      {loading ? (
        <div className="listing-grid">
          {[...Array(6)].map((_, i) => <SkeletonListingCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchListings} />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<Search size={48} color="var(--text-muted)" />}
          title="No listings found"
          description="Try adjusting your filters to see more results."
          action={<button className="btn btn-outline" onClick={handleReset}>Clear Filters</button>}
        />
      ) : (
        <>
          <div className="listing-grid">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} compatibility={listing.compatibility} />
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setFilters({ ...filters, page: p })}
          />
        </>
      )}
    </div>
  );

  if (hideLayout) return content;
  return user?.role === 'TENANT' ? <DashboardLayout>{content}</DashboardLayout> : <MainLayout>{content}</MainLayout>;
}
