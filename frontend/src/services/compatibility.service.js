import api from './api';

const compatibilityService = {
  getBrowseListings: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) query.append(k, v);
    });
    const qs = query.toString();
    return api.get(`/listings/browse${qs ? `?${qs}` : ''}`);
  }
};

export default compatibilityService;
