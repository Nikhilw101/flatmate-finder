// Frontend constants mirroring backend exactly — single source of truth
export const ROOM_TYPES = [
  'Private Room',
  'Shared Room',
  'Studio',
  'Entire Apartment',
];

export const FURNISHING_STATUS = [
  'Fully Furnished',
  'Semi Furnished',
  'Unfurnished',
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rent_asc', label: 'Rent: Low → High' },
  { value: 'rent_desc', label: 'Rent: High → Low' },
];

export const DEFAULT_PAGE_LIMIT = 9;
