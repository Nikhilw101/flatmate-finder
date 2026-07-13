import api from './api';

const adminService = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/admin/users${query ? `?${query}` : ''}`);
  },
  getUserById: (id) => api.get(`/admin/users/${id}`),
  disableUser: (id) => api.patch(`/admin/users/${id}/disable`),
  enableUser: (id) => api.patch(`/admin/users/${id}/enable`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  getListings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/admin/listings${query ? `?${query}` : ''}`);
  },
  toggleListingStatus: (id, isFilled) => api.patch(`/admin/listings/${id}/status`, { isFilled }),
  deleteListing: (id) => api.delete(`/admin/listings/${id}`)
};

export default adminService;
