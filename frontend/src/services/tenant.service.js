import api from './api';

const tenantService = {
  getProfile: () => api.get('/profile'),
  upsertProfile: (data) => api.put('/profile', data),
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
};

export default tenantService;
