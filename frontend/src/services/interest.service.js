import api from './api';

const interestService = {
  express: (listingId) => api.post('/interests', { listingId }),
  
  getMy: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) query.append(k, v);
    });
    const qs = query.toString();
    return api.get(`/interests/my${qs ? `?${qs}` : ''}`);
  },

  getIncoming: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) query.append(k, v);
    });
    const qs = query.toString();
    return api.get(`/interests/incoming${qs ? `?${qs}` : ''}`);
  },

  respond: (id, status) => api.patch(`/interests/${id}/respond`, { status })
};

export default interestService;
