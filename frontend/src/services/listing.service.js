import api from './api';

const listingService = {
  // Public — no auth required
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) query.append(k, v);
    });
    const qs = query.toString();
    return api.get(`/listings${qs ? `?${qs}` : ''}`);
  },

  getById: (id) => api.get(`/listings/${id}`),

  // Owner — auth required
  getMyListings: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) query.append(k, v);
    });
    const qs = query.toString();
    return api.get(`/listings/my/all${qs ? `?${qs}` : ''}`);
  },

  // Images are sent via multipart/form-data — handled separately
  create: (formData) =>
    api.request('/listings', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    }),

  update: (id, formData) =>
    api.request(`/listings/${id}`, {
      method: 'PUT',
      body: formData,
      headers: {},
    }),

  delete: (id) => api.delete(`/listings/${id}`),

  markFilled: (id) => api.patch(`/listings/${id}/fill`),
};

export default listingService;
