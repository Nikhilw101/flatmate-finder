import api from './api';

const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response; // Contains data.token and data.user
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  getMe: async () => {
    const response = await api.get('/users/me');
    return response; // Contains data wrapper
  }
};

export default authService;
